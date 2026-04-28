import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AppPage({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('app-page mx-auto', className)} {...props} />
}

interface AppCardProps extends ComponentPropsWithoutRef<'div'> {
  padded?: boolean | 'sm'
}

export function AppCard({ className, padded, children, ...props }: AppCardProps) {
  return (
    <div className={cn('app-card', padded === true && 'app-card-pad', padded === 'sm' && 'app-card-pad-sm', className)} {...props}>
      {children}
    </div>
  )
}

interface AppSectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function AppSectionHeader({ title, description, action, className }: AppSectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div>
        <h2 className="app-card-title">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface AppPillProps extends ComponentPropsWithoutRef<'span'> {
  tone?: 'discovery' | 'trust' | 'authority' | 'neutral' | 'positive' | 'warning' | 'negative'
}

export function AppPill({ tone = 'neutral', className, ...props }: AppPillProps) {
  const toneClass =
    tone === 'discovery' || tone === 'trust' || tone === 'authority'
      ? `app-purpose-pill ${tone}`
      : 'app-chip'

  const neutralTone =
    tone === 'neutral'
      ? 'bg-stone-100 text-stone-500'
      : tone === 'positive'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'warning'
          ? 'bg-amber-50 text-amber-600'
          : tone === 'negative'
            ? 'bg-red-50 text-red-600'
            : ''

  return <span className={cn(toneClass, neutralTone, className)} {...props} />
}
