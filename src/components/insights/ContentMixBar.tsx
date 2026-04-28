import type { PurposeWeighting } from '@/lib/cadence-engine'
import { weightingToSegments } from '@/lib/cadence-engine'
import type { StrategicPurpose } from '@/lib/onboarding-types'

interface ContentMixBarProps {
  weighting: PurposeWeighting
  label?: string
}

const PURPOSE_LABELS: Record<StrategicPurpose, string> = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

const PURPOSE_COLORS: Record<StrategicPurpose, string> = {
  discovery: 'var(--color-discovery)',
  trust: 'var(--color-trust)',
  authority: 'var(--color-authority)',
}

export function ContentMixBar({ weighting, label }: ContentMixBarProps) {
  const segments = weightingToSegments(weighting)

  return (
    <div>
      {label && <p className="mb-2 text-sm font-semibold text-stone-900">{label}</p>}
      <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
        {segments.map((segment) => (
          <div
            key={segment.purpose}
            className="chart-bar-enter"
            style={{ width: `${segment.percentage}%`, background: PURPOSE_COLORS[segment.purpose] }}
            aria-label={`${PURPOSE_LABELS[segment.purpose]} ${segment.percentage}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4">
        {segments.map((segment) => (
          <div key={segment.purpose} className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="size-2 rounded-full" style={{ background: PURPOSE_COLORS[segment.purpose] }} />
            <span>{PURPOSE_LABELS[segment.purpose]}</span>
            <span className="tabular-nums">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
