// Voice profile system
// Stores and analyses individual user's writing style
// Works alongside the content framework to personalise generation

import { supabase } from '@/lib/supabase'

export interface VoiceProfile {
  id: string
  userId: string
  
  // Personality sliders (1-5 scale)
  confidenceLevel: number      // 1=self-deprecating, 5=assertive
  technicalDepth: number       // 1=accessible, 5=deep expertise
  opinionStrength: number      // 1=balanced, 5=strong takes
  warmthLevel: number          // 1=professional distance, 5=warm/personable
  humourLevel: number          // 1=serious, 5=playful/witty
  
  // Writing mechanics (extracted from samples)
  avgSentenceLength: number | null
  avgParagraphLength: number | null
  usesQuestions: boolean
  usesContractions: boolean
  usesParentheticals: boolean
  usesEmDashes: boolean
  usesNumbersFrequently: boolean
  
  // Personal patterns
  signaturePhrases: string[]      // Phrases they use often
  topicsToAvoid: string[]         // Things they don't want to discuss
  excludedPhrases: string[]       // Words/phrases to never use in generated content
  preferredHookStyles: string[]   // Which hook patterns suit them
  
  // AI-generated voice summary (replaces long-form rules when available)
  voiceSummary?: string | null

  // Raw samples
  voiceSamples: string[]

  // Training tracking
  trainedFromDrafts: string[]

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface VoiceAnalysis {
  avgSentenceLength: number
  avgParagraphLength: number
  sentenceLengthVariation: number  // Standard deviation
  usesQuestions: boolean
  questionFrequency: number        // Percentage of posts with questions
  usesContractions: boolean
  contractionFrequency: number
  usesParentheticals: boolean
  usesEmDashes: boolean
  usesNumbersFrequently: boolean
  commonPhrases: string[]
  dominantHookStyle: string | null
  toneIndicators: ToneIndicators
}

export interface ToneIndicators {
  formalityScore: number      // Based on vocabulary and structure
  confidenceScore: number     // Based on hedging language
  warmthScore: number         // Based on personal pronouns and direct address
  technicalScore: number      // Based on jargon and specificity
}

// Default voice profile for new users
export const DEFAULT_VOICE_PROFILE: Omit<VoiceProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  confidenceLevel: 3,
  technicalDepth: 3,
  opinionStrength: 3,
  warmthLevel: 3,
  humourLevel: 2,
  avgSentenceLength: null,
  avgParagraphLength: null,
  usesQuestions: true,
  usesContractions: true,
  usesParentheticals: false,
  usesEmDashes: false,
  usesNumbersFrequently: false,
  signaturePhrases: [],
  topicsToAvoid: [],
  excludedPhrases: [],
  preferredHookStyles: [],
  voiceSamples: [],
  trainedFromDrafts: [],
}

// Slider definitions for UI
export const VOICE_SLIDERS = [
  {
    key: 'confidenceLevel',
    label: 'Confidence',
    leftLabel: 'Self-aware',
    rightLabel: 'Assertive',
    description: 'How boldly do you state your opinions?',
  },
  {
    key: 'technicalDepth',
    label: 'Technical depth',
    leftLabel: 'Accessible',
    rightLabel: 'Expert-level',
    description: 'How much jargon and technical detail do you use?',
  },
  {
    key: 'opinionStrength',
    label: 'Opinion strength',
    leftLabel: 'Balanced',
    rightLabel: 'Strong takes',
    description: 'Do you present multiple sides or take a firm stance?',
  },
  {
    key: 'warmthLevel',
    label: 'Warmth',
    leftLabel: 'Professional',
    rightLabel: 'Personable',
    description: 'How much personal warmth comes through?',
  },
  {
    key: 'humourLevel',
    label: 'Humour',
    leftLabel: 'Serious',
    rightLabel: 'Playful',
    description: 'Do you keep it straight or add wit?',
  },
] as const

// =============================================================================
// VOICE ANALYSIS
// Extract writing patterns from sample posts
// =============================================================================

/**
 * Analyse a collection of writing samples to extract voice patterns
 */
