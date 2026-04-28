import { useEffect, useRef, useState } from 'react'
import {
  IconAlertTriangle,
  IconChevronDown,
  IconCopy,
  IconLoader2,
  IconPlus,
  IconSparkles,
  IconWand,
  IconX,
} from '@tabler/icons-react'
import { ArticleContextCard } from '@/components/composer/ArticleContextCard'
import { ContextGathering } from '@/components/composer/ContextGathering'
import { PromptContextGathering } from '@/components/composer/PromptContextGathering'
import { HookSwapper } from '@/components/composer/HookSwapper'
import { InlineCta } from '@/components/composer/InlineCta'
import { TextSelectionToolbar } from '@/components/composer/TextSelectionToolbar'
import { Button } from '@/components/ui/button'
import { PURPOSE_REFINEMENT_INSTRUCTIONS } from '@/lib/ai-service-secure'
import { REPURPOSE_FORMATS, type RepurposeFormatId } from '@/lib/content-framework'
import type { useComposer } from '@/lib/hooks/useComposer'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { cn } from '@/lib/utils'

type Composer = ReturnType<typeof useComposer>

const GENERATION_MESSAGES = [
  'Reading your article...',
  'Applying your voice profile...',
  'Choosing the best framework...',
  'Writing your hook...',
  'Crafting the body...',
  'Polishing the ending...',
]

const PROMPT_SUGGESTIONS = [
  'A product lesson I learned this week',
  'A design detail most teams miss',
  'A tradeoff I used to get wrong',
  'A strong opinion about AI in product work',
]

const PURPOSE_LABELS: Record<StrategicPurpose, string> = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

