# LinkedIn content copilot v2 — rebuild plan for Cursor

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui
**Database:** Same Supabase project (copy `.env` from existing app)
**Project folder:** `linkedin-copilot-v2` (sibling to current app)

---

## How to use this document

Work through phases in order. Each phase has a goal, the files to create, and specific instructions. Paste the instructions for each phase into Cursor as you go. Do not skip phases — each one builds the foundation for the next.

---

## New information architecture (reference throughout)

| Route | Page | What it contains |
|---|---|---|
| `/` | → `/home` redirect | — |
| `/home` | Home | Decision zone: score verdict, AI insights (auto), trending articles, "what to do today" |
| `/compose` | Compose | Canvas-centric composer. Trends browsable from left panel. |
| `/posts` | Posts | Drafts tab (default) + Published tab with per-post analytics |
| `/insights` | Insights | Unified analytics: score breakdown, performance chart, content mix, 30-day plan, themes |
| `/trends` | Trends | Social pulse hero + RSS articles + bookmarks + "My sources" |
| `/circles` | Circles | Accountability groups, leaderboard, highlights |
| `/settings` | Settings | Profile, Content style, App settings (API key + appearance) |
| `/settings/voice` | Voice & writing | Voice training — first-class page, not a settings sub-section |
| `/onboarding` | Onboarding | Simplified 4-step flow |
| `/login` | Login | Auth |

**Key changes from v1:**
- Dashboard → Home (decision-focused, not reporting)
- Drafts → Posts (clearer purpose)
- Playbook merged into Insights
- Voice promoted out of Settings
- Trends gets social pulse as hero feature
- Settings consolidated from 9 sections to 3

---

## Design system reference (use throughout every phase)

### Type scale (define in `index.css`, use everywhere — no arbitrary `text-[Xpx]` values)
```
text-3xs  → 10px  → metadata, timestamps
text-2xs  → 11px  → labels, captions
text-xs   → 12px  → secondary copy
text-sm   → 13px  → body secondary
text-base → 15px  → body primary
text-lg   → 18px  → card headings
text-xl   → 22px  → page headings
text-2xl  → 28px  → hero numbers (scores)
text-3xl  → 36px  → large display numbers
```

### Colour tokens (all colours go through CSS variables — no hard-coded hex in components)
```css
/* Semantic tokens to add/confirm in index.css */
--color-positive: #009966;        /* upward trends, above benchmark */
--color-negative: #DC2626;        /* downward trends, below benchmark */
--color-chart-primary: #0090FF;   /* primary chart line */
--color-discovery: #10b981;       /* emerald — discovery purpose */
--color-trust: #0069a8;           /* sky blue — trust purpose */
--color-authority: #7c3aed;       /* violet — authority purpose */
```

### Spacing: 8pt grid. Use Tailwind's scale only (2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24). Never `p-[Xpx]`.

### Border radius: `rounded-xl` (12px) for all cards. `rounded-lg` (8px) for inputs, badges, inner elements. `rounded-full` for pills only.

### Component naming convention
- `src/components/ui/` — shadcn primitives + custom base components
- `src/components/[feature]/` — feature-specific components (home/, composer/, posts/, insights/, trends/, circles/)
- `src/components/layout/` — AppShell, Sidebar, MobileNav
- `src/pages/` — page-level components (thin, orchestrate data + layout)
- `src/lib/services/` — all Supabase/API calls
- `src/lib/hooks/` — all custom hooks (useComposer, useDashboard, etc.)
- `src/lib/utils/` — pure calculation functions (scoring, parsing, detection)

---

## Phase 0: Project scaffold

**Goal:** Working app shell with routing, auth, design tokens, and core shared components. No feature logic yet.

### 0.1 Create the project

```bash
cd .. # go to parent directory of linkedin-copilot-app
npm create vite@latest linkedin-copilot-v2 -- --template react-ts
cd linkedin-copilot-v2
npm install
```

### 0.2 Install dependencies

```bash
# Core
npm install react-router-dom @tanstack/react-query @supabase/supabase-js

# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-avatar @radix-ui/react-progress

# Utilities
npm install class-variance-authority clsx tailwind-merge xlsx

# Icons
npm install @tabler/icons-react

# Dev
npm install -D @tailwindcss/vite tailwindcss typescript eslint
```

### 0.3 Copy environment variables
Copy the `.env` file from the existing `linkedin-copilot-app` project. The Supabase URL and anon key stay the same.

### 0.4 Set up Tailwind v4

