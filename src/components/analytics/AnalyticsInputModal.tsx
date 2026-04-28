import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck, IconLoader2, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { TextInput } from '@/components/ui/form-controls'
import { computePostSaveInsight } from '@/lib/analytics-insights'
import type { Draft } from '@/lib/drafts-types'
import { savePostAnalytics } from '@/lib/services/analytics-service'

interface AnalyticsInputModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: Draft | null
  followerCount: number | null
  onSaved: (insight: { draftId: string; message: string; color: string }) => void
}

interface AnalyticsForm {
  impressions: string
  reactions: string
  comments: string
  reposts: string
  saves: string
  membersReached: string
  linkedinPostUrl: string
}

const EMPTY_FORM: AnalyticsForm = {
  impressions: '',
  reactions: '',
  comments: '',
  reposts: '',
  saves: '',
  membersReached: '',
  linkedinPostUrl: '',
}

function parseNumber(value: string, fallback: number | null = null) {
  const normalized = value.replace(/,/g, '').trim()
  if (!normalized) return fallback
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function AnalyticsInputModal({
  open,
  onOpenChange,
  draft,
  followerCount,
  onSaved,
}: AnalyticsInputModalProps) {
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<AnalyticsForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || !draft) return
    setForm({
      impressions: draft.performance?.impressions != null ? String(draft.performance.impressions) : '',
      reactions: draft.performance ? String(draft.performance.reactions) : '',
      comments: draft.performance ? String(draft.performance.comments) : '',
      reposts: draft.performance ? String(draft.performance.reposts) : '',
      saves: draft.performance?.saves != null ? String(draft.performance.saves) : '',
      membersReached: draft.performance?.membersReached != null ? String(draft.performance.membersReached) : '',
      linkedinPostUrl: draft.performance?.linkedinPostUrl ?? '',
    })
    setError(null)
    setSavedMessage(null)
  }, [draft, open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onOpenChange, open])

  const title = useMemo(() => draft?.title || 'Untitled post', [draft])

  if (!mounted || !open || !draft) return null

  const update = (key: keyof AnalyticsForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const impressions = parseNumber(form.impressions)
      await savePostAnalytics({
        draftId: draft.id,
        linkedinPostUrl: form.linkedinPostUrl.trim() || null,
        impressions,
        reactions: parseNumber(form.reactions, 0) ?? 0,
        comments: parseNumber(form.comments, 0) ?? 0,
        reposts: parseNumber(form.reposts, 0) ?? 0,
        saves: parseNumber(form.saves),
        membersReached: parseNumber(form.membersReached),
        followerCountAtPost: followerCount,
        audienceDemographics: draft.performance?.audienceDemographics ?? null,
        publishedDateFromAnalytics: null,
      })

      const insight = computePostSaveInsight(impressions)
      onSaved({ draftId: draft.id, message: insight.message, color: insight.color })
      setSavedMessage(insight.message)
      window.setTimeout(() => onOpenChange(false), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analytics could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/30 px-4 py-6"
      onClick={() => onOpenChange(false)}
      aria-modal="true"
      role="dialog"
    >
      <div className="app-card w-full max-w-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="app-page-title">{draft.hasPerformanceData ? 'Update analytics' : 'Add analytics'}</h2>
            <p className="app-page-description truncate">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close analytics modal"
          >
            <IconX size={16} />
          </button>
        </div>

        {savedMessage ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-positive">
            <div className="flex items-center gap-2">
              <IconCheck size={16} />
              {savedMessage}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Impressions" value={form.impressions} onChange={(value) => update('impressions', value)} />
              <Field label="Reactions" value={form.reactions} onChange={(value) => update('reactions', value)} />
              <Field label="Comments" value={form.comments} onChange={(value) => update('comments', value)} />
              <Field label="Reposts" value={form.reposts} onChange={(value) => update('reposts', value)} />
              <Field label="Saves" value={form.saves} onChange={(value) => update('saves', value)} />
              <Field label="Members reached" value={form.membersReached} onChange={(value) => update('membersReached', value)} />
            </div>

            <div className="mt-3">
              <Field label="LinkedIn URL" value={form.linkedinPostUrl} onChange={(value) => update('linkedinPostUrl', value)} placeholder="https://www.linkedin.com/feed/update/..." />
            </div>

            {error && <p className="mt-3 text-sm text-negative">{error}</p>}

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? <IconLoader2 className="animate-spin" size={16} /> : <IconCheck size={16} />}
                Save analytics
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder = '0',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      <TextInput value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
