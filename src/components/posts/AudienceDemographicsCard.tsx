import { IconUsers } from '@tabler/icons-react'
import type { AudienceDemographics } from '@/lib/analytics-parsing'

interface AudienceDemographicsCardProps {
  demographics: AudienceDemographics
}

export function AudienceDemographicsCard({ demographics }: AudienceDemographicsCardProps) {
  const sections = [
    { label: 'Job title', entries: demographics.jobTitles },
    { label: 'Company size', entries: demographics.companySizes },
    { label: 'Company', entries: demographics.companies },
    { label: 'Job function', entries: demographics.jobFunctions },
    { label: 'Seniority', entries: demographics.seniority },
    { label: 'Industry', entries: demographics.industries },
    { label: 'Location', entries: demographics.locations },
  ].filter((section) => section.entries && Object.keys(section.entries).length > 0)

  if (sections.length === 0) return null

  return (
    <section className="app-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <IconUsers size={18} className="text-stone-400" />
        <div>
          <h2 className="app-card-title">Audience demographics</h2>
          <p className="text-xs text-stone-500">Top audience patterns from analytics imports.</p>
        </div>
      </div>
      {(demographics.topJobTitle || demographics.topLocation || demographics.topIndustry) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {demographics.topJobTitle && <HighlightPill label="Top job title" value={demographics.topJobTitle} />}
          {demographics.topLocation && <HighlightPill label="Top location" value={demographics.topLocation} />}
          {demographics.topIndustry && <HighlightPill label="Top industry" value={demographics.topIndustry} />}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {sections.slice(0, 3).map((section) => (
          <DemographicSection key={section.label} label={section.label} entries={section.entries || {}} />
        ))}
      </div>
    </section>
  )
}

function HighlightPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs text-stone-600">
      <span className="font-medium text-stone-500">{label}:</span>{' '}
      <span className="text-stone-800">{value}</span>
    </div>
  )
}

function DemographicSection({ label, entries }: { label: string; entries: Record<string, number> }) {
  const top = Object.entries(entries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const max = Math.max(1, ...top.map(([, value]) => value))

  return (
    <div>
      <p className="app-label">{label}</p>
      <div className="space-y-2">
        {top.map(([value, count]) => (
          <div key={value}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-stone-700">{value}</span>
              <span className="text-stone-400">{count}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-chart-primary" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
