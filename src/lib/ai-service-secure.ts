// Secure AI generation service
// Calls the Supabase Edge Function which handles AI API calls server-side
// Supports both OpenAI and Claude providers
// The API key is never exposed to the client

import { supabase } from './supabase'
import type { Article } from './trend-detection'
import type { StrategicPurpose } from './onboarding-types'
import type { PerspectiveContext } from '@/components/composer/ContextGathering'
import {
  CONTENT_FRAMEWORK,
  validateContentForPurpose,
  getStrategicPurposeGuidance,
  getToneModifierPrompt,
  themeToPrompt,
  type ContentTheme,
  ADDITIONAL_BANNED_VOCAB,
  TIER_1_BANNED,
  POST_FORMATTING_CONSTRAINTS,
  HOOK_CONSTRAINTS,
  viralHookFrameworksToPrompt,
  postFrameworksToPrompt,
  ctaTypeToPrompt,
  type CtaTypeId,
  type PostFrameworkId,
  UX_DOMAIN_KNOWLEDGE,
  repurposeFormatToPrompt,
  type RepurposeFormatId,
} from './content-framework'
import { type VoiceProfile, voiceProfileToPrompt, voiceConfidenceLevel } from './voice-profile'

export type AiProvider = 'openai' | 'claude'

export interface AiPreferences {
  provider: AiProvider | null
  model: string | null
}

export interface GenerationContext {
  // User profile
  displayName: string | null
  jobTitle: string | null
  primaryDiscipline: string | null
  yearsExperience: number | null
  targetAudience: string[]
  strategicPurpose: StrategicPurpose | null
  toneFormality: number
  toneStyle: number
  toneSamples: string[]

  // Voice profile
  voiceProfile?: VoiceProfile | null

  // Content context
  article?: Article
  selectedAngle?: string
  customPrompt?: string

  // Content theme selection
  selectedTheme?: ContentTheme | null
  personalisedThemes?: ContentTheme[] | null

  // Post framework and CTA type (from LI-post-generator.md)
  ctaType?: CtaTypeId
  preferredFramework?: PostFrameworkId | string

  // Perspective context (from article context gathering)
  perspectiveContext?: PerspectiveContext
  articleContent?: string
}

export interface GeneratedDraft {
  content: string
  hooks: string[]
  suggestedBrands: string[]
  targetPurpose: StrategicPurpose
  wordCount: number
  validationScore: number
  validationIssues: string[]
  framework?: string  // which post framework the AI chose (e.g. "Hot take")
}

export interface GeneratedHook {
  hook: string
  framework: string
}

