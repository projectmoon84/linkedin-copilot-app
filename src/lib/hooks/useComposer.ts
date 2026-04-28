import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { PerspectiveContext } from '@/components/composer/ContextGathering'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import {
  generateDraftSecure,
  generateHooksSecure,
  generateRepurposedContent,
  refineDraftSecure,
  type GeneratedHook,
  type GenerationContext,
  type RepurposedContent,
} from '@/lib/ai-service-secure'
import type { RepurposeFormatId } from '@/lib/content-framework'
import { CONTENT_THEMES, validateContentForPurpose, type ContentTheme, type CtaTypeId } from '@/lib/content-framework'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { summarizeArticle, type ArticleBrief } from '@/lib/ai-service-secure'
import {
  createDraft,
  fetchDraftById,
  fetchRecentAutosaveDraft,
  fetchRecentPosts,
  updateDraft,
  type DraftRow,
  type RecentPost,
} from '@/lib/services/draft-service'
import { fetchArticleById, fetchArticleContent, fetchArticles } from '@/lib/services/article-service'
import { fetchVoiceProfile, fetchVoiceProfileRaw, upsertVoiceProfile } from '@/lib/services/profile-service'
import type { Article } from '@/lib/trend-detection'
import type { VoiceProfile } from '@/lib/voice-profile'

type SaveStatus = 'idle' | 'saving' | 'saved'

interface PerformancePatterns {
  bestPurpose: StrategicPurpose | null
  bestDay: string | null
  sampleSize: number
  averageImpressions: number | null
}

const PURPOSES: StrategicPurpose[] = ['discovery', 'trust', 'authority']
const LINKEDIN_CHAR_LIMIT = 3000

function firstLine(content: string) {
  return content.split('\n').find((line) => line.trim())?.trim() || 'Untitled draft'
}

function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function coercePurpose(value: string | null | undefined): StrategicPurpose {
  return value === 'discovery' || value === 'trust' || value === 'authority' ? value : 'discovery'
}

function hooksFromDraft(hooks: string[]): GeneratedHook[] {
  return hooks.map((hook) => ({ hook, framework: 'Generated' })).filter((hook) => hook.hook.trim().length > 0)
}

function applyHookToContent(content: string, hook: string) {
  const paragraphs = content.split(/\n{2,}/)
  if (paragraphs.length === 0) return hook
  paragraphs[0] = hook
  return paragraphs.join('\n\n')
}

