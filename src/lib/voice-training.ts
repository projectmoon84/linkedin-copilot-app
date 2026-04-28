// Voice training service
// Learns from published posts to refine the user's voice profile over time

import { supabase } from '@/lib/supabase'
import { analyseVoiceSamples, type VoiceAnalysis } from '@/lib/voice-profile'

// ─── Types ──────────────────────────────────────────────────────

export interface VoiceProfileDiff {
  field: string
  label: string
  current: string | number | boolean | string[]
  proposed: string | number | boolean | string[]
  type: 'slider' | 'boolean' | 'array' | 'number'
}

export interface VoiceTrainingProposal {
  postCount: number
  draftIds: string[]
  analysis: VoiceAnalysis
  currentProfile: Record<string, any>
  proposedProfile: Record<string, any>
  diffs: VoiceProfileDiff[]
}

// ─── Core functions ─────────────────────────────────────────────

const MIN_UNTRAINED_POSTS = 3

/**
 * Check if voice training is available (3+ untrained published drafts)
 */
export async function isVoiceTrainingAvailable(
  userId: string
): Promise<{ available: boolean; untrainedCount: number }> {
  // Get the user's voice profile to check trained_from_drafts
  const { data: profileData } = await supabase
    .from('voice_profiles')
    .select('trained_from_drafts')
    .eq('user_id', userId)
    .single()

  const trainedIds: string[] = (profileData as any)?.trained_from_drafts || []

  // Count published drafts not yet trained on
  const { data: publishedDrafts } = await supabase
    .from('drafts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'published')

  const untrained = (publishedDrafts || []).filter(
    (d: any) => !trainedIds.includes(d.id)
  )

  return {
    available: untrained.length >= MIN_UNTRAINED_POSTS,
    untrainedCount: untrained.length,
  }
}

/**
 * Build a training proposal from untrained published posts
 */
export async function proposeVoiceTraining(
  userId: string
): Promise<VoiceTrainingProposal | null> {
  // Load current voice profile
  const { data: profileRow } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!profileRow) return null

  const profile = profileRow as any
  const trainedIds: string[] = profile.trained_from_drafts || []

  // Load untrained published drafts
  const { data: publishedDrafts } = await supabase
    .from('drafts')
    .select('id, content')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const untrained = (publishedDrafts || []).filter(
    (d: any) => !trainedIds.includes(d.id)
  )

  if (untrained.length < MIN_UNTRAINED_POSTS) return null

  // Analyse the untrained posts
  const samples = untrained.map((d: any) => d.content as string)
  const analysis = analyseVoiceSamples(samples)

  // Build current vs proposed values
  const currentProfile = {
    confidenceLevel: profile.confidence_level,
    technicalDepth: profile.technical_depth,
    opinionStrength: profile.opinion_strength,
    warmthLevel: profile.warmth_level,
    humourLevel: profile.humour_level,
    usesQuestions: profile.uses_questions,
    usesContractions: profile.uses_contractions,
    usesParentheticals: profile.uses_parentheticals,
    usesEmDashes: profile.uses_em_dashes,
    usesNumbersFrequently: profile.uses_numbers_frequently,
    avgSentenceLength: profile.avg_sentence_length,
    avgParagraphLength: profile.avg_paragraph_length,
    signaturePhrases: profile.signature_phrases || [],
  }

  const proposedProfile = {
    confidenceLevel: clampSlider(Math.round(analysis.toneIndicators.confidenceScore)),
    technicalDepth: clampSlider(Math.round(analysis.toneIndicators.technicalScore)),
    opinionStrength: clampSlider(Math.round(analysis.toneIndicators.confidenceScore)),
    warmthLevel: clampSlider(Math.round(analysis.toneIndicators.warmthScore)),
    humourLevel: currentProfile.humourLevel, // Hard to detect, keep current
    usesQuestions: analysis.usesQuestions,
    usesContractions: analysis.usesContractions,
    usesParentheticals: analysis.usesParentheticals,
    usesEmDashes: analysis.usesEmDashes,
    usesNumbersFrequently: analysis.usesNumbersFrequently,
    avgSentenceLength: analysis.avgSentenceLength,
    avgParagraphLength: analysis.avgParagraphLength,
    signaturePhrases: mergeArrays(
      currentProfile.signaturePhrases,
      analysis.commonPhrases.slice(0, 5),
      10
    ),
  }

  // Compute diffs
  const diffs: VoiceProfileDiff[] = []

  // Slider diffs
  const sliderFields = [
    { field: 'confidenceLevel', label: 'Confidence' },
    { field: 'technicalDepth', label: 'Technical depth' },
    { field: 'opinionStrength', label: 'Opinion strength' },
    { field: 'warmthLevel', label: 'Warmth' },
    { field: 'humourLevel', label: 'Humour' },
  ]
  for (const { field, label } of sliderFields) {
    if (currentProfile[field as keyof typeof currentProfile] !== proposedProfile[field as keyof typeof proposedProfile]) {
      diffs.push({
        field,
        label,
        current: currentProfile[field as keyof typeof currentProfile] as number,
        proposed: proposedProfile[field as keyof typeof proposedProfile] as number,
        type: 'slider',
      })
    }
  }

  // Boolean diffs
  const boolFields = [
    { field: 'usesQuestions', label: 'Uses questions' },
    { field: 'usesContractions', label: 'Uses contractions' },
    { field: 'usesParentheticals', label: 'Uses parentheticals' },
    { field: 'usesEmDashes', label: 'Uses em dashes' },
    { field: 'usesNumbersFrequently', label: 'Uses numbers frequently' },
  ]
  for (const { field, label } of boolFields) {
    if (currentProfile[field as keyof typeof currentProfile] !== proposedProfile[field as keyof typeof proposedProfile]) {
      diffs.push({
        field,
        label,
        current: currentProfile[field as keyof typeof currentProfile] as boolean,
        proposed: proposedProfile[field as keyof typeof proposedProfile] as boolean,
        type: 'boolean',
      })
    }
  }

  // Number diffs
  const numberFields = [
    { field: 'avgSentenceLength', label: 'Avg sentence length' },
    { field: 'avgParagraphLength', label: 'Avg paragraph length' },
  ]
  for (const { field, label } of numberFields) {
    const cur = currentProfile[field as keyof typeof currentProfile]
    const prop = proposedProfile[field as keyof typeof proposedProfile]
    if (cur !== prop) {
      diffs.push({
        field,
        label,
        current: cur as number,
        proposed: prop as number,
        type: 'number',
      })
    }
  }

  // Array diffs (signature phrases)
  const newPhrases = (proposedProfile.signaturePhrases as string[]).filter(
    (p: string) => !(currentProfile.signaturePhrases as string[]).includes(p)
  )
  if (newPhrases.length > 0) {
    diffs.push({
      field: 'signaturePhrases',
      label: 'Signature phrases',
      current: currentProfile.signaturePhrases as string[],
      proposed: proposedProfile.signaturePhrases as string[],
      type: 'array',
    })
  }

  return {
    postCount: untrained.length,
    draftIds: untrained.map((d: any) => d.id),
    analysis,
    currentProfile,
    proposedProfile,
    diffs,
  }
}