// Build the system prompt
function buildSystemPrompt(context: GenerationContext): string {
  const purpose = context.strategicPurpose || 'trust'

  const formalityDesc = context.toneFormality <= 2
    ? 'more formal and polished'
    : context.toneFormality >= 4
      ? 'casual and conversational'
      : 'professional but approachable'

  const styleDesc = context.toneStyle <= 2
    ? 'educational and helpful'
    : context.toneStyle >= 4
      ? 'opinionated and provocative'
      : 'balanced – informative with a clear point of view'

  // ── Tiered banned vocabulary ────────────────────────────────────────────
  // Tier 1: absolute worst AI clichés — always banned, hard constraint
  // Tier 2: the rest of the banned list — softer guidance ("strongly avoid")
  const tier2Banned = [...new Set([...CONTENT_FRAMEWORK.bannedPhrases, ...ADDITIONAL_BANNED_VOCAB])]
    .filter(phrase => !TIER_1_BANNED.some(t1 => t1.toLowerCase() === phrase.toLowerCase()))

  // ── Voice confidence scaling ──────────────────────────────────────────
  const sampleCount = context.voiceProfile?.voiceSamples?.length || context.toneSamples?.length || 0
  const voiceConfidence = voiceConfidenceLevel(sampleCount)

  let prompt = `You are a LinkedIn content writer helping a ${context.jobTitle || 'product/design professional'} create posts that make smart people pause mid-scroll.

## ABOUT THE WRITER
- Name: ${context.displayName || 'A product/design professional'}
- Role: ${context.jobTitle || 'Designer'}
- Experience: ${context.yearsExperience || 'Several'} years in ${context.primaryDiscipline?.replace('-', ' ') || 'product/design'}
- Writing for: ${context.targetAudience.length > 0 ? context.targetAudience.join(', ') : 'product leaders, founders, and senior designers'}
- Tone preference: ${formalityDesc}, ${styleDesc}

${getStrategicPurposeGuidance(purpose as StrategicPurpose)}

${getToneModifierPrompt(purpose as StrategicPurpose)}

## POST STRUCTURE GUIDANCE

The Epiphany Bridge (Hook → Agitation → Shift → Evidence → Takeaway → CTA) is one strong structure. Use it if it fits the content naturally, but don't force it — some posts work better as a simple story, a list of observations, or a single sharp insight. Let the content dictate the shape.

${postFrameworksToPrompt(context.preferredFramework as string | undefined)}

## HOOK WRITING

These 4 frameworks are proven patterns for strong opening lines. Use them as inspiration — you don't need to follow one rigidly, but your hook MUST stop the scroll:

${viralHookFrameworksToPrompt()}

${HOOK_CONSTRAINTS}

${POST_FORMATTING_CONSTRAINTS}

## BANNED VOCABULARY

### Never use these (hard ban):
${TIER_1_BANNED.join(', ')}

### Strongly avoid these (rewrite if you catch yourself using them):
${tier2Banned.slice(0, 40).join(', ')}

## CRITICAL REQUIREMENTS

1. The HOOK is everything. First sentence under 12 words. Make the reader need to click "see more".
2. NEVER use hard-banned vocabulary. If you catch yourself writing one, rewrite immediately.
3. Be SPECIFIC. Names, numbers, tools, companies. Vague is forgettable.
4. Every sentence must pass the Bar Test: would you say this out loud to a colleague at a bar?
5. Write like a human sharing field notes, not an AI writing thought leadership.
6. Stop explaining one step earlier than feels necessary.
7. Use → for bullets. Never numbered lists in the body.
8. Blank line between every paragraph. No paragraph longer than 2 lines.
${voiceConfidence !== 'none' ? `9. Follow the personal voice settings below${voiceConfidence === 'strong' ? ' carefully — they are well-established' : voiceConfidence === 'moderate' ? ' as guidance' : ' as light suggestions (limited training data)'}.` : ''}

${context.voiceProfile ? voiceProfileToPrompt(context.voiceProfile) : ''}

${context.selectedTheme ? themeToPrompt(context.selectedTheme) : ''}
`

  // Add tone samples if no voice profile (only pass 5 most recent)
  if (!context.voiceProfile && context.toneSamples && context.toneSamples.length > 0) {
    const recentSamples = context.toneSamples.slice(-5)
    prompt += `## VOICE REFERENCE\n\n`
    prompt += `Match the voice, vocabulary, and personality of these examples from the writer:\n\n`
    recentSamples.forEach((sample, i) => {
      prompt += `### Example ${i + 1}:\n"${sample.substring(0, 600)}"\n\n`
    })
  }

  // ── UX domain knowledge ─────────────────────────────────────────────────
  // Always included — this app is built for UX/product design professionals
  prompt += `\n${UX_DOMAIN_KNOWLEDGE}\n`

  return prompt
}

