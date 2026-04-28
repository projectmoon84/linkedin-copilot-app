import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconBookmark, IconChartBar, IconFlame, IconLoader2, IconRefresh, IconRss, IconSettings, IconTrendingUp, IconX } from '@tabler/icons-react'
import { FeedSourceManager } from '@/components/scout/FeedSourceManager'
import { ArticleCard } from '@/components/trends/ArticleCard'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/ui/count-up'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { scoreArticleForUser } from '@/lib/article-scoring'
import { SOURCE_CATEGORIES } from '@/lib/content-sources'
import { fetchArticles, triggerFeedRefresh } from '@/lib/services/article-service'
import type { Article } from '@/lib/trend-detection'
import { cn } from '@/lib/utils'

type FeedView = 'all' | 'saved'
type TimeFilter = 'recent' | 'all'
type FeedSort = 'recommended' | 'newest'
type ScoredArticle = { article: Article; relevance: number }
type Signal = { name: string; count: number; avgFit: number; latest: number }

const TIME_FILTERS: Array<{ value: TimeFilter; label: string; daysBack: number | null }> = [
  { value: 'recent', label: 'Recent', daysBack: 30 },
  { value: 'all', label: 'All time', daysBack: null },
]

const SORT_OPTIONS: Array<{ value: FeedSort; label: string }> = [
  { value: 'recommended', label: 'Best fit' },
  { value: 'newest', label: 'Newest' },
]

function savedKey(userId: string | undefined) {
  return `saved-articles:${userId || 'anonymous'}`
}

function normaliseText(value: string) {
  return value.toLowerCase().replace(/[-_]/g, ' ').trim()
}

function articleMatchesTopic(article: Article, topic: string) {
  const target = normaliseText(topic)
  if (!target) return true

  if (article.detectedTopics.some((item) => normaliseText(item) === target || target.includes(normaliseText(item)))) {
    return true
  }

  const text = normaliseText(`${article.title} ${article.summary ?? ''}`)
  const significantWords = target.split(/\s+/).filter((word) => word.length > 2)
  if (significantWords.length === 0) return text.includes(target)
  return significantWords.some((word) => text.includes(word))
}

function topicFilterLabel(topic: string) {
  return topic.length > 28 ? `${topic.slice(0, 28)}...` : topic
}

function addSignal(map: Map<string, Signal>, name: string, relevance: number, latest: number, count = 1) {
  const existing = map.get(name) ?? { name, count: 0, avgFit: 0, latest: 0 }
  const nextCount = existing.count + count
  map.set(name, {
    name,
    count: nextCount,
    avgFit: ((existing.avgFit * existing.count) + relevance * count) / nextCount,
    latest: Math.max(existing.latest, latest),
  })
}

function getPublishedTime(article: Article) {
  return new Date(article.publishedAt ?? article.fetchedAt).getTime()
}

function sortSignals(a: Signal, b: Signal) {
  if (b.count !== a.count) return b.count - a.count
  if (b.avgFit !== a.avgFit) return b.avgFit - a.avgFit
  return b.latest - a.latest
}

