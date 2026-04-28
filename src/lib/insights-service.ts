import { supabase } from '@/lib/supabase'
import type { Insight } from '@/lib/score-engine'

function getEdgeFunctionUrl(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`
}

export async function generateInsightsSecure(): Promise<Insight[]> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated')

  const response = await fetch(getEdgeFunctionUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate insights')
  }

  return (data.insights || []).map((row: any) => ({
    id: row.id,
    insightType: row.insight_type,
    content: row.content,
    suggestedAction: row.suggested_action,
    generatedAt: row.generated_at,
    weekStart: row.week_start,
    dismissed: row.dismissed,
  }))
}
