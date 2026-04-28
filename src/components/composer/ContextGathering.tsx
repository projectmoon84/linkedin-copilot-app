import { useState } from 'react'
import { IconSparkles, IconLoader2, IconQuote, IconListCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import type { Article } from '@/lib/trend-detection'
import type { ArticleBrief } from '@/lib/ai-service-secure'

export interface PerspectiveContext {
  personalTake: string
  selectedAngle: string | null
  stance: 'agree' | 'disagree' | 'nuanced' | null
  questionAnswers: Record<string, string>   // question → selected option
}

interface ContextGatheringProps {
  article: Article
  brief: ArticleBrief | null
  briefLoading: boolean
  fetchingContent: boolean
  onGenerate: (perspective: PerspectiveContext) => void
  onSkip: () => void
}

export function ContextGathering({
  article,
  brief,
  briefLoading,
  fetchingContent,
  onGenerate,
  onSkip,
}: ContextGatheringProps) {
  const [personalTake, setPersonalTake] = useState('')
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({})

  const hasAnsweredAny = Object.keys(questionAnswers).length > 0
  const canGenerate = hasAnsweredAny || personalTake.trim().length > 0

  const handleSelectOption = (question: string, option: string) => {
    setQuestionAnswers(prev => {
      if (prev[question] === option) {
        const next = { ...prev }
        delete next[question]
        return next
      }
      return { ...prev, [question]: option }
    })
  }

  const handleGenerate = () => {
    // Derive stance and angle from question answers for backwards compat
    onGenerate({
      personalTake,
      selectedAngle: null,
      stance: null,
      questionAnswers,
    })
  }

  const isLoading = fetchingContent || briefLoading

  return (
    <div className="w-full max-w-[640px] flex flex-col">
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <IconLoader2 size={13} className="animate-spin" />
          {fetchingContent ? 'Reading article...' : 'Preparing summary...'}
        </div>
      )}

      {/* Article brief — bullets + quotes */}
      {brief && brief.bullets.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <IconListCheck size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">Key points</h3>
          </div>
          <ul className="space-y-1.5 ml-0.5">
            {brief.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90 leading-relaxed">
                <span className="text-muted-foreground/60 mt-0.5 select-none">→</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief && brief.quotes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <IconQuote size={14} className="text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground">Notable quotes</h3>
          </div>
          <div className="space-y-2.5">
            {brief.quotes.map((quote, i) => (
              <blockquote
                key={i}
                className="border-l-2 border-primary/30 pl-3.5 text-sm text-foreground/80 leading-relaxed italic"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* Divider before questions */}
      {brief && (brief.bullets.length > 0 || brief.quotes.length > 0) && (
        <div className="border-t border-border mb-6" />
      )}

      {/* Perspective questions */}
      {brief && brief.perspectiveQuestions.length > 0 && (
        <div className="space-y-5 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">What's your take?</h3>
            <p className="text-xs text-muted-foreground">Pick the options that best match your view on {article.sourceName} — this shapes the post.</p>
          </div>
          {brief.perspectiveQuestions.map((q, qi) => (
            <div key={qi}>
              <p className="text-xs font-medium text-foreground mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((option, oi) => {
                  const isSelected = questionAnswers[q.question] === option
                  return (
                    <button
                      key={oi}
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
      )}

      {/* Optional free text */}
      {brief && !briefLoading && (
        <div className="mb-6">
          <label htmlFor="personal-take" className="text-xs font-medium text-foreground block mb-2">
            Anything else to add? <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="personal-take"
            value={personalTake}
            onChange={(e) => setPersonalTake(e.target.value)}
            placeholder="e.g. I've seen this play out at three companies — the real problem isn't what the article says..."
            rows={2}
            className="w-full px-4 py-3 border border-border rounded-lg text-sm leading-relaxed text-foreground bg-card placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors resize-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Skip — just generate
        </button>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          className={cn(
            'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all',
            canGenerate && !isLoading
              ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
              : 'bg-accent text-muted-foreground cursor-default',
          )}
        >
          <IconSparkles size={15} />
          Generate draft
        </button>
      </div>
    </div>
  )
}