function relativeSaveTime(date: Date | null) {
  if (!date) return null
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes <= 0) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`
}

function analysePerformance(posts: RecentPost[]): PerformancePatterns {
  const withImpressions = posts.filter((post) => post.impressions != null)
  const averageImpressions = withImpressions.length > 0
    ? Math.round(withImpressions.reduce((sum, post) => sum + (post.impressions ?? 0), 0) / withImpressions.length)
    : null

  const purposeAverages = PURPOSES.map((purpose) => {
    const purposePosts = withImpressions.filter((post) => post.strategicPurpose === purpose)
    const avg = purposePosts.length > 0
      ? purposePosts.reduce((sum, post) => sum + (post.impressions ?? 0), 0) / purposePosts.length
      : 0
    return { purpose, avg, count: purposePosts.length }
  }).filter((item) => item.count > 0)

  const bestPurpose = purposeAverages.sort((a, b) => b.avg - a.avg)[0]?.purpose ?? null

  const dayAverages = withImpressions.reduce<Record<string, { count: number; total: number }>>((acc, post) => {
    const date = post.publishedAt || post.createdAt
    const day = new Date(date).toLocaleDateString('en-GB', { weekday: 'long' })
    acc[day] = acc[day] || { count: 0, total: 0 }
    acc[day].count += 1
    acc[day].total += post.impressions ?? 0
    return acc
  }, {})

  const bestDay = Object.entries(dayAverages)
    .map(([day, value]) => ({ day, avg: value.total / value.count }))
    .sort((a, b) => b.avg - a.avg)[0]?.day ?? null

  return {
    bestPurpose,
    bestDay,
    sampleSize: withImpressions.length,
    averageImpressions,
  }
}

export function useComposer() {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [searchParams] = useSearchParams()
  const draftParam = searchParams.get('draft')
  const articleParam = searchParams.get('article')
  const purposeParam = searchParams.get('purpose')
  const themeParam = searchParams.get('theme')
  const topicParam = searchParams.get('topic')

  const [content, setContentState] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [article, setArticleState] = useState<Article | null>(null)
  const [activePurpose, setActivePurpose] = useState<StrategicPurpose>('discovery')
  const [selectedTheme, setSelectedTheme] = useState<ContentTheme | null>(null)
  const [ctaType, setCtaType] = useState<CtaTypeId | null>(null)
  const [hooks, setHooks] = useState<GeneratedHook[]>([])
  const [postFramework, setPostFramework] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(draftParam)
  const [restoreCandidate, setRestoreCandidate] = useState<DraftRow | null>(null)
  const [restoreDismissed, setRestoreDismissed] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [validationIssues, setValidationIssues] = useState<string[]>([])
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleContent, setArticleContent] = useState<string | null>(null)
  const [articleBrief, setArticleBrief] = useState<ArticleBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [performancePosts, setPerformancePosts] = useState<RecentPost[]>([])
  const [perspectiveContext, setPerspectiveContext] = useState<PerspectiveContext | null>(null)
  const [repurposing, setRepurposing] = useState(false)
  const [repurposedContent, setRepurposedContent] = useState<RepurposedContent | null>(null)

  useEffect(() => {
    if (profile?.strategicPurpose) setActivePurpose(coercePurpose(profile.strategicPurpose))
  }, [profile?.strategicPurpose])

  useEffect(() => {
    if (purposeParam) setActivePurpose(coercePurpose(purposeParam))
  }, [purposeParam])

  useEffect(() => {
    if (!themeParam) return
    const decodedTheme = decodeURIComponent(themeParam)
    const theme = CONTENT_THEMES.find((item) => item.id === decodedTheme || item.title === decodedTheme)
    if (!theme) {
      setCustomPrompt(decodedTheme)
      return
    }

    setSelectedTheme(theme)
    setActivePurpose(theme.purpose)
    setCustomPrompt(theme.exampleHooks[0] || theme.description)
  }, [themeParam])

  useEffect(() => {
    if (!topicParam) return
    setCustomPrompt(decodeURIComponent(topicParam))
  }, [topicParam])

  useEffect(() => {
    if (!user) return

    void fetchVoiceProfile(user.id).then((result) => {
      setVoiceProfile(result?.profile ?? null)
    })

    void fetchRecentPosts(user.id, 20).then(setPerformancePosts)
  }, [user])

  useEffect(() => {
    let cancelled = false
    setArticlesLoading(true)
    void fetchArticles({ limit: 24, daysBack: 30 })
      .then((articles) => {
        if (!cancelled) setTrendingArticles(articles)
      })
      .finally(() => {
        if (!cancelled) setArticlesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!draftParam || !user) return

    let cancelled = false
    void fetchDraftById(draftParam, user.id).then((draft) => {
      if (cancelled || !draft) return
      setDraftId(draft.id)
      setContentState(draft.content)
      setActivePurpose(draft.strategicPurpose ?? 'discovery')
      setLastSavedAt(draft.updatedAt ? new Date(draft.updatedAt) : null)
      setSaveStatus('saved')
      setIsDirty(false)
    })

    return () => {
      cancelled = true
    }
  }, [draftParam, user])

  useEffect(() => {
    if (!articleParam) return
    let cancelled = false
    void fetchArticleById(articleParam).then((nextArticle) => {
      if (!cancelled) setArticleState(nextArticle)
    })
    return () => {
      cancelled = true
    }
  }, [articleParam])

  useEffect(() => {
    if (!user || draftParam || restoreDismissed) return

    let cancelled = false
    void fetchRecentAutosaveDraft(user.id).then((draft) => {
      if (!cancelled && draft && draft.content.trim()) setRestoreCandidate(draft)
    })

    return () => {
      cancelled = true
    }
  }, [draftParam, restoreDismissed, user])

  useEffect(() => {
    if (!article) {
      setArticleContent(null)
      setArticleBrief(null)
      setPerspectiveContext(null)
      return
    }

    let cancelled = false
    setBriefLoading(true)
    setArticleBrief(null)
    setArticleContent(null)

    void fetchArticleContent(article.url)
      .then(async (contentText) => {
        if (cancelled) return
        setArticleContent(contentText)
        if (!contentText) return null
        return summarizeArticle(article.title, contentText, article.summary)
      })
      .then((brief) => {
        if (!cancelled && brief) setArticleBrief(brief)
      })
      .catch((err) => {
        if (!cancelled) console.error('Article context failed:', err)
      })
      .finally(() => {
        if (!cancelled) setBriefLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [article])

  const setContent = useCallback((nextContent: string) => {
    setContentState(nextContent)
    setIsDirty(true)
    setSaveStatus('idle')
    const validation = validateContentForPurpose(nextContent, activePurpose)
    setValidationIssues(validation.issues.map((issue) => issue.message))
  }, [activePurpose])

  const buildContext = useCallback((overrides?: Partial<GenerationContext>): GenerationContext => ({
    displayName: profile?.displayName ?? null,
    jobTitle: profile?.jobTitle ?? null,
    primaryDiscipline: profile?.primaryDiscipline ?? null,
    yearsExperience: profile?.yearsExperience ?? null,
    targetAudience: profile?.targetAudience ?? [],
    strategicPurpose: activePurpose,
    toneFormality: profile?.stylePreferences?.formality ?? 3,
    toneStyle: profile?.stylePreferences?.style ?? 3,
    toneSamples: voiceProfile?.voiceSamples ?? [],
    voiceProfile,
    article: article ?? undefined,
    customPrompt,
    selectedTheme,
    ctaType: ctaType ?? undefined,
    preferredFramework: postFramework ?? undefined,
    perspectiveContext: perspectiveContext ?? undefined,
    articleContent: articleContent ?? undefined,
    ...overrides,
  }), [activePurpose, article, articleContent, ctaType, customPrompt, perspectiveContext, postFramework, profile, selectedTheme, voiceProfile])

  const save = useCallback(async (options?: { autosave?: boolean }) => {
    if (!user || !content.trim()) return null

    setSaving(true)
    setSaveStatus('saving')
    setError(null)

    try {
      const savedDraft = draftId
        ? await updateDraft({
            id: draftId,
            content,
            strategicPurpose: activePurpose,
            articleId: article?.id ?? null,
            title: options?.autosave ? 'Autosaved draft' : firstLine(content),
            status: 'draft',
          })
        : await createDraft({
            userId: user.id,
            content,
            strategicPurpose: activePurpose,
            articleId: article?.id ?? null,
            title: options?.autosave ? 'Autosaved draft' : firstLine(content),
          })

      setDraftId(savedDraft.id)
      setSaveStatus('saved')
      setLastSavedAt(new Date(savedDraft.updatedAt || Date.now()))
      setIsDirty(false)
      return savedDraft
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Draft could not be saved.'
      setError(message)
      setSaveStatus('idle')
      return null
    } finally {
      setSaving(false)
    }
  }, [activePurpose, article?.id, content, draftId, user])

  useEffect(() => {
    if (!user || !content.trim() || !isDirty || generating || refining) return

    const timeout = window.setTimeout(() => {
      void save({ autosave: true })
    }, 30000)

    return () => window.clearTimeout(timeout)
  }, [content, generating, isDirty, refining, save, user])

  const generate = useCallback(async (perspective?: PerspectiveContext) => {
    setGenerating(true)
    setError(null)
    if (perspective) setPerspectiveContext(perspective)

    try {
      const generated = await generateDraftSecure(buildContext({
        perspectiveContext: perspective ?? perspectiveContext ?? undefined,
      }))
      setContentState(generated.content)
      setHooks(hooksFromDraft(generated.hooks))
      setActivePurpose(generated.targetPurpose)
      setPostFramework(generated.framework ?? null)
      setValidationIssues(generated.validationIssues)
      setIsDirty(true)
      setSaveStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Draft generation failed.')
    } finally {
      setGenerating(false)
    }
  }, [buildContext, perspectiveContext])

  const refine = useCallback(async (instruction: string) => {
    if (!content.trim()) return
    setRefining(true)
    setError(null)

    try {
      const refined = await refineDraftSecure(content, instruction, buildContext())
      setContent(refined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refine this draft.')
    } finally {
      setRefining(false)
    }
  }, [buildContext, content, setContent])

  const applyHook = useCallback((hook: string) => {
    setContent(applyHookToContent(content, hook))
  }, [content, setContent])

  const regenerateHooks = useCallback(async () => {
    if (!content.trim()) return
    setRefining(true)
    setError(null)

    try {
      setHooks(await generateHooksSecure(content))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate hooks.')
    } finally {
      setRefining(false)
    }
  }, [content])

  const repurpose = useCallback(async (formatId: RepurposeFormatId) => {
    if (!content.trim()) return
    setRepurposing(true)
    setRepurposedContent(null)
    setError(null)

    try {
      const result = await generateRepurposedContent(content, formatId, {
        voiceProfile,
        toneSamples: voiceProfile?.voiceSamples ?? [],
        displayName: profile?.displayName ?? null,
        jobTitle: profile?.jobTitle ?? null,
      })
      setRepurposedContent(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not repurpose this post.')
    } finally {
      setRepurposing(false)
    }
  }, [content, profile, voiceProfile])

  const clearRepurposed = useCallback(() => {
    setRepurposedContent(null)
  }, [])

  const saveAndTrain = useCallback(async () => {
    if (!user || !content.trim()) return
    await save()

    const raw = await fetchVoiceProfileRaw(user.id)
    const existingSamples = Array.isArray(raw?.voice_samples) ? raw.voice_samples.map(String) : []
    const nextSamples = [content, ...existingSamples.filter((sample) => sample !== content)].slice(0, 10)

    await upsertVoiceProfile({
      user_id: user.id,
      voice_samples: nextSamples,
      updated_at: new Date().toISOString(),
    })
  }, [content, save, user])

  const copy = useCallback(async () => {
    if (!content.trim()) return
    await navigator.clipboard.writeText(content)
  }, [content])

  const reset = useCallback(() => {
    setContentState('')
    setCustomPrompt('')
    setArticleState(null)
    setSelectedTheme(null)
    setCtaType(null)
    setHooks([])
    setPostFramework(null)
    setPerspectiveContext(null)
    setDraftId(null)
    setError(null)
    setSaveStatus('idle')
    setIsDirty(false)
    setValidationIssues([])
  }, [])

  const restoreDraft = useCallback(() => {
    if (!restoreCandidate) return
    setDraftId(restoreCandidate.id)
    setContentState(restoreCandidate.content)
    setActivePurpose(restoreCandidate.strategicPurpose ?? 'discovery')
    setLastSavedAt(new Date(restoreCandidate.updatedAt))
    setSaveStatus('saved')
    setIsDirty(false)
    setRestoreCandidate(null)
  }, [restoreCandidate])

  const dismissRestore = useCallback(() => {
    setRestoreCandidate(null)
    setRestoreDismissed(true)
  }, [])

  const setArticle = useCallback((nextArticle: Article | null) => {
    setArticleState(nextArticle)
    setPerspectiveContext(null)
    if (nextArticle) {
      setCustomPrompt(`React to ${nextArticle.title}`)
    }
  }, [])

  const purposeScores = useMemo(() => {
    const base = { discovery: 0, trust: 0, authority: 0 }
    for (const post of performancePosts) {
      const purpose = coercePurpose(post.strategicPurpose)
      base[purpose] += post.impressions ?? 1
    }
    return base
  }, [performancePosts])

  const performancePatterns = useMemo(() => analysePerformance(performancePosts), [performancePosts])
  const bestPurpose = performancePatterns.bestPurpose ?? coercePurpose(profile?.strategicPurpose)
  const wordCount = useMemo(() => countWords(content), [content])
  const charCount = content.length
  const currentHook = content.split(/\n{2,}/)[0] || ''
  const saveTimeLabel = relativeSaveTime(lastSavedAt)
  const autosaveLabel = saveStatus === 'saving'
    ? 'Saving...'
    : saveStatus === 'saved' && saveTimeLabel
      ? `Auto-saved · ${saveTimeLabel}`
      : isDirty
        ? 'Unsaved changes'
        : 'Ready'

  return {
    content,
    setContent,
    customPrompt,
    setCustomPrompt,
    article,
    setArticle,
    activePurpose,
    setActivePurpose,
    selectedTheme,
    setSelectedTheme,
    ctaType,
    setCtaType,
    hooks,
    postFramework,
    setPostFramework,
    generating,
    refining,
    saving,
    error,
    setError,
    saveStatus,
    lastSavedAt,
    autosaveLabel,
    draftId,
    userId: user?.id ?? null,
    restoreCandidate,
    restoreDraft,
    dismissRestore,
    validationIssues,
    voiceProfile,
    trendingArticles,
    articlesLoading,
    articleContent,
    articleBrief,
    briefLoading,
    performancePatterns,
    allThemes: CONTENT_THEMES,
    generate,
    refine,
    applyHook,
    regenerateHooks,
    repurpose,
    repurposing,
    repurposedContent,
    clearRepurposed,
    save,
    saveAndTrain,
    copy,
    reset,
    startNew: reset,
    buildContext,
    wordCount,
    charCount,
    isOverLimit: charCount > LINKEDIN_CHAR_LIMIT,
    isDirty,
    bestPurpose,
    purposeScores,
    currentHook,
  }
}
