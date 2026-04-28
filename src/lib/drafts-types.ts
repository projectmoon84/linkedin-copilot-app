import type { AudienceDemographics } from '@/lib/analytics-parsing'
import type { StrategicPurpose } from '@/lib/onboarding-types'

export interface PerformanceData {
  reactions: number
  comments: number
  reposts: number
  impressions: number | null
  membersReached: number | null
  saves: number | null
  followerCountAtPost: number | null
  linkedinPostUrl: string | null
  audienceDemographics: AudienceDemographics | null
  publishedDateFromAnalytics: string | null
}

export interface Draft {
  id: string
  title: string
  content: string
  strategicPurpose: StrategicPurpose | null
  status: 'draft' | 'scheduled' | 'published'
  publishedAt: string | null
  hasPerformanceData: boolean
  performance: PerformanceData | null
  createdAt: string
  updatedAt: string
}

export const PURPOSE_LABELS: Record<StrategicPurpose, string> = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

export type PublishedSort = 'date' | 'impressions' | 'reactions' | 'comments' | 'engagement'
export type AnalyticsFilterValue = 'all' | 'has_data' | 'needs_data'

export function computeEngagementRate(performance: PerformanceData): number | null {
  if (!performance.impressions) return null
  return ((performance.reactions + performance.comments + performance.reposts) / performance.impressions) * 100
}

