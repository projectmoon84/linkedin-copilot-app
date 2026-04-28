import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconFiles, IconPlus } from '@tabler/icons-react'
import { AnalyticsInputModal } from '@/components/analytics/AnalyticsInputModal'
import { DraftCard } from '@/components/posts/DraftCard'
import { DraftFilters } from '@/components/posts/DraftFilters'
import { PerformanceInsightsBar } from '@/components/posts/PerformanceInsightsBar'
import { PublishedPostCard } from '@/components/posts/PublishedPostCard'
import { PublishedSortControls } from '@/components/posts/PublishedSortControls'
import { AudienceDemographicsCard } from '@/components/posts/AudienceDemographicsCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import type { AudienceDemographics } from '@/lib/analytics-parsing'
import type { Draft, PublishedSort, AnalyticsFilterValue } from '@/lib/drafts-types'
import { buildInsights, computeEngagementRate, getBenchmarksForUser } from '@/lib/drafts-types'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { deleteDraft, fetchDrafts, publishDraft } from '@/lib/services/draft-service'
import { cn } from '@/lib/utils'

type Tab = 'drafts' | 'published'

function combineDemographics(posts: Draft[]): AudienceDemographics | null {
  const combined: Required<AudienceDemographics> = {
    jobFunctions: {},
    seniority: {},
    industries: {},
    locations: {},
  }
  let hasAny = false

  for (const post of posts) {
    const demographics = post.performance?.audienceDemographics
    if (!demographics) continue
    for (const [sourceKey, targetKey] of [
      ['jobFunctions', 'jobFunctions'],
      ['seniority', 'seniority'],
      ['industries', 'industries'],
      ['locations', 'locations'],
    ] as const) {
      const values = demographics[sourceKey]
      if (!values) continue
      for (const [label, count] of Object.entries(values)) {
        combined[targetKey][label] = (combined[targetKey][label] || 0) + count
        hasAny = true
      }
    }
  }

  return hasAny ? combined : null
}

