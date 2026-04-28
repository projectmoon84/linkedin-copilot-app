import { supabase } from '@/lib/supabase'
import {
  AI_MODEL_OPTIONS,
  DEFAULT_MODEL_BY_PROVIDER,
  getAiFeaturePreferences,
  getAiPreferences,
} from '@/lib/ai-service-secure'
import type { Insight } from '@/lib/score-engine'

function getEdgeFunctionUrl(): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`
}

export async function generateInsightsSecure(): Promise<Insight[]> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) throw new Error('Not authenticated')

  const [basePreferences, featurePreferences] = await Promise.all([
    getAiPreferences(),
    getAiFeaturePreferences(),
  ])

  const insightsPreference = featurePreferences.insights
  const provider = insightsPreference?.provider ?? basePreferences.provider
  const rawModel = (
    insightsPreference?.model
    ?? (insightsPreference?.provider === basePreferences.provider ? basePreferences.model : null)
    ?? (provider ? DEFAULT_MODEL_BY_PROVIDER[provider] : null)
  )
  const model = provider && rawModel && AI_MODEL_OPTIONS[provider].some((option) => option.value === rawModel)
    ? rawModel
    : (provider ? DEFAULT_MODEL_BY_PROVIDER[provider] : null)

  const response = await fetch(getEdgeFunctionUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      provider,
      model,
    }),
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
