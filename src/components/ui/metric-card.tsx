import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type VerdictTone = 'positive' | 'negative' | 'neutral'

interface MetricCardProps {
  title: string
  value: ReactNode
  unit?: string
  verdict?: string
  verdictTone?: VerdictTone
  delta?: string
  benchmark?: string
  loading?: boolean
  emptyState?: string
  onClick?: () => void
}

const verdictToneClass: Record<VerdictTone, string> = {
  positive: 'text-positive',
  negative: 'text-negative',
  neutral: 'text-muted-foreground',
}

export function MetricCard({
  title,
  value,
  unit,
  verdict,
  verdictTone = 'neutral',
  delta,
  benchmark,
  loading,
  emptyState,
  onClick,
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {delta && <span className={cn('text-xs font-semibold', verdictToneClass[verdictTone])}>{delta}</span>}
      </div>

      <div className="flex flex-1 items-center">
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : emptyState ? (
          <p className="text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <p className="flex items-baseline gap-1 text-3xl font-bold tabular-nums text-foreground">
            <span>{value}</span>
            {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
          </p>
        )}
      </div>

      <div className="min-h-8 space-y-1">
        {verdict && (
          <p className={cn('text-sm font-semibold', verdictToneClass[verdictTone])}>
            {verdict}
          </p>
        )}
        {benchmark && <p className="text-xs text-muted-foreground">{benchmark}</p>}
      </div>
    </>
  )

  const className = cn(
    'app-card h-[180px] p-4 text-left transition-colors',
    'flex flex-col',
    onClick && 'cursor-pointer hover:border-stone-300 hover:bg-stone-50',
  )

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    )
  }

  return <article className={className}>{content}</article>
}