export function analyseVoiceSamples(samples: string[]): VoiceAnalysis {
  if (samples.length === 0) {
    return getEmptyAnalysis()
  }

  const allText = samples.join(' ')
  const sentences = extractSentences(allText)
  const paragraphs = samples.flatMap(s => s.split(/\n\n+/).filter(p => p.trim()))
  
  // Sentence analysis
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const avgSentenceLength = average(sentenceLengths)
  const sentenceLengthVariation = standardDeviation(sentenceLengths)
  
  // Paragraph analysis
  const paragraphLengths = paragraphs.map(p => p.split('\n').filter(l => l.trim()).length)
  const avgParagraphLength = average(paragraphLengths)
  
  // Pattern detection
  const usesQuestions = samples.some(s => s.includes('?'))
  const questionFrequency = samples.filter(s => s.includes('?')).length / samples.length
  
  const contractionPatterns = /\b(don't|won't|can't|isn't|aren't|wasn't|weren't|I'm|you're|we're|they're|it's|that's|what's|here's|there's|let's|I've|you've|we've|they've|I'd|you'd|we'd|they'd|I'll|you'll|we'll|they'll)\b/gi
  const contractionMatches = allText.match(contractionPatterns) || []
  const usesContractions = contractionMatches.length > 0
  const contractionFrequency = contractionMatches.length / sentences.length
  
  const usesParentheticals = /\([^)]+\)/.test(allText)
  const usesEmDashes = /—|--/.test(allText)
  
  // Number usage
  const numberMatches = allText.match(/\b\d+%?\b/g) || []
  const usesNumbersFrequently = numberMatches.length / samples.length > 1
  
  // Common phrases (2-4 word ngrams that appear multiple times)
  const commonPhrases = extractCommonPhrases(samples)
  
  // Hook style detection
  const dominantHookStyle = detectHookStyle(samples)
  
  // Tone indicators
  const toneIndicators = analyseTone(allText, sentences)
  
  return {
    avgSentenceLength: Math.round(avgSentenceLength),
    avgParagraphLength: Math.round(avgParagraphLength * 10) / 10,
    sentenceLengthVariation: Math.round(sentenceLengthVariation),
    usesQuestions,
    questionFrequency: Math.round(questionFrequency * 100),
    usesContractions,
    contractionFrequency: Math.round(contractionFrequency * 100) / 100,
    usesParentheticals,
    usesEmDashes,
    usesNumbersFrequently,
    commonPhrases,
    dominantHookStyle,
    toneIndicators,
  }
}

/**
 * Extract sentences from text
 */
function extractSentences(text: string): string[] {
  // Split on sentence endings, handling common abbreviations
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * Calculate average of number array
 */
function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * Calculate standard deviation
 */
function standardDeviation(nums: number[]): number {
  if (nums.length === 0) return 0
  const avg = average(nums)
  const squareDiffs = nums.map(n => Math.pow(n - avg, 2))
  return Math.sqrt(average(squareDiffs))
}

/**
 * Extract common 2-4 word phrases
 */
function extractCommonPhrases(samples: string[]): string[] {
  const phrases = new Map<string, number>()
  
  for (const sample of samples) {
    const words = sample.toLowerCase().split(/\s+/)
    
    // Extract 2-3 word ngrams
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ')
        // Skip if contains punctuation only or very common words
        if (!/^[a-z\s]+$/.test(phrase)) continue
        if (isBoringPhrase(phrase)) continue
        
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
      }
    }
  }
  
  // Return phrases that appear at least twice
  return Array.from(phrases.entries())
    .filter((entry) => entry[1] >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase)
}

/**
 * Check if phrase is too common to be meaningful
 */
function isBoringPhrase(phrase: string): boolean {
  const boring = [
    'i think', 'i know', 'i have', 'i was', 'i am',
    'it is', 'it was', 'this is', 'that is',
    'to be', 'to do', 'to get', 'to have',
    'of the', 'in the', 'on the', 'for the',
    'and the', 'but the', 'so the',
    'a lot', 'as a', 'at the',
  ]
  return boring.includes(phrase)
}

/**
 * Detect dominant hook style from opening lines
 */
