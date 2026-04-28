# Social pulse feed

Scout module feature specification — April 2026

---

## What this is

The Social Pulse Feed is the content discovery engine for the Scout module. It aggregates articles and discussions from sources the user chooses — website RSS feeds and Reddit — then surfaces trends, engagement signals, and post ideas that connect back to the user's content strategy.

It answers three questions: what's happening in my world right now, what's getting traction, and what should I write about next?

---

## Sources

### Website RSS feeds

Most blogs, publications, and industry sites publish RSS or Atom feeds. The `rss-parser` npm package handles both formats cleanly. Because browsers can't fetch third-party feeds directly (CORS), all fetching happens server-side via Supabase Edge Functions. Feed items are stored in your database, making the client fast and filterable.

Reliability: high. Cost: free.

### Reddit

Reddit supports native RSS out of the box — append `.rss` to any subreddit URL and you get a working feed. But Reddit's RSS format buries engagement data (upvote scores, comment counts) inside HTML content strings, which makes it a pain to extract cleanly.

The better approach for Reddit is to use Reddit's **JSON API** instead of the RSS feed. It's free, doesn't require authentication for public subreddits, and returns upvote scores, comment counts, upvote ratios, and post metadata as clean structured data. The user still just pastes a Reddit URL — the platform handles the conversion.

Reliability: high. Cost: free.

---

## How URL input works

The user pastes a single URL into one field. The platform detects what it is and does the right thing automatically.

### Reddit URL detection and conversion

If the URL contains `reddit.com`, the platform identifies it as Reddit and constructs the JSON API endpoint:

| User pastes | Platform converts to |
|---|---|
| `reddit.com/r/UXDesign` | `reddit.com/r/UXDesign/top.json?t=week&limit=50` |
| `reddit.com/r/UXDesign/top` | `reddit.com/r/UXDesign/top.json?t=week&limit=50` |
| `reddit.com/r/UXDesign/new` | `reddit.com/r/UXDesign/new.json?limit=50` |
| `reddit.com/r/UXDesign/rising` | `reddit.com/r/UXDesign/rising.json?limit=50` |

The default view is `top` with a one-week window — this surfaces what's genuinely resonating, not just what was posted recently. The user can optionally specify the sort preference after adding the source (top/new/rising, and for top: day/week/month).

The platform stores the canonical subreddit name (e.g. `r/UXDesign`) as the display title, not the full API URL.

### RSS autodiscovery

If the URL is a website (not Reddit and not already an RSS feed), the Edge Function fetches the page HTML and looks for a `<link rel="alternate" type="application/rss+xml">` tag. Most sites include this — it's how feed readers discover feeds automatically.

If autodiscovery finds a feed, it uses that URL. If not, it returns a clear message: "Couldn't find an RSS feed at this address. Try looking for an RSS or ⊞ icon on the site, or paste the feed URL directly."

### Direct RSS/Atom URLs

If the URL is already a feed URL (contains `/feed`, `/rss`, `.xml`, or returns the right content type), it's used directly.

---

## What engagement data is available

This is where the two source types diverge significantly, and it's worth being clear about what's real.

### Reddit — genuine engagement signals

Because the platform uses the Reddit JSON API rather than the RSS feed, you get clean, reliable engagement data for every post:

- **Score** — net upvotes (upvotes minus downvotes). A post with a score of 847 has proven it resonated with the community.
- **Upvote ratio** — the percentage of votes that were upvotes (e.g. 0.94 = 94% positive). High ratio = broadly well-received, not just controversial.
- **Number of comments** — depth of discussion. A post with 200 comments generated a conversation, not just passive scrolling.
- **Awards** — Reddit awards indicate exceptional posts the community wanted to recognise.
- **Flair/tags** — subreddit-specific categories that can help with content classification.

This data is fetched at the time of polling. A post's score will have changed since it was first posted, and that's fine — you're interested in what's genuinely valued by the community, and scores reflect that over time.

