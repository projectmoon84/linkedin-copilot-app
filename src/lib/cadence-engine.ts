import type { ContentGoal, PostingFrequency, StrategicPurpose } from '@/lib/onboarding-types'
import type { ContentTheme } from '@/lib/content-framework'

export interface PurposeWeighting {
  discovery: number
  trust: number
  authority: number
}

export interface CadenceRecommendation {
  postsPerWeek: number
  weighting: PurposeWeighting
  suggestedDays: string[]
  mixDescription: string
}

export interface PostingStats {
  thisWeek: Record<StrategicPurpose, number>
  totalThisWeek: number
  daysSinceLastPost: number | null
  totalPublished: number
  streakWeeks: number
}

export interface NextPostSuggestion {
  purpose: StrategicPurpose
  reason: string
  urgency: 'on-track' | 'behind' | 'overdue'
}

export interface PlannedPost {
  purpose: StrategicPurpose
  theme: string
  hookSuggestion: string
}

export interface WeekPlan {
  weekNumber: number
  dateRange: string
  posts: PlannedPost[]
  focusTip: string
}

const FREQUENCY_TO_POSTS_PER_WEEK: Record<PostingFrequency, number> = {
  daily: 5,
  few_times_week: 3,
  weekly: 1,
  fortnightly: 0.5,
}

const DEFAULT_POSTING_DAYS: Record<PostingFrequency, string[]> = {
  daily: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  few_times_week: ['monday', 'wednesday', 'friday'],
  weekly: ['tuesday'],
  fortnightly: ['tuesday'],
}

const PURPOSE_FOCUS: Record<StrategicPurpose, PurposeWeighting> = {
  discovery: { discovery: 0.6, trust: 0.3, authority: 0.1 },
  trust: { discovery: 0.3, trust: 0.4, authority: 0.3 },
  authority: { discovery: 0.2, trust: 0.4, authority: 0.4 },
}

const GOAL_INFLUENCE: Record<ContentGoal, Partial<PurposeWeighting>> = {
  get_noticed: { discovery: 0.15 },
  attract_clients: { trust: 0.1, authority: 0.05 },
  build_reputation: { authority: 0.15 },
  share_knowledge: { trust: 0.1, discovery: 0.05 },
  promote_product: { discovery: 0.1, trust: 0.05 },
  grow_network: { discovery: 0.1 },
}

export function normaliseWeighting(weighting: PurposeWeighting): PurposeWeighting {
  const total = weighting.discovery + weighting.trust + weighting.authority
  if (total <= 0) return { discovery: 0.34, trust: 0.33, authority: 0.33 }

  return {
    discovery: weighting.discovery / total,
    trust: weighting.trust / total,
    authority: weighting.authority / total,
  }
}

export function getCadenceRecommendation(
  frequency: PostingFrequency,
  strategicPurpose: StrategicPurpose,
  contentGoals: ContentGoal[] = [],
  preferredDays: string[] = [],
  manualWeighting?: PurposeWeighting | null,
): CadenceRecommendation {
  const postsPerWeek = FREQUENCY_TO_POSTS_PER_WEEK[frequency] ?? 1
  let weighting = manualWeighting ?? PURPOSE_FOCUS[strategicPurpose] ?? PURPOSE_FOCUS.trust

  for (const goal of contentGoals) {
    const influence = GOAL_INFLUENCE[goal]
    if (!influence) continue

    weighting = {
      discovery: weighting.discovery + (influence.discovery ?? 0),
      trust: weighting.trust + (influence.trust ?? 0),
      authority: weighting.authority + (influence.authority ?? 0),
    }
  }

  weighting = normaliseWeighting(weighting)

  return {
    postsPerWeek,
    weighting,
    suggestedDays: preferredDays.length > 0 ? preferredDays : DEFAULT_POSTING_DAYS[frequency],
    mixDescription: `${Math.round(weighting.discovery * 100)}% discovery, ${Math.round(weighting.trust * 100)}% trust, ${Math.round(weighting.authority * 100)}% authority.`,
  }
}

function topPurpose(weighting: PurposeWeighting): StrategicPurpose {
  return (Object.entries(weighting) as [StrategicPurpose, number][]).sort((a, b) => b[1] - a[1])[0][0]
}

