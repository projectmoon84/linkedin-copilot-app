import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { generateInsightsSecure } from '@/lib/insights-service'
import { supabase } from '@/lib/supabase'
import type { Insight } from '@/lib/score-engine'

function getCurrentWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0]
}

async function fetchInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase
    .from('insights')
    .select('id, insight_type, content, suggested_action, generated_at, week_start, dismissed')
    .eq('user_id', userId)
    .eq('week_start', getCurrentWeekStart())
    .eq('dismissed', false)
    .order('generated_at', { ascending: false })
    .limit(6)

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.id,
    insightType: row.insight_type,
    content: row.content,
    suggestedAction: row.suggested_action,
    generatedAt: row.generated_at,
    weekStart: row.week_start,
    dismissed: row.dismissed,
  }))
}

export function useInsights() {
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const userId = profile?.userId
  const [generating, setGenerating] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['insights', userId],
    queryFn: () => fetchInsights(userId!),
    enabled: Boolean(userId),
  })

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: updateError } = await supabase.from('insights').update({ dismissed: true }).eq('id', id)
      if (updateError) throw updateError
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
  })

  const generateInsights = useCallback(async () => {
    setGenerating(true)
    try {
      await generateInsightsSecure()
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })
    } catch (err) {
      console.error('Failed to generate insights:', err)
    } finally {
      setGenerating(false)
    }
  }, [queryClient, userId])

  const autoTriggered = useRef(false)
  useEffect(() => {
    if (autoTriggered.current || isLoading || generating || !userId) return
    if (data && data.length > 0) return

    autoTriggered.current = true
    void generateInsights()
  }, [data, generateInsights, generating, isLoading, userId])

  const allInsights = data ?? []

  return {
    allInsights: allInsights.slice(0, 6),
    loading: isLoading,
    generating,
    error: error ? (error as Error).message : null,
    generatedAt: allInsights[0]?.generatedAt ?? null,
    dismissInsight: (id: string) => dismissMutation.mutateAsync(id),
  }
}
