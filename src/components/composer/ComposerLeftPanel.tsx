import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconSearch, IconSparkles, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { useComposer } from '@/lib/hooks/useComposer'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { formatRelativeTime } from '@/lib/trend-detection'
import { cn } from '@/lib/utils'

type Composer = ReturnType<typeof useComposer>

const PURPOSES: StrategicPurpose[] = ['discovery', 'trust', 'authority']

const PURPOSE_LABELS: Record<StrategicPurpose, string> = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

export function ComposerLeftPanel({
  composer,
  onClose,
}: {
  composer: Composer
  onClose?: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [themePurpose, setThemePurpose] = useState<StrategicPurpose>(composer.bestPurpose)

  const filteredThemes = useMemo(() => (
    composer.allThemes.filter((theme) => theme.purpose === themePurpose).slice(0, 5)
  ), [composer.allThemes, themePurpose])

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return composer.trendingArticles.slice(0, 12)
    return composer.trendingArticles
      .filter((article) => `${article.title} ${article.summary || ''} ${article.sourceName}`.toLowerCase().includes(normalized))
      .slice(0, 12)
  }, [composer.trendingArticles, query])

  const voiceStrength = composer.voiceProfile?.voiceSamples.length ?? 0

  return (
    <aside className="flex h-full flex-col border-r border-border bg-white shadow-xl md:shadow-none">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="app-card-title">Resources</p>
          <p className="text-xs text-stone-500">Patterns, topics, articles, voice.</p>
        </div>
        {onClose && (
          <button type="button" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900" onClick={onClose} aria-label="Close resources">
            <IconX size={16} />
          </button>
        )}
      </div>

      <div className="scrollbar-none flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <p className="app-label">What works for you</p>
          <div className="rounded-lg border border-border bg-stone-50 p-3 text-sm text-stone-600">
            {composer.performancePatterns.sampleSize >= 3 ? (
              <div className="space-y-2">
                {composer.performancePatterns.bestPurpose && (
                  <p><span className="font-semibold text-stone-900">Best type:</span> {PURPOSE_LABELS[composer.performancePatterns.bestPurpose]}</p>
                )}
                {composer.performancePatterns.bestDay && (
                  <p><span className="font-semibold text-stone-900">Best day:</span> {composer.performancePatterns.bestDay}</p>
                )}
                {composer.performancePatterns.averageImpressions != null && (
                  <p><span className="font-semibold text-stone-900">Avg reach:</span> {composer.performancePatterns.averageImpressions.toLocaleString()} impressions</p>
                )}
                <p className="text-xs text-stone-400">Based on {composer.performancePatterns.sampleSize} posts with analytics.</p>
              </div>
            ) : (
              <p>Add analytics to a few posts and this panel will surface your best patterns.</p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="app-label mb-0">Topic & theme browser</p>
          </div>

          <div className="mb-3 flex rounded-lg bg-stone-100 p-1">
            {PURPOSES.map((purpose) => (
              <button
                key={purpose}
                type="button"
                onClick={() => setThemePurpose(purpose)}
                className={cn(
                  'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  themePurpose === purpose ? 'bg-white text-stone-900' : 'text-stone-500 hover:text-stone-900',
                )}
              >
                {PURPOSE_LABELS[purpose]}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredThemes.map((theme) => {
              const selected = composer.selectedTheme?.id === theme.id
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    composer.setSelectedTheme(selected ? null : theme)
                    composer.setActivePurpose(theme.purpose)
                    if (!selected) composer.setCustomPrompt(theme.exampleHooks[0] || theme.description)
                  }}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    selected ? 'border-primary bg-stone-100' : 'border-border hover:bg-stone-50',
                  )}
                >
                  <p className="text-sm font-semibold text-stone-900">{theme.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">{theme.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="app-label">Trending articles</p>
          <label className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
            <IconSearch size={14} className="text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search articles"
              className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
            />
          </label>

          <div className="space-y-2">
            {composer.articlesLoading && <p className="text-sm text-stone-500">Loading articles...</p>}
            {!composer.articlesLoading && filteredArticles.length === 0 && (
              <p className="text-sm text-stone-500">No matching articles yet.</p>
            )}
            {filteredArticles.map((article) => {
              const selected = composer.article?.id === article.id
              return (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => composer.setArticle(selected ? null : article)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    selected ? 'border-primary bg-stone-100' : 'border-border hover:bg-stone-50',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-2xs font-semibold text-stone-400">{article.sourceName}</span>
                    <span className="text-3xs text-stone-400">{formatRelativeTime(article.publishedAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">{article.title}</p>
                  {article.detectedTopics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.detectedTopics.slice(0, 2).map((topic) => (
                        <span key={topic} className="app-chip bg-stone-100 text-stone-500">{topic}</span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="app-label">Voice profile</p>
          <button
            type="button"
            className="w-full rounded-lg border border-border bg-stone-50 p-3 text-left transition-colors hover:bg-stone-100"
            onClick={() => navigate('/settings/voice')}
          >
            <div className="flex items-center gap-2">
              <IconSparkles size={16} className="text-stone-500" />
              <p className="text-sm font-semibold text-stone-900">Voice: {voiceStrength}/10</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, voiceStrength * 10)}%` }} />
            </div>
            <p className="mt-2 text-xs text-stone-500">Add more samples to make every draft sound closer to you.</p>
          </button>
        </section>
      </div>

      {onClose && (
        <div className="border-t border-border p-3">
          <Button variant="outline" className="w-full" onClick={onClose}>
            <IconChevronLeft size={16} />
            Back to canvas
          </Button>
        </div>
      )}
    </aside>
  )
}