In `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### 0.5 Design tokens in `src/index.css`

Create `src/index.css` with the full token system. Include:
- Stone palette (copy from existing app)
- All semantic colour tokens (background, foreground, muted, border, primary, etc.)
- Add the new tokens: `--color-positive`, `--color-negative`, `--color-chart-primary`, `--color-discovery`, `--color-trust`, `--color-authority`
- Typography: define `text-2xs`, `text-3xs` as custom utilities
- Font imports: Bricolage Grotesque (headings) + Inter (body) from Google Fonts
- Set `font-family: 'Inter'` on `body`, `font-family: 'Bricolage Grotesque'` on `[class*="font-heading"]`

### 0.6 Shared UI components to build first

Build these before any features — every page will use them:

**`src/components/ui/metric-card.tsx`** — The core stat card used on Home and Insights.
Props: `title`, `value`, `unit?`, `verdict?` (string like "Above benchmark"), `verdictTone?` ('positive' | 'negative' | 'neutral'), `delta?`, `benchmark?`, `loading?`, `emptyState?` (string with CTA text), `onClick?`.
Style: `bg-white border border-stone-200 rounded-xl p-4 h-[180px] flex flex-col`. Title at top, large `text-3xl font-bold tabular-nums` value in the middle, verdict/benchmark at the bottom. Use CSS token colours for verdict tones — never hard-coded hex.

**`src/components/ui/page-header.tsx`** — Consistent page title + subtitle. Props: `title`, `description?`, `action?` (ReactNode for right-side button).

**`src/components/ui/empty-state.tsx`** — Props: `icon`, `heading`, `description`, `action?` ({ label, onClick }). Use in all zero-data states.

**`src/components/ui/purpose-badge.tsx`** — Pill showing Discovery / Trust / Authority. Props: `purpose`. Uses the `--color-discovery/trust/authority` tokens.

**`src/components/ui/toggle-switch.tsx`** — Proper toggle (not HTML checkbox). Used in Circles privacy settings and anywhere else we need a toggle.

**`src/components/ui/skeleton.tsx`** — Copy from existing app.

**`src/components/ui/count-up.tsx`** — Copy from existing app.

### 0.7 Routing structure in `src/App.tsx`

Set up all routes listed in the IA table above using `react-router-dom v7`. Use `lazy()` for all page imports. Wrap in `AuthProvider`, `UserProfileProvider`, `QueryClientProvider`. Protected routes redirect to `/login` if no session.

### 0.8 AppShell and Sidebar

**`src/components/layout/Sidebar.tsx`** — New navigation items matching the new IA:
```
Home          (IconLayoutDashboard)
Compose       (IconPencil)
Posts         (IconFiles)
Insights      (IconChartBar)
Trends        (IconFlame)
Circles       (IconUsersGroup)
──────────────
Voice         (IconMicrophone)  ← promoted out of settings
Settings      (IconSettings)
```

Sidebar: 240px expanded, 64px collapsed. `rounded-xl` active state pill with left accent bar. Copy the collapsible toggle mechanic from v1.

---

## Phase 1: Auth, onboarding, and settings

**Goal:** Users can sign in, complete a simplified onboarding, and manage their profile. All the same Supabase auth + profile tables as v1.

### 1.1 Auth

Copy `src/lib/supabase.ts`, `src/contexts/AuthContext.tsx`, `src/components/layout/ProtectedRoute.tsx` from v1 with no changes needed.

Create `src/pages/LoginPage.tsx` — clean, centred login card with email/password + magic link option. Bricolage Grotesque headline "Your LinkedIn content engine." Subheading in Inter. Single email input + "Continue" button. No visual clutter.

### 1.2 UserProfileContext

Copy `src/contexts/UserProfileContext.tsx` from v1. No changes needed — it reads from the same Supabase `user_profiles` table.

Copy these service files unchanged:
- `src/lib/services/profile-service.ts`
- `src/lib/database.types.ts`
- `src/lib/onboarding-types.ts`
- `src/lib/env.ts`

### 1.3 Simplified onboarding — 4 steps (down from 6)

**Step 1: About you** — display name, job title, years of experience, company type, follower count. (Combines old Role + Profile steps.)

**Step 2: Your focus** — primary discipline, specialist interests, industries, target audience. (Combines old Focus + Audience steps.)

**Step 3: Content style** — strategic purpose (Discovery/Trust/Authority selector with clear descriptions), posting frequency, preferred days, tone sliders (formality + style). (Combines old Purpose + Preferences steps.)

**Step 4: Voice sample (optional)** — "Paste one of your best LinkedIn posts so we can learn your writing style." Single large textarea. "Skip for now" link below. This replaces the old StepVoice which had confusing sliders.

Progress indicator: simple numbered dots at the top (1 of 4), not a bar.

Each step: full-screen centred layout, max-width 560px, Bricolage heading, clean form, large primary "Continue" button. No sidebar on onboarding.

`src/pages/OnboardingPage.tsx` — manages step state and calls `upsertUserProfile` on completion.

### 1.4 Settings page — 3 sections

**`src/pages/SettingsPage.tsx`** — Left sidebar nav with three sections (not nine):

**About you:** display name, job title, years experience, company type, follower count, primary discipline, specialist interests, industries, target audience, primary goal, LinkedIn presence. One scrollable form, one Save button.

**Content style:** strategic purpose, posting frequency, preferred days, tone formality slider, tone style slider. One Save button.

**App:** OpenAI API key (inline — no redirect to sub-page), theme toggle (light/dark/system). One Save button per section.

Remove the API and Voice redirect cards entirely — no more "click here to go somewhere else" within settings. Voice is now its own nav item.

Auto-save pattern: show "Unsaved changes" indicator in the sidebar nav item when the user has modified a section without saving. Show "Saved ✓" for 3 seconds after saving.

### 1.5 Voice & writing page

**`src/pages/VoicePage.tsx`** — Accessible from the main sidebar nav (not buried in settings).

Sections:
1. **Voice profile strength indicator** — "Your voice profile: 4/10 samples · Add more for better AI output." A simple progress bar makes this feel like a game to complete.
2. **Voice samples** — Paste a LinkedIn post, click "Add sample". List of saved samples with delete. Max 10. Copy the add/delete logic from v1 `VoiceSettingsPage`.
3. **Bulk import** — "Have older posts? Paste up to 5 at once." A larger textarea that accepts multiple posts separated by `---`. Splits and saves them as individual samples.
4. **Tone sliders** — confidence, technical depth, opinion strength, warmth, humour. Copy from v1.
5. **Signature phrases** — words/phrases that are distinctly yours. Add/remove chips.
6. **Topics to avoid** — same add/remove chip pattern.
7. **AI analysis** — "Analyse my writing style" button. Calls `analyseVoiceWithAI`. Shows result as a readable summary card.

Copy all voice logic: `src/lib/voice-profile.ts`, `src/lib/voice-training.ts`, `src/lib/services/profile-service.ts` (voice functions), `src/lib/ai-service-secure.ts` (analyseVoiceWithAI).

---

## Phase 2: Home page

**Goal:** The Home page answers "what should I do today?" in one glance. It has a Decision Zone (above fold) and an Understanding Zone (below fold). No redundant surfaces.

### 2.1 Data layer — `src/lib/hooks/useHomeData.ts`

**Important:** Replace the 7 separate hooks in v1's DashboardPage with a single coordinated hook. `useHomeData` internally calls all sub-hooks and returns a unified loading state + refresh function. This prevents 7 independent loading spinners appearing sequentially on mount.

```ts
export function useHomeData() {
  // Internally uses: useLinkedInScore, usePostingStats,
  // useAnalyticsDuePosts, useInsights, trending articles query
  return {
    score, history, impressionsHistory,
    stats, nextPost, recommendation,
    analyticsDuePosts,
    insights, insightsLoading,
    trendingArticles, trendingLoading,
    loading,   // true until all critical data ready
    refresh,   // refreshes all in parallel
  }
}
```

Copy these hooks/services from v1 (they work fine, just reorganise how they're called):
- `src/lib/useLinkedInScore.ts`
- `src/lib/usePostingStats.ts`
- `src/lib/useAnalyticsDuePosts.ts`
- `src/lib/useInsights.ts`
- `src/lib/useCelebrations.ts`
- `src/lib/score-engine.ts`
- `src/lib/analytics-insights.ts`
- `src/lib/services/analytics-service.ts`

### 2.2 Decision zone components

**`src/components/home/ScoreVerdictCard.tsx`** — The hero metric card. Uses `MetricCard` base. The verdict is the primary text, score is secondary. Examples:
- "Strong · 72/100" in `--color-positive`
- "Building · 48/100" in amber
- "Needs focus · 31/100" in `--color-negative`

The verdict text comes from an updated `getScoreLabel()` that returns both a label and a tone. **Fix the `Math.random()` bug here:** the improvement tip always targets the user's lowest-scoring dimension, derived deterministically from the score breakdown.

**`src/components/home/InsightsBanner.tsx`** — Auto-generates on page load when the user has ≥3 posts with analytics. Shows as a horizontally scrollable row of insight cards (each insight is a card with an icon, a heading, and a single-sentence recommendation). No manual "Generate insights" button. Shows skeleton cards while generating. Dismissed insights persist to localStorage.

**`src/components/home/WeekProgress.tsx`** — Posts this week vs target. Three purpose pills showing count for the week. Streak count. Compact — fits in one row.

**`src/components/home/AnalyticsDueBanner.tsx`** — Shown when posts are overdue for analytics. A sticky amber banner at the top of the page (not a card buried in the scroll): "2 posts are ready for analytics · [Add now →]". Links directly to the analytics modal on the Posts page.

### 2.3 Understanding zone components

**`src/components/home/TrendingNow.tsx`** — 3 article cards (same `TrendingCard` design from v1 but now with a "Save" bookmark icon in addition to "Write about this"). Appears below the Decision Zone.

**`src/components/home/RecentPostsCard.tsx`** — Recent published posts. Each post shows: title, date, impressions, and a relative performance signal ("↑ Above your average" in `--color-positive` or "↓ Below your average" in `--color-negative`). Derived from comparing each post's impressions to the user's average. No analytics calls needed.

### 2.4 Home page layout

```
src/pages/HomePage.tsx

