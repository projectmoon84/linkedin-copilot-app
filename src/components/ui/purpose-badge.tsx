import { cn } from '@/lib/utils'

type Purpose = 'discovery' | 'trust' | 'authority'

interface PurposeBadgeProps {
  purpose: Purpose
  className?: string
}

const purposeLabels: Record<Purpose, string> = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

export function PurposeBadge({ purpose, className }: PurposeBadgeProps) {
  return (
    <span className={cn('app-purpose-pill', purpose, className)}>
      {purposeLabels[purpose]}
    </span>
  )
}
