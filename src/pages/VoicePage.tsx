import { useEffect, useMemo, useState } from 'react'
import {
  IconAlertCircle,
  IconCheck,
  IconLoader2,
  IconPlus,
  IconSparkles,
  IconTrash,
  IconWand,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Field, RangeInput, TextArea, TextInput } from '@/components/ui/form-controls'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { analyseVoiceWithAI, type AiVoiceAnalysis } from '@/lib/ai-service-secure'
import { fetchVoiceProfileRaw, upsertVoiceProfile } from '@/lib/services/profile-service'
import { analyseVoiceSamples, VOICE_SLIDERS, voiceStrengthLabel, type VoiceAnalysis } from '@/lib/voice-profile'
import { cn } from '@/lib/utils'

type SliderKey = (typeof VOICE_SLIDERS)[number]['key']
type SliderState = Record<SliderKey, number>

const DEFAULT_SLIDERS: SliderState = {
  confidenceLevel: 3,
  technicalDepth: 3,
  opinionStrength: 3,
  warmthLevel: 3,
  humourLevel: 2,
}

export function VoicePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sliders, setSliders] = useState<SliderState>(DEFAULT_SLIDERS)
  const [voiceSamples, setVoiceSamples] = useState<string[]>([])
  const [newSample, setNewSample] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [signaturePhrases, setSignaturePhrases] = useState<string[]>([])
  const [topicsToAvoid, setTopicsToAvoid] = useState<string[]>([])
  const [voiceSummary, setVoiceSummary] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AiVoiceAnalysis | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const row = await fetchVoiceProfileRaw(user.id)
        if (!row) return

        setSliders({
          confidenceLevel: row.confidence_level || 3,
          technicalDepth: row.technical_depth || 3,
          opinionStrength: row.opinion_strength || 3,
          warmthLevel: row.warmth_level || 3,
          humourLevel: row.humour_level || 2,
        })
        setVoiceSamples(row.voice_samples || [])
        setSignaturePhrases(row.signature_phrases || [])
        setTopicsToAvoid(row.topics_to_avoid || [])
        setVoiceSummary(row.voice_summary || null)

        if (row.voice_samples?.length > 0) {
          setAnalysis(analyseVoiceSamples(row.voice_samples))
        }
      } catch (err) {
        console.error('Error loading voice profile:', err)
        setError('Your voice profile could not be loaded.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user])

  const strengthPercent = useMemo(() => Math.min(100, (voiceSamples.length / 10) * 100), [voiceSamples.length])

  const addSample = () => {
    const trimmed = newSample.trim()
    if (!trimmed || voiceSamples.length >= 10) return

    setVoiceSamples((current) => [...current, trimmed])
    setNewSample('')
  }

  const importBulk = () => {
    const posts = bulkText
      .split(/^---+$/m)
      .map((post) => post.trim())
      .filter(Boolean)
      .slice(0, 5)

    if (posts.length === 0) return

    const remaining = 10 - voiceSamples.length
    setVoiceSamples((current) => [...current, ...posts.slice(0, remaining)])
    setBulkText('')
  }

  const runAnalysis = async () => {
    if (voiceSamples.length === 0) return

    setAnalysing(true)
    setError(null)

    try {
      const localAnalysis = analyseVoiceSamples(voiceSamples)
      setAnalysis(localAnalysis)

      const commonPhrases = localAnalysis.commonPhrases
        .slice(0, 5)
        .filter((phrase) => !signaturePhrases.includes(phrase))

      if (commonPhrases.length > 0) {
        setSignaturePhrases((current) => [...current, ...commonPhrases].slice(0, 10))
      }

      if (voiceSamples.length >= 3) {
        const aiResult = await analyseVoiceWithAI(voiceSamples)
        if (aiResult) {
          setAiAnalysis(aiResult)
          setVoiceSummary(aiResult.voiceSummary)

          const aiPhrases = aiResult.signaturePhrases.filter((phrase) => !signaturePhrases.includes(phrase))
          if (aiPhrases.length > 0) {
            setSignaturePhrases((current) => [...current, ...aiPhrases].slice(0, 10))
          }

          if (aiResult.thingsToAvoid.length > 0) {
            setTopicsToAvoid((current) => [...current, ...aiResult.thingsToAvoid.filter((topic) => !current.includes(topic))].slice(0, 10))
          }
        }
      }
    } catch (err) {
      console.error('Voice analysis failed:', err)
      setError('Voice analysis failed. Your samples are still saved locally on this page.')
    } finally {
      setAnalysing(false)
    }
  }

  const save = async () => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const latestAnalysis = voiceSamples.length > 0 ? analyseVoiceSamples(voiceSamples) : analysis
      if (latestAnalysis) setAnalysis(latestAnalysis)

      await upsertVoiceProfile({
        user_id: user.id,
        confidence_level: sliders.confidenceLevel,
        technical_depth: sliders.technicalDepth,
        opinion_strength: sliders.opinionStrength,
        warmth_level: sliders.warmthLevel,
        humour_level: sliders.humourLevel,
        voice_samples: voiceSamples,
        signature_phrases: signaturePhrases,
        topics_to_avoid: topicsToAvoid,
        voice_summary: voiceSummary || null,
        avg_sentence_length: latestAnalysis?.avgSentenceLength || null,
        avg_paragraph_length: latestAnalysis?.avgParagraphLength || null,
        uses_questions: latestAnalysis?.usesQuestions ?? true,
        uses_contractions: latestAnalysis?.usesContractions ?? true,
        uses_parentheticals: latestAnalysis?.usesParentheticals ?? false,
        uses_em_dashes: latestAnalysis?.usesEmDashes ?? false,
        uses_numbers_frequently: latestAnalysis?.usesNumbersFrequently ?? false,
        updated_at: new Date().toISOString(),
      })

      setSaved(true)
      window.setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving voice profile:', err)
      setError('Your voice profile could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <VoiceSkeleton />
    )
  }

  return (
    <div className="app-page mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title="Voice & writing" description="Teach the copilot how you actually sound on LinkedIn." />
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <IconLoader2 className="animate-spin" size={16} /> : saved ? <IconCheck size={16} /> : null}
          {saved ? 'Saved' : 'Save changes'}
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-negative/20 bg-muted p-4 text-sm text-negative">
          <IconAlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="app-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Your voice profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {voiceSamples.length}/10 samples. {voiceStrengthLabel(voiceSamples.length)}.
            </p>
          </div>
          <Button variant="outline" onClick={() => void runAnalysis()} disabled={analysing || voiceSamples.length === 0}>
            {analysing ? <IconLoader2 className="animate-spin" size={16} /> : <IconWand size={16} />}
            Analyse my writing style
          </Button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${strengthPercent}%` }} />
        </div>
      </section>

      <section className="app-card p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">Voice samples</h2>
        <p className="mt-1 text-sm text-muted-foreground">Paste LinkedIn posts you have written. Keep your strongest examples.</p>

        {voiceSamples.length === 0 ? (
          <EmptyState
            embedded
            className="mt-4 min-h-48 bg-stone-50"
            icon={<IconSparkles size={20} />}
            heading="No voice samples yet"
            description="Add a few posts you already like and the copilot will learn your rhythm, phrasing, and defaults."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {voiceSamples.map((sample, index) => (
              <div key={`${sample.slice(0, 24)}-${index}`} className="group relative rounded-lg border border-border bg-muted p-3 pr-10 text-sm text-foreground">
                {sample.slice(0, 260)}
                {sample.length > 260 ? '...' : ''}
                <button
                  type="button"
                  onClick={() => setVoiceSamples((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="absolute right-2 top-2 rounded-lg p-1 text-muted-foreground opacity-70 hover:bg-background hover:text-negative group-hover:opacity-100"
                  aria-label="Remove sample"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {voiceSamples.length < 10 && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field label="Add one sample">
              <TextArea value={newSample} onChange={(event) => setNewSample(event.target.value)} placeholder="Paste one LinkedIn post..." />
              <Button className="mt-3" variant="outline" onClick={addSample} disabled={!newSample.trim()}>
                <IconPlus size={16} />
                Add sample
              </Button>
            </Field>
            <Field label="Bulk import" description="Paste up to 5 posts separated by a line containing only three hyphens.">
              <TextArea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={"First post...\n\n---\n\nSecond post..."}
                className="font-mono text-sm"
              />
              <Button className="mt-3" variant="outline" onClick={importBulk} disabled={!bulkText.trim()}>
                Import posts
              </Button>
            </Field>
          </div>
        )}
      </section>

      <section className="app-card p-5">
        <h2 className="font-heading text-lg font-semibold text-foreground">Tone sliders</h2>
        <div className="mt-5 space-y-6">
          {VOICE_SLIDERS.map((slider) => (
            <Field key={slider.key} label={slider.label} description={slider.description}>
              <RangeInput
                value={sliders[slider.key]}
                onChange={(value) => setSliders((current) => ({ ...current, [slider.key]: value }))}
                leftLabel={slider.leftLabel}
                rightLabel={slider.rightLabel}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChipEditor
          title="Signature phrases"
          description="Words or phrases that are distinctly yours."
          placeholder="Here's the thing"
          items={signaturePhrases}
          onChange={setSignaturePhrases}
        />
        <ChipEditor
          title="Topics to avoid"
          description="Things you do not want the AI to bring into your posts."
          placeholder="Crypto"
          items={topicsToAvoid}
          onChange={setTopicsToAvoid}
          danger
        />
      </section>

      {(voiceSummary || analysis) && (
        <section className="app-card p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            <IconSparkles className="mr-2 inline" size={18} />
            AI analysis
          </h2>
          {voiceSummary && <p className="mt-3 text-sm leading-relaxed text-foreground">{voiceSummary}</p>}
          {aiAnalysis && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1">Hook: {aiAnalysis.hookStyle || 'varied'}</span>
              <span className="rounded-full bg-muted px-2.5 py-1">Rhythm: {aiAnalysis.sentenceStyle || 'varied'}</span>
            </div>
          )}
          {analysis && (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Average sentence</dt>
                <dd className="font-semibold text-foreground">{analysis.avgSentenceLength} words</dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Questions</dt>
                <dd className="font-semibold text-foreground">{analysis.usesQuestions ? 'Present' : 'Rare'}</dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Contractions</dt>
                <dd className="font-semibold text-foreground">{analysis.usesContractions ? 'Present' : 'Rare'}</dd>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <dt className="text-muted-foreground">Hook style</dt>
                <dd className="font-semibold capitalize text-foreground">{analysis.dominantHookStyle || 'varied'}</dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </div>
  )
}

function VoiceSkeleton() {
  return (
    <div className="app-page mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-72" />
      <Skeleton className="h-80" />
    </div>
  )
}

function ChipEditor({
  title,
  description,
  placeholder,
  items,
  onChange,
  danger,
}: {
  title: string
  description: string
  placeholder: string
  items: string[]
  onChange: (items: string[]) => void
  danger?: boolean
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const trimmed = draft.trim()
    if (!trimmed || items.length >= 10 || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setDraft('')
  }

  return (
    <section className="app-card p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(items.filter((current) => current !== item))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium',
                danger ? 'border-negative/30 text-negative' : 'border-border text-foreground',
              )}
            >
              {item} x
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <TextInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </section>
  )
}