<div max-w-5xl mx-auto px-4 py-8 space-y-6>

  {/* Analytics due — sticky banner, shown when relevant */}
  <AnalyticsDueBanner />

  {/* Decision zone */}
  <section aria-label="This week">
    <WeekProgress />
  </section>

  {/* 4 metric cards */}
  <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <ScoreVerdictCard />
    <MetricCard title="Engagement rate" ... verdict="Above benchmark" />
    <MetricCard title="Audience reach" ... />
    <MetricCard title="Posts this week" ... />
  </section>

  {/* AI insights — auto-generated, skeletons while loading */}
  <InsightsBanner />

  {/* Understanding zone */}
  <section aria-label="Trending now">
    <TrendingNow />
  </section>

  <section aria-label="Recent posts">
    <RecentPostsCard />
  </section>

</div>
```

---

## Phase 3: Composer

**Goal:** A canvas-first creative tool. Minimal on load, intelligent after generation. The left panel is a resource drawer, not a settings form.

### 3.1 State management — `src/lib/hooks/useComposer.ts`

**Critical:** Extract all composer state from the page component into a single custom hook. The `ComposerPage` should only handle layout. The hook manages:

```ts
export function useComposer() {
  // State
  const [content, setContent] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [article, setArticle] = useState<Article | null>(null)
  const [activePurpose, setActivePurpose] = useState<StrategicPurpose>('discovery')
  const [selectedTheme, setSelectedTheme] = useState<ContentTheme | null>(null)
  const [ctaType, setCtaType] = useState<CtaTypeId | null>(null)
  const [hooks, setHooks] = useState<GeneratedHook[]>([])
  const [postFramework, setPostFramework] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Actions
  const generate, refine, applyHook, regenerateHooks, save, saveAndTrain, copy, reset, startNew

  // Derived
  const wordCount, charCount, isOverLimit, isDirty, bestPurpose, purposeScores

  return { ...state, ...actions, ...derived }
}
```

Copy and adapt generation logic from: `src/lib/ai-service-secure.ts`, `src/lib/content-framework.ts`, `src/lib/voice-profile.ts`, `src/lib/services/draft-service.ts`.

### 3.2 Persistence — switch from sessionStorage to Supabase autosave

Instead of sessionStorage, auto-save draft content to Supabase on a 30-second debounce after the user stops typing. Show an autosave indicator in the header: "Saved · just now" / "Saving…" / "Unsaved changes". This means drafts survive tab closes and browser restarts.

On load, if there's an existing `draft` query param, load that draft. If there's no draft param but there's a recent unsaved autosave draft in Supabase, offer to restore it.

### 3.3 Canvas-centric empty state

**`src/components/composer/ComposerCanvas.tsx`** — The centre column. When empty:

```
[Article context card, if attached]

