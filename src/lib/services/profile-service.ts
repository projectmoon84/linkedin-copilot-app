import { supabase } from '@/lib/supabase'
import type { VoiceProfile } from '@/lib/voice-profile'

export async function fetchVoiceProfile(userId: string): Promise<{ profile: VoiceProfile; voiceSamples: string[] } | null> {
  const { data } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  const row = data as Record<string, any>
  const profile: VoiceProfile = {
    id: row.id,
    userId: row.user_id,
    confidenceLevel: row.confidence_level ?? 3,
    technicalDepth: row.technical_depth ?? 3,
    opinionStrength: row.opinion_strength ?? 3,
    warmthLevel: row.warmth_level ?? 3,
    humourLevel: row.humour_level ?? 2,
    avgSentenceLength: row.avg_sentence_length ?? null,
    avgParagraphLength: row.avg_paragraph_length ?? null,
    usesQuestions: row.uses_questions ?? true,
    usesContractions: row.uses_contractions ?? true,
    usesParentheticals: row.uses_parentheticals ?? false,
    usesEmDashes: row.uses_em_dashes ?? false,
    usesNumbersFrequently: row.uses_numbers_frequently ?? false,
    signaturePhrases: row.signature_phrases ?? [],
    topicsToAvoid: row.topics_to_avoid ?? [],
    excludedPhrases: row.excluded_phrases ?? [],
    preferredHookStyles: row.preferred_hook_styles ?? [],
    voiceSummary: row.voice_summary ?? null,
    voiceSamples: row.voice_samples ?? [],
    trainedFromDrafts: row.trained_from_drafts ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  return { profile, voiceSamples: profile.voiceSamples }
}

export async function fetchVoiceProfileRaw(userId: string): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

export async function upsertVoiceProfile(profileData: Record<string, any>): Promise<void> {
  const { error } = await supabase
    .from('voice_profiles')
    .upsert(profileData as any, { onConflict: 'user_id' })

  if (error) throw error
}

export async function updateUserProfile(userId: string, updates: Record<string, any>): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)

  if (error) throw error
}

export async function upsertUserProfile(profileData: Record<string, any>): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(profileData as any)

  if (error) throw error
}

export async function insertToneSamples(samples: Array<{ user_id: string; content: string; source_type: string }>): Promise<void> {
  const { error } = await supabase
    .from('tone_samples')
    .insert(samples as any)

  if (error) throw error
}