export function ComposerCanvas({
  composer,
  onOpenDrawer,
}: {
  composer: Composer
  onOpenDrawer: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [promptGathering, setPromptGathering] = useState(false)

  useEffect(() => {
    if (!composer.generating) {
      return
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % GENERATION_MESSAGES.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [composer.generating])

  useEffect(() => {
    if (!textareaRef.current || !composer.content) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [composer.content])

  const generationMessage = composer.article
    ? GENERATION_MESSAGES[messageIndex]
    : GENERATION_MESSAGES[Math.min(messageIndex + 1, GENERATION_MESSAGES.length - 1)]
  const promptSuggestions = composer.selectedTheme?.exampleHooks?.length
    ? composer.selectedTheme.exampleHooks
    : PROMPT_SUGGESTIONS

  if (!composer.content) {
    return (
      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="mb-4 flex justify-end md:hidden">
            <Button variant="outline" size="sm" onClick={onOpenDrawer}>Browse topics</Button>
          </div>

          {composer.restoreCandidate && (
            <div className="app-card mb-4 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="app-card-title">Restore your last autosave?</p>
                  <p className="mt-1 text-sm text-stone-500">
                    {composer.restoreCandidate.content.slice(0, 120)}
                    {composer.restoreCandidate.content.length > 120 ? '...' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={composer.dismissRestore}>Dismiss</Button>
                  <Button size="sm" onClick={composer.restoreDraft}>Restore</Button>
                </div>
              </div>
            </div>
          )}

          {composer.article && (
            <ArticleContextCard
              article={composer.article}
              selectedAngle={null}
              onRemove={() => composer.setArticle(null)}
            />
          )}

          {composer.article ? (
            <div className="app-card p-5 sm:p-6">
              <ContextGathering
                article={composer.article}
                brief={composer.articleBrief}
                briefLoading={composer.briefLoading}
                fetchingContent={composer.briefLoading && !composer.articleContent}
                onGenerate={(perspective) => void composer.generate(perspective)}
                onSkip={() => void composer.generate()}
              />
            </div>
          ) : promptGathering ? (
            <div className="app-card p-5 sm:p-6">
              <PromptContextGathering
                prompt={composer.customPrompt}
                onGenerate={(perspective) => {
                  setPromptGathering(false)
                  void composer.generate(perspective)
                }}
                onBack={() => setPromptGathering(false)}
              />
            </div>
          ) : (
            <div className="app-card p-5 sm:p-6">
              <div className="mb-4">
                <h1 className="app-page-title">What do you want to write about?</h1>
                <p className="app-page-description">Start with a messy thought. The structure can come next.</p>
              </div>

              <textarea
                value={composer.customPrompt}
                onChange={(event) => composer.setCustomPrompt(event.target.value)}
                placeholder="e.g. Why onboarding should help users do one real thing before teaching them five concepts."
                rows={7}
                className="app-input resize-none px-4 py-3 leading-relaxed"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => composer.setCustomPrompt(suggestion)}
                    className="app-chip bg-stone-100 text-stone-600 transition-colors hover:bg-stone-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
                  onClick={onOpenDrawer}
                >
                  Browse topics →
                </button>
                <Button
                  onClick={() => {
                    if (composer.customPrompt.trim().length > 10) {
                      setPromptGathering(true)
                    } else {
                      void composer.generate()
                    }
                  }}
                  disabled={composer.generating}
                >
                  {composer.generating ? <IconLoader2 className="animate-spin" size={16} /> : <IconSparkles size={16} />}
                  Generate draft
                </Button>
              </div>
            </div>
          )}

          {composer.generating && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
              <IconLoader2 className="animate-spin" size={16} />
              {generationMessage}
            </div>
          )}

          {composer.error && (
            <div className="mt-4 rounded-lg border border-negative/20 bg-red-50 p-3 text-sm text-negative">
              {composer.error}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-3xl flex-wrap items-center gap-2">
        {(['discovery', 'trust', 'authority'] as StrategicPurpose[]).map((purpose) => (
          <button
            key={purpose}
            type="button"
            onClick={() => {
              composer.setActivePurpose(purpose)
              void composer.refine(PURPOSE_REFINEMENT_INSTRUCTIONS[purpose])
            }}
            className={cn(
              `app-purpose-pill ${purpose}`,
              composer.activePurpose !== purpose && 'opacity-50 hover:opacity-100',
            )}
          >
            {PURPOSE_LABELS[purpose]}
          </button>
        ))}

        {composer.postFramework && (
          <span className="app-chip bg-stone-100 text-stone-500">
            {composer.postFramework}
          </span>
        )}

        <button
          type="button"
          className="app-btn app-btn-ghost app-btn-size-xs"
          onClick={() => void composer.refine('Rewrite this post using a different framework while keeping the core message and voice.')}
          disabled={composer.refining}
        >
          <IconWand size={13} />
          Try different
        </button>
      </div>

      <div className="compose-draft-shell -mx-4 px-4 py-6 sm:-mx-8 sm:px-8">
        <div className="mx-auto mb-5 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
          <HookSwapper
            currentHook={composer.currentHook}
            hooks={composer.hooks}
            generating={composer.refining}
            onApplyHook={composer.applyHook}
            onRegenerateHooks={() => void composer.regenerateHooks()}
          />
          <button
            type="button"
            className="app-btn app-btn-ghost app-btn-size-xs"
            onClick={() => void composer.copy()}
          >
            <IconCopy size={13} />
            Copy
          </button>
        </div>

        <div className="relative mx-auto w-full max-w-3xl">
          <textarea
            ref={textareaRef}
            value={composer.content}
            onChange={(event) => composer.setContent(event.target.value)}
            rows={18}
            className="compose-draft-textarea w-full resize-none border-0 bg-transparent text-base leading-7 text-stone-900 outline-none"
          />
          {composer.userId && (
            <TextSelectionToolbar
              textareaRef={textareaRef}
              userId={composer.userId}
              content={composer.content}
              onContentChange={composer.setContent}
              buildContext={composer.buildContext}
            />
          )}
        </div>

        <div className="mx-auto w-full max-w-3xl">
          <InlineCta
            content={composer.content}
            refining={composer.refining}
            onRefine={(instruction) => void composer.refine(instruction)}
          />
        </div>
      </div>

      <div className="mx-auto mt-3 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <span>{composer.wordCount} words · {composer.charCount}/3000 characters</span>
        {composer.isOverLimit && <span className="text-negative">LinkedIn's limit is 3000 characters.</span>}
      </div>

      {composer.validationIssues.length > 0 && (
        <div className="mx-auto mt-4 w-full max-w-3xl rounded-lg border border-warning/30 bg-amber-50 p-4 text-sm text-stone-700">
          <div className="mb-2 flex items-center gap-2 font-semibold text-warning">
            <IconAlertTriangle size={16} />
            Tighten before publishing
          </div>
          <ul className="space-y-1">
            {composer.validationIssues.slice(0, 4).map((issue) => (
              <li key={issue}>→ {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {composer.refining && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-500">
          <IconLoader2 className="animate-spin" size={16} />
          Polishing the draft...
        </div>
      )}

      <RepurposePanel composer={composer} />

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={() => { setPromptGathering(false); composer.startNew() }}>
          <IconPlus size={16} />
          Start new draft
        </Button>
      </div>
    </section>
  )
}

// ─── Repurpose Panel ──────────────────────────────────────────────────────────

function RepurposePanel({ composer }: { composer: Composer }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeFormat, setActiveFormat] = useState<RepurposeFormatId | null>(null)

  const handleFormat = async (formatId: RepurposeFormatId) => {
    setActiveFormat(formatId)
    await composer.repurpose(formatId)
  }

  const handleCopy = async () => {
    if (!composer.repurposedContent?.content) return
    await navigator.clipboard.writeText(composer.repurposedContent.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    composer.clearRepurposed()
    setActiveFormat(null)
    setOpen(false)
  }

  return (
    <div className="mt-4">
      {!open ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-400 transition-colors hover:text-stone-700"
          >
            <IconChevronDown size={14} />
            Repurpose this post
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-stone-50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Repurpose this post</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Turn your draft into a different format — same insight, new platform.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
              aria-label="Close repurpose panel"
            >
              <IconX size={15} />
            </button>
          </div>

          {/* Format picker */}
          <div className="mb-4 flex flex-wrap gap-2">
            {REPURPOSE_FORMATS.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => void handleFormat(format.id as RepurposeFormatId)}
                disabled={composer.repurposing}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                  activeFormat === format.id && !composer.repurposing
                    ? 'border-primary bg-white text-stone-900 shadow-sm'
                    : 'border-border bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900',
                  composer.repurposing && activeFormat === format.id && 'opacity-70',
                )}
              >
                <span className="text-base leading-none" aria-hidden="true">{format.icon}</span>
                {format.name}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {composer.repurposing && (
            <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
              <IconLoader2 className="animate-spin" size={15} />
              Transforming your post...
            </div>
          )}

          {/* Result */}
          {!composer.repurposing && composer.repurposedContent && (
            <div className="rounded-lg border border-border bg-white">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-stone-500">
                  {REPURPOSE_FORMATS.find(f => f.id === composer.repurposedContent?.formatId)?.name ?? 'Output'}
                </p>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <IconCopy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-stone-800">
                {composer.repurposedContent.content}
              </pre>
            </div>
          )}

          {/* Try another */}
          {!composer.repurposing && composer.repurposedContent && (
            <p className="mt-3 text-center text-xs text-stone-400">
              Pick another format above to try a different derivative.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