[ContextGathering questions, if article attached]

OR

[Large textarea placeholder: "What do you want to write about?"]
[Contextual prompt suggestions as clickable chips below]
[Generate button — primary, large]
```

The left panel starts **collapsed** on load. A subtle "Browse topics →" link or a collapsed drawer icon invites the user to open it. This puts focus on the creative prompt, not the configuration options.

**Generation progress messages** — replace the static spinner with sequential messages:
```ts
const GENERATION_MESSAGES = [
  'Reading your article…',        // if article attached
  'Applying your voice profile…',
  'Choosing the best framework…',
  'Writing your hook…',
  'Crafting the body…',
  'Polishing the ending…',
]
```
Cycle through messages every 3 seconds during generation.

### 3.4 Post-generation canvas state

After generation, the canvas shows the draft with these inline controls:

1. **Purpose badge** (tappable popover, same as v1 — this works well)
2. **Framework badge** + "Try different" button (same as v1 — this works well)
3. **HookSwapper** at the top of the draft (inline, same as v1)
4. **Textarea** — the draft itself, editable
5. **InlineCta** at the bottom (same as v1)
6. **Validation suggestions** — amber box if any issues (same as v1)

**Autosave indicator** in the ComposerHeader: "Auto-saved · 2 min ago" using the Supabase save status.

### 3.5 Save flow

Replace the split "Save" / "Save & train" dropdown with a two-button approach in the header:
- **"Save draft"** — primary button
- **"Save + train voice"** — secondary button with sparkle icon, always visible (not hidden in dropdown)

Below the buttons, a subtle tooltip: "Training your voice improves every future post."

### 3.6 Left panel — `src/components/composer/ComposerLeftPanel.tsx`

Slim down to four sections (remove pre-generation configuration overload):

1. **What works for you** — winning patterns from `usePerformanceAnalysis`. Always visible at the top.
2. **Topic & theme browser** — browse themes by purpose. Clicking a theme pre-fills the custom prompt.
3. **Trending articles** — search + scroll list of trend articles to attach. This replaces the need to navigate to Trends first.
4. **Voice profile** — compact card showing profile strength ("Voice: 6/10") with a link to `/settings/voice`.

Remove from left panel: strategic purpose selector (now post-generation), CTA type selector (now inline on canvas), article angle selector (now handled by ContextGathering on canvas).

### 3.7 Copy remaining composer logic from v1

These files work well and should be copied with minimal changes:
- `src/lib/ai-generation.ts`
- `src/lib/content-framework.ts`
- `src/lib/article-scoring.ts`
- `src/lib/character-one-liner.ts`
- `src/lib/creator-identity.ts`
- `src/components/composer/HookSwapper.tsx`
- `src/components/composer/InlineCta.tsx`
- `src/components/composer/TextSelectionToolbar.tsx`
- `src/components/composer/ContextGathering.tsx`
- `src/components/composer/ArticleContextCard.tsx`
- `src/lib/services/article-service.ts`

---

## Phase 4: Posts page

**Goal:** The Posts page is your writing history — drafts (in progress) and published posts (with analytics). Drafts tab is the default.

### 4.1 Page structure

```
src/pages/PostsPage.tsx