// Build the user prompt
function buildUserPrompt(context: GenerationContext): string {
  let prompt = ''

  if (context.article) {
    const pc = context.perspectiveContext
    const hasAnswers = pc && Object.keys(pc.questionAnswers || {}).length > 0
    const hasPersonalTake = pc?.personalTake?.trim()
    const hasPerspective = hasAnswers || hasPersonalTake

    // Format question answers for the prompt
    const answersBlock = hasAnswers
      ? Object.entries(pc!.questionAnswers).map(([q, a]) => `- Q: ${q}\n  A: ${a}`).join('\n')
      : ''

    prompt = hasPerspective
      ? `Write a LinkedIn post where the author REACTS to this article with their own personal perspective.

**Article:** "${context.article.title}"
**Source:** ${context.article.sourceName}
**Summary:** ${context.article.summary || 'No summary available'}

${context.articleContent ? `**Article content (first ~1,500 words):**\n${context.articleContent.substring(0, 8000)}\n` : ''}

## THE AUTHOR'S PERSPECTIVE

${answersBlock ? `**Their views on the article:**\n${answersBlock}\n` : ''}
${hasPersonalTake ? `**Additional context from the author:** ${pc!.personalTake}` : ''}

**Critical instruction:** The post MUST be built around the author's perspective above. Use their selected viewpoints to determine the angle, tone, and argument of the post. The article is context — the author's opinion is the story. Don't summarise the article. Weave in the author's experience and viewpoint as the central thread.`

      : `Write a LinkedIn post inspired by this article:

**Article:** "${context.article.title}"
**Source:** ${context.article.sourceName}
**Summary:** ${context.article.summary || 'No summary available'}

${context.articleContent ? `**Article content (first ~1,500 words):**\n${context.articleContent.substring(0, 8000)}\n` : ''}

${context.selectedAngle ? `**Angle to take:** ${context.selectedAngle}` : ''}

Important: Don't summarise the article. Use it as a springboard for your OWN perspective, experience, or take. Add value beyond what the article says.`

    prompt += `\n\n${context.article.detectedBrands?.length > 0 ? `Brands you could mention for reach: ${context.article.detectedBrands.map(b => b.name).join(', ')}` : ''}
`
  } else if (context.customPrompt) {
    prompt = `Write a LinkedIn post about: ${context.customPrompt}

Add your own perspective and make it specific. Include real details, examples, or experiences.`
  } else {
    prompt = `Write an engaging LinkedIn post that would resonate with ${context.targetAudience.join(' and ') || 'design professionals'}.

Pick something specific: a lesson learned, a mistake made, an observation noticed, or a process insight. Don't try to cover too much – depth beats breadth.`
  }

  // If a theme is selected, add it as additional context
  if (context.selectedTheme) {
    prompt += `

**Content theme:** ${context.selectedTheme.title}
${context.selectedTheme.description}
Use this theme to guide your topic and angle.`
  }

  // Add CTA type instruction if selected
  if (context.ctaType) {
    prompt += `\n\n${ctaTypeToPrompt(context.ctaType)}`
  }

  prompt += `

## OUTPUT FORMAT

Return your response as JSON in exactly this format:
{
  "content": "The full post content. Use \\n for line breaks between paragraphs.",
  "hooks": ["Alternative hook option 1", "Alternative hook option 2", "Alternative hook option 3"],
  "suggestedBrands": ["@figma", "@linear"],
  "targetPurpose": "${context.strategicPurpose || 'trust'}",
  "framework": "Name of the post framework you used (Story / Framework / Hot take / Case study / Behind the scenes)",
  "hookPatternUsed": "Name of the hook framework you used (Contrarian / Specificity hook / Negative bias / Story opener)"
}

Remember: The hook is EVERYTHING. Spend most of your effort there.`

  return prompt
}

// Get the Supabase Edge Function URL
function getEdgeFunctionUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  return `${supabaseUrl}/functions/v1/generate-content`
}

// Call the Edge Function
async function callEdgeFunction(body: Record<string, unknown>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const response = await fetch(getEdgeFunctionUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate content')
  }

  return data
}

// ============================================================
// Content generation functions
// ============================================================

