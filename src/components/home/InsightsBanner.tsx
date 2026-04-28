import { IconBulb, IconX } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Insight } from '@/lib/score-engine'

interface InsightsBannerProps {
  insights: Insight[]
  loading?: boolean
  onDismiss: (id: string) => Promise<void>
  generatedAt?: string | null
}

function tagStyle(type: string) {
  if (type === 'TIMING') return { color: 'var(--color-authority)' }
  if (type === 'FORMAT') return { color: 'var(--color-warning)' }
  return { color: 'var(--color-chart-primary)' }
}

function formatGeneratedAt(value?: string | null) {
  if (!value) return 'Auto-updated'
  return `Updated ${new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function InsightsBanner({ insights, loading, onDismiss, generatedAt }: InsightsBannerProps) {
  if (loading) {
    return (
      <div className="app-card home-insights-row">
        <div className="home-insights-inner">
          <div className="home-insights-header">
            <div className="home-insights-title">
              <IconBulb size={14} />
              AI insights
              <span className="home-auto-badge">Auto-updated</span>
            </div>
          </div>
          <div className="home-insights-grid">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (insights.length === 0) return null

  return (
    <div className="app-card home-insights-row" aria-label="AI insights">
      <div className="home-insights-inner">
        <div className="home-insights-header">
          <div className="home-insights-title">
            <IconBulb size={14} className="text-stone-400" />
            AI insights
            <span className="home-auto-badge">Auto-updated</span>
          </div>
          <span className="text-2xs text-stone-400">{formatGeneratedAt(generatedAt)}</span>
        </div>
        <div className="home-insights-grid">
          {insights.slice(0, 3).map((insight) => (
            <article key={insight.id} className="home-insight-pill">
              <div className="flex items-start justify-between gap-2">
                <div className="home-insight-pill-tag" style={tagStyle(insight.insightType)}>
                  {insight.insightType.toLowerCase()}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss insight"
                  className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  onClick={() => void onDismiss(insight.id)}
                >
                  <IconX size={12} />
                </button>
              </div>
              <p>{insight.content}</p>
              {insight.suggestedAction && <div className="home-insight-action">→ {insight.suggestedAction}</div>}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