Tab order: [Drafts] [Published]   ← Drafts is default, not Published

Drafts tab:
  - "New draft" button (top right)
  - Draft cards (same DraftCard as v1, with edit/copy/publish/delete)
  - Empty state if no drafts

Published tab:
  - Sort controls (date / impressions / reactions / engagement)
  - Filter chips (purpose: All / Discovery / Trust / Authority)
  - PerformanceInsightsBar (expanded by default on first visit)
  - Published post cards
```

### 4.2 Analytics upload improvements

The analytics upload modal must be reachable from three places (not just published post cards):
1. Clicking "Add analytics" on a `PublishedPostCard`
2. Clicking the `AnalyticsDueBanner` on the Home page (passes `?highlight=ID`)
3. A new "Add analytics" button in the `RecentPostsCard` on the Home page

Copy `src/components/analytics/AnalyticsInputModal.tsx` from v1 — it works well.

### 4.3 Audience demographics

**`src/components/posts/AudienceDemographicsCard.tsx`** — Moved from `components/drafts/` (where it was unused). Surface it in the Published tab, above the post list, visible when the user has ≥3 posts with analytics. Shows audience breakdown by job function, seniority, and industry.

Copy `src/components/drafts/AudienceDemographicsCard.tsx` from v1 and ensure it renders.

### 4.4 PerformanceInsightsBar enhancement

Add two new derived insights to the bar (calculated from existing data, no new API calls):
- **Best performing type:** "Your Trust posts average 2.1× more engagement than Discovery posts."
- **Best day:** "Posts published on Tuesday get 34% more impressions for you."

These appear as additional insight chips alongside the existing averages.

Copy `src/components/drafts/PerformanceInsightsBar.tsx`, `src/components/drafts/DraftCard.tsx`, `src/components/drafts/PublishedPostCard.tsx`, `src/components/drafts/DraftFilters.tsx`, `src/components/drafts/PublishedSortControls.tsx`, `src/lib/services/draft-service.ts`, `src/lib/drafts-types.ts` from v1.

---

## Phase 5: Insights page

**Goal:** One place for all performance data, strategy, and coaching. Merges the best of v1's Dashboard (analytics) and Playbook (strategy).

### 5.1 Page sections

```
src/pages/InsightsPage.tsx

