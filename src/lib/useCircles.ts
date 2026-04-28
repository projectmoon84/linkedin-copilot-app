import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { supabase } from '@/lib/supabase'
import type { Circle } from '@/lib/circles-types'

interface UseCirclesResult {
  circles: Circle[]
  loading: boolean
  error: string | null
  createCircle: (name: string) => Promise<{ circleId: string; inviteCode: string } | null>
  joinCircle: (code: string, shareScore: boolean, shareImpressions: boolean) => Promise<boolean>
  leaveCircle: (circleId: string) => Promise<boolean>
  updatePrivacy: (circleId: string, shareScore: boolean, shareImpressions: boolean) => Promise<boolean>
}

async function fetchCircles(userId: string): Promise<Circle[]> {
  const { data: memberships, error: membershipError } = await (supabase as any)
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId)

  if (membershipError) throw membershipError
  if (!memberships?.length) return []

  const circleIds = memberships.map((membership: any) => membership.circle_id)

  const { data: circleData, error: circleError } = await (supabase as any)
    .from('circles')
    .select('id, name, invite_code, created_by, is_workspace, created_at')
    .in('id', circleIds)

  if (circleError) throw circleError

  const { data: countData, error: countError } = await (supabase as any)
    .from('circle_members')
    .select('circle_id')
    .in('circle_id', circleIds)

  if (countError) throw countError

  const counts: Record<string, number> = {}
  for (const row of (countData || []) as Array<{ circle_id: string }>) {
    counts[row.circle_id] = (counts[row.circle_id] || 0) + 1
  }

  return (circleData || []).map((circle: any) => ({
    id: circle.id,
    name: circle.name,
    inviteCode: circle.invite_code,
    createdBy: circle.created_by,
    isWorkspace: Boolean(circle.is_workspace),
    createdAt: circle.created_at,
    memberCount: counts[circle.id] || 0,
  }))
}

export function useCircles(): UseCirclesResult {
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const userId = profile?.userId

  const { data, isLoading, error } = useQuery({
    queryKey: ['circles', userId],
    queryFn: () => fetchCircles(userId!),
    enabled: Boolean(userId),
  })

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['circles', userId] })
  }, [queryClient, userId])

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: result, error: rpcError } = await (supabase.rpc as any)('create_circle', { p_name: name })
      if (rpcError) throw rpcError
      return {
        circleId: result.circle_id as string,
        inviteCode: result.invite_code as string,
      }
    },
    onSuccess: invalidate,
  })

  const joinMutation = useMutation({
    mutationFn: async (params: { code: string; shareScore: boolean; shareImpressions: boolean }) => {
      const { error: rpcError } = await (supabase.rpc as any)('join_circle', {
        p_invite_code: params.code,
        p_share_score: params.shareScore,
        p_share_impressions: params.shareImpressions,
      })
      if (rpcError) throw rpcError
    },
    onSuccess: invalidate,
  })

  const leaveMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const { error: rpcError } = await (supabase.rpc as any)('leave_circle', { p_circle_id: circleId })
      if (rpcError) throw rpcError
    },
    onSuccess: invalidate,
  })

  const privacyMutation = useMutation({
    mutationFn: async (params: { circleId: string; shareScore: boolean; shareImpressions: boolean }) => {
      const { error: rpcError } = await (supabase.rpc as any)('update_circle_privacy', {
        p_circle_id: params.circleId,
        p_share_score: params.shareScore,
        p_share_impressions: params.shareImpressions,
      })
      if (rpcError) throw rpcError
    },
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ['circleLeaderboard', params.circleId] })
    },
  })

  const createCircle = useCallback(async (name: string) => {
    try {
      return await createMutation.mutateAsync(name)
    } catch (err) {
      console.error('Failed to create circle:', err)
      return null
    }
  }, [createMutation])

  const joinCircle = useCallback(async (code: string, shareScore: boolean, shareImpressions: boolean) => {
    try {
      await joinMutation.mutateAsync({ code, shareScore, shareImpressions })
      return true
    } catch (err) {
      console.error('Failed to join circle:', err)
      return false
    }
  }, [joinMutation])

  const leaveCircle = useCallback(async (circleId: string) => {
    try {
      await leaveMutation.mutateAsync(circleId)
      return true
    } catch (err) {
      console.error('Failed to leave circle:', err)
      return false
    }
  }, [leaveMutation])

  const updatePrivacy = useCallback(async (circleId: string, shareScore: boolean, shareImpressions: boolean) => {
    try {
      await privacyMutation.mutateAsync({ circleId, shareScore, shareImpressions })
      return true
    } catch (err) {
      console.error('Failed to update circle privacy:', err)
      return false
    }
  }, [privacyMutation])

  return {
    circles: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    createCircle,
    joinCircle,
    leaveCircle,
    updatePrivacy,
  }
}
