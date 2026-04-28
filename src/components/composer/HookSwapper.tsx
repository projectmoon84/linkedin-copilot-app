import { useState, useRef, useEffect } from 'react'
import { IconArrowsExchange2, IconRefresh } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { GeneratedHook } from '@/lib/ai-service-secure'

interface HookSwapperProps {
  currentHook: string
  hooks: GeneratedHook[]
  generating: boolean
  onApplyHook: (hook: string) => void
  onRegenerateHooks: () => void
}

export function HookSwapper({
  currentHook,
  hooks,
  generating,
  onApplyHook,
  onRegenerateHooks,
}: HookSwapperProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (hooks.length === 0) return null

  return (
    <div className="relative inline-block mb-3" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Swap hook"
        className={cn(
          'flex items-center gap-1.5 text-2xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer',
          open
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-border',
        )}
      >
        <IconArrowsExchange2 size={12} />
        Swap hook
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[400px] bg-card border border-border rounded-lg shadow-lg z-50 p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Alternative hooks
          </p>
          <div className="space-y-1.5">
            {hooks
              .filter(h => h.hook !== currentHook)
              .slice(0, 4)
              .map((item, i) => (
                <button
                  key={i}
                  onClick={() => { onApplyHook(item.hook); setOpen(false) }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-muted transition-all group"
                >
                  <span className="text-3xs text-muted-foreground/60 font-medium group-hover:text-muted-foreground transition-colors">
                    {item.framework}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground mt-0.5">
                    {item.hook}
                  </p>
                </button>
              ))}
          </div>
          <button
            onClick={onRegenerateHooks}
            disabled={generating}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2.5 mt-1 border-t border-border transition-colors disabled:opacity-50"
          >
            <IconRefresh size={12} className={generating ? 'animate-spin' : ''} />
            Generate new hooks
          </button>
        </div>
      )}
    </div>
  )
}
