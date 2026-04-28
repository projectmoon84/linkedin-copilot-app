import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: ReactNode
  heading: string
  description: string
  embedded?: boolean
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, heading, description, embedded, className, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-64 flex-col items-center justify-center border-dashed px-6 py-10 text-center',
        embedded ? 'rounded-lg border border-border' : 'app-card',
        className,
      )}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
        {icon}
      </div>
      <h2 className="app-card-title">{heading}</h2>
      <p className="mt-2 max-w-md text-sm text-stone-500">{description}</p>
      {action && (
        <Button className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
