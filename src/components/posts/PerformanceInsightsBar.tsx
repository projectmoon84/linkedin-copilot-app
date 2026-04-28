import { IconChevronDown, IconChevronUp, IconTrophy } from '@tabler/icons-react'
import { CountUp } from '@/components/ui/count-up'
import type { BenchmarkTier, PerformanceInsights } from '@/lib/drafts-types'
import { formatMetric, getPercentileLabel, PURPOSE_LABELS } from '@/lib/drafts-types'
import { cn } from '@/lib/utils'

interface PerformanceInsightsBarProps {
  insights: PerformanceInsights
  benchmarks: BenchmarkTier
  isExpanded: boolean
  onToggle: () => void
}

export function PerformanceInsightsBar({
  insights,
  benchmarks,
  isExpanded,
  onToggle,
}: PerformanceInsightsBarProps) {
  return (
    <section className="app-card bg-stone-50">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <IconTrophy size={18} className="text-warning" />
          <div>
            <h2 className="app-card-title">Performance insights</h2>
            <p className="text-xs text-stone-500">Compared with creators at {benchmarks.label}.</p>
          </div>
        </div>
        {isExpanded ? <IconChevronUp size={16} className="text-stone-400" /> : <IconChevronDown size={16} className="text-stone-400" />}
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-border p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCell label="Avg impressions" benchmark={benchmarks.impressions} rawValue={insights.avgImpressions} compact />
            <MetricCell label="Avg reactions" benchmark={benchmarks.reactions} rawValue={insights.avgReactions} compact />
            <MetricCell label="Avg comments" benchmark={benchmarks.comments} rawValue={insights.avgComments} compact />
            <MetricCell label="Avg engagement" benchmark={benchmarks.engagementRate} rawValue={insights.avgEngagement ?? 0} suffix="%" decimals={1} />
          </div>

          <div className="flex flex-wrap gap-2">
            {insights.bestPurposeInsight && (
              <span className="app-chip bg-emerald-50 text-positive">{insights.bestPurposeInsight}</span>
            )}
            {insights.bestDayInsight && (
              <span className="app-chip bg-sky-50 text-chart-primary">{insights.bestDayInsight}</span>
            )}
          </div>

          {insights.bestPost && (
            <div className="rounded-lg border border-border bg-white p-3">
              <p className="text-xs text-stone-400">Best performing post</p>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-stone-900">{insights.bestPost.title}</p>
            </div>
          )}

          {insights.purposeBreakdown.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
              {insights.purposeBreakdown.map((item) => (
                <div key={item.purpose} className="rounded-lg border border-border bg-white p-3 text-sm">
                  <span className={`app-purpose-pill ${item.purpose}`}>{PURPOSE_LABELS[item.purpose]}</span>
                  <p className="mt-2 text-stone-500">{item.count} {item.count === 1 ? 'post' : 'posts'}</p>
                  <p className="font-semibold text-stone-900">{formatMetric(Math.round(item.avgImpressions))} avg impressions</p>
                  <p className="text-stone-500">{item.avgEngagement != null ? `${item.avgEngagement.toFixed(1)}% engagement` : 'No engagement rate'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function MetricCell({
  label,
  rawValue,
  benchmark,
  suffix,
  decimals,
  compact,
}: {
  label: string
  rawValue: number
  benchmark: number
  suffix?: string
  decimals?: number
  compact?: boolean
}) {
  const percentile = getPercentileLabel(rawValue, benchmark)
  return (
    <div className="rounded-lg border border-border bg-white p-3 text-center">
      <p className="font-heading text-lg font-semibold text-stone-900">
        <CountUp
          end={rawValue}
          suffix={suffix}
          decimals={decimals}
          format={compact ? (value) => formatMetric(Math.round(value)) : undefined}
        />
      </p>
      <p className="text-xs text-stone-500">{label}</p>
      <p className={cn('mt-1 text-2xs', percentile.tone === 'positive' && 'text-positive', percentile.tone === 'warning' && 'text-warning', percentile.tone === 'neutral' && 'text-stone-400')}>
        {percentile.text}
      </p>
    </div>
  )
}