**What you can do with this:** Sort the feed by engagement score. Surface "Getting traction" highlights showing the top-scoring posts across all Reddit sources. Use score + comment count as the primary signal for trending topic identification on Reddit.

### RSS feeds — topic-level trending, not post-level engagement

Standard RSS feeds don't include engagement data. A blog post in an RSS feed arrives with a title, description, author, and publish date — that's it. There's no way to know how many people read it, shared it, or commented on it.

What you can do instead is identify **topic-level trends** across your RSS sources:

- **Cross-source frequency** — if five different publications you follow all publish articles about "AI in design systems" in the same week, that's a meaningful signal. The topic is dominating the conversation.
- **Keyword velocity** — a topic that appeared in 2 articles last week and 11 articles this week is accelerating. That's more interesting than a topic that's been at 8 articles per week for a month.
- **Publication clustering** — when a major site publishes on a topic, smaller sites tend to follow within 24–72 hours. Catching the first wave is more useful than catching the fifth.

So for RSS sources, the trending layer tells you what topics are dominating the written conversation in your niche. For Reddit, it tells you what's actually resonating with real people. Together they're complementary — RSS shows what practitioners are writing about, Reddit shows what people care enough to upvote and discuss.

---

## Architecture

### How data flows

```
User pastes URL
        ↓
Platform detects source type (Reddit / RSS / autodiscovery)
        ↓
Stores in feed_sources table with type and derived API endpoint
        ↓
Edge Function runs on schedule (or manual refresh)
        ↓
For Reddit: fetches JSON API → extracts posts + engagement data
For RSS: fetches feed → parses with rss-parser → normalises items
        ↓
Upserts into feed_items table (deduped by post ID / feed guid)
        ↓
Trend analysis runs: keyword extraction + velocity + engagement weighting
        ↓
Trend results stored in feed_trends table
        ↓
Post idea generation runs (daily, cached): reads trends + user strategy → calls OpenAI
        ↓
React client queries feed_items + trends + suggestions
```

### Polling strategy

| Source type | Default interval | Rationale |
|---|---|---|
| Reddit (top/week) | Every 2 hours | Scores change as posts age; no need to poll constantly |
| Reddit (new/rising) | Every 30–60 minutes | These views move faster |
| News and publication RSS | Every 2 hours | Content updates frequently |
| Blog RSS | Every 6 hours | Posts are less frequent |

All sources store a `next_fetch_at` timestamp. The Edge Function queries `WHERE next_fetch_at <= now() AND is_active = true`, processes those sources, then updates `next_fetch_at` for each one.

---

## Database schema

### feed_sources

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | Unique identifier |
| user_id | uuid (FK) | Owner — for RLS |
| display_url | text | What the user originally pasted |
| fetch_url | text | The actual endpoint to call (may differ from display_url for Reddit) |
| source_type | text | 'reddit' or 'rss' |
| title | text | Display name (auto-populated, editable) |
| subreddit | text (nullable) | e.g. 'UXDesign' — only for Reddit sources |
| reddit_sort | text (nullable) | 'top', 'new', 'rising' — only for Reddit |
| reddit_time_filter | text (nullable) | 'day', 'week', 'month' — only for Reddit top sort |
| category | text (nullable) | User-defined grouping, e.g. 'UX blogs', 'Communities' |
| fetch_interval_minutes | integer | How often to poll |
| next_fetch_at | timestamptz | When the next fetch should happen |
| last_fetched_at | timestamptz | Last successful fetch |
| last_error | text (nullable) | Last error message if fetch failed |
| is_active | boolean | User can pause sources without deleting |
| created_at | timestamptz | When the source was added |

