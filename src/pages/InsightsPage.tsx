import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IconInfoCircle } from '@tabler/icons-react'
import { ContentMixBar } from '@/components/insights/ContentMixBar'
import { ImpressionsEngagementChart } from '@/components/insights/ImpressionsEngagementChart'
import { MiniBar } from '@/components/insights/MiniBar'
import { ScoreRing } from '@/components/insights/ScoreRing'
import { ThirtyDayPlan } from '@/components/insights/ThirtyDayPlan'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/ui/count-up'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { generate30DayPlan, type PurposeWeighting } from '@/lib/cadence-engine'
import { getThemesForPurpose, type ContentTheme } from '@/lib/content-framework'
import { buildInsights, getBenchmarksForUser, PURPOSE_LABELS, type Draft } from '@/lib/drafts-types'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { buildScoreBreakdown, getLowestScoreDimension, getScoreLabel } from '@/lib/score-engine'
import { fetchDrafts } from '@/lib/services/draft-service'
import { useLinkedInScore } from '@/lib/useLinkedInScore'
import { usePostingStats } from '@/lib/usePostingStats'

const PURPOSES: StrategicPurpose[] = ['discovery', 'trust', 'authority']
const DEFAULT_WEIGHTING: PurposeWeighting = { discovery: 0.34, trust: 0.33, authority: 0.33 }

const IMPROVEMENT_TIPS: Record<string, string> = {
  Engagement: 'Add analytics to recent posts and study the hooks that earned comments, not just reactions.',
  Consistency: 'Pick two repeatable posting days and protect them like meetings.',
  Growth: 'Use one discovery post each week to reach people outside your current network.',
  'Content mix': 'Balance discovery, trust, and authority so your feed is not doing one job forever.',
  Completeness: 'Log analytics seven days after publishing so the score has real evidence.',
}

function actualMix(posts: Draft[]): PurposeWeighting {
  const counts: PurposeWeighting = { discovery: 0, trust: 0, authority: 0 }
  for (const post of posts) {
    if (post.strategicPurpose) counts[post.strategicPurpose] += 1
  }
  const total = counts.discovery + counts.trust + counts.authority
  if (total === 0) return { discovery: 0.34, trust: 0.33, authority: 0.33 }
  return {
    discovery: counts.discovery / total,
    trust: counts.trust / total,
    authority: counts.authority / total,
  }
}

function themeGroups(personalisedThemes?: ContentTheme[] | null) {
  return {
    discovery: getThemesForPurpose('discovery', personalisedThemes).slice(0, 3),
    trust: getThemesForPurpose('trust', personalisedThemes).slice(0, 3),
    authority: getThemesForPurpose('authority', personalisedThemes).slice(0, 3),
  }
}

function themeMatchesDraft(theme: ContentTheme, drafts: Draft[]) {
  const title = theme.title.toLowerCase()
  return drafts.some((draft) => (
    draft.strategicPurpose === theme.purpose &&
    `${draft.title} ${draft.content}`.toLowerCase().includes(title)
  ))
}

