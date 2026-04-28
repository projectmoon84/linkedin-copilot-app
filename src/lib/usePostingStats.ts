import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { getCadenceRecommendation, suggestNextPost, type PostingStats, type PurposeWeighting } from '@/lib/cadence-engine'
import type { ContentGoal, PostingFrequency, StrategicPurpose } from '@/lib/onboarding-types'
import { supabase } from '@/lib/supabase'

async function fetchPostingStats(profile: NonNullable<ReturnType<typeof useUserProfile>['profile']>) {
  const { data, error } = await supabase.rpc('get_my_posting_stats' as any)

  if (error) throw error

  const raw = data as any
  const stats: PostingStats = {
    thisWeek: {
      discovery: raw?.this_week?.discovery ?? 0,
      trust: raw?.this_week?.trust ?? 0,
      authority: raw?.this_week?.authority ?? 0,
    },
    totalThisWeek: (raw?.this_week?.discovery ?? 0) + (raw?.this_week?.trust ?? 0) + (raw?.this_week?.authority ?? 0),
    daysSinceLastPost: raw?.days_since_last_post ?? null,
    totalPublished: raw?.total_published ?? 0,
    streakWeeks: raw?.streak_weeks ?? 0,
  }

  const recommendation = getCadenceRecommendation(
    (profile.postingFrequencyGoal as PostingFrequency) || 'weekly',
    (profile.strategicPurpose as StrategicPurpose) || 'trust',
    (profile.contentGoals as ContentGoal[]) || [],
    profile.preferredPostingDays || [],
    null as PurposeWeighting | null,
  )

  return {
    stats,
    recommendation,
    nextPost: suggestNextPost(recommendation, stats),
  }
}

export function usePostingStats() {
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const userId = profile?.userId

  const { data, isLoading, error } = useQuery({
    queryKey: ['postingStats', userId],
    queryFn: () => fetchPostingStats(profile!),
    enabled: Boolean(userId && profile),
  })

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['postingStats', userId] })
  }, [queryClient, userId])

  return {
    stats: data?.stats ?? null,
    recommendation: data?.recommendation ?? null,
    nextPost: data?.nextPost ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refresh,
  }
}