// Generate a draft using the Edge Function
export async function generateDraftSecure(context: GenerationContext): Promise<GeneratedDraft> {
  const systemPrompt = buildSystemPrompt(context)
  const userPrompt = buildUserPrompt(context)
  const purpose = context.strategicPurpose || 'trust'

  const data = await callEdgeFunction({
    action: 'generate',
    systemPrompt,
    userPrompt,
    temperature: 0.85,
    maxTokens: 1200,
  })

  const rawContent = data.content

  // Parse JSON response
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    const content = parsed.content || ''

    // Validate with purpose-aware rules
    const validation = validateContentForPurpose(content, purpose as StrategicPurpose)

    return {
      content,
      hooks: parsed.hooks || [],
      suggestedBrands: parsed.suggestedBrands || [],
      targetPurpose: parsed.targetPurpose || purpose,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      validationScore: validation.score,
      validationIssues: validation.issues.map(i => i.message),
      framework: parsed.framework || undefined,
    }
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError)
    const validation = validateContentForPurpose(rawContent, purpose as StrategicPurpose)

    return {
      content: rawContent,
      hooks: [],
      suggestedBrands: [],
      targetPurpose: purpose,
      wordCount: rawContent.split(/\s+/).filter(Boolean).length,
      validationScore: validation.score,
      validationIssues: validation.issues.map(i => i.message),
    }
  }
}

// Generate hooks using the Edge Function — returns 10 hooks with framework labels
export async function generateHooksSecure(content: string): Promise<GeneratedHook[]> {
  const allBanned = [...new Set([...CONTENT_FRAMEWORK.bannedPhrases, ...ADDITIONAL_BANNED_VOCAB])]

  const prompt = `Given this LinkedIn post, generate 10 alternative opening hooks.

## THE POST:
${content}

## HOOK FRAMEWORKS TO USE:
${viralHookFrameworksToPrompt()}

${HOOK_CONSTRAINTS}

## BANNED VOCABULARY (never use any of these):
${allBanned.slice(0, 30).join(', ')}

## REQUIREMENTS:
- Generate exactly 10 hooks — at least 2 from each of the 4 frameworks
- Each hook must be 1–2 lines maximum
- Be specific and concrete — no vague generalisations
- Make people want to read more without giving everything away
- The bolder, more specific options are better than the safe ones

Return ONLY a JSON array of 10 objects in exactly this format:
[
  { "hook": "The hook text here.", "framework": "Contrarian" },
  { "hook": "Another hook here.", "framework": "Specificity hook" }
]

Framework names must be one of: Contrarian, Specificity hook, Negative bias, Story opener`

  const data = await callEdgeFunction({
    action: 'hooks',
    content: prompt,
  })

  try {
    const jsonMatch = data.content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Validate shape — accept both new {hook, framework} format and legacy string format
      if (Array.isArray(parsed)) {
        return parsed.map((item: unknown) => {
          if (typeof item === 'string') {
            return { hook: item, framework: 'Unknown' }
          }
          const obj = item as Record<string, unknown>
          return {
            hook: String(obj.hook || ''),
            framework: String(obj.framework || 'Unknown'),
          }
        }).filter(h => h.hook.length > 0)
      }
    }
  } catch (e) {
    console.error('Failed to parse hooks:', e)
  }

  return []
}

// ============================================================
// Article summarisation
// ============================================================

export interface PerspectiveQuestion {
  question: string
  options: string[]
}

export interface ArticleBrief {
  bullets: string[]           // 3-5 key takeaways
  quotes: string[]            // 2-3 notable quotes from the article
  perspectiveQuestions: PerspectiveQuestion[]
}

/**
 * Summarise an article into bullets, quotes, and perspective questions.
 * Uses the user's configured AI provider via the edge function.
 */
