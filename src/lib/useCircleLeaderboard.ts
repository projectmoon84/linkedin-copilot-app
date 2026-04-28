import { useQuery } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { generateHighlights } from '@/lib/circles-highlights'
import type { Highlight, LeaderboardEntry } from '@/lib/circles-types'
import { supabase } from '@/lib/supabase'

interface UseCircleLeaderboardResult {
  leaderboard: LeaderboardEntry[]
  highlights: Highlight[]
  loading: boolean
  error: string | null
}

async function fetchLeaderboard(circleId: string): Promise<{ leaderboard: LeaderboardEntry[]; highlights: Highlight[] }> {
  const { data, error } = await (supabase.rpc as any)('get_circle_leaderboard', {
    p_circle_id: circleId,
  })

  if (error) throw error

  const leaderboard = ((data as any[]) || []).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    avatarSeed: row.avatar_seed || row.display_name || row.user_id,
    role: row.role,
    shareScore: Boolean(row.share_score),
    shareImpressions: Boolean(row.share_impressions),
    overallScore: row.overall_score,
    prevScore: row.prev_score,
    postsThisWeek: row.posts_this_week ?? 0,
    postsTarget: row.posts_target ?? 3,
    streak: row.streak ?? 0,
    impressions: row.impressions,
    isCurrentUser: Boolean(row.is_current_user),
  })) satisfies LeaderboardEntry[]

  return {
    leaderboard,
    highlights: generateHighlights(leaderboard),
  }
}

export function useCircleLeaderboard(circleId: string | null): UseCircleLeaderboardResult {
  const { profile } = useUserProfile()

  const { data, isLoading, error } = useQuery({
    queryKey: ['circleLeaderboard', circleId],
    queryFn: () => fetchLeaderboard(circleId!),
    enabled: Boolean(profile?.userId && circleId),
  })

  return {
    leaderboard: data?.leaderboard ?? [],
    highlights: data?.highlights ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}
