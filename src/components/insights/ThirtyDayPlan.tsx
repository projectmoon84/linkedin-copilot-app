import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBulb, IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { WeekPlan } from '@/lib/cadence-engine'
import type { Draft } from '@/lib/drafts-types'
import { PURPOSE_LABELS } from '@/lib/drafts-types'
import type { StrategicPurpose } from '@/lib/onboarding-types'

interface ThirtyDayPlanProps {
  weeks: WeekPlan[]
  drafts: Draft[]
}

function matchesSlot(draft: Draft, purpose: StrategicPurpose, theme: string) {
  if (draft.strategicPurpose !== purpose) return false
  const haystack = `${draft.title} ${draft.content}`.toLowerCase()
  const normalizedTheme = theme.toLowerCase()
  return haystack.includes(normalizedTheme) || normalizedTheme === 'general post'
}

export function ThirtyDayPlan({ weeks, drafts }: ThirtyDayPlanProps) {
  const navigate = useNavigate()
  const [expandedWeek, setExpandedWeek] = useState(1)

  if (weeks.length === 0) return null

  return (
    <div className="space-y-3">
      {weeks.map((week) => {
        const expanded = expandedWeek === week.weekNumber
        return (
          <section key={week.weekNumber} className="app-card">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-stone-50"
              onClick={() => setExpandedWeek(expanded ? 0 : week.weekNumber)}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-stone-900">Week {week.weekNumber}</span>
                <span className="text-xs text-stone-500">{week.dateRange}</span>
                <div className="flex flex-wrap gap-1">
                  {[...new Set(week.posts.map((post) => post.purpose))].map((purpose) => (
                    <span key={purpose} className={`app-purpose-pill ${purpose}`}>{PURPOSE_LABELS[purpose]}</span>
                  ))}
                </div>
              </div>
              {expanded ? <IconChevronUp size={16} className="text-stone-400" /> : <IconChevronDown size={16} className="text-stone-400" />}
            </button>

            {expanded && (
              <div className="space-y-3 border-t border-border p-4">
                {week.posts.map((post, index) => {
                  const matchingDraft = drafts.find((draft) => matchesSlot(draft, post.purpose, post.theme))
                  return (
                    <div key={`${post.purpose}-${post.theme}-${index}`} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className={`app-purpose-pill ${post.purpose}`}>{PURPOSE_LABELS[post.purpose]}</span>
                        <p className="mt-2 text-sm font-semibold text-stone-900">{post.theme}</p>
                        {post.hookSuggestion && (
                          <p className="mt-1 text-xs italic leading-relaxed text-stone-500">"{post.hookSuggestion}"</p>
                        )}
                        {matchingDraft ? (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-positive">
                            <IconCheck size={14} />
                            {matchingDraft.title}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-stone-400">Not yet written</p>
                        )}
                      </div>
                      {!matchingDraft && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/compose?purpose=${post.purpose}&theme=${encodeURIComponent(post.theme)}`)}
                        >
                          Write this
                        </Button>
                      )}
                    </div>
                  )
                })}

                <div className="flex items-start gap-2 border-t border-border pt-3 text-sm text-stone-500">
                  <IconBulb size={16} className="mt-0.5 shrink-0 text-warning" />
                  {week.focusTip}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