export function TrendsPage() {
  const { profile } = useUserProfile()
  const [feedView, setFeedView] = useState<FeedView>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('recent')
  const [feedSort, setFeedSort] = useState<FeedSort>('recommended')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [topicFilter, setTopicFilter] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(savedKey(profile?.userId)) || '[]') as string[]
    } catch {
      return []
    }
  })

  const activeTime = TIME_FILTERS.find((filter) => filter.value === timeFilter) ?? TIME_FILTERS[0]

  const articlesQuery = useQuery({
    queryKey: ['trendsArticles', activeTime.daysBack],
    queryFn: () => fetchArticles({ limit: 100, daysBack: activeTime.daysBack }),
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedKey(profile?.userId))
      setSavedIds(raw ? JSON.parse(raw) : [])
    } catch {
      setSavedIds([])
    }
  }, [profile?.userId])

  const scoredArticles = useMemo(() => {
    const articles = articlesQuery.data ?? []
    return articles.map((article) => ({ article, relevance: scoreArticleForUser(article, profile) }))
  }, [articlesQuery.data, profile])

  const filteredArticles = useMemo(() => {
    const filtered = scoredArticles.filter(({ article }) => {
      if (feedView === 'saved' && !savedIds.includes(article.id)) return false
      if (categoryFilter !== 'all' && article.category !== categoryFilter) return false
      if (topicFilter && !articleMatchesTopic(article, topicFilter)) return false
      if (brandFilter && !article.detectedBrands.some((brand) => brand.name === brandFilter)) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (feedSort === 'newest') {
        return new Date(b.article.publishedAt ?? b.article.fetchedAt).getTime() -
          new Date(a.article.publishedAt ?? a.article.fetchedAt).getTime()
      }
      if (b.relevance !== a.relevance) return b.relevance - a.relevance
      return new Date(b.article.publishedAt ?? b.article.fetchedAt).getTime() -
        new Date(a.article.publishedAt ?? a.article.fetchedAt).getTime()
    })
  }, [brandFilter, categoryFilter, feedSort, feedView, savedIds, scoredArticles, topicFilter])

  const toggleSaved = (articleId: string) => {
    setSavedIds((current) => {
      const next = current.includes(articleId)
        ? current.filter((id) => id !== articleId)
        : [articleId, ...current]

      localStorage.setItem(savedKey(profile?.userId), JSON.stringify(next))
      return next
    })
  }

  const refresh = async () => {
    setRefreshing(true)
    setRefreshMessage(null)
    try {
      const feedResult = await triggerFeedRefresh()
      await articlesQuery.refetch()
      setRefreshMessage(feedResult.message)
    } finally {
      setRefreshing(false)
    }
  }

  const clearFilters = () => {
    setFeedView('all')
    setCategoryFilter('all')
    setTopicFilter(null)
    setBrandFilter(null)
  }

  return (
    <div className="app-page mx-auto space-y-5">
      <PageHeader
        title="Trends"
        description="One feed for source-backed ideas, saved articles, and topics your audience is likely to care about."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setSourcesOpen(true)} variant="outline" size="sm">
              <IconSettings size={15} />
              Sources
            </Button>
            <Button onClick={() => void refresh()} disabled={refreshing} variant="outline" size="sm">
              {refreshing ? <IconLoader2 className="animate-spin" size={15} /> : <IconRefresh size={15} />}
              Refresh
            </Button>
          </div>
        }
      />

      <FeedSignals
        items={filteredArticles}
        loading={articlesQuery.isLoading}
        onTopicSelect={(topic) => {
          setTopicFilter(topic)
          setFeedView('all')
        }}
        onBrandSelect={(brand) => {
          setBrandFilter(brand)
          setFeedView('all')
        }}
      />

      {refreshMessage && (
        <div className="rounded-lg border border-border bg-stone-50 p-3 text-sm text-stone-600">{refreshMessage}</div>
      )}

      <section className="space-y-4">
        <div className="app-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFeedView('all')}
                className={cn(
                  'app-chip border transition-colors',
                  feedView === 'all' ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-white text-stone-500 hover:bg-stone-50',
                )}
              >
                All articles
              </button>
              <button
                type="button"
                onClick={() => setFeedView('saved')}
                className={cn(
                  'app-chip border transition-colors',
                  feedView === 'saved' ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-white text-stone-500 hover:bg-stone-50',
                )}
              >
                <IconBookmark size={13} />
                Saved
                {savedIds.length > 0 ? ` ${savedIds.length}` : ''}
              </button>
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTimeFilter(filter.value)}
                  className={cn(
                    'app-chip border transition-colors',
                    timeFilter === filter.value ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-white text-stone-500 hover:bg-stone-50',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-400">Sort</span>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeedSort(option.value)}
                  className={cn(
                    'app-chip border transition-colors',
                    feedSort === option.value ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-white text-stone-500 hover:bg-stone-50',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {SOURCE_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setCategoryFilter(category.value)}
                className={cn(
                  'app-chip border transition-colors',
                  categoryFilter === category.value ? 'border-stone-900 bg-stone-900 text-white' : 'border-border bg-white text-stone-500 hover:bg-stone-50',
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          {(feedView === 'saved' || topicFilter || brandFilter || categoryFilter !== 'all') && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-stone-400">Active filters:</span>
              {feedView === 'saved' && <DismissibleChip label="Saved only" onDismiss={() => setFeedView('all')} />}
              {categoryFilter !== 'all' && (
                <DismissibleChip
                  label={`Source: ${SOURCE_CATEGORIES.find((category) => category.value === categoryFilter)?.label ?? categoryFilter}`}
                  onDismiss={() => setCategoryFilter('all')}
                />
              )}
              {topicFilter && <DismissibleChip label={`Topic: ${topicFilterLabel(topicFilter)}`} onDismiss={() => setTopicFilter(null)} />}
              {brandFilter && <DismissibleChip label={`Brand: ${brandFilter}`} onDismiss={() => setBrandFilter(null)} />}
              <button type="button" className="text-xs font-medium text-stone-400 hover:text-stone-900" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-stone-900">
              {feedView === 'saved' ? 'Saved articles' : 'Article feed'}
            </h2>
            <p className="text-sm text-stone-500">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'item' : 'items'} ready to inspect or turn into a post.
            </p>
          </div>
        </div>

        {articlesQuery.isLoading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-48" />)}
          </div>
        ) : filteredArticles.length === 0 ? (
          <EmptyState
            icon={feedView === 'saved' ? <IconBookmark size={20} /> : <IconRss size={20} />}
            heading={feedView === 'saved' ? 'No saved articles yet' : 'No articles found'}
            description={feedView === 'saved' ? 'Save useful articles and they will collect here.' : 'Refresh feeds, adjust filters, or add more sources.'}
          />
        ) : (
          <div className="grid gap-4">
            {filteredArticles.map(({ article, relevance }) => (
              <ArticleCard
                key={article.id}
                article={article}
                relevance={relevance}
                saved={savedIds.includes(article.id)}
                onToggleSaved={toggleSaved}
                onTopicClick={setTopicFilter}
                onBrandClick={setBrandFilter}
              />
            ))}
          </div>
        )}
      </section>

      <SourcesDrawer open={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    </div>
  )
}

function FeedSignals({
  items,
  loading,
  onTopicSelect,
  onBrandSelect,
}: {
  items: ScoredArticle[]
  loading?: boolean
  onTopicSelect: (topic: string) => void
  onBrandSelect: (brand: string) => void
}) {
  if (loading) {
    return (
      <section className="app-card p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)}
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="app-card p-5">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <IconChartBar size={17} className="text-stone-400" />
          Feed signals will appear when matching articles are available.
        </div>
      </section>
    )
  }

  const topicMap = new Map<string, Signal>()
  const brandMap = new Map<string, Signal>()
  const sourceNames = new Set<string>()
  let strongFits = 0
  let totalFit = 0

  for (const item of items) {
    const latest = getPublishedTime(item.article)
    sourceNames.add(item.article.sourceName)
    totalFit += item.relevance
    if (item.relevance >= 0.7) strongFits += 1

    for (const topic of item.article.detectedTopics) {
      addSignal(topicMap, topic, item.relevance, latest)
    }

    for (const brand of item.article.detectedBrands) {
      addSignal(brandMap, brand.name, item.relevance, latest, Math.max(1, brand.mentionCount))
    }

    if (item.article.detectedTopics.length === 0 && item.article.category) {
      addSignal(topicMap, item.article.category, item.relevance, latest)
    }
  }

  const topics = [...topicMap.values()].sort(sortSignals).slice(0, 6)
  const brands = [...brandMap.values()].sort(sortSignals).slice(0, 6)
  const maxTopicCount = Math.max(1, ...topics.map((topic) => topic.count))
  const maxBrandCount = Math.max(1, ...brands.map((brand) => brand.count))
  const avgFit = Math.round((totalFit / Math.max(1, items.length)) * 100)

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <IconFlame size={18} className="text-warning" />
              <h2 className="app-page-title">Feed signals</h2>
            </div>
            <p className="text-sm text-stone-500">Trending topics and brands detected from the articles currently in view.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
            <IconTrendingUp size={15} />
            Live from feed
          </div>
        </div>
      </div>

      <div className="grid border-b border-border md:grid-cols-4">
        <SignalMetric label="Articles scanned" value={items.length} />
        <SignalMetric label="Sources represented" value={sourceNames.size} />
        <SignalMetric label="Strong-fit ideas" value={strongFits} />
        <SignalMetric label="Average audience fit" value={avgFit} suffix="%" />
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <SignalList
          title="Hot topics"
          empty="No recurring topics detected yet."
          signals={topics}
          maxCount={maxTopicCount}
          accentClassName="bg-warning"
          onSelect={onTopicSelect}
        />
        <SignalList
          title="Brands and products"
          empty="No brand or product mentions detected yet."
          signals={brands}
          maxCount={maxBrandCount}
          accentClassName="bg-chart-primary"
          onSelect={onBrandSelect}
        />
      </div>
    </section>
  )
}

function SignalMetric({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold text-stone-900">
        <CountUp end={value} suffix={suffix} />
      </p>
    </div>
  )
}

function SignalList({
  title,
  empty,
  signals,
  maxCount,
  accentClassName,
  onSelect,
}: {
  title: string
  empty: string
  signals: Signal[]
  maxCount: number
  accentClassName: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="border-b border-border p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <h3 className="mb-4 text-sm font-semibold text-stone-900">{title}</h3>
      {signals.length === 0 ? (
        <p className="text-sm text-stone-500">{empty}</p>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <button
              key={signal.name}
              type="button"
              onClick={() => onSelect(signal.name)}
              className="group w-full text-left"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-stone-700 group-hover:text-stone-950">{signal.name}</span>
                <span className="shrink-0 text-xs text-stone-400">
                  {signal.count} {signal.count === 1 ? 'mention' : 'mentions'} · {Math.round(signal.avgFit * 100)}% fit
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500', accentClassName)}
                  style={{ width: `${Math.max(10, (signal.count / maxCount) * 100)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SourcesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sources drawer"
        className="absolute inset-0 bg-stone-950/20"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-stone-900">Manage sources</h2>
            <p className="mt-1 text-sm text-stone-500">Add RSS feeds, websites, or Reddit communities to shape the feed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FeedSourceManager />
        </div>
      </aside>
    </div>
  )
}

function DismissibleChip({ label, onDismiss }: { label: string; onDismiss: () => void }) {
  return (
    <button
      type="button"
      className="app-chip bg-stone-100 text-stone-600 hover:bg-stone-200"
      onClick={onDismiss}
    >
      {label}
      <IconX size={12} />
    </button>
  )
}