export function InsightsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const scoreData = useLinkedInScore()
  const postingData = usePostingStats()
  const [showScoreExplainer, setShowScoreExplainer] = useState(() => localStorage.getItem('hasSeenScoreExplainer') !== 'true')

  const draftsQuery = useQuery({
    queryKey: ['insightsDrafts', user?.id],
    queryFn: () => fetchDrafts(user!.id),
    enabled: Boolean(user?.id),
  })

  const drafts = draftsQuery.data ?? []
  const publishedPosts = drafts.filter((draft) => draft.status === 'published')
  const postsWithData = publishedPosts.filter((draft) => draft.performance)
  const insights = useMemo(() => buildInsights(postsWithData), [postsWithData])
  const benchmarks = getBenchmarksForUser(profile?.approxFollowerCount ?? null)
  const actualWeighting = useMemo(() => actualMix(publishedPosts), [publishedPosts])
  const targetWeighting = postingData.recommendation?.weighting ?? DEFAULT_WEIGHTING
  const groupedThemes = useMemo(() => themeGroups(null), [])
  const planWeeks = useMemo(() => generate30DayPlan(
    postingData.recommendation?.postsPerWeek ?? 1,
    targetWeighting,
    {
      discovery: getThemesForPurpose('discovery', null),
      trust: getThemesForPurpose('trust', null),
      authority: getThemesForPurpose('authority', null),
    },
  ), [postingData.recommendation?.postsPerWeek, targetWeighting])

  const score = scoreData.score
  const scoreLabel = score ? getScoreLabel(score.overallScore) : null
  const breakdown = score ? buildScoreBreakdown(score) : []
  const lowestDimension = score ? getLowestScoreDimension(score) : null
  const loading = scoreData.loading || postingData.loading || draftsQuery.isLoading

  const dismissScoreExplainer = () => {
    localStorage.setItem('hasSeenScoreExplainer', 'true')
    setShowScoreExplainer(false)
  }

  if (loading) {
    return <InsightsSkeleton />
  }

  return (
    <div className="app-page mx-auto space-y-6">
      <PageHeader
        title="Insights"
        description="Performance data, strategy, and coaching in one place."
        action={<Button variant="outline" onClick={() => void scoreData.refresh()}>Refresh score</Button>}
      />

      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="app-card p-5">
          {score ? (
            <>
              <div className="flex flex-col items-center text-center">
                <ScoreRing score={score.overallScore} />
                <div className="mt-3">
                  <p className="app-card-title">{scoreLabel?.label || 'Score'}</p>
                  <p className="text-sm text-stone-500">{score.postsWithAnalytics} posts with analytics</p>
                </div>
              </div>

              {showScoreExplainer && (
                <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-stone-700">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-chart-primary">
                    <IconInfoCircle size={16} />
                    How your score works
                  </div>
                  <p>Your score measures engagement, consistency, growth, content mix, and profile completeness.</p>
                  <button type="button" className="mt-2 text-xs font-semibold text-chart-primary" onClick={dismissScoreExplainer}>
                    Got it
                  </button>
                </div>
              )}

              {lowestDimension && (
                <div className="mt-5 rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-semibold text-stone-900">Next best improvement</p>
                  <p className="mt-1 text-sm text-stone-500">
                    <strong className="text-stone-900">{lowestDimension.label}:</strong> {IMPROVEMENT_TIPS[lowestDimension.label]}
                  </p>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<IconInfoCircle size={20} />}
              heading="No score yet"
              description="Publish posts and add analytics to calculate your score."
            />
          )}
        </div>

        <div className="app-card p-5">
          <h2 className="app-card-title mb-4">Score breakdown</h2>
          {breakdown.length === 0 ? (
            <EmptyState
              embedded
              className="min-h-56"
              icon={<IconInfoCircle size={20} />}
              heading="No breakdown yet"
              description="Add analytics to published posts and each score dimension will appear here."
            />
          ) : (
            <div className="space-y-4">
              {breakdown.map((item) => (
                <MiniBar key={item.label} label={`${item.label} (${item.weight}%)`} value={item.score} description={item.description} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="app-card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="app-card-title">Performance</h2>
            <p className="text-sm text-stone-500">Weekly impressions with engagement rate overlaid.</p>
          </div>
          {scoreData.reportableWeekLabel && <span className="text-xs text-stone-400">Latest reportable week: {scoreData.reportableWeekLabel}</span>}
        </div>
        <ImpressionsEngagementChart weeklyData={scoreData.impressionsHistory} />

        {insights && (
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Snapshot label="Avg impressions" value={Math.round(insights.avgImpressions)} benchmark={`${benchmarks.impressions.toLocaleString()} benchmark`} />
            <Snapshot label="Avg reactions" value={Math.round(insights.avgReactions)} benchmark={`${benchmarks.reactions} benchmark`} />
            <Snapshot label="Avg comments" value={Math.round(insights.avgComments)} benchmark={`${benchmarks.comments} benchmark`} />
            <Snapshot label="Avg engagement" value={insights.avgEngagement ?? null} suffix="%" decimals={1} benchmark={`${benchmarks.engagementRate}% benchmark`} />
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="app-card p-5">
          <h2 className="app-card-title">Content mix</h2>
          <p className="mt-1 text-sm text-stone-500">Actual published mix versus your target strategy.</p>
          <div className="mt-5 space-y-5">
            <ContentMixBar weighting={actualWeighting} label="Actual mix" />
            <ContentMixBar weighting={targetWeighting} label="Target mix" />
          </div>
        </div>

        <div className="app-card p-5">
          <h2 className="app-card-title">Posting rhythm</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Snapshot label="This week" value={postingData.stats?.totalThisWeek ?? 0} benchmark={`${Math.round(postingData.recommendation?.postsPerWeek ?? 1)} target`} />
            <Snapshot label="Published" value={postingData.stats?.totalPublished ?? 0} benchmark="All time" />
            <Snapshot label="Streak" value={postingData.stats?.streakWeeks ?? 0} suffix="w" benchmark={postingData.nextPost?.urgency || 'Status'} />
          </div>
          {postingData.nextPost && (
            <p className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">{postingData.nextPost.reason}</p>
          )}
        </div>
      </section>

      <section className="app-card p-5">
        <div className="mb-4">
          <h2 className="app-card-title">Your themes</h2>
          <p className="text-sm text-stone-500">Strategic angles you can turn into posts now.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PURPOSES.flatMap((purpose) => groupedThemes[purpose].slice(0, 2)).map((theme) => (
            <ThemeCard key={theme.id} theme={theme} hasDraft={themeMatchesDraft(theme, drafts)} onWrite={() => navigate(`/compose?purpose=${theme.purpose}&theme=${theme.id}`)} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="app-card-title">30-day plan</h2>
          <p className="text-sm text-stone-500">A deterministic plan based on your target cadence and content mix.</p>
        </div>
        <ThirtyDayPlan weeks={planWeeks} drafts={drafts} />
      </section>

      <section className="app-card p-5">
        <h2 className="app-card-title">Metrics that matter</h2>
        <p className="mt-1 text-sm text-stone-500">Benchmarks for creators with {benchmarks.label}.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <Snapshot label="Impressions" value={benchmarks.impressions} benchmark="per post" />
          <Snapshot label="Reactions" value={benchmarks.reactions} benchmark="per post" />
          <Snapshot label="Comments" value={benchmarks.comments} benchmark="per post" />
          <Snapshot label="Reposts" value={benchmarks.reposts} benchmark="per post" />
          <Snapshot label="Engagement" value={benchmarks.engagementRate} suffix="%" decimals={1} benchmark="rate" />
        </div>
        <p className="mt-4 text-sm text-stone-500">Use these as direction, not judgment. Your strongest signal is improvement against your own previous posts.</p>
      </section>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="app-page mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </section>
      <Skeleton className="h-80" />
      <section className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </section>
    </div>
  )
}

function Snapshot({
  label,
  value,
  benchmark,
  suffix,
  decimals,
}: {
  label: string
  value: number | null
  benchmark: string
  suffix?: string
  decimals?: number
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-stone-900">
        {value == null ? '--' : <CountUp end={value} suffix={suffix} decimals={decimals} />}
      </p>
      <p className="text-xs text-stone-500">{benchmark}</p>
    </div>
  )
}

function ThemeCard({ theme, hasDraft, onWrite }: { theme: ContentTheme; hasDraft: boolean; onWrite: () => void }) {
  return (
    <article className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={`app-purpose-pill ${theme.purpose}`}>{PURPOSE_LABELS[theme.purpose]}</span>
        {hasDraft && <span className="app-chip bg-emerald-50 text-positive">Draft exists</span>}
      </div>
      <h3 className="text-sm font-semibold text-stone-900">{theme.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-stone-500">{theme.description}</p>
      <Button className="mt-4" variant="outline" size="sm" onClick={onWrite}>Write this →</Button>
    </article>
  )
}