/**
 * Apply a voice training proposal: snapshot current, apply changes, mark drafts as trained
 */
export async function applyVoiceTraining(
  userId: string,
  proposal: VoiceTrainingProposal
): Promise<void> {
  // Load current full profile row for snapshot
  const { data: currentRow } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!currentRow) throw new Error('Voice profile not found')

  const profile = currentRow as any

  // 1. Snapshot current profile
  await supabase.from('voice_profile_snapshots').insert({
    user_id: userId,
    voice_profile_id: profile.id,
    snapshot_data: currentRow,
    reason: `Training from ${proposal.postCount} published posts`,
    trained_from_drafts: proposal.draftIds,
  })

  // 2. Apply proposed changes
  const proposed = proposal.proposedProfile
  const existingSamples: string[] = profile.voice_samples || []

  // Load untrained post contents for voice samples
  const { data: draftRows } = await supabase
    .from('drafts')
    .select('content')
    .in('id', proposal.draftIds)

  const newSampleTexts = (draftRows || []).map((d: any) => d.content as string)

  // Respect 10-sample cap: drop oldest if needed
  const combinedSamples = [...existingSamples, ...newSampleTexts]
  const cappedSamples = combinedSamples.slice(-10)

  const trainedIds = [
    ...(profile.trained_from_drafts || []),
    ...proposal.draftIds,
  ]

  await supabase
    .from('voice_profiles')
    .update({
      confidence_level: proposed.confidenceLevel,
      technical_depth: proposed.technicalDepth,
      opinion_strength: proposed.opinionStrength,
      warmth_level: proposed.warmthLevel,
      humour_level: proposed.humourLevel,
      uses_questions: proposed.usesQuestions,
      uses_contractions: proposed.usesContractions,
      uses_parentheticals: proposed.usesParentheticals,
      uses_em_dashes: proposed.usesEmDashes,
      uses_numbers_frequently: proposed.usesNumbersFrequently,
      avg_sentence_length: proposed.avgSentenceLength,
      avg_paragraph_length: proposed.avgParagraphLength,
      signature_phrases: proposed.signaturePhrases,
      voice_samples: cappedSamples,
      trained_from_drafts: trainedIds,
    })
    .eq('user_id', userId)
}