### feed_items

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | Unique identifier |
| feed_source_id | uuid (FK) | Which source this came from |
| user_id | uuid (FK) | Owner — denormalised for query speed |
| external_id | text | Reddit post ID or RSS guid — for deduplication |
| title | text | Post or article title |
| link | text | URL to the original content |
| description | text | Summary or excerpt (HTML stripped) |
| author | text (nullable) | Author name or Reddit username |
| published_at | timestamptz | When the item was originally published |
| image_url | text (nullable) | Featured image if available |
| categories | text[] | Tags or flair from the source |
| reddit_score | integer (nullable) | Upvote score — Reddit only |
| reddit_upvote_ratio | numeric (nullable) | 0–1 upvote ratio — Reddit only |
| reddit_num_comments | integer (nullable) | Comment count — Reddit only |
| reddit_awards | integer (nullable) | Number of awards received — Reddit only |
| engagement_score | numeric (nullable) | Normalised engagement score used for sorting and trending |
| is_bookmarked | boolean | User saved this for later |
| is_hidden | boolean | User dismissed this item |
| last_score_updated_at | timestamptz (nullable) | When Reddit score was last refreshed |
| created_at | timestamptz | When this item was first stored |

The `engagement_score` column is a normalised value computed across all items — it makes Reddit posts and RSS articles sortable on a common scale even though their raw signals are different. For Reddit it's derived from score and comment count relative to the subreddit's typical range. For RSS it's derived from keyword frequency signals.

### feed_trends

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | Unique identifier |
| user_id | uuid (FK) | Owner |
| keyword | text | The trending term or phrase |
| mention_count | integer | Number of feed items mentioning this in the current window |
| avg_reddit_score | numeric (nullable) | Average score of Reddit posts mentioning this keyword |
| trend_direction | text | 'rising', 'stable', 'falling' |
| first_seen_at | timestamptz | When this keyword first appeared |
| last_seen_at | timestamptz | Most recent mention |
| sample_item_ids | uuid[] | 2–3 representative items for this trend |
| trend_window_hours | integer | Time window used (default 72) |
| calculated_at | timestamptz | When this trend was last computed |

### feed_post_ideas

| Column | Type | Purpose |
|---|---|---|
| id | uuid (PK) | Unique identifier |
| user_id | uuid (FK) | Owner |
| feed_item_id | uuid (FK, nullable) | The item that inspired this idea |
| trend_keyword | text (nullable) | The trend this relates to |
| hook | text | Suggested hook line |
| angle | text | Brief description of the angle |
| strategic_purpose | text | 'discovery', 'trust', or 'authority' |
| is_used | boolean | Whether the user drafted from this |
| is_dismissed | boolean | User said "not relevant" |
| generated_at | timestamptz | When this was created |

---

## User experience

### Adding sources

One input field. "Paste a website URL, subreddit URL, or RSS feed link." The platform handles everything from there.

Below the input, a grid of suggested sources organised by category — UX, product, design systems, indie hacking, etc. For UX/product, suggestions would include: UX Collective, Nielsen Norman Group, Smashing Magazine, Intercom Blog, `r/userexperience`, `r/ProductManagement`, `r/UXDesign`, `r/startups`. One tap to subscribe.

Each subscribed source shows: title, source type badge (RSS or Reddit), last fetched timestamp, item count, status indicator (healthy / erroring / no new content in 7+ days), and pause/delete actions.

### The feed

A unified stream of content from all sources. Every item shows:

- Source name and type indicator (small Reddit logo or RSS icon)
- Title
- 2–3 line excerpt
- Relative timestamp ("3 hours ago", "yesterday")
- For Reddit items: score, comment count, upvote ratio as small stats

**Filter bar:** source type (RSS / Reddit), category, time range (today / this week / this month), bookmarked only, unread only.

**Sort options:** relevance (default — blends recency and engagement), newest first, highest engagement.

**Item actions:** bookmark, hide, "Write about this" (opens Writer with context pre-filled).

### Trending topics bar

A horizontal strip above the feed showing 5–8 keywords appearing frequently across sources. Each chip shows the keyword and a direction indicator (↑ rising, → stable). Tapping filters the feed to matching items.

