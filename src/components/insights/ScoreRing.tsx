import { CountUp } from '@/components/ui/count-up'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

function scoreColor(score: number) {
  if (score >= 70) return 'var(--color-positive)'
  if (score >= 50) return 'var(--color-chart-primary)'
  if (score >= 30) return 'var(--color-warning)'
  return 'var(--color-negative)'
}

export function ScoreRing({ score, size = 148, strokeWidth = 8, className }: ScoreRingProps) {
  const bounded = Math.max(0, Math.min(100, score))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - bounded / 100)
  const center = size / 2

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg width={size} height={size} className="absolute inset-0" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-stone-100)" strokeWidth={strokeWidth} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <CountUp end={score} className="font-heading text-3xl font-semibold tabular-nums text-stone-900" />
    </div>
  )
}