function detectHookStyle(samples: string[]): string | null {
  const hooks = samples.map(s => s.split('\n')[0].trim())
  
  let contrarian = 0
  let consequence = 0
  let admission = 0
  let observation = 0
  
  for (const hook of hooks) {
    const lower = hook.toLowerCase()
    
    // Contrarian indicators
    if (/^(most|everyone|nobody|stop|don't|never|forget)/i.test(hook)) contrarian++
    if (/wrong|myth|lie|overrated|actually/i.test(lower)) contrarian++
    
    // Specific consequence indicators
    if (/\d+%|\d+ (users|customers|people|days|hours|weeks)/i.test(hook)) consequence++
    if (/lost|gained|increased|decreased|reduced|saved/i.test(lower)) consequence++
    
    // Personal admission indicators
    if (/^i (failed|messed|screwed|shipped|made a mistake|was wrong|didn't)/i.test(lower)) admission++
    if (/my .* got|i learned|confession/i.test(lower)) admission++
    
    // Observation indicators
    if (/^(i've (seen|noticed|reviewed|watched)|after \d+|the best .* i know)/i.test(lower)) observation++
    if (/only \d|every .* i've|pattern/i.test(lower)) observation++
  }
  
  const max = Math.max(contrarian, consequence, admission, observation)
  if (max < 2) return null
  
  if (contrarian === max) return 'contrarian'
  if (consequence === max) return 'consequence'
  if (admission === max) return 'admission'
  if (observation === max) return 'observation'
  
  return null
}

/**
 * Analyse tone indicators
 */
function analyseTone(text: string, sentences: string[]): ToneIndicators {
  const lower = text.toLowerCase()
  const wordCount = text.split(/\s+/).length
  
  // Formality (higher = more formal)
  const formalIndicators = (lower.match(/\b(therefore|however|furthermore|consequently|additionally|regarding|concerning)\b/g) || []).length
  const informalIndicators = (lower.match(/\b(kinda|gonna|wanna|gotta|yeah|yep|nope|stuff|things|pretty much|basically)\b/g) || []).length
  const formalityScore = Math.min(5, Math.max(1, 3 + (formalIndicators - informalIndicators) / 2))
  
  // Confidence (higher = more confident)
  const hedgingWords = (lower.match(/\b(maybe|perhaps|might|could|possibly|i think|i believe|i guess|seems|apparently)\b/g) || []).length
  const assertiveWords = (lower.match(/\b(clearly|obviously|definitely|certainly|always|never|must|will|is|are)\b/g) || []).length
  const confidenceScore = Math.min(5, Math.max(1, 3 + (assertiveWords - hedgingWords * 2) / wordCount * 50))
  
  // Warmth (higher = warmer)
  const youUsage = (lower.match(/\byou\b/g) || []).length
  const weUsage = (lower.match(/\bwe\b/g) || []).length
  const personalPronouns = (lower.match(/\b(i|my|me)\b/g) || []).length
  const warmthScore = Math.min(5, Math.max(1, 2 + (youUsage + weUsage + personalPronouns / 2) / sentences.length))
  
  // Technical depth (higher = more technical)
  const technicalPatterns = (text.match(/[A-Z]{2,}|[a-z]+\.[a-z]+|\b(API|UI|UX|CSS|HTML|JS|SDK|CTA|KPI|OKR|MVP)\b/gi) || []).length
  const specificNumbers = (text.match(/\d+(\.\d+)?%?/g) || []).length
  const technicalScore = Math.min(5, Math.max(1, 2 + (technicalPatterns + specificNumbers) / sentences.length))
  
  return {
    formalityScore: Math.round(formalityScore * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 10) / 10,
    warmthScore: Math.round(warmthScore * 10) / 10,
    technicalScore: Math.round(technicalScore * 10) / 10,
  }
}

/**
 * Get empty analysis for when there are no samples
 */
function getEmptyAnalysis(): VoiceAnalysis {
  return {
    avgSentenceLength: 0,
    avgParagraphLength: 0,
    sentenceLengthVariation: 0,
    usesQuestions: true,
    questionFrequency: 0,
    usesContractions: true,
    contractionFrequency: 0,
    usesParentheticals: false,
    usesEmDashes: false,
    usesNumbersFrequently: false,
    commonPhrases: [],
    dominantHookStyle: null,
    toneIndicators: {
      formalityScore: 3,
      confidenceScore: 3,
      warmthScore: 3,
      technicalScore: 3,
    },
  }
}

// =============================================================================
// VOICE CONFIDENCE LEVEL
// Scale voice guidance based on how much training data we have
// =============================================================================

export type VoiceConfidence = 'none' | 'light' | 'moderate' | 'strong'

/**
 * Determine how strongly to apply voice constraints based on sample count.
 * 0 samples → none (no voice constraints)
 * 1–3 samples → light (suggestions only)
 * 4–7 samples → moderate (guidance)
 * 8+ samples → strong (treated as reference examples)
 */
export function voiceConfidenceLevel(sampleCount: number): VoiceConfidence {
  if (sampleCount === 0) return 'none'
  if (sampleCount <= 3) return 'light'
  if (sampleCount <= 7) return 'moderate'
  return 'strong'
}

/**
 * Get a human-readable label for the voice profile strength
 */
export function voiceStrengthLabel(sampleCount: number): string {
  const confidence = voiceConfidenceLevel(sampleCount)
  switch (confidence) {
    case 'none': return 'No samples yet'
    case 'light': return 'Getting started'
    case 'moderate': return 'Learning your style'
    case 'strong': return 'Well-trained'
  }
}


// =============================================================================
// VOICE PROFILE TO PROMPT
// Convert voice settings into AI instructions
// =============================================================================

/**
 * Convert a voice profile into prompt instructions
 */
export function voiceProfileToPrompt(profile: VoiceProfile | null): string {
  if (!profile) {
    return ''
  }

  let prompt = `## PERSONAL VOICE SETTINGS\n\n`

  // If we have an AI-generated voice summary, use it as a concise brief
  // instead of the longer mechanical rules
  if (profile.voiceSummary) {
    prompt += `### Voice profile (AI-analysed)\n`
    prompt += `${profile.voiceSummary}\n\n`

    // Still include excluded phrases and topics — those are user-specified hard constraints
    if (profile.excludedPhrases?.length > 0) {
      prompt += `### Excluded phrases\n`
      prompt += `NEVER use any of these exact words or phrases in the output:\n`
      profile.excludedPhrases.forEach(phrase => {
        prompt += `- "${phrase}"\n`
      })
      prompt += `Find alternative wording instead.\n`
    }

    if (profile.topicsToAvoid?.length > 0) {
      prompt += `\n### Topics to avoid\n`
      prompt += `Never mention or reference:\n`
      profile.topicsToAvoid.forEach(topic => {
        prompt += `- ${topic}\n`
      })
    }

    // Include recent voice samples for reference
    if (profile.voiceSamples?.length > 0) {
      const recentSamples = profile.voiceSamples.slice(-5)
      prompt += `\n### Voice reference examples\n`
      prompt += `Match the voice, rhythm, and personality of these examples:\n\n`
      recentSamples.forEach((sample, i) => {
        prompt += `**Example ${i + 1}:**\n"${sample.substring(0, 400)}${sample.length > 400 ? '...' : ''}"\n\n`
      })
    }

    return prompt
  }

  // Fallback: mechanical rules when no AI summary exists

  // Personality settings
  prompt += `### Tone calibration\n`
  
  if (profile.confidenceLevel <= 2) {
    prompt += `- Write with self-awareness. Use phrases like "I've found that" or "In my experience" rather than absolute statements.\n`
  } else if (profile.confidenceLevel >= 4) {
    prompt += `- Write assertively. State opinions directly without excessive hedging. Own your perspective.\n`
  }
  
  if (profile.technicalDepth <= 2) {
    prompt += `- Keep language accessible. Explain any jargon. Write for someone smart but not necessarily in the field.\n`
  } else if (profile.technicalDepth >= 4) {
    prompt += `- Use technical language freely. The audience knows design terminology. Be precise and specific.\n`
  }
  
  if (profile.opinionStrength <= 2) {
    prompt += `- Present balanced perspectives. Acknowledge trade-offs and alternative views.\n`
  } else if (profile.opinionStrength >= 4) {
    prompt += `- Take strong stances. Don't hedge. It's okay to be provocative or contrarian.\n`
  }
  
  if (profile.warmthLevel <= 2) {
    prompt += `- Maintain professional distance. Focus on the ideas rather than personal connection.\n`
  } else if (profile.warmthLevel >= 4) {
    prompt += `- Be warm and personable. Address the reader directly. Let personality come through.\n`
  }
  
  if (profile.humourLevel <= 2) {
    prompt += `- Keep the tone serious and focused. No jokes or playfulness.\n`
  } else if (profile.humourLevel >= 4) {
    prompt += `- Add wit and playfulness where appropriate. Light humour is welcome.\n`
  }
  
  // Writing mechanics
  prompt += `\n### Writing mechanics\n`
  
  if (profile.avgSentenceLength) {
    prompt += `- Target sentence length: around ${profile.avgSentenceLength} words on average.\n`
  }
  
  if (profile.usesContractions) {
    prompt += `- Use contractions naturally (don't, won't, it's).\n`
  } else {
    prompt += `- Avoid contractions. Write out "do not" instead of "don't".\n`
  }
  
  if (profile.usesQuestions) {
    prompt += `- Include questions to engage the reader.\n`
  }
  
  if (profile.usesParentheticals) {
    prompt += `- Parenthetical asides are welcome (like this).\n`
  }
  
  if (profile.usesEmDashes) {
    prompt += `- Em dashes are okay for emphasis—use them sparingly.\n`
  } else {
    prompt += `- Avoid em dashes.\n`
  }
  
  // Signature phrases
  if (profile.signaturePhrases?.length > 0) {
    prompt += `\n### Signature phrases the writer uses\n`
    prompt += `These phrases are part of their natural voice. Use them where they fit:\n`
    profile.signaturePhrases.forEach(phrase => {
      prompt += `- "${phrase}"\n`
    })
  }
  
  // Preferred hook styles
  if (profile.preferredHookStyles?.length > 0) {
    prompt += `\n### Preferred hook styles\n`
    prompt += `This writer tends to favour these hook patterns:\n`
    profile.preferredHookStyles.forEach(style => {
      prompt += `- ${style}\n`
    })
  }
  
  // Topics to avoid
  if (profile.topicsToAvoid?.length > 0) {
    prompt += `\n### Topics to avoid\n`
    prompt += `Never mention or reference:\n`
    profile.topicsToAvoid.forEach(topic => {
      prompt += `- ${topic}\n`
    })
  }
  
  // Excluded phrases
  if (profile.excludedPhrases?.length > 0) {
    prompt += `\n### Excluded phrases\n`
    prompt += `NEVER use any of these exact words or phrases in the output:\n`
    profile.excludedPhrases.forEach(phrase => {
      prompt += `- "${phrase}"\n`
    })
    prompt += `Find alternative wording instead.\n`
  }

  // Voice samples for reference — use 5 most recent to prioritise current voice
  if (profile.voiceSamples?.length > 0) {
    const recentSamples = profile.voiceSamples.slice(-5)
    prompt += `\n### Voice reference examples\n`
    prompt += `Match the voice, rhythm, and personality of these examples:\n\n`
    recentSamples.forEach((sample, i) => {
      prompt += `**Example ${i + 1}:**\n"${sample.substring(0, 400)}${sample.length > 400 ? '...' : ''}"\n\n`
    })
  }
  
  return prompt
}

// =============================================================================
// EXCLUDED PHRASES SERVICE
// Add/remove phrases from the user's voice profile
// =============================================================================

/**
 * Append a phrase to the user's excluded_phrases array
 */
export async function addExcludedPhrase(userId: string, phrase: string): Promise<void> {
  const trimmed = phrase.trim()
  if (!trimmed) return

  // Fetch current excluded phrases
  const { data } = await supabase
    .from('voice_profiles')
    .select('excluded_phrases')
    .eq('user_id', userId)
    .single()

  const current: string[] = (data as any)?.excluded_phrases || []

  // Don't add duplicates
  if (current.some(p => p.toLowerCase() === trimmed.toLowerCase())) return

  await supabase
    .from('voice_profiles')
    .update({ excluded_phrases: [...current, trimmed] })
    .eq('user_id', userId)
}

/**
 * Remove a phrase from the user's excluded_phrases array
 */
export async function removeExcludedPhrase(userId: string, phrase: string): Promise<void> {
  const { data } = await supabase
    .from('voice_profiles')
    .select('excluded_phrases')
    .eq('user_id', userId)
    .single()

  const current: string[] = (data as any)?.excluded_phrases || []
  const updated = current.filter(p => p !== phrase)

  await supabase
    .from('voice_profiles')
    .update({ excluded_phrases: updated })
    .eq('user_id', userId)
}

/**
 * Append an edited draft as a voice sample
 */
export async function addVoiceSample(userId: string, sample: string): Promise<void> {
  const trimmed = sample.trim()
  if (!trimmed) return

  const { data } = await supabase
    .from('voice_profiles')
    .select('voice_samples')
    .eq('user_id', userId)
    .single()

  const current: string[] = (data as any)?.voice_samples || []

  // Cap at 20 samples
  if (current.length >= 20) return

  await supabase
    .from('voice_profiles')
    .update({ voice_samples: [...current, trimmed] })
    .eq('user_id', userId)
}
