import { CountUp } from '@/components/ui/count-up'

interface MiniBarProps {
  label: string
  value: number
  description?: string
}

function barColor(value: number) {
  if (value >= 70) return 'var(--color-positive)'
  if (value >= 50) return 'var(--color-chart-primary)'
  if (value >= 30) return 'var(--color-warning)'
  return 'var(--color-negative)'
}

export function MiniBar({ label, value, description }: MiniBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-sm text-stone-700">{label}</span>
        <CountUp end={value} className="text-sm font-semibold tabular-nums text-stone-900" />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.min(value, 100)}%`, background: barColor(value) }} />
      </div>
      {description && <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>}
    </div>
  )
}