export function PostsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const tabParam = searchParams.get('tab')
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>(highlightId ? 'published' : tabParam === 'published' ? 'published' : 'drafts')
  const [purposeFilter, setPurposeFilter] = useState<StrategicPurpose | null>(null)
  const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilterValue>('all')
  const [sort, setSort] = useState<PublishedSort>('date')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [analyticsDraft, setAnalyticsDraft] = useState<Draft | null>(null)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [savedInsight, setSavedInsight] = useState<{ draftId: string; message: string; color: string } | null>(null)
  const [insightsExpanded, setInsightsExpanded] = useState(true)

  const loadDrafts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      setDrafts(await fetchDrafts(user.id))
    } catch (err) {
      console.error('Error loading posts:', err)
      setDrafts([])
      setLoadError(err instanceof Error ? err.message : 'Posts could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadDrafts()
  }, [loadDrafts])

  useEffect(() => {
    if (!highlightId || drafts.length === 0) return
    const match = drafts.find((draft) => draft.id === highlightId)
    if (!match) return
    setTab('published')
    setAnalyticsDraft(match)
    setAnalyticsOpen(true)
  }, [drafts, highlightId])

  useEffect(() => {
    if (highlightId) {
      setTab('published')
      return
    }

    setTab(tabParam === 'published' ? 'published' : 'drafts')
  }, [highlightId, tabParam])

  const draftPosts = useMemo(() => drafts.filter((draft) => draft.status !== 'published'), [drafts])
  const publishedPosts = useMemo(() => drafts.filter((draft) => draft.status === 'published'), [drafts])
  const postsWithData = useMemo(() => publishedPosts.filter((draft) => draft.performance), [publishedPosts])
  const insights = useMemo(() => buildInsights(postsWithData), [postsWithData])
  const benchmarks = getBenchmarksForUser(profile?.approxFollowerCount ?? null)
  const audienceDemographics = useMemo(() => (
    postsWithData.length >= 3 ? combineDemographics(postsWithData) : null
  ), [postsWithData])

  const filteredDrafts = useMemo(() => (
    purposeFilter ? draftPosts.filter((draft) => draft.strategicPurpose === purposeFilter) : draftPosts
  ), [draftPosts, purposeFilter])

  const filteredPublished = useMemo(() => {
    const filtered = publishedPosts.filter((draft) => {
      if (purposeFilter && draft.strategicPurpose !== purposeFilter) return false
      if (analyticsFilter === 'has_data' && !draft.hasPerformanceData) return false
      if (analyticsFilter === 'needs_data' && draft.hasPerformanceData) return false
      return true
    })

    return [...filtered].sort((a, b) => {
      if (sort === 'date') return new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime()
      if (sort === 'impressions') return (b.performance?.impressions ?? 0) - (a.performance?.impressions ?? 0)
      if (sort === 'reactions') return (b.performance?.reactions ?? 0) - (a.performance?.reactions ?? 0)
      if (sort === 'comments') return (b.performance?.comments ?? 0) - (a.performance?.comments ?? 0)
      return (b.performance ? computeEngagementRate(b.performance) ?? 0 : 0) - (a.performance ? computeEngagementRate(a.performance) ?? 0 : 0)
    })
  }, [analyticsFilter, publishedPosts, purposeFilter, sort])

  const handleCopy = async (draft: Draft) => {
    await navigator.clipboard.writeText(draft.content)
    setCopiedId(draft.id)
    window.setTimeout(() => setCopiedId((current) => (current === draft.id ? null : current)), 1600)
  }

  const handleDelete = async (draftId: string) => {
    setDeletingId(draftId)
    try {
      await deleteDraft(draftId)
      setDrafts((current) => current.filter((draft) => draft.id !== draftId))
    } finally {
      setDeletingId(null)
    }
  }

  const handlePublish = async (draftId: string) => {
    setPublishingId(draftId)
    try {
      await publishDraft(draftId)
      await loadDrafts()
      setTab('published')
    } finally {
      setPublishingId(null)
    }
  }

  const handleAnalyticsSaved = (insight: { draftId: string; message: string; color: string }) => {
    setSavedInsight(insight)
    void loadDrafts()
  }

  const clearHighlight = () => {
    if (!highlightId) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('highlight')
    setSearchParams(nextParams, { replace: true })
  }

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', nextTab)
    nextParams.delete('highlight')
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <div className="app-page mx-auto space-y-6">
      <PageHeader
        title="Posts"
        description="Your writing history, draft queue, and published analytics."
        action={<Button onClick={() => navigate('/compose')}><IconPlus size={16} />New draft</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        <TabButton active={tab === 'drafts'} onClick={() => selectTab('drafts')}>Drafts</TabButton>
        <TabButton active={tab === 'published'} onClick={() => selectTab('published')}>Published</TabButton>
      </div>

      {loading ? (
        <PostsSkeleton />
      ) : loadError ? (
        <EmptyState
          icon={<IconFiles size={20} />}
          heading="Posts could not load"
          description={loadError}
          action={{ label: 'Try again', onClick: () => void loadDrafts() }}
        />
      ) : tab === 'drafts' ? (
        <section className="space-y-4">
          <DraftFilters
            purposeFilter={purposeFilter}
            filteredCount={filteredDrafts.length}
            totalCount={draftPosts.length}
            onPurposeFilterChange={setPurposeFilter}
          />

          {filteredDrafts.length === 0 ? (
            <EmptyState
              icon={<IconFiles size={20} />}
              heading="No drafts yet"
              description="Start a draft in Compose and it will appear here."
              action={{ label: 'New draft', onClick: () => navigate('/compose') }}
            />
          ) : (
            <div className="grid gap-4">
              {filteredDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  copiedId={copiedId}
                  deletingId={deletingId}
                  publishingId={publishingId}
                  onEdit={(draftId) => navigate(`/compose?draft=${draftId}`)}
                  onCopy={(nextDraft) => void handleCopy(nextDraft)}
                  onDelete={(draftId) => void handleDelete(draftId)}
                  onPublish={(draftId) => void handlePublish(draftId)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <DraftFilters
              purposeFilter={purposeFilter}
              analyticsFilter={analyticsFilter}
              showAnalyticsFilters
              filteredCount={filteredPublished.length}
              totalCount={publishedPosts.length}
              onPurposeFilterChange={setPurposeFilter}
              onAnalyticsFilterChange={setAnalyticsFilter}
            />
            <PublishedSortControls currentSort={sort} onSortChange={setSort} />
          </div>

          {insights && (
            <PerformanceInsightsBar
              insights={insights}
              benchmarks={benchmarks}
              isExpanded={insightsExpanded}
              onToggle={() => setInsightsExpanded((current) => !current)}
            />
          )}

          {audienceDemographics && <AudienceDemographicsCard demographics={audienceDemographics} />}

          {filteredPublished.length === 0 ? (
            <EmptyState
              icon={<IconFiles size={20} />}
              heading="No published posts yet"
              description="Mark a draft as published once it is live, then add analytics after the numbers settle."
              action={{ label: 'View drafts', onClick: () => selectTab('drafts') }}
            />
          ) : (
            <div className="grid gap-4">
              {filteredPublished.map((draft) => (
                <PublishedPostCard
                  key={draft.id}
                  draft={draft}
                  copiedId={copiedId}
                  deletingId={deletingId}
                  followerCount={profile?.approxFollowerCount ?? null}
                  savedInsight={savedInsight}
                  highlightId={highlightId}
                  onCopy={(nextDraft) => void handleCopy(nextDraft)}
                  onDelete={(draftId) => void handleDelete(draftId)}
                  onAnalyticsOpen={(nextDraft) => {
                    setAnalyticsDraft(nextDraft)
                    setAnalyticsOpen(true)
                  }}
                  onSavedInsightDismiss={() => setSavedInsight(null)}
                  onHighlightComplete={clearHighlight}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <AnalyticsInputModal
        open={analyticsOpen}
        onOpenChange={(open) => {
          setAnalyticsOpen(open)
          if (!open) setAnalyticsDraft(null)
        }}
        draft={analyticsDraft}
        followerCount={profile?.approxFollowerCount ?? null}
        onSaved={handleAnalyticsSaved}
      />
    </div>
  )
}

function PostsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-44" />
      ))}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-b-2 px-3 py-3 text-sm font-semibold transition-colors',
        active ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-900',
      )}
    >
      {children}
    </button>
  )
}