export async function summarizeArticle(
  articleTitle: string,
  articleContent: string,
  articleSummary: string | null,
): Promise<ArticleBrief> {
  const prompt = `You are analysing an article so a LinkedIn author can quickly understand it and decide what to write about.

## ARTICLE
**Title:** ${articleTitle}
**Content:**
${articleContent.substring(0, 8000)}

## TASK

Produce a JSON object with exactly this shape:

{
  "bullets": ["...", "...", "..."],
  "quotes": ["...", "..."],
  "perspectiveQuestions": [
    { "question": "...", "options": ["...", "...", "..."] }
  ]
}

### Rules:
- **bullets**: 3–5 short bullet points summarising the key arguments or findings. Each bullet should be 1 sentence, factual, no opinion. Write them so someone can skip reading the full article.
- **quotes**: 2–3 direct, notable quotes from the article text that are interesting, provocative, or worth reacting to. Use the exact wording from the article. If you can't find strong direct quotes, pick the most interesting sentences.
- **perspectiveQuestions**: 3–4 multiple-choice questions designed to quickly capture the reader's personal perspective or reaction. Each question should have 3–4 options. The questions should help the AI understand what angle, opinion, or experience the author wants to bring. Make them specific to THIS article's content — not generic. The options should represent genuinely different viewpoints, not just agree/disagree.

Return ONLY the JSON object, nothing else.`

  const data = await callEdgeFunction({
    action: 'generate',
    systemPrompt: 'You are a helpful article analyst. Always respond with valid JSON only.',
    userPrompt: prompt,
    temperature: 0.5,
    maxTokens: 1000,
  })

  try {
    const jsonMatch = data.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 5) : [],
        quotes: Array.isArray(parsed.quotes) ? parsed.quotes.slice(0, 3) : [],
        perspectiveQuestions: Array.isArray(parsed.perspectiveQuestions)
          ? parsed.perspectiveQuestions.slice(0, 4).map((q: any) => ({
              question: String(q.question || ''),
              options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [],
            })).filter((q: any) => q.question && q.options.length >= 2)
          : [],
      }
    }
  } catch (e) {
    console.error('Failed to parse article summary:', e)
  }

  // Fallback if parsing fails
  return {
    bullets: articleSummary ? [articleSummary] : [],
    quotes: [],
    perspectiveQuestions: [],
  }
}

// ============================================================
// Prompt-based perspective questions
// ============================================================

/**
 * Generate dynamic multiple-choice questions to help shape a LinkedIn post
 * from a free-form prompt, before the draft is generated.
 */
export async function generatePromptQuestions(prompt: string): Promise<PerspectiveQuestion[]> {
  const userPrompt = `A LinkedIn author wants to write about: "${prompt}"

Generate 3 multiple-choice questions that will uncover the angle, voice, and specifics that make this post worth reading.

Focus on:
- Their specific point of view or stance on this topic
- What experience or source sits behind it (first-hand, observed, researched)
- The emotional register or tone they want (direct, reflective, contrarian, instructional)

Rules:
- Questions must be specific to this exact topic — nothing generic
- Each question has 3–4 short, distinct options (under 8 words each)
- Options should represent genuinely different directions, not variations of the same answer
- Keep questions under 12 words
- Avoid agree/disagree framing — make options richer than that

Return ONLY a JSON array:
[
  { "question": "...", "options": ["...", "...", "..."] }
]`

  const data = await callEdgeFunction({
    action: 'generate',
    systemPrompt: 'You generate targeted multiple-choice questions to shape LinkedIn posts. Return ONLY valid JSON, nothing else.',
    userPrompt,
    temperature: 0.7,
    maxTokens: 600,
  })

  try {
    const jsonMatch = data.content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (Array.isArray(parsed)) {
        return parsed
          .slice(0, 4)
          .map((q: any) => ({
            question: String(q.question || ''),
            options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [],
          }))
          .filter((q) => q.question && q.options.length >= 2)
      }
    }
  } catch (e) {
    console.error('Failed to parse prompt questions:', e)
  }

  return []
}

// ============================================================
// AI-assisted voice analysis
// ============================================================

export interface AiVoiceAnalysis {
  voiceSummary: string
  hookStyle: string
  sentenceStyle: string
  signaturePhrases: string[]
  thingsToAvoid: string[]
}

/**
 * Analyse voice samples using AI for higher-quality voice profiling.
 * Requires at least 3 samples for meaningful results.
 */