The chips are weighted differently depending on source. A keyword appearing in multiple RSS articles this week gets a frequency score. The same keyword also appearing in high-scoring Reddit posts gets a significant boost. A topic that's been written about extensively AND has Reddit communities upvoting discussions about it is a genuine trend.

### Getting traction

Above the main feed, a "Getting traction" section shows 2–3 items with the highest engagement scores. For Reddit sources these will typically dominate this section, since they have real engagement data. Each card is slightly larger — it's what the platform is saying "people actually care about this."

### Post idea suggestions

A collapsible panel showing 3–5 AI-generated post ideas. Each shows a hook, brief angle, and strategic purpose badge. "Draft this" creates a new draft in the Writer with context pre-loaded. "Not relevant" soft-dismisses it and improves future suggestions.

---

## Trend analysis — how it works

### For Reddit sources

Engagement data comes directly from the API, so trending is straightforward:

1. Fetch posts sorted by score within the configured time window
2. Extract keyword bigrams from titles of posts with score > [subreddit median]
3. Track keyword frequency weighted by score — a keyword appearing in a post with 800 upvotes counts far more than one in a post with 12
4. Velocity: compare top keyword frequency in the last 24h vs the prior 48h

Reddit is the strongest engagement signal in the system. When something is genuinely trending on a relevant subreddit, you'll see it clearly.

### For RSS sources

No engagement data, so trending is derived from cross-source frequency and velocity:

1. Extract keyword bigrams from titles and descriptions of all RSS items in the last 72 hours
2. Remove stop words and very short tokens
3. Count frequency, boost keywords appearing across multiple different sources (a topic mentioned in four different publications is a stronger signal than one publication mentioning it four times)
4. Velocity: compare frequency in the last 24h vs the prior 48h

### Combined trend score

```
trend_score = (mention_count × source_diversity_multiplier × velocity_multiplier × engagement_weight)
```

Where `engagement_weight` is significantly higher for keywords that appear in high-scoring Reddit posts. This means genuinely resonant topics rise to the top, not just topics that happen to be written about frequently.

---

## Integration with the existing app

### Dashboard Zone 3

The implementation plan v3 defines "Zone 3: Trending in your world" on the dashboard. The feed provides the data: 2–3 top-trending items shown as cards with source, title, a strategic purpose tag, and a "Write about this" button.

### Writer integration

"Write about this" and "Draft this" create a new draft pre-filled with: the strategic purpose, a reference link to the source content, and either the suggested hook or a placeholder. The user lands in the Writer with context already set — no copying, no switching tabs.

### Strategy alignment

Post idea generation cross-references the user's content mix. If they're overdue for a trust post, suggestions skew toward trust-oriented angles on trending topics. Scout connects to Strategist's cadence engine.

---

## Phased build plan

Each phase is a self-contained deliverable. Effort estimates assume 5 hours per week.

---

### Phase 1 — Source management and fetching

**What gets built:** Add sources, auto-detect type, fetch and store content.

**Database:**
- `feed_sources` table with RLS
- `feed_items` table with RLS
- Unique constraint on `(feed_source_id, external_id)` for deduplication
- Indexes on `user_id`, `published_at`, `feed_source_id`

**Edge Function — `fetch-feeds`:**
- Query sources where `next_fetch_at <= now()` and `is_active = true`
- For Reddit sources: call the JSON API endpoint, extract posts + engagement fields, normalise to `feed_items`
- For RSS sources: fetch feed URL, parse with `rss-parser`, normalise to `feed_items`
- Upsert with deduplication (skip if `external_id` already exists for this source)
- Update `last_fetched_at` and `next_fetch_at` after each source
- Store any fetch errors in `last_error` without crashing the batch

**URL detection logic (runs before storing a source):**
```
if url.includes('reddit.com'):
    extract subreddit name
    determine sort (top/new/rising from URL path, default to top)
    construct JSON API endpoint
    set source_type = 'reddit'
else:
    attempt RSS autodiscovery (fetch page, look for <link rel="alternate">)
    if found: use discovered feed URL
    if not found: return error message
    set source_type = 'rss'
```

