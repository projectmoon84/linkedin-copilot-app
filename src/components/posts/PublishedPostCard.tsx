import type { ComponentType } from 'react'
import {
  IconChartBar,
  IconCheck,
  IconCopy,
  IconEye,
  IconLoader2,
  IconMessageCircle,
  IconRepeat,
  IconThumbUp,
  IconTrash,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { Draft } from '@/lib/drafts-types'
import {
  computeEngagementRate,
  formatMetric,
  getBenchmarksForUser,
  getPercentileLabel,
  isAnalyticsDue,
  PURPOSE_LABELS,
} from '@/lib/drafts-types'
import { CountUp } from '@/components/ui/count-up'
import { formatRelativeTime } from '@/lib/trend-detection'
import { cn } from '@/lib/utils'

interface PublishedPostCardProps {
  draft: Draft
  copiedId: string | null
  deletingId: string | null
  followerCount: number | null
  savedInsight: { draftId: string; message: string; color: string } | null
  highlightId: string | null
  onCopy: (draft: Draft) => void
  onDelete: (draftId: string) => void
  onAnalyticsOpen: (draft: Draft) => void
  onSavedInsightDismiss: () => void
  onHighlightComplete: () => void
}

export function PublishedPostCard({
  draft,
  copiedId,
  deletingId,
  followerCount,
  savedInsight,
  highlightId,
  onCopy,
  onDelete,
  onAnalyticsOpen,
  onSavedInsightDismiss,
  onHighlightComplete,
}: PublishedPostCardProps) {
  const performance = draft.performance
  const benchmarks = getBenchmarksForUser(performance?.followerCountAtPost ?? followerCount)
  const engagement = performance ? computeEngagementRate(performance) : null
  const highlighted = highlightId === draft.id

  return (
    <article
      className={cn('app-card p-4 transition-colors', highlighted && 'border-warning')}
      ref={(el) => {
        if (el && highlighted) {
          window.setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            onHighlightComplete()
          }, 150)
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-2xs text-stone-400">Published {formatRelativeTime(draft.publishedAt)}</span>
            {draft.strategicPurpose && (
              <span className={`app-purpose-pill ${draft.strategicPurpose}`}>
                {PURPOSE_LABELS[draft.strategicPurpose]}
              </span>
            )}
            {isAnalyticsDue(draft) && <span className="app-chip bg-amber-50 text-warning">Analytics due</span>}
            {draft.hasPerformanceData && <span className="app-chip bg-emerald-50 text-positive">Analytics recorded</span>}
          </div>
          <h2 className="app-card-title line-clamp-1">{draft.title || 'Untitled post'}</h2>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-500">
        {draft.content}
      </p>

      {performance && (
        <div className="mt-4 grid gap-2 rounded-lg bg-stone-50 p-3 text-xs text-stone-500 sm:grid-cols-5">
          <Metric icon={IconEye} label="Impressions" value={performance.impressions} benchmark={benchmarks.impressions} />
          <Metric icon={IconThumbUp} label="Reactions" value={performance.reactions} benchmark={benchmarks.reactions} />
          <Metric icon={IconMessageCircle} label="Comments" value={performance.comments} benchmark={benchmarks.comments} />
          <Metric icon={IconRepeat} label="Reposts" value={performance.reposts} benchmark={benchmarks.reposts} />
          <div>
            <div className="font-semibold text-stone-900">{engagement != null ? <CountUp end={engagement} suffix="%" decimals={1} /> : '--'}</div>
            <div>Engagement</div>
          </div>
        </div>
      )}

      {savedInsight?.draftId === draft.id && (
        <button
          type="button"
          onClick={onSavedInsightDismiss}
          className={cn(
            'mt-4 w-full rounded-lg border p-3 text-left text-sm',
            savedInsight.color === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-positive' : 'border-border bg-stone-50 text-stone-600',
          )}
        >
          {savedInsight.message}
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" onClick={() => onCopy(draft)}>
          {copiedId === draft.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copiedId === draft.id ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onAnalyticsOpen(draft)}>
          <IconChartBar size={14} />
          {draft.hasPerformanceData ? 'Update analytics' : 'Add analytics'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(draft.id)}
          disabled={deletingId === draft.id}
          aria-label="Delete post"
          className="ml-auto text-stone-400 hover:text-negative"
        >
          {deletingId === draft.id ? <IconLoader2 className="animate-spin" size={14} /> : <IconTrash size={14} />}
        </Button>
      </div>
    </article>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  benchmark,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  label: string
  value: number | null
  benchmark: number
}) {
  const percentile = value != null ? getPercentileLabel(value, benchmark) : null
  return (
    <div title={label}>
      <div className="flex items-center gap-1 font-semibold text-stone-900">
        <Icon size={14} className="text-stone-400" />
        {value == null ? '--' : <CountUp end={value} format={(next) => formatMetric(Math.round(next))} />}
      </div>
      <div className={cn(percentile?.tone === 'positive' && 'text-positive', percentile?.tone === 'warning' && 'text-warning')}>
        {percentile?.text || label}
      </div>
    </div>
  )
}
