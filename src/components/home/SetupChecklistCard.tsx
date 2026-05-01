import {
  IconArrowRight,
  IconCheck,
  IconExternalLink,
  IconKey,
  IconMessage2Heart,
  IconRss,
  IconSparkles,
  IconUserCircle,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetupChecklist } from '@/lib/hooks/useSetupChecklist'
import { cn } from '@/lib/utils'

const OPENAI_KEYS_URL = 'https://platform.openai.com/api-keys'
const OPENAI_HELP_URL = 'https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key'
const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com/'
const ANTHROPIC_DOCS_URL = 'https://docs.anthropic.com/en/api/getting-started'

interface ChecklistItemProps {
  done: boolean
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  description: string
  actionHref: string
  actionLabel: string
  externalLinks?: Array<{ href: string; label: string }>
}

function ChecklistItem({
  done,
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  externalLinks = [],
}: ChecklistItemProps) {
  return (
    <div className={cn('rounded-2xl border p-4', done ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-white')}>
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl', done ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600')}>
          {done ? <IconCheck size={18} /> : <Icon size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', done ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500')}>
              {done ? 'Done' : 'To do'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button asChild size="sm" variant={done ? 'outline' : 'default'}>
              <Link to={actionHref}>
                {actionLabel}
                <IconArrowRight size={15} />
              </Link>
            </Button>
            {externalLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                <IconExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SetupChecklistCard() {
  const checklist = useSetupChecklist()

  if (checklist.loading) {
    return (
      <section className="app-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </section>
    )
  }

  const allComplete = checklist.completedCount === checklist.totalCount

  return (
    <section className="app-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Setup checklist</h2>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', allComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600')}>
              {checklist.completedCount}/{checklist.totalCount} complete
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Complete these in any order. LINCO gets much more useful once your profile, AI access, voice samples, and trend sources are in place.
          </p>
        </div>
        {allComplete && (
          <Button asChild size="sm" variant="outline">
            <Link to="/compose">
              Start writing
              <IconArrowRight size={15} />
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <ChecklistItem
          done={checklist.profileComplete}
          icon={IconUserCircle}
          title="Complete your profile basics"
          description="Add your name, role, discipline, audience, and context so drafts sound relevant from day one."
          actionHref="/settings?section=about"
          actionLabel="Open About You"
        />
        <ChecklistItem
          done={checklist.styleComplete}
          icon={IconSparkles}
          title="Define your content style"
          description="Set your strategic purpose, posting cadence, and tone so LINCO can make better drafting decisions automatically."
          actionHref="/settings?section=style"
          actionLabel="Open Content Style"
        />
        <ChecklistItem
          done={checklist.aiReady}
          icon={IconKey}
          title="Add an AI provider key"
          description="Connect at least one provider and choose a default model. This is required for generation, hooks, summaries, and insights."
          actionHref="/settings?section=app"
          actionLabel="Open App Settings"
          externalLinks={[
            { href: OPENAI_KEYS_URL, label: 'OpenAI API keys' },
            { href: OPENAI_HELP_URL, label: 'OpenAI key help' },
            { href: ANTHROPIC_CONSOLE_URL, label: 'Anthropic console' },
            { href: ANTHROPIC_DOCS_URL, label: 'Anthropic getting started' },
          ]}
        />
        <ChecklistItem
          done={checklist.voiceReady}
          icon={IconMessage2Heart}
          title="Teach LINCO your voice"
          description={`Add at least 3 strong writing samples so the app can learn your rhythm, phrasing, and default point of view. Currently ${checklist.voiceSampleCount}/3.`}
          actionHref="/settings/voice"
          actionLabel="Open Voice Settings"
        />
        <ChecklistItem
          done={checklist.sourcesReady}
          icon={IconRss}
          title="Add trend sources"
          description={`Give Trends something to work with by connecting RSS feeds or subreddits. Currently ${checklist.feedSourceCount} source${checklist.feedSourceCount === 1 ? '' : 's'} configured.`}
          actionHref="/trends"
          actionLabel="Open Trends"
        />
      </div>
    </section>
  )
}
