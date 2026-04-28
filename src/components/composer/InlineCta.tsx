import { useState, useRef, useEffect } from 'react'
import { IconPencil, IconLoader2 } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const CTA_OPTIONS = [
  {
    id: 'question',
    label: 'Question',
    instruction: 'Rewrite only the final paragraph as a genuine, specific question CTA. Keep everything else the same.',
  },
  {
    id: 'bold-statement',
    label: 'Bold statement',
    instruction: 'Rewrite only the final paragraph as a bold, definitive closing statement — no question, no ask. End with conviction. Keep everything else the same.',
  },
  {
    id: 'thought-provoker',
    label: 'Thought provoker',
    instruction: 'Rewrite only the final paragraph as a thought-provoking reframe that makes the reader reconsider something. Not a question — a statement that lingers. Keep everything else the same.',
  },
  {
    id: 'takeaway',
    label: 'Takeaway line',
    instruction: 'Rewrite only the final paragraph as a crisp, memorable one-line takeaway — the single thing the reader should remember. Keep everything else the same.',
  },
  {
    id: 'clarifying-moment',
    label: 'Clarifying moment',
    instruction: 'Rewrite only the final paragraph as a clarifying "here\'s what this really means" moment — distill the post down to its core truth. Keep everything else the same.',
  },
  {
    id: 'resource',
    label: 'Resource (DMs)',
    instruction: 'Rewrite only the final paragraph as a resource/DM call to action — offer something free via DM with a trigger keyword. Keep everything else the same.',
  },
  {
    id: 'handraiser',
    label: 'Handraiser',
    instruction: 'Rewrite only the final paragraph as a handraiser CTA — ask readers to comment a keyword to signal interest. Keep everything else the same.',
  },
  {
    id: 'personal-invite',
    label: 'Personal invite',
    instruction: 'Rewrite only the final paragraph as a personal invite — invite readers to connect, follow, or check out something specific you offer. Warm and direct, not salesy. Keep everything else the same.',
  },
] as const

interface InlineCtaProps {
  content: string
  refining: boolean
  onRefine: (instruction: string) => void
}

export function InlineCta({ content, refining, onRefine }: InlineCtaProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Detect CTA type from content heuristics
  const lastParagraph = content.split('\n\n').filter(p => p.trim()).pop() || ''
  const lower = lastParagraph.toLowerCase()
  const detectedType = lower.endsWith('?')
    ? 'Question'
    : (lower.includes('dm') || (lower.includes('comment') && lower.includes('send')))
      ? 'Resource'
      : (lower.includes('comment') || lower.includes('drop'))
        ? 'Handraiser'
        : null

  return (
    <div className="relative mt-4" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={refining}
        className={cn(
          'flex items-center gap-1.5 text-2xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer',
          'bg-muted border-border text-muted-foreground hover:text-foreground',
        )}
      >
        {refining ? (
          <IconLoader2 size={11} className="animate-spin" />
        ) : (
          <IconPencil size={11} />
        )}
        {detectedType ? `${detectedType} CTA` : 'CTA style'}
      </button>

      {open && !refining && (
        <div className="absolute left-0 bottom-full mb-2 w-60 bg-card border border-border rounded-lg shadow-lg z-50 p-2 animate-in fade-in slide-in-from-bottom-1 duration-150 max-h-[320px] overflow-y-auto">
          <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
            Change CTA style
          </p>
          {CTA_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setOpen(false)
                onRefine(opt.instruction)
              }}
              className="w-full text-left px-2.5 py-2 text-xs rounded-md hover:bg-muted transition-colors text-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