export async function analyseVoiceWithAI(samples: string[]): Promise<AiVoiceAnalysis | null> {
  if (samples.length < 3) return null

  const samplesText = samples.slice(-10).map((s, i) => `### Sample ${i + 1}:\n${s.substring(0, 800)}`).join('\n\n')

  const prompt = `You are a writing style analyst. Analyse these LinkedIn posts by the same author and extract their distinctive voice characteristics.

## THE AUTHOR'S POSTS

${samplesText}

## TASK

Produce a JSON object with exactly this shape:

{
  "voiceSummary": "A 2-3 sentence description of the author's distinctive writing voice. Focus on what makes it THEIRS — sentence rhythm, opening patterns, level of directness, use of specifics, emotional register. Be concrete, not generic.",
  "hookStyle": "Their dominant hook pattern (e.g. 'contrarian', 'story opener', 'data-led', 'observation', 'admission')",
  "sentenceStyle": "Their sentence rhythm (e.g. 'short punchy', 'long flowing', 'short-medium mix', 'varies dramatically')",
  "signaturePhrases": ["Phrases or expressions they use repeatedly across posts"],
  "thingsToAvoid": ["Patterns or tones NOT present in their writing that the AI should avoid"]
}

Important:
- The voiceSummary should be specific enough that another writer could imitate this person's style from the description alone.
- signaturePhrases should only include phrases that appear in multiple samples.
- thingsToAvoid should list things that would feel out-of-character based on these samples.

Return ONLY the JSON object, nothing else.`

  try {
    const data = await callEdgeFunction({
      action: 'generate',
      systemPrompt: 'You are a writing style analyst. Always respond with valid JSON only.',
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 800,
    })

    const jsonMatch = data.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        voiceSummary: String(parsed.voiceSummary || ''),
        hookStyle: String(parsed.hookStyle || ''),
        sentenceStyle: String(parsed.sentenceStyle || ''),
        signaturePhrases: Array.isArray(parsed.signaturePhrases) ? parsed.signaturePhrases.map(String) : [],
        thingsToAvoid: Array.isArray(parsed.thingsToAvoid) ? parsed.thingsToAvoid.map(String) : [],
      }
    }
  } catch (e) {
    console.error('Failed to analyse voice with AI:', e)
  }

  return null
}

// Legacy wrapper — returns plain strings for backwards compatibility
export async function generateHooksSecureLegacy(content: string): Promise<string[]> {
  const hooks = await generateHooksSecure(content)
  return hooks.map(h => h.hook)
}

// ============================================================
// Content repurposing
// ============================================================

export interface RepurposedContent {
  formatId: RepurposeFormatId
  content: string
}

/**
 * Repurpose an existing LinkedIn post into a different format.
 * Supported formats: twitter-thread, email-snippet, carousel, video-script, quote-cards.
 */
