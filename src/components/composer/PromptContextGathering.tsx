import { useEffect, useState } from 'react'
import { IconArrowLeft, IconLoader2, IconSparkles } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { generatePromptQuestions, type PerspectiveQuestion } from '@/lib/ai-service-secure'
import type { PerspectiveContext } from '@/components/composer/ContextGathering'

interface PromptContextGatheringProps {
  prompt: string
  onGenerate: (perspective: PerspectiveContext) => void
  onBack: () => void
}

export function PromptContextGathering({ prompt, onGenerate, onBack }: PromptContextGatheringProps) {
  const [questions, setQuestions] = useState<PerspectiveQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({})
  const [additionalContext, setAdditionalContext] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadQuestions = async () => {
      await Promise.resolve()
      if (cancelled) return

      setLoading(true)
      setQuestions([])
      setQuestionAnswers({})
      setAdditionalContext('')

      try {
        const qs = await generatePromptQuestions(prompt)
        if (!cancelled) setQuestions(qs)
      } catch {
        // Silently fall back to no questions — user can still generate
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadQuestions()

    return () => {
      cancelled = true
    }
  }, [prompt])

  const handleSelectOption = (question: string, option: string) => {
    setQuestionAnswers((prev) => {
      if (prev[question] === option) {
        const next = { ...prev }
        delete next[question]
        return next
      }
      return { ...prev, [question]: option }
    })
  }

  const handleGenerate = () => {
    onGenerate({
      personalTake: additionalContext,
      selectedAngle: null,
      stance: null,
      questionAnswers,
    })
  }

  const handleSkip = () => {
    onGenerate({
      personalTake: '',
      selectedAngle: null,
      stance: null,
      questionAnswers: {},
    })
  }

  const canGenerate = Object.keys(questionAnswers).length > 0 || additionalContext.trim().length > 0

  return (
    <div className="w-full">
      {/* Topic summary */}
      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700"
        >
          <IconArrowLeft size={12} />
          Change topic
        </button>
        <p className="text-xs font-medium text-stone-500">Writing about</p>
        <p className="mt-0.5 text-sm font-semibold text-stone-900 leading-snug">{prompt}</p>
      </div>

      <div className="border-t border-border mb-5" />

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <IconLoader2 size={13} className="animate-spin" />
          Thinking of questions...
        </div>
      ) : questions.length > 0 ? (
        <>
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Shape your post</h3>
            <p className="text-xs text-muted-foreground">
              Pick the options that best match your angle — this helps the draft feel like you wrote it.
            </p>
          </div>

          <div className="space-y-5 mb-5">
            {questions.map((q, qi) => (
              <div key={qi}>
                <p className="text-xs font-medium text-foreground mb-2">{q.question}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((option, oi) => {
                    const isSelected = questionAnswers[q.question] === option
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => handleSelectOption(q.question, option)}
                        className={cn(
                          'text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer text-left leading-snug',
                          isSelected
                            ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-card',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Optional free text */}
      {!loading && (
        <div className="mb-5">
          <label htmlFor="additional-context" className="text-xs font-medium text-foreground block mb-2">
            {questions.length > 0
              ? <>Anything else to add? <span className="text-muted-foreground font-normal">(optional)</span></>
              : 'Add any context that should shape the post'}
          </label>
          <textarea
            id="additional-context"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="e.g. I want to focus on the part that surprised me most, not the obvious takeaway..."
            rows={2}
            className="w-full px-4 py-3 border border-border rounded-lg text-sm leading-relaxed text-foreground bg-card placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>
      )}

      {/* Actions */}
      {!loading && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Skip — just generate
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all',
              canGenerate
                ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                : 'bg-accent text-muted-foreground cursor-default',
            )}
          >
            <IconSparkles size={15} />
            Generate draft
          </button>
        </div>
      )}
    </div>
  )
}
