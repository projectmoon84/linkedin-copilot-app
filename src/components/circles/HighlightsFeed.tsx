import { IconFlame, IconTargetArrow, IconTrendingUp } from '@tabler/icons-react'
import type { Highlight, LeaderboardEntry } from '@/lib/circles-types'

interface HighlightsFeedProps {
  highlights: Highlight[]
  members: LeaderboardEntry[]
}

const highlightIcons: Record<Highlight['type'], typeof IconFlame> = {
  streak: IconFlame,
  score_jump: IconTrendingUp,
  target_hit: IconTargetArrow,
}

export function HighlightsFeed({ highlights, members }: HighlightsFeedProps) {
  if (highlights.length === 0) {
    const sampleMembers = members.length > 0 ? members.slice(0, 3) : null

    return (
      <div className="grid gap-3">
        {(sampleMembers || [null, null, null]).map((member, index) => {
          const firstName = member?.displayName.split(' ')[0] || 'Someone'
          const message = index === 1
            ? `When ${firstName} publishes a post, you will see it here.`
            : `When ${firstName} hits their weekly target, it will appear here.`

          return (
            <div key={member?.userId || index} className="rounded-lg border border-dashed border-border bg-stone-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="size-9 rounded-full bg-stone-100" />
                <div className="space-y-2">
                  <div className="h-2.5 w-28 rounded-full bg-stone-100" />
                  <div className="h-2 w-40 rounded-full bg-stone-100" />
                </div>
              </div>
              <p className="text-sm leading-relaxed text-stone-500">{message}</p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {highlights.map((highlight) => {
        const Icon = highlightIcons[highlight.type]
        return (
          <article key={highlight.id} className="flex items-center gap-3 rounded-lg border border-border bg-white p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">{highlight.message}</p>
              <p className="mt-0.5 text-xs text-stone-500">A good moment to cheer them on.</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