export async function generateRepurposedContent(
  originalPost: string,
  formatId: RepurposeFormatId,
  context: Pick<GenerationContext, 'voiceProfile' | 'toneSamples' | 'displayName' | 'jobTitle'>,
): Promise<RepurposedContent> {
  const userPrompt = repurposeFormatToPrompt(formatId, originalPost)

  const systemPrompt = `You are a content repurposing strategist helping a UX/product design professional transform their LinkedIn post into a new format.

Your job is to:
- Extract the core thesis and strongest insight from the original
- Reformat it natively for the target platform — never just paste the original text
- Rewrite the hook completely for the new format
- Maintain the author's voice: observational, specific, human, not corporate

${context.voiceProfile ? `The author's voice: ${context.voiceProfile.voiceSummary || 'observational, calm, grounded in real product experience'}` : ''}
${!context.voiceProfile && context.toneSamples && context.toneSamples.length > 0
  ? `Match the tone of this writing sample:\n"${context.toneSamples[context.toneSamples.length - 1]?.substring(0, 400)}"`
  : ''}

Hard rules:
- Never use: delve, leverage, seamless, robust, foster, empower, unleash, game-changer, tapestry, synergy
- Write like a real person, not a content marketer
- Every derivative must stand alone — a reader shouldn't need the original to understand it
- Rewrite the hook for every format — the hook is 90% of the battle`

  const data = await callEdgeFunction({
    action: 'generate',
    systemPrompt,
    userPrompt,
    temperature: 0.8,
    maxTokens: 1200,
  })

  return {
    formatId,
    content: data.content || '',
  }
}

// Purpose-specific refinement instructions
// Used when user taps a different purpose in the purpose badge popover
export const PURPOSE_REFINEMENT_INSTRUCTIONS: Record<StrategicPurpose, string> = {
  discovery: 'Rewrite to appeal to people who don\'t know me yet. Open with a broader, attention-grabbing claim. Add 2–3 relevant brand tags (e.g. #Leadership, #ProductManagement) at the end. Aim for 180–220 words. Keep the same topic and key points.',
  trust: 'Rewrite to build credibility and trust. Add a personal experience or specific result that grounds the argument. Keep the same topic but make it feel more authentic and relatable. Use "I" perspective where appropriate.',
  authority: 'Rewrite as a clear, confident point of view. Remove hedging language (maybe, might, could, I think). Structure it as a definitive take rather than a story. Be direct and assertive while keeping the same topic and key points.',
}

// Refine a draft using the Edge Function
export async function refineDraftSecure(
  content: string,
  instruction: string,
  context: GenerationContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context)

  const data = await callEdgeFunction({
    action: 'refine',
    systemPrompt,
    content,
    instruction,
  })

  return data.content || content
}

// ============================================================
// API key management — OpenAI
// ============================================================

export async function hasApiKey(): Promise<boolean> {
  // Check if user has ANY configured API key (OpenAI or Claude)
  const [openai, claude] = await Promise.all([
    hasOpenAiKey(),
    hasClaudeKey(),
  ])
  return openai || claude
}

export async function hasOpenAiKey(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_openai_key' as any)
  if (error) {
    console.error('Error checking OpenAI API key:', error)
    return false
  }
  return data === true
}

export async function saveApiKey(apiKey: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('save_openai_key', { api_key: apiKey })
  if (error) {
    console.error('Error saving OpenAI API key:', error)
    return false
  }
  return data === true
}

export async function deleteApiKey(): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_openai_key' as any)
  if (error) {
    console.error('Error deleting OpenAI API key:', error)
    return false
  }
  return data === true
}

export async function testApiKeySecure(provider: AiProvider = 'openai'): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await callEdgeFunction({ action: 'test', provider })
    return { success: data.success, error: data.error }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================
// API key management — Claude
// ============================================================

export async function hasClaudeKey(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_claude_key' as any)
  if (error) {
    console.error('Error checking Claude API key:', error)
    return false
  }
  return data === true
}

export async function saveClaudeKey(apiKey: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('save_claude_key', { api_key: apiKey })
  if (error) {
    console.error('Error saving Claude API key:', error)
    return false
  }
  return data === true
}

export async function deleteClaudeKey(): Promise<boolean> {
  const { data, error } = await supabase.rpc('delete_claude_key' as any)
  if (error) {
    console.error('Error deleting Claude API key:', error)
    return false
  }
  return data === true
}

// ============================================================
// AI preferences management
// ============================================================

export async function getAiPreferences(): Promise<AiPreferences> {
  const { data, error } = await supabase.rpc('get_ai_preferences' as any)
  if (error) {
    console.error('Error getting AI preferences:', error)
    return { provider: null, model: null }
  }
  return {
    provider: data?.provider || null,
    model: data?.model || null,
  }
}

export async function setAiPreferences(provider: AiProvider, model: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)('set_ai_preferences', {
    p_provider: provider,
    p_model: model,
  })
  if (error) {
    console.error('Error setting AI preferences:', error)
    return false
  }
  return data === true
}