**Frontend — source management page:**
- URL input with detection feedback ("Found: r/UXDesign on Reddit" or "Found RSS feed: UX Collective")
- Source list with status indicators
- Category assignment
- Manual refresh button
- Suggested sources grid (curated JSON file, grouped by category)

**Claude Code approach:** Start with the URL detection logic as a standalone utility function — test it thoroughly before touching the database. Then write the migration. Then build the Edge Function. Then build the React UI. Test the full loop with 3–4 real sources.

**Estimated effort:** 1–2 weeks

---

### Phase 2 — The feed view

**What gets built:** A unified, filterable, sortable feed.

**Frontend:**
- Card layout: source indicator, title, excerpt, timestamp, engagement stats for Reddit items
- Filter bar: source type, category, time range, bookmarked
- Sort: relevance, newest, highest engagement
- Pagination (cursor-based on `published_at` for performance)
- Bookmark and hide actions
- "Write about this" — creates a draft and navigates to Writer

**Backend queries:**
- Main feed query with filters and sort applied in SQL (not in JavaScript)
- Bookmark and hide mutations
- Draft creation endpoint (or reuse existing)

**Dashboard Zone 3:**
- A small feed widget on the dashboard: 2–3 recent high-relevance items
- "View Scout" link

**Claude Code approach:** Write the SQL queries first. Get filtering and sorting right before touching the UI. Use `EXPLAIN ANALYZE` to check query performance with the indexes in place. Then build the card component. Then wire up filters.

**Estimated effort:** 2–3 weeks

---

### Phase 3 — Trend analysis and engagement highlights

**What gets built:** Trending topics bar, engagement highlights, and the trend engine.

**Database:** `feed_trends` table with RLS.

**Edge Function — `analyse-trends`:**
- Runs after each fetch cycle (triggered by `fetch-feeds`, or as a separate scheduled function)
- Reddit trending: frequency-weighted by score across recent posts
- RSS trending: cross-source keyword frequency with source diversity multiplier
- Velocity calculation: 24h vs prior 48h window
- Upsert into `feed_trends`