Section 1: Your score           ← Score ring + breakdown + improvement tip (fixed)
Section 2: Performance          ← ImpressionsEngagementChart + PerformanceSnapshot table
Section 3: Content mix          ← Actual vs target bar + posting frequency stats
Section 4: Your themes          ← Theme cards with "Write this" buttons
Section 5: 30-day plan          ← ThirtyDayPlan, connected to actual drafts
Section 6: Metrics that matter  ← Benchmark data for follower bracket + tips
```

### 5.2 Score section — educational scaffolding added

Wrap the score ring with an info tooltip: "Your score measures engagement, consistency, growth, content mix, and profile completeness." Show this on first load using a `hasSeenScoreExplainer` localStorage flag.

The `ScoreImprovementTip` must target the user's actual lowest-scoring dimension — derive this from `score.engagementScore`, `score.consistencyScore`, `score.growthScore`, `score.mixScore`, `score.completenessScore` and show the tip for whichever is lowest. **Never use `Math.random()`.**

### 5.3 Theme cards with "Write this" action

Each theme card in section 4 gets a "Write this →" button that navigates to:
```
/compose?purpose=discovery&theme=theme-id
```
The composer reads these params and pre-selects the purpose and theme, then shows the empty state with that theme's example hooks as prompt suggestions.

### 5.4 30-day plan connected to drafts

In `ThirtyDayPlan`, each planned post slot shows:
- A tick and the post title if a matching draft (by theme) exists for that week
- A greyed "not yet written" placeholder if not
- A "Write this" button on each unwritten slot

Match planned posts to drafts by comparing `draft.strategicPurpose` and `draft.themeId` to the plan slot.

### 5.5 Copy and adapt from v1

Copy with fixes:
- `src/lib/score-engine.ts` (fix Math.random in getScoreLabel)
- `src/components/dashboard/ScoreRing.tsx` → `src/components/insights/ScoreRing.tsx`
- `src/components/dashboard/MiniBar.tsx` → `src/components/insights/MiniBar.tsx`
- `src/components/dashboard/ImpressionsEngagementChart.tsx`
- `src/components/dashboard/ContentMixBar.tsx`
- `src/components/strategy/ThirtyDayPlan.tsx`
- `src/components/strategy/ContentStrategySettings.tsx`
- `src/lib/cadence-engine.ts`
- `src/lib/usePerformanceAnalysis.ts`
- `src/lib/usePostScatter.ts`
- `src/lib/services/performance-analysis-service.ts`
- `src/lib/theme-generation.ts`
- `src/lib/content-framework.ts` (getThemesForPurpose, CONTENT_FRAMEWORK)

---

## Phase 6: Trends page

**Goal:** Content discovery — social pulse as the hero, RSS articles as the supporting feed. Bookmarking. Relevance scores. Cleaner filters.

### 6.1 Page layout

```
src/pages/TrendsPage.tsx

[Action bar: filter chips | "My sources" button | Refresh button]

[Social Pulse section — HERO, full width]
  ↳ AI-scored trending topics from Reddit/HN/Twitter
  ↳ Each topic: trending reason, audience fit score, post angle, sample posts

[RSS Articles feed — below social pulse]
  [Single filter bar: tabs (Trending | Recent | All) + category chips inline]
  [Article cards with relevance score + bookmark button]

[No separate sidebar — trending topics + brands as inline filter chips above the article list]
```

### 6.2 Social pulse hero — `src/components/trends/SocialPulse.tsx`

This is the most underused feature in v1. Give it proper real estate.

Each social trending topic card shows:
- Topic name (large, bold)
- Trending reason: "Trending because: [trending_reason from DB]"
- Audience fit: a coloured badge ("Strong fit" / "Good fit" / "Low fit" based on `audience_fit_score`)
- Post angle: the `post_angle` field shown as a quoted suggestion: _"Your angle: [post_angle]"_
- Sample posts: 2-3 linked examples from Reddit/HN/Twitter
- "Write about this →" button linking to `/compose?topic=[topic]`

Display as a horizontal scroll row of 3-4 topic cards, with a "See all" expansion.

Copy `src/lib/services/social-trends-service.ts` from v1 — the data model is already rich enough.

### 6.3 Article cards with relevance + bookmarking

**Relevance score on each card:**
Run `scoreArticleForUser()` from `src/lib/article-scoring.ts` and show the result as a dot indicator:
- 🟢 Strong match (score ≥ 0.7)
- 🟡 Good match (score 0.4-0.7)
- ⚪ Weak match (score < 0.4)

**Bookmark button:**
Add a `saved_articles` table in Supabase (or use localStorage as a fast interim solution): `{ user_id, article_id, saved_at }`. Each article card has a bookmark icon. Bookmarked articles appear in a "Saved" tab above the article list.

### 6.4 Consolidated filters

Replace the two separate filter rows with a single bar:
- Tab-style time filter: "Trending (14d)" | "Recent (30d)" | "All"
- Category chips inline below (same categories as v1)
- Active topic/brand filters shown as dismissible chips

### 6.5 "My sources" — rename Knowledge Base

Rename the "Knowledge Base" button to "My sources". The dialog stays the same — it's just the label that was confusing. Inside the dialog, add a section header "Your RSS feeds" with a description: "Articles from these feeds will appear in your Trends page, personalised to your niche."

Copy: `src/lib/article-service.ts`, `src/lib/trend-detection.ts`, `src/lib/content-sources.ts`, `src/components/knowledge/KnowledgeBaseManager.tsx`, `src/components/trends/WeeklyTrendBrief.tsx` from v1.

### 6.6 Pre-fetch article content on card expand

When the user expands an article card (clicks to reveal post angles), immediately begin fetching the article content in the background:
```ts
onCardExpand: () => {
  prefetchArticleContent(article.url) // fires request, caches result
}
```
When the user then navigates to `/compose?article=ID`, the content is already cached and ContextGathering renders without delay.

---

## Phase 7: Circles

**Goal:** Circles with proper onboarding, proper toggle controls, and an engaging highlights feed.

### 7.1 Empty state with value proposition

Replace the minimal empty state with an illustrated onboarding moment:

```
[Icon: group of people]
"Post more. Together."

