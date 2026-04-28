# LinkedIn content copilot — complete product audit

**Date:** April 2026
**Scope:** Holistic UX, UI design, feature flows, information architecture, component system, and technical architecture
**Approach:** Full codebase read + feature-by-feature analysis

---

## The honest headline

This is a genuinely powerful tool with a real engine underneath it — smart scoring, voice training, content frameworks, social trend scraping, circle accountability, and a collaborative composer. The problem is that it feels like the sum of its features rather than a cohesive product. A user who already understands everything it does will love it. A new user has almost no chance of discovering that depth on their own.

The two existing UX review documents (`dashboard-ux-review.md` and `composer-ux-review.md`) identified many of the right issues at the component level. This audit builds on those, adds what they missed, and takes the wider product view — information architecture, the UI design system, the technical structure, and what a clean rebuild would look like.

---

## Part 1: Information architecture and navigation

### The current structure

```
Dashboard
Compose
Drafts
Trends
Playbook
Circles
Settings  (/settings, /settings/voice, /settings/api)
```

Six top-level destinations plus a settings section with its own second-level sidebar containing nine sub-sections. This is a lot to hold in your head, and several destinations overlap significantly in purpose.

### Core IA problem 1: analytics live in three separate places

The biggest structural issue is that performance data is scattered across three pages:

- **Dashboard** — score breakdown, metrics strip, performance chart, recent posts
- **Drafts / Published** — PerformanceInsightsBar, per-post analytics, audience demographics
- **Playbook** — "Metrics that matter", actual vs target comparison, benchmark data

A user trying to answer "how am I doing?" must visit all three. The data is never in one place, and discovering this requires accident rather than design.

### Core IA problem 2: creation and discovery are split but the user's workflow isn't

Trends (content discovery) and Compose (content creation) are separate destinations. In practice they're one flow: find something worth writing about, then write about it. The handoff from Trends → Compose works (there's a "Write about this" button), but the reverse doesn't — the Composer has no way to browse trends without leaving the page entirely.

### Core IA problem 3: Settings is carrying active features

Settings has nine sections: Profile, Focus, Audience, Purpose, Strategy, Voice, API, Appearance, Preferences. Voice training and Content Strategy in particular are active, value-generating features that directly shape AI output — they shouldn't live in a configuration panel. They should be part of the core product, accessible on their own.

### What the IA should be (proposed)

| Destination | What it contains | Purpose |
|---|---|---|
| **Home** | Decision zone: metrics with verdicts, AI insights, "what to do today" | Assess and decide |
| **Compose** | Canvas + left panel. Browse trends inline. | Full creation loop in one place |
| **Posts** | All drafts + published posts. Analytics per post. | Your writing history |
| **Insights** | Analytics dashboard + Playbook + benchmark data | All performance data, one place |
| **Circles** | Accountability + leaderboard + highlights | Social layer |
| **Settings** | Profile basics, tone sliders, API key, appearance | Genuinely just configuration |

Voice training becomes accessible from the Compose page (via a profile card in the left panel). Themes and content mix move to the Insights page as a strategy section. The Playbook's 30-day plan lives in Insights. This takes the structure from 8 destination concepts to 6 with much cleaner purpose separation.

---

## Part 2: Dashboard

*The existing `dashboard-ux-review.md` is accurate. This section adds what it missed.*

### What the existing review got right (all still valid)

- The `Math.random()` bug in `ScoreImprovementTip` (critical — must be fixed)
- Metrics cards need plain-English verdicts, not just raw numbers
- InsightsCard should auto-generate and sit higher up the page
- The Decision Zone / Understanding Zone structural split is the right approach
- Playbook CTAs should link directly to the composer, not settings

### Additional issues the review missed

**The score ring has no educational scaffolding.** A new user sees 47/100 with no explanation of what the score measures or how it's composed. The breakdown panel exists below it, but nothing explains that five dimensions contribute to the number. A tooltip or "How is this calculated?" link on first load would close that gap.

**"Trending in your world" is in the wrong place.** This section — which pulls personalised articles matched to the user's niche — appears below RecentPostsCard and InsightsCard, after the user has scrolled through all the analytical content. It belongs much higher, adjacent to the "what to do next" signal. When someone has a post due, a relevant trending article is exactly the right prompt.

