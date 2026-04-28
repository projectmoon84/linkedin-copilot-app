import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { supabase } from '@/lib/supabase'
import type { WeeklyScore } from '@/lib/score-engine'

function getISOWeekStart(date: Date): string {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  const day = next.getDay()
  const diff = next.getDate() - day + (day === 0 ? -6 : 1)
  next.setDate(diff)
  return next.toISOString().split('T')[0]
}

export interface WeeklyPerformance {
  weekStart: string
  totalImpressions: number
  totalMembersReached: number
  totalReactions: number
  totalComments: number
  totalReposts: number
  postCount: number
  engagementRate: number | null
}

interface ScoreData {
  score: WeeklyScore | null
  history: WeeklyScore[]
  impressionsHistory: WeeklyPerformance[]
  reportableWeek: WeeklyPerformance | null
  previousWeek: WeeklyPerformance | null
  reportableWeekLabel: string | null
}

async function fetchScoreData(userId: string): Promise<ScoreData> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('calculate_weekly_score' as any)

  if (rpcError) throw rpcError

  const raw = rpcData as any
  const score: WeeklyScore | null = raw && raw.overall_score !== undefined
    ? {
        overallScore: raw.overall_score,
        engagementScore: raw.engagement_score,
        consistencyScore: raw.consistency_score,
        growthScore: raw.growth_score,
        mixScore: raw.mix_score,
        completenessScore: raw.completeness_score,
        followerBracket: raw.follower_bracket,
        postsWithAnalytics: raw.posts_with_analytics,
        weekStart: raw.week_start,
      }
    : null

  const { data: historyData } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(8)

  const history: WeeklyScore[] = (historyData || []).map((row: any) => ({
    overallScore: row.overall_score,
    engagementScore: row.engagement_score,
    consistencyScore: row.consistency_score,
    growthScore: row.growth_score,
    mixScore: row.mix_score,
    completenessScore: row.completeness_score,
    followerBracket: row.follower_bracket,
    postsWithAnalytics: row.posts_with_analytics,
    weekStart: row.week_start,
  }))

  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const { data: perfData } = await supabase
    .from('drafts')
    .select('published_at, post_performance(impressions, members_reached, reactions, comments, reposts)')
    .eq('user_id', userId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .gte('published_at', eightWeeksAgo.toISOString())

  const weeklyMap: Record<string, Omit<WeeklyPerformance, 'weekStart' | 'engagementRate'>> = {}

  for (const draft of (perfData || []) as any[]) {
    if (!draft.published_at) continue
    const weekStart = getISOWeekStart(new Date(draft.published_at))

    weeklyMap[weekStart] ??= {
      totalImpressions: 0,
      totalMembersReached: 0,
      totalReactions: 0,
      totalComments: 0,
      totalReposts: 0,
      postCount: 0,
    }

    const performances = Array.isArray(draft.post_performance) ? draft.post_performance : []
    for (const performance of performances) {
      weeklyMap[weekStart].totalImpressions += performance.impressions || 0
      weeklyMap[weekStart].totalMembersReached += performance.members_reached || 0
      weeklyMap[weekStart].totalReactions += performance.reactions || 0
      weeklyMap[weekStart].totalComments += performance.comments || 0
      weeklyMap[weekStart].totalReposts += performance.reposts || 0
    }
    weeklyMap[weekStart].postCount++
  }

  const impressionsHistory: WeeklyPerformance[] = Object.entries(weeklyMap)
    .map(([weekStart, data]) => {
      const totalEngagement = data.totalReactions + data.totalComments + data.totalReposts
      return {
        weekStart,
        ...data,
        engagementRate: data.totalImpressions > 0 ? (totalEngagement / data.totalImpressions) * 100 : null,
      }
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  const currentWeekStart = getISOWeekStart(new Date())
  const completedWeeks = impressionsHistory.filter((week) => week.weekStart < currentWeekStart)
  const reportableWeek = completedWeeks.at(-1) ?? null
  const previousWeek = completedWeeks.at(-2) ?? null

  const reportableWeekLabel = reportableWeek
    ? `w/c ${new Date(`${reportableWeek.weekStart}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : null

  return { score, history, impressionsHistory, reportableWeek, previousWeek, reportableWeekLabel }
}

export function useLinkedInScore() {
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const userId = profile?.userId

  const { data, isLoading, error } = useQuery({
    queryKey: ['linkedInScore', userId],
    queryFn: () => fetchScoreData(userId!),
    enabled: Boolean(userId),
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['linkedInScore', userId] })
  }, [queryClient, userId])

  return {
    score: data?.score ?? null,
    history: data?.history ?? [],
    impressionsHistory: data?.impressionsHistory ?? [],
    reportableWeek: data?.reportableWeek ?? null,
    previousWeek: data?.previousWeek ?? null,
    reportableWeekLabel: data?.reportableWeekLabel ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refresh,
  }
}