People in circles post 2× more consistently than solo users.
Create a circle with up to 4 friends or colleagues. You'll see
each other's posting stats, celebrate wins, and stay accountable.

[Create a circle]  [Join with a code]
```

### 7.2 Privacy toggles — replace checkboxes with toggle switches

Replace `<input type="checkbox">` with the `ToggleSwitch` component built in Phase 0. Same logic, consistent visual treatment.

### 7.3 Circle member cards

Replace the basic `LeaderboardTable` with a card-based layout. Each member card shows:
- Avatar + name
- Posts this week (progress bar vs target)
- Streak (flame icon + count)
- LinkedIn score (if shared)
- Impressions (if shared)

This feels more human and less like a spreadsheet.

### 7.4 Highlights feed improvements

Add placeholder content to the highlights feed when it's empty:
- "When [Name] hits their weekly target, it'll appear here."
- "When someone in your circle publishes a post, you'll see it."

Show 3 placeholder slots with ghost/skeleton styling and the member's name.

Copy and adapt: `src/lib/useCircles.ts`, `src/lib/useCircleLeaderboard.ts`, `src/lib/circles-types.ts`, `src/lib/circles-highlights.ts`, `src/components/circles/CreateCircleDialog.tsx`, `src/components/circles/JoinCircleDialog.tsx`, `src/components/circles/HighlightsFeed.tsx` from v1.

---

## Phase 8: Polish and consistency pass

**Goal:** The app looks and feels like one product, not a collection of features.

### 8.1 Typography audit

Search every file for `text-[` and replace all arbitrary text sizes with the semantic scale defined in Phase 0. There should be zero instances of `text-[Xpx]` in the codebase.

### 8.2 Colour audit

Search every file for hard-coded hex values in className strings (e.g. `text-[#009966]`, `bg-[#0090FF]`). Replace all with CSS token classes:
- `#009966` → use `text-positive` (add this as a Tailwind utility from `--color-positive`)
- `#DC2626` → use `text-negative`
- `#0090FF` → use `text-chart-primary`
- Purpose colours → use `text-discovery`, `text-trust`, `text-authority`

### 8.3 Dark mode audit

Test every page in dark mode. The most common failures:
- Hard-coded white backgrounds (`bg-white` → `bg-card`)
- Hard-coded dark text colours that disappear on dark backgrounds
- Charts with hard-coded colours that need dark-mode variants

### 8.4 Mobile responsiveness

Test every page at 375px width. Key areas to check:
- Sidebar → bottom navigation on mobile (copy `MobileNav` from v1)
- Metric card grid → 2 columns on mobile (already in the grid classes)
- Composer → single column, left panel as a bottom sheet
- Trends social pulse → single-column card stack on mobile

### 8.5 Loading states audit

Every async data fetch should show a skeleton state, not a spinner. Review all pages and replace `IconLoader2` spinners with `Skeleton` components that match the shape of the content they're loading.

### 8.6 Empty states audit

Every list/collection in the app needs a designed empty state using the `EmptyState` component. Check: Posts drafts, Posts published, Insights (no analytics yet), Trends (no articles), Circles, Voice samples.

Empty states should always include:
- An icon
- A heading that explains what will appear here
- A description sentence
- An action button where appropriate

---

## Supabase — tables used (all existing, no schema changes needed)

The new app connects to the same Supabase project and uses the same tables. No migrations needed unless you add bookmarks.

| Table | Used by |
|---|---|
| `user_profiles` | Auth, settings, onboarding, all AI generation |
| `drafts` | Posts page, composer, analytics |
| `analytics_uploads` | Analytics input modal |
| `voice_profiles` | Voice page, composer generation |
| `voice_samples` | Voice page |
| `articles` | Trends, composer article picker |
| `circles` | Circles page |
| `circle_members` | Circles page |
| `social_trending_topics` | Trends social pulse |
| `insights` | Home AI insights |

**Optional new table for bookmarks:**
```sql
create table saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  article_id text not null,
  saved_at timestamptz default now(),
  unique(user_id, article_id)
);
alter table saved_articles enable row level security;
create policy "Users manage own saved articles" on saved_articles
  for all using (auth.uid() = user_id);
```

---

## Files to copy from v1 unchanged

These files have no UX issues and can be copied as-is:

```
src/lib/supabase.ts
src/lib/env.ts
src/lib/utils.ts
src/lib/database.types.ts
src/lib/onboarding-types.ts
src/lib/ai-service-secure.ts          (copy, no changes)
src/lib/ai-generation.ts
src/lib/analytics-parsing.ts
src/lib/article-scoring.ts
src/lib/cadence-engine.ts
src/lib/character-one-liner.ts
src/lib/circles-highlights.ts
src/lib/circles-types.ts
src/lib/content-framework.ts
src/lib/content-sources.ts
src/lib/creator-identity.ts
src/lib/drafts-types.ts
src/lib/insights-service.ts
src/lib/knowledge-base-service.ts
src/lib/query-client.ts
src/lib/trend-detection.ts
src/lib/voice-profile.ts
src/lib/voice-training.ts
src/lib/services/analytics-service.ts
src/lib/services/article-service.ts   (consolidate both article-service files into one here)
src/lib/services/draft-service.ts
src/lib/services/performance-analysis-service.ts
src/lib/services/profile-service.ts
src/lib/services/screenshot-service.ts
src/lib/services/social-trends-service.ts
src/contexts/AuthContext.tsx
src/contexts/UserProfileContext.tsx
src/components/ui/alert-dialog.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/confetti.tsx
src/components/ui/confirm-dialog.tsx
src/components/ui/count-up.tsx
src/components/ui/dialog.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/multi-select-chips.tsx
src/components/ui/radio-card-group.tsx
src/components/ui/skeleton.tsx
src/components/ui/slider.tsx
src/components/ui/staggered-list.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/tooltip.tsx
src/components/ui/achievement-toast.tsx
src/components/composer/HookSwapper.tsx
src/components/composer/InlineCta.tsx
src/components/composer/TextSelectionToolbar.tsx
src/components/composer/ContextGathering.tsx
src/components/composer/ArticleContextCard.tsx
src/components/composer/composer-constants.ts
src/components/analytics/AnalyticsInputModal.tsx
src/components/knowledge/KnowledgeBaseManager.tsx
src/components/trends/WeeklyTrendBrief.tsx
src/components/circles/CreateCircleDialog.tsx
src/components/circles/JoinCircleDialog.tsx
src/lib/useCircles.ts
src/lib/useCircleLeaderboard.ts
src/lib/useAnalyticsDuePosts.ts
src/lib/useContextualPrompts.ts
src/lib/useInsights.ts
src/lib/useLinkedInScore.ts
src/lib/usePerformanceAnalysis.ts
src/lib/usePostScatter.ts
src/lib/usePostingStats.ts
src/lib/useCelebrations.ts
src/lib/useTheme.ts
src/lib/useVoiceTraining.ts
```

---

## Files to NOT copy (replace entirely)

```
src/App.tsx                        → new routing structure
src/pages/DashboardPage.tsx        → replaced by HomePage.tsx
src/pages/DraftsPage.tsx           → replaced by PostsPage.tsx
src/pages/PlaybookPage.tsx         → replaced by InsightsPage.tsx
src/pages/ComposerPage.tsx         → rebuilt with useComposer hook
src/pages/SettingsPage.tsx         → rebuilt with 3 sections
src/pages/VoiceSettingsPage.tsx    → rebuilt as VoicePage.tsx (first-class nav item)
src/pages/TrendsPage.tsx           → rebuilt with social pulse hero
src/pages/OnboardingPage.tsx       → rebuilt as 4-step flow
src/pages/CirclesPage.tsx          → rebuilt with new empty state + card layout
src/components/layout/Sidebar.tsx  → new nav items
src/components/dashboard/*         → replaced by src/components/home/* and src/components/insights/*
src/lib/article-service.ts         → consolidate into src/lib/services/article-service.ts
```

---

## Development order summary

```
Phase 0  → Scaffold + design tokens + shared components         (~1 day)
Phase 1  → Auth + simplified onboarding + settings + voice      (~1 day)
Phase 2  → Home page                                            (~1 day)
Phase 3  → Composer (useComposer hook + canvas)                 (~2 days)
Phase 4  → Posts page (drafts + published + analytics)          (~1 day)
Phase 5  → Insights page (analytics + playbook merged)          (~1 day)
Phase 6  → Trends (social pulse hero + bookmarks)               (~1 day)
Phase 7  → Circles (empty state + toggle switches)              (~0.5 days)
Phase 8  → Polish: typography, colour, dark mode, mobile        (~1 day)
```

Total estimate: ~10 development days to a clean v2.

---

## Key decisions to keep from v1

These are good and should carry over without change:
- Supabase for auth + data (don't change)
- Tailwind v4 + shadcn/ui component primitives (don't change)
- Bricolage Grotesque + Inter typefaces (don't change)
- Stone palette as the neutral foundation (don't change)
- React Query for server state (don't change)
- Discovery / Trust / Authority framework (don't change — it's the product's IP)
- TextSelectionToolbar for inline text editing (don't change — it's excellent)
- ContextGathering for article-based posts (keep and extend)
- Post frameworks + hook patterns system (don't change)
- The score engine logic (don't change, just fix the random bug)
