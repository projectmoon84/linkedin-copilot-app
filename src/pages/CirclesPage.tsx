import { useMemo, useState } from 'react'
import {
  IconCheck,
  IconCopy,
  IconLogout,
  IconPlus,
  IconShield,
  IconUserPlus,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react'
import { CircleMemberCards } from '@/components/circles/CircleMemberCards'
import { CreateCircleDialog } from '@/components/circles/CreateCircleDialog'
import { HighlightsFeed } from '@/components/circles/HighlightsFeed'
import { JoinCircleDialog } from '@/components/circles/JoinCircleDialog'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { useCircleLeaderboard } from '@/lib/useCircleLeaderboard'
import { useCircles } from '@/lib/useCircles'
import { cn } from '@/lib/utils'
import type { Circle, LeaderboardEntry } from '@/lib/circles-types'

type CirclesTab = 'members' | 'highlights'

export function CirclesPage() {
  const { circles, loading, error, createCircle, joinCircle, leaveCircle, updatePrivacy } = useCircles()
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CirclesTab>('members')
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const activeCircle = useMemo<Circle | null>(
    () => circles.find((circle) => circle.id === activeCircleId) ?? circles[0] ?? null,
    [activeCircleId, circles],
  )

  const {
    leaderboard,
    highlights,
    loading: leaderboardLoading,
    error: leaderboardError,
  } = useCircleLeaderboard(activeCircle?.id ?? null)

  const currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser)
  const isCreator = currentUserEntry?.role === 'admin'

  const copyCode = async () => {
    if (!activeCircle) return
    await navigator.clipboard.writeText(activeCircle.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const toggleScore = async () => {
    if (!activeCircle || !currentUserEntry) return
    await updatePrivacy(activeCircle.id, !currentUserEntry.shareScore, currentUserEntry.shareImpressions)
  }

  const toggleImpressions = async () => {
    if (!activeCircle || !currentUserEntry) return
    await updatePrivacy(activeCircle.id, currentUserEntry.shareScore, !currentUserEntry.shareImpressions)
  }

  const confirmLeave = async () => {
    if (!activeCircle) return
    setLeaving(true)
    const success = await leaveCircle(activeCircle.id)
    setLeaving(false)
    setConfirmLeaveOpen(false)
    if (success) setActiveCircleId(null)
  }

  return (
    <div className="app-page mx-auto space-y-6">
      <PageHeader
        title="Circles"
        description="Small accountability groups for staying visible on LinkedIn."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              <IconUserPlus size={16} />
              Join with a code
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <IconPlus size={16} />
              Create a circle
            </Button>
          </div>
        }
      />

      {loading ? (
        <CirclesSkeleton />
      ) : error ? (
        <EmptyState
          icon={<IconUsersGroup size={20} />}
          heading="Circles could not load"
          description={error}
        />
      ) : circles.length === 0 ? (
        <CirclesEmptyState onCreate={() => setCreateOpen(true)} onJoin={() => setJoinOpen(true)} />
      ) : (
        <div className="space-y-4">
          {circles.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {circles.map((circle) => (
                <button
                  key={circle.id}
                  type="button"
                  onClick={() => setActiveCircleId(circle.id)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    activeCircle?.id === circle.id
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-border bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900',
                  )}
                >
                  {circle.name}
                </button>
              ))}
            </div>
          )}

          {activeCircle && (
            <>
              <CircleSummary circle={activeCircle} copied={copied} onCopy={() => void copyCode()} />

              {currentUserEntry && (
                <SharingPreferences
                  entry={currentUserEntry}
                  onToggleScore={() => void toggleScore()}
                  onToggleImpressions={() => void toggleImpressions()}
                />
              )}

              <section className="app-card">
                <div className="border-b border-border px-4 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
                      Members
                    </TabButton>
                    <TabButton active={activeTab === 'highlights'} onClick={() => setActiveTab('highlights')}>
                      Highlights
                    </TabButton>
                  </div>
                </div>

                <div className="p-4">
                  {leaderboardLoading ? (
                    <LeaderboardSkeleton />
                  ) : leaderboardError ? (
                    <EmptyState
                      icon={<IconUsersGroup size={20} />}
                      heading="Circle data could not load"
                      description={leaderboardError}
                    />
                  ) : activeTab === 'members' ? (
                    <CircleMemberCards entries={leaderboard} />
                  ) : (
                    <HighlightsFeed highlights={highlights} members={leaderboard} />
                  )}
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="text-negative hover:text-negative"
                  onClick={() => setConfirmLeaveOpen(true)}
                  disabled={leaving}
                >
                  <IconLogout size={16} />
                  {leaving ? 'Leaving...' : 'Leave circle'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <CreateCircleDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createCircle} />
      <JoinCircleDialog open={joinOpen} onOpenChange={setJoinOpen} onJoin={joinCircle} />

      {confirmLeaveOpen && activeCircle && (
        <LeaveCircleDialog
          circle={activeCircle}
          isCreator={isCreator}
          leaving={leaving}
          onCancel={() => setConfirmLeaveOpen(false)}
          onConfirm={() => void confirmLeave()}
        />
      )}
    </div>
  )
}

function CirclesEmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <section className="app-card overflow-hidden">
      <div className="grid gap-8 p-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
        <div className="relative min-h-48 rounded-lg bg-stone-50 p-6">
          <div className="absolute left-7 top-8 flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
            <IconUsersGroup size={30} className="text-stone-800" />
          </div>
          <div className="absolute bottom-8 left-16 size-14 rounded-full border-4 border-white bg-stone-200" />
          <div className="absolute right-12 top-12 size-12 rounded-full border-4 border-white bg-stone-300" />
          <div className="absolute bottom-10 right-16 size-16 rounded-full border-4 border-white bg-stone-100" />
          <div className="absolute bottom-7 left-8 right-8 h-2 rounded-full bg-white" />
        </div>

        <div>
          <p className="app-label">Accountability circles</p>
          <h2 className="font-heading text-2xl font-semibold text-stone-900">Post more. Together.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
            People in circles post 2x more consistently than solo users. Create a circle with up to 4 friends
            or colleagues. You will see each other's posting stats, celebrate wins, and stay accountable.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={onCreate}>
              <IconPlus size={16} />
              Create a circle
            </Button>
            <Button variant="outline" onClick={onJoin}>
              <IconUserPlus size={16} />
              Join with a code
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function CircleSummary({ circle, copied, onCopy }: { circle: Circle; copied: boolean; onCopy: () => void }) {
  return (
    <section className="app-card app-card-pad flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-heading text-xl font-semibold text-stone-900">{circle.name}</h2>
        <p className="mt-1 text-sm text-stone-500">{circle.memberCount} of 5 members</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-stone-50 px-3 py-2">
        <span className="font-mono text-xs font-semibold tracking-widest text-stone-600">{circle.inviteCode}</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md p-1 text-stone-400 hover:bg-white hover:text-stone-900"
          aria-label="Copy invite code"
        >
          {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
        </button>
      </div>
    </section>
  )
}

function SharingPreferences({
  entry,
  onToggleScore,
  onToggleImpressions,
}: {
  entry: LeaderboardEntry
  onToggleScore: () => void
  onToggleImpressions: () => void
}) {
  return (
    <section className="app-card app-card-pad">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
          <IconShield size={18} />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-stone-900">Your sharing preferences</h2>
          <p className="mt-1 text-sm text-stone-500">Posting frequency and streak are always visible.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <PreferenceToggle
          label="Share my LinkedIn score"
          description="Useful for seeing week-by-week momentum."
          checked={entry.shareScore}
          onCheckedChange={onToggleScore}
        />
        <PreferenceToggle
          label="Share my impressions"
          description="Useful for celebrating reach and traction."
          checked={entry.shareImpressions}
          onCheckedChange={onToggleImpressions}
        />
      </div>
    </section>
  )
}

function PreferenceToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-stone-50 p-4">
      <div>
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onCheckedChange={onCheckedChange} label={label} />
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors',
        active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:text-stone-900',
      )}
    >
      {children}
    </button>
  )
}

function LeaveCircleDialog({
  circle,
  isCreator,
  leaving,
  onCancel,
  onConfirm,
}: {
  circle: Circle
  isCreator: boolean
  leaving: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 px-4">
      <div className="app-card w-full max-w-md bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-stone-900">
              {isCreator ? 'Delete this circle?' : 'Leave this circle?'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              {isCreator
                ? `${circle.name} will be removed for everyone.`
                : `You can rejoin ${circle.name} later with the invite code.`}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
            onClick={onCancel}
            aria-label="Close"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={leaving}>
            {leaving ? 'Leaving...' : isCreator ? 'Delete circle' : 'Leave circle'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CirclesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-44" />
      ))}
    </div>
  )
}