**YourWeek is doing too many jobs.** The `YourWeek` component shows posts done/target, streak, next post nudge, analytics-due posts, AND trending articles. Five jobs in one component. Split it: keep the weekly progress tracker (posts done, streak) and move the nudges into the Decision Zone.

**The refresh button is nearly invisible.** A small timestamp with a tiny spinner icon in the top-right corner is the only way to refresh dashboard data. This is not a pattern users recognise. Replace with a "Last updated X minutes ago" label and a visible Refresh button, or (better) auto-refresh silently when the user focuses the tab.

**Empty states for engagement and audience reach are too passive.** "Add analytics to see" appears as small grey text in both empty metric cards. This is the first thing many new users see — and it's a dead end. Replace with an active CTA: "Upload your first week of analytics to unlock your score →".

---

## Part 3: Composer

*The existing `composer-ux-review.md` is detailed. This confirms its findings and adds missing pieces.*

### From the existing review (all confirmed, with progress notes)

- Article attachment should read the full article, not just title + summary — **ContextGathering.tsx is now implemented** for article-attached drafts, which is real progress. The gap is that it's only triggered by articles, not manual prompt entry.
- Strategic purpose selector pre-generation adds cognitive load before the creative moment
- Side panel controls feel like a settings form, not an editing tool
- Header validation percentage is confusing — remove it or replace with a qualitative label
- The system prompt is over-constrained; voice training needs bulk import and confidence levels

### Additional issues

**The empty state presents too many choices simultaneously.** When landing on Compose with no article attached, the user sees: the prompt input, a Generate button, contextual prompt suggestions below, AND the left panel open with purpose/theme selectors. These should be sequenced, not presented together. The prompt input should be the dominant element; everything else progressive-disclosure.