export function formatMetric(value: number | null | undefined): string {
  if (value == null) return '--'
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

export interface BenchmarkTier {
  maxFollowers: number
  label: string
  impressions: number
  reactions: number
  comments: number
  reposts: number
  saves: number
  engagementRate: number
}

export const BENCHMARK_TIERS: BenchmarkTier[] = [
  { maxFollowers: 500, label: '<500 followers', impressions: 400, reactions: 4, comments: 1, reposts: 0.5, saves: 0.5, engagementRate: 1.8 },
  { maxFollowers: 1000, label: '500-1k followers', impressions: 600, reactions: 6, comments: 1.5, reposts: 0.8, saves: 0.8, engagementRate: 2.0 },
  { maxFollowers: 5000, label: '1k-5k followers', impressions: 800, reactions: 8, comments: 2, reposts: 1, saves: 1, engagementRate: 2.0 },
  { maxFollowers: 10000, label: '5k-10k followers', impressions: 2000, reactions: 20, comments: 4, reposts: 2, saves: 2, engagementRate: 1.6 },
  { maxFollowers: Infinity, label: '10k+ followers', impressions: 5000, reactions: 40, comments: 8, reposts: 4, saves: 3, engagementRate: 1.2 },
]

export function getBenchmarksForUser(followerCount: number | null): BenchmarkTier {
  if (followerCount == null) return BENCHMARK_TIERS[2]
  return BENCHMARK_TIERS.find((tier) => followerCount <= tier.maxFollowers) ?? BENCHMARK_TIERS[2]
}

export function getPercentileLabel(value: number, benchmark: number): { text: string; tone: 'positive' | 'neutral' | 'warning' } {
  if (benchmark === 0) return { text: 'No benchmark', tone: 'neutral' }
  const ratio = value / benchmark
  if (ratio >= 2) return { text: 'Top 10%', tone: 'positive' }
  if (ratio >= 1.2) return { text: 'Above avg', tone: 'positive' }
  if (ratio >= 0.8) return { text: 'Average', tone: 'neutral' }
  return { text: 'Below avg', tone: 'warning' }
}

export function isAnalyticsDue(draft: Draft): boolean {
  if (!draft.publishedAt || draft.hasPerformanceData) return false
  const daysSince = (Date.now() - new Date(draft.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 7
}

export interface PerformanceInsights {
  avgImpressions: number
  avgReactions: number
  avgComments: number
  avgEngagement: number | null
  bestPost: Draft | null
  purposeBreakdown: Array<{
    purpose: StrategicPurpose
    count: number
    avgImpressions: number
    avgEngagement: number | null
  }>
  bestPurposeInsight: string | null
  bestDayInsight: string | null
}

function formatPurpose(purpose: StrategicPurpose) {
  return PURPOSE_LABELS[purpose]
}

export function buildInsights(postsWithData: Draft[]): PerformanceInsights | null {
  if (postsWithData.length < 1) return null

  const performances = postsWithData.map((draft) => draft.performance!)
  const avgImpressions = performances.reduce((sum, p) => sum + (p.impressions ?? 0), 0) / performances.length
  const avgReactions = performances.reduce((sum, p) => sum + p.reactions, 0) / performances.length
  const avgComments = performances.reduce((sum, p) => sum + p.comments, 0) / performances.length
  const engagementRates = performances.map(computeEngagementRate).filter((rate): rate is number => rate != null)
  const avgEngagement = engagementRates.length > 0 ? engagementRates.reduce((sum, rate) => sum + rate, 0) / engagementRates.length : null

  const bestPost = [...postsWithData].sort((a, b) => {
    const aEngagement = (a.performance?.reactions ?? 0) + (a.performance?.comments ?? 0) + (a.performance?.reposts ?? 0)
    const bEngagement = (b.performance?.reactions ?? 0) + (b.performance?.comments ?? 0) + (b.performance?.reposts ?? 0)
    return bEngagement - aEngagement
  })[0] ?? null

  const purposeBreakdown = (['discovery', 'trust', 'authority'] as StrategicPurpose[]).map((purpose) => {
    const purposePosts = postsWithData.filter((draft) => draft.strategicPurpose === purpose)
    const rates = purposePosts.map((draft) => computeEngagementRate(draft.performance!)).filter((rate): rate is number => rate != null)
    const avgPurposeImpressions = purposePosts.length > 0
      ? purposePosts.reduce((sum, draft) => sum + (draft.performance?.impressions ?? 0), 0) / purposePosts.length
      : 0
    return {
      purpose,
      count: purposePosts.length,
      avgImpressions: avgPurposeImpressions,
      avgEngagement: rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null,
    }
  }).filter((item) => item.count > 0)

  const bestPurpose = [...purposeBreakdown]
    .filter((item) => item.avgEngagement != null)
    .sort((a, b) => (b.avgEngagement ?? 0) - (a.avgEngagement ?? 0))[0]
  const weakestPurpose = [...purposeBreakdown]
    .filter((item) => item.avgEngagement != null && item.purpose !== bestPurpose?.purpose)
    .sort((a, b) => (a.avgEngagement ?? 0) - (b.avgEngagement ?? 0))[0]
  const bestPurposeInsight = bestPurpose && weakestPurpose && weakestPurpose.avgEngagement && bestPurpose.avgEngagement
    ? `Your ${formatPurpose(bestPurpose.purpose)} posts average ${(bestPurpose.avgEngagement / weakestPurpose.avgEngagement).toFixed(1)}x more engagement than ${formatPurpose(weakestPurpose.purpose)} posts.`
    : bestPurpose
      ? `Your ${formatPurpose(bestPurpose.purpose)} posts are leading on engagement.`
      : null

  const dayStats = postsWithData.reduce<Record<string, { count: number; total: number }>>((acc, draft) => {
    const date = draft.publishedAt || draft.updatedAt
    const day = new Date(date).toLocaleDateString('en-GB', { weekday: 'long' })
    acc[day] = acc[day] || { count: 0, total: 0 }
    acc[day].count += 1
    acc[day].total += draft.performance?.impressions ?? 0
    return acc
  }, {})
  const dayAverages = Object.entries(dayStats).map(([day, stat]) => ({ day, avg: stat.total / stat.count }))
  const bestDay = [...dayAverages].sort((a, b) => b.avg - a.avg)[0]
  const otherDays = dayAverages.filter((item) => item.day !== bestDay?.day)
  const otherAverage = otherDays.length > 0 ? otherDays.reduce((sum, item) => sum + item.avg, 0) / otherDays.length : null
  const bestDayInsight = bestDay && otherAverage && otherAverage > 0
    ? `Posts published on ${bestDay.day} get ${Math.round(((bestDay.avg - otherAverage) / otherAverage) * 100)}% more impressions for you.`
    : bestDay
      ? `${bestDay.day} is your strongest posting day so far.`
      : null

  return {
    avgImpressions,
    avgReactions,
    avgComments,
    avgEngagement,
    bestPost,
    purposeBreakdown,
    bestPurposeInsight,
    bestDayInsight,
  }
}