**Keyword extraction:**
- Tokenise titles and descriptions
- Remove stop words (use the `stopword` npm package — it's lightweight and handles English well)
- Extract bigrams (two-word phrases are more meaningful than single words for topic detection)
- Group near-duplicates (e.g. "design system" and "design systems" → same keyword)

**Frontend:**
- Trending chips strip above the feed
- "Getting traction" section: 2–3 highlighted cards above the main feed
- Filtering the feed by tapping a trend chip

**Claude Code approach:** Build and test keyword extraction as a pure function first — easy to unit test in isolation. Then build the Edge Function that uses it. Then build the UI components. Check the trends output with a week's worth of real feed data before building the UI — you want to verify the signal quality.

**Estimated effort:** 2–3 weeks

---

### Phase 4 — AI-powered post suggestions

**What gets built:** Strategy-aware post ideas generated from trending content.

**Database:** `feed_post_ideas` table.

**Edge Function — `generate-post-ideas`:**
- Triggered when user opens Scout page (cached — regenerate at most once per 12 hours)
- Gathers: current top 5 trends, 3–5 highest-engagement feed items, user's content strategy (purpose mix targets, recent posts, voice profile)
- Prompt structure:
  ```
  Current trending topics in this user's feeds: [keywords with scores]
  Highest-engagement content right now: [titles + excerpts + scores]
  User's content strategy: [purpose mix, what they're overdue for]
  User's voice: [brief voice profile summary]
  Suggest 5 post ideas. Each must have: a hook (one sentence), an angle (2–3 sentences), and a strategic purpose (discovery/trust/authority).
  ```
- Parse structured response, store in `feed_post_ideas`

**Frontend:**
- Collapsible suggestions panel on the Scout page
- Each idea: hook line, angle text, purpose badge, "Draft this" button, "Not relevant" dismissal
- "Draft this" creates a draft in the Writer with hook, angle, reference link, and purpose pre-filled

**Claude Code approach:** Spend real time on prompt engineering before writing any code. Test the prompt in the OpenAI Playground with actual feed data and your own voice profile. Get the output format right first. Then build the Edge Function around a prompt you've already validated. The quality of this feature is entirely determined by the prompt.

**Estimated effort:** 2–3 weeks

---

### Phase 5 — Polish

**What gets built:** Source health monitoring, keyword muting, OPML import, and refinements.

**Source health:** Visual indicator if a source hasn't returned new content in 7+ days or has consistent errors. Prompt to check or remove.

**Keyword muting:** Let users suppress specific keywords from the trends bar (e.g. mute "AI" if they want to focus on fundamentals). Store as a simple array on the user's profile.

**OPML import:** Parse an uploaded OPML file and batch-add all feeds with a preview step.

**Reddit score refresh:** For Reddit posts stored in the last 7 days, periodically re-fetch the score to show how engagement evolves over time. A post that had 50 upvotes at fetch time and now has 600 is worth surfacing.

**Estimated effort:** 1–2 weeks

---

## Overall timeline

| Phase | Duration | Key deliverable |
|---|---|---|
| 1. Source management | 1–2 weeks | Add sources, auto-detect, fetch and store |
| 2. Feed view | 2–3 weeks | Unified, filterable content stream |
| 3. Trend analysis | 2–3 weeks | Trending topics bar and engagement highlights |
| 4. AI suggestions | 2–3 weeks | Strategy-aware post ideas |
| 5. Polish | 1–2 weeks | Health monitoring, muting, OPML |
| **Total** | **7–12 weeks** | **A content discovery engine that earns its place in the app** |

## Dependency map

1. **Phase 1** — start immediately, no dependencies
2. **Phase 2** — needs Phase 1 data
3. **Phase 3** — needs Phase 1 data, Phase 2 display surface
4. **Phase 4** — needs Phase 3 trends + Strategist module content mix data
5. **Phase 5** — runs alongside or after Phase 4

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Reddit API changes or rate-limits | Feed stops updating | Reddit's public JSON API has been stable for years and doesn't require auth for public content. Poll at conservative intervals (not less than 30 minutes per subreddit). Implement exponential backoff on errors. |
| Trend analysis produces noise | Users ignore the trends bar | Start with high frequency thresholds — only surface keywords appearing in 3+ items. Let users mute irrelevant terms. Quality improves as users curate better sources. |
| AI suggestions feel generic | Users don't trust or use the ideas | Prompt engineering is the whole game here. Feed specific data in (exact keywords, actual scores, voice profile). Test with your own data before shipping. |
| Feed items accumulate indefinitely | Database grows, queries slow down | Prune feed items older than 30 days. Keep bookmarked items regardless of age. Add soft item limits per source (store the latest 200 items per source, discard older ones on next fetch). |

---

## How to prompt Claude Code in Cursor

**Give it the schema upfront.** Paste the relevant table definitions from this document at the start of each new chat. Claude Code writes much better SQL and TypeScript when it knows the exact column names and types.

**Start with the data layer.** Always build the migration and Edge Function before the UI. A beautiful UI on top of broken data is harder to debug.

**One thing at a time.** Don't ask Claude Code to build the URL detection, Edge Function, and React UI in one prompt. Build URL detection first, test it, then move to the Edge Function.

**Describe behaviour, not implementation.** "When a user pastes `reddit.com/r/UXDesign`, detect it as Reddit, extract the subreddit name, default to top/week sort, construct the JSON API URL, and store both the display URL and fetch URL" is better than "write a function that detects Reddit URLs."

**Reference your existing patterns.** At the start of a session, ask Claude Code to read a representative existing component and Edge Function so it matches your code style. You'll get much more consistent output.
