import { IconChartBar, IconFlame, IconLock, IconTargetArrow, IconUsersGroup } from '@tabler/icons-react'
import { EmptyState } from '@/components/ui/empty-state'
import { getAvatarUrl } from '@/lib/creator-identity'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/circles-types'

interface CircleMemberCardsProps {
  entries: LeaderboardEntry[]
}

export function CircleMemberCards({ entries }: CircleMemberCardsProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        embedded
        className="min-h-56"
        icon={<IconUsersGroup size={20} />}
        heading="Invite your first member"
        description="The member cards will fill in as people join your circle."
      />
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <MemberCard key={entry.userId} entry={entry} />
      ))}
    </div>
  )
}

function MemberCard({ entry }: { entry: LeaderboardEntry }) {
  const target = Math.max(entry.postsTarget || 1, 1)
  const progress = Math.min(100, Math.round((entry.postsThisWeek / target) * 100))
  const firstName = entry.displayName.split(' ')[0] || entry.displayName

  return (
    <article className={cn('app-card app-card-pad-sm', entry.isCurrentUser && 'border-stone-800 bg-stone-50')}>
      <div className="flex items-start gap-3">
        <img
          src={getAvatarUrl(entry.avatarSeed, null, 44)}
          alt={entry.displayName}
          className="size-11 shrink-0 rounded-full bg-stone-100"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-base font-semibold text-stone-900">
                {entry.displayName}
                {entry.isCurrentUser && <span className="font-body text-xs font-medium text-stone-400"> you</span>}
              </h3>
              <p className="mt-0.5 text-xs capitalize text-stone-500">{entry.role}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
              <IconFlame size={13} />
              {entry.streak}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-stone-700">Posts this week</span>
              <span className="font-medium text-stone-500">{entry.postsThisWeek}/{target}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-stone-800 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatPill
              icon={<IconTargetArrow size={14} />}
              label="Score"
              value={entry.shareScore && entry.overallScore != null ? String(entry.overallScore) : 'Private'}
              muted={!entry.shareScore || entry.overallScore == null}
            />
            <StatPill
              icon={<IconChartBar size={14} />}
              label="Impressions"
              value={entry.shareImpressions && entry.impressions != null ? formatNumber(entry.impressions) : 'Private'}
              muted={!entry.shareImpressions || entry.impressions == null}
            />
          </div>

          {progress >= 100 && (
            <p className="mt-4 rounded-lg bg-stone-100 px-3 py-2 text-xs font-medium text-stone-700">
              {firstName} hit this week's target.
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function StatPill({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-white p-3', muted && 'text-stone-400')}>
      <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-400">
        {muted ? <IconLock size={13} /> : icon}
        {label}
      </div>
      <p className={cn('text-sm font-semibold text-stone-900', muted && 'text-stone-400')}>{value}</p>
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
