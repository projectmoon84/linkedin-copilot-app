import type { ReactNode } from 'react'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { PURPOSE_LABELS, type AnalyticsFilterValue } from '@/lib/drafts-types'
import { cn } from '@/lib/utils'

interface DraftFiltersProps {
  purposeFilter: StrategicPurpose | null
  analyticsFilter?: AnalyticsFilterValue
  showAnalyticsFilters?: boolean
  filteredCount: number
  totalCount: number
  onPurposeFilterChange: (purpose: StrategicPurpose | null) => void
  onAnalyticsFilterChange?: (filter: AnalyticsFilterValue) => void
}

export function DraftFilters({
  purposeFilter,
  analyticsFilter = 'all',
  showAnalyticsFilters,
  filteredCount,
  totalCount,
  onPurposeFilterChange,
  onAnalyticsFilterChange,
}: DraftFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChip active={purposeFilter === null} onClick={() => onPurposeFilterChange(null)}>All</FilterChip>
      {(['discovery', 'trust', 'authority'] as StrategicPurpose[]).map((purpose) => (
        <FilterChip
          key={purpose}
          active={purposeFilter === purpose}
          tone={purpose}
          onClick={() => onPurposeFilterChange(purposeFilter === purpose ? null : purpose)}
        >
          {PURPOSE_LABELS[purpose]}
        </FilterChip>
      ))}
      {showAnalyticsFilters && onAnalyticsFilterChange && (
        <>
          <span className="px-1 text-stone-300">|</span>
          {([
            ['all', 'All data'],
            ['has_data', 'Has analytics'],
            ['needs_data', 'Needs data'],
          ] as [AnalyticsFilterValue, string][]).map(([value, label]) => (
            <FilterChip key={value} active={analyticsFilter === value} onClick={() => onAnalyticsFilterChange(value)}>
              {label}
            </FilterChip>
          ))}
        </>
      )}
      {filteredCount !== totalCount && (
        <span className="ml-1 text-2xs text-stone-400">Showing {filteredCount} of {totalCount}</span>
      )}
    </div>
  )
}

function FilterChip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean
  tone?: StrategicPurpose
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'app-chip border transition-colors',
        active && tone ? `app-purpose-pill ${tone} border-transparent` : '',
        active && !tone ? 'border-stone-800 bg-stone-800 text-white' : '',
        !active ? 'border-border bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900' : '',
      )}
    >
      {children}
    </button>
  )
}