export function suggestNextPost(recommendation: CadenceRecommendation, stats: PostingStats): NextPostSuggestion {
  if (stats.daysSinceLastPost !== null && stats.daysSinceLastPost > 7) {
    const purpose = topPurpose(recommendation.weighting)
    return {
      purpose,
      urgency: 'overdue',
      reason: `It has been ${stats.daysSinceLastPost} days since your last post. Start with a ${purpose} post to rebuild momentum.`,
    }
  }

  if (stats.totalThisWeek >= recommendation.postsPerWeek) {
    const purpose = topPurpose(recommendation.weighting)
    return {
      purpose,
      urgency: 'on-track',
      reason: `You have hit this week's target. A bonus ${purpose} post would round out the mix.`,
    }
  }

  const targetCounts: Record<StrategicPurpose, number> = {
    discovery: Math.max(0, Math.round(recommendation.postsPerWeek * recommendation.weighting.discovery) - stats.thisWeek.discovery),
    trust: Math.max(0, Math.round(recommendation.postsPerWeek * recommendation.weighting.trust) - stats.thisWeek.trust),
    authority: Math.max(0, Math.round(recommendation.postsPerWeek * recommendation.weighting.authority) - stats.thisWeek.authority),
  }
  const purpose = (Object.entries(targetCounts) as [StrategicPurpose, number][]).sort((a, b) => b[1] - a[1])[0][0]

  return {
    purpose,
    urgency: 'behind',
    reason: `Your next post should be ${purpose}. It is the biggest gap in this week's mix.`,
  }
}

export function weightingToSegments(weighting: PurposeWeighting): Array<{ purpose: StrategicPurpose; percentage: number }> {
  return (['discovery', 'trust', 'authority'] as StrategicPurpose[]).map((purpose) => ({
    purpose,
    percentage: Math.round(weighting[purpose] * 100),
  }))
}

const WEEK_FOCUS_TIPS = [
  'Build momentum with consistency before chasing polish.',
  'Experiment with one unfamiliar angle and compare the response.',
  'Spend extra time on the first line. The hook carries the post.',
  'Reply to every comment and turn reactions into conversations.',
]

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatRange(start: Date, end: Date) {
  return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

export function generate30DayPlan(
  postsPerWeek: number,
  weighting: PurposeWeighting,
  themesByPurpose: Record<StrategicPurpose, ContentTheme[]>,
): WeekPlan[] {
  const now = new Date()
  const day = now.getDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const startDate = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), daysUntilMonday)
  const themeIndex: Record<StrategicPurpose, number> = { discovery: 0, trust: 0, authority: 0 }
  const weeks: WeekPlan[] = []

  for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
    const weekStart = addDays(startDate, weekIndex * 7)
    const weekEnd = addDays(weekStart, 6)
    const postsThisWeek = Math.max(1, Math.round(postsPerWeek))
    const purposeSlots: StrategicPurpose[] = []
    const discoveryCount = Math.round(postsThisWeek * weighting.discovery)
    const trustCount = Math.round(postsThisWeek * weighting.trust)
    const authorityCount = Math.max(0, postsThisWeek - discoveryCount - trustCount)

    for (let i = 0; i < discoveryCount; i += 1) purposeSlots.push('discovery')
    for (let i = 0; i < trustCount; i += 1) purposeSlots.push('trust')
    for (let i = 0; i < authorityCount; i += 1) purposeSlots.push('authority')
    if (purposeSlots.length === 0) purposeSlots.push(topPurpose(weighting))

    const posts = purposeSlots.map((purpose) => {
      const themes = themesByPurpose[purpose] || []
      const theme = themes[themeIndex[purpose] % Math.max(1, themes.length)]
      themeIndex[purpose] += 1

      return {
        purpose,
        theme: theme?.title || 'General post',
        hookSuggestion: theme?.exampleHooks[weekIndex % Math.max(1, theme.exampleHooks.length)] || '',
      }
    })

    weeks.push({
      weekNumber: weekIndex + 1,
      dateRange: formatRange(weekStart, weekEnd),
      posts,
      focusTip: WEEK_FOCUS_TIPS[weekIndex],
    })
  }

  return weeks
}