/**
 * Rollback voice profile to the most recent snapshot
 */
export async function rollbackVoiceProfile(
  userId: string
): Promise<{ success: boolean; message: string }> {
  // Get the most recent snapshot
  const { data: snapshots } = await supabase
    .from('voice_profile_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!snapshots || snapshots.length === 0) {
    return { success: false, message: 'No snapshot found to rollback to.' }
  }

  const snapshot = snapshots[0] as any
  const snapshotData = snapshot.snapshot_data

  // Restore the profile from snapshot data
  await supabase
    .from('voice_profiles')
    .update({
      confidence_level: snapshotData.confidence_level,
      technical_depth: snapshotData.technical_depth,
      opinion_strength: snapshotData.opinion_strength,
      warmth_level: snapshotData.warmth_level,
      humour_level: snapshotData.humour_level,
      uses_questions: snapshotData.uses_questions,
      uses_contractions: snapshotData.uses_contractions,
      uses_parentheticals: snapshotData.uses_parentheticals,
      uses_em_dashes: snapshotData.uses_em_dashes,
      uses_numbers_frequently: snapshotData.uses_numbers_frequently,
      avg_sentence_length: snapshotData.avg_sentence_length,
      avg_paragraph_length: snapshotData.avg_paragraph_length,
      signature_phrases: snapshotData.signature_phrases,
      voice_samples: snapshotData.voice_samples,
      trained_from_drafts: snapshotData.trained_from_drafts || [],
    })
    .eq('user_id', userId)

  // Delete the used snapshot (pop from stack)
  await supabase
    .from('voice_profile_snapshots')
    .delete()
    .eq('id', snapshot.id)

  return { success: true, message: 'Voice profile rolled back to previous state.' }
}

// ─── Helpers ────────────────────────────────────────────────────

function clampSlider(value: number): number {
  return Math.min(5, Math.max(1, value))
}

function mergeArrays(existing: string[], newItems: string[], cap: number): string[] {
  const combined = [...existing]
  for (const item of newItems) {
    if (!combined.includes(item) && combined.length < cap) {
      combined.push(item)
    }
  }
  return combined
}