**No progress signal during generation.** The "Crafting your draft…" spinner gives no indication of how long the AI call will take (it's variable — anywhere from 3 to 30 seconds). Add messages that change every few seconds: "Reading your article…", "Applying your voice…", "Writing your hook…". This reduces anxiety and signals that the system is working, not stalled.

**Autosave to sessionStorage is invisible and lossy.** The composer saves to sessionStorage on every keystroke, but the user has no indication this is happening. Worse, sessionStorage is wiped when the browser tab closes — unlike a drafts autosave. Add a subtle "Auto-saved" indicator in the header, and seriously consider debounced saves to Supabase drafts instead.

**"Start new" vs "Start over" is confusing.** Two similar-sounding destructive actions with different consequences: "Start over" clears the canvas, "Start new" prompts to save first. The alert dialog is good, but the "Discard" action should have red/destructive styling rather than equal visual weight to "Save & start new".

**Voice training is hidden at the critical moment.** "Save & train voice" is buried in a dropdown under the Save button. This is the most valuable long-term action a user can take — every training sample improves future generation. It should be a primary nudge at save time, not a secondary menu item: "This looks like a great voice sample. [Save draft] [Save + train voice]."

**No scheduled posting or reminders.** The workflow ends at "Copy" or "Save to drafts". There's no reminder feature ("post this on Thursday"), no scheduled post awareness, and no connection back to LinkedIn. The user copies text, switches to LinkedIn, pastes it, and the tool has no visibility of what happened. Even a simple "I'm going to post this" button that sets a reminder would close the loop.

---

## Part 4: Trends and content sourcing

This is arguably the most underutilised part of the product given how much infrastructure exists behind it.

### What's actually in the codebase that most users probably don't know about

- RSS feed scraping from configured sources via an Edge Function
- AI-scored social trends from Reddit, HackerNews, and Twitter (X) via `scrape-social-trends` Edge Function
- Topic and brand detection across all articles
- Weekly trend brief generation
- Knowledge base for custom RSS sources
- Article scoring and relevance matching against the user's profile

### The problem: it's all hidden or buried

The social trends feature (`SocialTrendingTopics`) — which aggregates Reddit, HN, and Twitter data with audience-fit scoring — appears as a sidebar widget called "Social pulse" on the Trends page. It gets equal visual weight to a static "Quick tip" card. This is one of the most distinctive features of the product and it's a sidebar widget.

The Knowledge Base (where users add custom RSS feeds) is accessed via a button labelled "Knowledge Base" in the top action bar — most users would assume this is documentation. Rename it "My sources" or "Manage feeds". Better: surface it as a prominent first-time-user prompt in the Trends empty state: "Tell us what you read and we'll personalise your feed."

### Specific Trends page issues

**Two filter rows create decision paralysis.** Time filter (Trending / Most Recent / All) and category filter appear as separate rows. They work independently and their interaction isn't obvious. Consolidate to a single filter bar, or replace with a tabbed approach where "Trending" and "All" are tabs, and categories appear as chips within each.

**Article cards don't show relevance scores.** `article-scoring.ts` calculates relevance to the user's profile, but scores aren't shown on cards. A user scanning 20 articles has no idea which three are most relevant. A simple match indicator (a coloured dot or a "Strong match" / "Good match" label) would dramatically improve scanning.

**"Trending" means two different things.** The trending topics sidebar shows topics trending in the RSS corpus. The social pulse widget shows topics trending on Reddit/HN/Twitter. Both use the word "trending" but they're different signals from different sources. Distinguish them clearly: "In your feeds" vs "Across the web".

**No bookmarking.** A user who finds three great articles on Monday but only has time to write on Wednesday has no way to save them. A simple "Save for later" toggle per article card would dramatically improve the workflow.

**The Trends → Compose handoff loses context.** When you navigate to `/compose?article=X`, the article content has to be re-fetched. If the network is slow, the ContextGathering step stalls. Consider pre-fetching article content when the user expands a card in Trends, so it's already cached when they navigate to Compose.

---

## Part 5: Drafts and published posts

### Tab order is backwards

The Drafts page opens on "Published" by default. The mental model is: in-progress work first (drafts), archive second (published). Swap the default tab.

### The analytics upload loop is weakly enforced

The intended ritual is: write post → publish to LinkedIn → wait a week → upload analytics. The app surfaces an analytics-due reminder on the Dashboard via `useAnalyticsDuePosts`, but the reminder only links to a Drafts page with a `?highlight=ID` param. If the user dismisses the banner without following through, there's no further nudge.

The analytics upload modal is only accessible by clicking a published post card. Someone who isn't already on the Drafts page looking at their posts will never find it.

Suggestions:
- Surface a persistent notification (not just a card) on the Dashboard when analytics are overdue
- Allow analytics upload directly from the Dashboard's recent posts list
- Add a "Remind me in 2 days" option to the nudge with a configurable delay

### Audience demographics card is missing from the UI

`AudienceDemographicsCard.tsx` exists in `src/components/drafts/` but does not appear to be prominently surfaced anywhere. Audience data (who is engaging with your posts by job title, seniority, industry) is listed as a key value proposition in your product description. It should appear in an Insights section alongside performance data — not buried in a component file.

### PerformanceInsightsBar could go further

The bar shows aggregate stats but not: which post type performs best for this user, which day gets the most engagement, or whether engagement is trending up or down over 30 days. These could all be derived from existing data without additional API calls and would transform the bar from a summary into a coaching tool.

---

## Part 6: Playbook

The Playbook is a well-organised read-only reference. The data is good. The problem is that it's passive — you read it and then have to manually act on it elsewhere.

### Make themes clickable into the Composer

Every theme card should have a "Write this" button that opens the Composer with that theme pre-selected. Currently themes are informational — you read "AI-assisted leadership stories" and then have to remember to select it when you navigate to Compose. One button per card converts this from a reference document into an active content planning tool.

### The 30-day plan doesn't connect to actual drafts

`ThirtyDayPlan.tsx` generates a week-by-week schedule with suggested themes. But it has no connection to the user's actual drafts or published posts. A user following the plan has no visual feedback of "I've done week 1". Connect the plan to the drafts list: show a tick next to planned posts that have been written, a greyed-out placeholder for upcoming ones.

### "Metrics that matter" duplicates the Dashboard

Both pages show benchmark engagement rate and impressions. The Playbook version has more context (actual vs target), which is more useful. Consolidate: remove the simple version from Dashboard and keep the richer version in Playbook/Insights.

---

## Part 7: Circles

Circles has the right instincts — accountability, community, gentle gamification — but currently feels like a prototype.

**No onboarding in the empty state.** First visitors see "Create a circle" and "Join a circle" buttons with a brief description. There's no explanation of why Circles helps, what a circle looks like when it's active, or how other users benefit. Add an illustrated empty state that shows what a populated circle looks like, and include a concrete hook: "People in circles post 2× more consistently than solo users."

**Privacy toggles use raw HTML checkboxes.** The "Your sharing preferences" section uses `<input type="checkbox">` — visually inconsistent with the rest of the app. These should be toggle switches.

**The 5-member cap isn't explained.** The counter shows "X of 5 members" with no context. Teams of 8-10 people exist. Either explain the reasoning, or reconsider whether the limit is necessary for the core product experience.

**The Highlights tab needs richer content.** For new circles with limited activity, the feed will be nearly empty. Add a template-like fallback: "When circle members hit milestones, they'll appear here" with an example of what a highlight looks like.

---

## Part 8: Settings

### Nine sections is too many

Current sections: Profile, Focus, Audience, Purpose, Strategy, Voice, API, Appearance, Preferences.

Proposed consolidation:
- Profile + Focus + Audience → "About you" (one scrollable form)
- Purpose + Preferences → "Content style"
- Appearance + API → "App settings"
- Voice + Strategy → promoted to first-class pages, removed from Settings

This takes Settings from nine sections to three, and makes Voice and Strategy visible features rather than hidden configuration.

### The settings save model is ambiguous

Settings shows sections one at a time but saves everything with a single "Save changes" button. If you change Profile, click to Focus, change something, then hit Save — does it save both? Yes, because all state is held in memory. But this is non-obvious and will cause lost changes. Add a visible "Unsaved changes" indicator per-section in the sidebar, or auto-save when the user navigates between sections.

### API and Voice sections redirect rather than render

Settings > API shows a card with "Manage API key →" that navigates to `/settings/api`. Settings > Voice shows "Open voice settings →" that navigates to `/settings/voice`. These are settings sections inside a settings section — one indirection too many. Either inline the content or remove these sections from Settings and promote them to standalone navigation items.

---

## Part 9: UI design system audit

### What's working

The design foundation is strong: Bricolage Grotesque for headings and Inter for body is a distinctive, professional pairing. The stone palette as primary neutral is warm without being dull. The CSS token system in `index.css` is well-structured with semantic naming using Tailwind v4's `@theme` blocks.

### Inconsistency 1: two visual languages in one product

The Dashboard uses bespoke, pixel-tuned components with explicit pixel sizes (`text-[24px]`, `text-[32px]`), custom corners (`rounded-xl`), and hard-coded hex colours (`#0090FF`, `#009966`, `#DC2626`).

Every other page (Trends, Drafts, Settings, Circles, Playbook) uses shadcn-style `Card`, `Badge`, and `Button` components with standard Tailwind sizing.

The result is two visual languages coexisting. The Dashboard feels more polished and intentional — other pages feel like a different app. The fix is to extract the Dashboard's design decisions into the token and component system so every page can inherit them.

### Inconsistency 2: typography scale has no single source of truth

Custom `text-2xs` and `text-3xs` classes coexist with Tailwind's standard scale AND arbitrary inline values (`text-[13px]`, `text-[24px]`, `text-[32px]`). There is no canonical type scale.

For a dense SaaS application, six sizes are sufficient:
- `xs` — 11-12px — metadata, labels
- `sm` — 13-14px — secondary text
- `base` — 15-16px — body copy
- `lg` — 18-20px — card titles
- `xl` — 22-24px — page headings
- `2xl` — 28-32px — hero numbers (scores, metrics)

Define these as tokens in `@theme`. Remove all `text-[Xpx]` arbitrary values.

### Inconsistency 3: border radius is mixed

Dashboard cards: `rounded-xl` (12px). shadcn Cards on other pages: `rounded-lg` (8px). Composer panels: `rounded-[15px]` (arbitrary). Pick one and apply it everywhere. `rounded-xl` is the better choice — it's already used on the best-designed page.

### Inconsistency 4: hard-coded colours bypass the token system

Dashboard uses `text-[#009966]`, `bg-[#0090FF]`, `text-[#DC2626]` etc. as inline Tailwind classes. The token system defines `--color-success`, `--color-destructive`, and chart colours — but these aren't being used consistently. Hard-coded values will silently break in dark mode.

Replace all hard-coded hex values with semantic tokens. Add `--color-positive` (for upward trends) and `--color-negative` (downward trends) if they don't exist.

### Component library recommendation: extend shadcn, don't replace it

The app is already using shadcn/ui correctly for primitives (Button, Card, Badge, Tabs, Dialog, etc.). The recommendation is to **deepen this, not replace it**.

Don't adopt a full framework like HeroUI or Untitled UI as a wholesale replacement — the custom design aesthetic here is already more distinctive than either of those options and worth preserving. Instead:

- Solidify the token system (spacing, radius, type, colour)
- Extend shadcn components with the app's own tokens via `components.json` and CSS variables
- Extract the Dashboard's bespoke metric card design into a shared `MetricCard` component others can use
- Reference **Linear's design language** for inspiration — high density, monochrome + single accent, typography doing most of the work. Apply that level of restraint across every page, not just the Dashboard.

---

## Part 10: Technical architecture observations

### ComposerPage.tsx is doing too much

At ~510 lines with approximately 30 `useState` declarations, `ComposerPage.tsx` manages the entire composer workflow as a single component. State interactions between 30 variables are genuinely hard to predict, making bugs likely and testing difficult.

Extract to a `useComposer` hook or `ComposerContext` that manages state. The page component should handle layout and event delegation only.

### Duplicate service files

`src/lib/article-service.ts` and `src/lib/services/article-service.ts` both exist. Changes in one won't automatically reflect in the other — a maintenance hazard. Consolidate.

Similarly, logic is spread between `src/lib/` (trend-detection, analytics-insights, article-scoring) and `src/lib/services/`. A cleaner separation: `services/` for data fetching (Supabase + Edge Functions), `lib/` for pure calculation functions (scoring, parsing, detection).

### Dashboard fires too many parallel hooks on mount

`DashboardPage.tsx` initialises `useLinkedInScore`, `usePostingStats`, `useAnalyticsDuePosts`, `usePostScatter`, `useInsights`, `useCelebrations`, and a `useQuery` for trending articles — all simultaneously on mount. Consider a single `useDashboardData` hook that coordinates these, batches loading states, and provides a unified refresh mechanism.

### SessionStorage has an edge case that loses work

The composer persists to `sessionStorage` on every content change. But sessionStorage is cleared when the browser tab closes. A user who accidentally closes the tab and reopens it will lose their unsaved draft with no explanation. Consider switching to `localStorage` with a TTL, or (better) debounced auto-saves to Supabase drafts every 30 seconds of idle time — matching the mental model of Google Docs.

### Social trend data is richer than the UI shows

The `SocialTrendingTopic` model includes `trending_score`, `audience_fit_score`, `trending_reason`, `audience_fit_reason`, `post_angle`, and `sample_posts` (with URLs and scores from Reddit/HN/Twitter). The `SocialTrendingTopics` component likely only uses a fraction of this data. The `post_angle` field alone is immediately actionable in the Composer. Expose this data properly.

---

## Part 11: If building from scratch

### 1. Structure around three user jobs, not a feature list

Every screen should answer one of three questions:

1. **"What should I write today?"** — Compose + trend discovery + AI prompts tailored to your strategy
2. **"How am I doing?"** — Unified analytics, score, insights, audience data in one place
3. **"How do I get better?"** — Voice training, playbook coaching, benchmark comparison

Every existing feature maps cleanly to one of these. The navigation structure would reflect this directly, rather than listing each feature as a peer destination.

### 2. Make the AI layer explicit and controllable

The best thing about this tool is that it's not generic "write me a LinkedIn post" AI. It uses voice profiles, strategic purpose, content frameworks, and historical performance data to generate contextual drafts. But the user cannot see any of this — they press Generate and get a result with no understanding of what shaped it.

Show the user the inputs: "Generating with: Your voice profile (7/10 trained) · Discovery purpose · Contrarian hook style · Article: [title]." This builds trust, creates teachable moments, and gives users something concrete to optimise.

### 3. Design the analytics ritual as the retention mechanism

Post → Wait 7 days → Upload analytics → See score improve. This is the loop that creates long-term retention. Right now it's almost invisible. Design it as a weekly ritual with a dedicated, celebratory screen: "This week's results" — your score change, best-performing post, one specific thing to try next week. Think Duolingo streak or Strava weekly summary. Create emotional attachment to the habit.

### 4. Composer: start minimal, reveal complexity progressively

The composer's first screen should have one action: a text input with "What do you want to write about?" and nothing else visible. After you type and generate, the app applies your voice profile, purpose from settings, and contextual prompts behind the scenes. Purpose, themes, and frameworks appear post-generation as refinement options, not upfront as configuration. This removes the settings-form feeling and replaces it with a blank creative canvas.

### 5. Social pulse deserves to be a hero feature

The infrastructure for scraping Reddit, HN, and Twitter — scoring trending topics, calculating audience fit, extracting post angles — is genuinely sophisticated and ahead of most competitors. It's currently a sidebar widget. In a rebuild, this would be the primary content discovery surface: a personalised morning brief of "what's happening in your world this week, and here are three post angles for each topic."

---

## Priority roadmap

### P0 — Fix immediately (bugs and broken patterns)

| Issue | File | Effort |
|---|---|---|
| `Math.random()` bug in ScoreImprovementTip | ScoreImprovementTip.tsx | 30 min |
| Duplicate article-service files | lib/article-service.ts + lib/services/ | 1 hour |
| Tab order reversed in Drafts | DraftsPage.tsx | 15 min |
| Settings: ambiguous save model — add unsaved-changes indicator | SettingsPage.tsx | 2 hours |

### P1 — High-impact UX improvements

| Issue | Effort |
|---|---|
| Metrics cards: add plain-English verdicts (e.g. "Above benchmark · 2.1%") | Half day |
| Composer empty state: sequence inputs (prompt first, options second) | Half day |
| Add "Save + train voice" as primary nudge on save | 1 hour |
| Move trending articles higher on Dashboard | 2 hours |
| Add article bookmarking to Trends | Half day |
| Show article relevance scores on Trends cards | Half day |
| Add "Write this" button to Playbook theme cards | 2 hours |
| Circles: replace checkbox privacy toggles with toggle switches | 1 hour |
| Circles: add value explanation and illustration to empty state | 1 hour |
| Auto-generate InsightsCard on load (remove manual trigger) | 2 hours |
| Add composer generation progress messages | 2 hours |
| Add autosave indicator to composer header | 1 hour |

### P2 — Design system consistency

| Issue | Effort |
|---|---|
| Replace all `text-[Xpx]` arbitrary values with semantic tokens | 1 day |
| Replace hard-coded hex colours with CSS tokens | Half day |
| Standardise border radius to `rounded-xl` across all card components | Half day |
| Extract Dashboard metric card design into a shared `MetricCard` component | 1 day |
| Inline API + Voice sections into Settings (remove sub-page redirects) | Half day |

### P3 — Architecture

| Issue | Effort |
|---|---|
| Extract ComposerPage state to `useComposer` hook | 1 day |
| Combine Dashboard data hooks into `useDashboardData` | Half day |
| Switch composer persistence from sessionStorage to debounced Supabase save | Half day |
| Consolidate lib/ vs lib/services/ file structure | Half day |

### P4 — New features with high leverage

| Feature | Notes | Effort |
|---|---|---|
| Weekly analytics ritual screen | The loop that drives retention | 2 days |
| Surface AudienceDemographicsCard in Insights | Component exists, just needs a home | Half day |
| Social pulse as a first-class Trends section | Replace sidebar widget | 1 day |
| Connect 30-day plan to actual drafts (tick off completed) | Playbook engagement | 1 day |
| Article pre-fetching in Trends for faster Compose handoff | Performance + UX | Half day |

---

## What's working well

This list is as important as the issues.

- **The scoring engine is sophisticated.** Five dimensions (engagement, consistency, growth, content mix, completeness) with follower-bracket benchmarking is a real, defensible data model. Users don't know this is here — but the work is done.
- **Voice training is the right concept.** Capture samples, analyse patterns, adjust generation. The TextSelectionToolbar for learning excluded phrases inline is particularly clever.
- **ContextGathering is implemented.** The composer-ux-review recommended adding this — it's already in the code. Genuine progress.
- **The content framework (Discovery/Trust/Authority + post frameworks + hook patterns)** gives the AI a structured vocabulary. This is the product's real IP and most generic AI writing tools have nothing equivalent.
- **The cadence engine and 30-day planning** connect strategic purpose to a real posting schedule. Most LinkedIn tools have no concept of content strategy.
- **Social trend scraping infrastructure** is running and producing audience-fit scores, trending reasons, and post angles. It's ahead of competitors and currently invisible to users.
- **StaggeredList, CountUp, and AchievementToast** show genuine craft in the user experience. The dashboard already has celebratory moments.
- **The Playbook** is a coherent product concept — your strategic position, your targets, your plan. Its problem is passivity, not purpose.
- **The design foundation** — Bricolage Grotesque + Inter, stone palette, the metric card aesthetic on the Dashboard — is excellent and distinctive. The work is making it consistent, not replacing it.
