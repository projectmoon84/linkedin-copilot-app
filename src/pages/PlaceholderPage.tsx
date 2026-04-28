import type { ReactNode } from 'react'
import { IconSparkles } from '@tabler/icons-react'
import { EmptyState } from '@/components/ui/empty-state'
import { AppPage } from '@/components/ui/app-surface'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import { PurposeBadge } from '@/components/ui/purpose-badge'

interface PlaceholderPageProps {
  title: string
  description: string
  emptyHeading: string
  emptyDescription: string
  children?: ReactNode
}

export function PlaceholderPage({
  title,
  description,
  emptyHeading,
  emptyDescription,
  children,
}: PlaceholderPageProps) {
  return (
    <AppPage className="space-y-6">
      <PageHeader title={title} description={description} />
      {children}
      <EmptyState
        icon={<IconSparkles size={20} />}
        heading={emptyHeading}
        description={emptyDescription}
      />
    </AppPage>
  )
}

export function PhaseZeroCards() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Scaffold preview">
      <MetricCard title="Score verdict" value="--" verdict="Waiting for data" benchmark="Home uses this card first." />
      <MetricCard title="Posts this week" value="0" verdict="Start from Compose" benchmark="Draft and published data comes later." />
      <MetricCard title="Engagement rate" value="--" unit="%" emptyState="Add analytics in the Posts phase." />
      <MetricCard title="Purpose mix" value={<PurposeBadge purpose="discovery" />} benchmark="Discovery, Trust, Authority tokens are ready." />
    </section>
  )
}
