import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/form-controls'
import { ToggleSwitch } from '@/components/ui/toggle-switch'

interface JoinCircleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoin: (code: string, shareScore: boolean, shareImpressions: boolean) => Promise<boolean>
}

export function JoinCircleDialog({ open, onOpenChange, onJoin }: JoinCircleDialogProps) {
  const [code, setCode] = useState('')
  const [shareScore, setShareScore] = useState(false)
  const [shareImpressions, setShareImpressions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const close = () => {
    setCode('')
    setShareScore(false)
    setShareImpressions(false)
    setError(null)
    onOpenChange(false)
  }

  const join = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    const success = await onJoin(code.trim().toUpperCase(), shareScore, shareImpressions)
    setLoading(false)

    if (success) {
      close()
      return
    }

    setError('That code did not work. Check it is correct and that the circle is not full.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 px-4">
      <div className="app-card w-full max-w-md bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-stone-900">Join a circle</h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              Enter the invite code and choose what your circle can see.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
            onClick={close}
            aria-label="Close"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="space-y-5">
          <Field label="Invite code">
            <TextInput
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void join()
              }}
              placeholder="A3KF7N2X"
              maxLength={8}
              className="font-mono tracking-widest uppercase"
              autoFocus
            />
          </Field>

          <div className="rounded-lg border border-border bg-stone-50 p-4">
            <p className="text-sm leading-relaxed text-stone-600">
              Posting frequency and streak are always visible.
            </p>
            <div className="mt-4 space-y-3">
              <ToggleRow
                label="Share my LinkedIn score"
                description="Let members see your current score."
                checked={shareScore}
                onCheckedChange={setShareScore}
              />
              <ToggleRow
                label="Share my impressions"
                description="Let members see recent audience reach."
                checked={shareImpressions}
                onCheckedChange={setShareImpressions}
              />
            </div>
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={() => void join()} disabled={loading || !code.trim()}>
              {loading ? 'Joining...' : 'Join circle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-stone-800">{label}</p>
        <p className="mt-0.5 text-xs text-stone-500">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onCheckedChange={onCheckedChange} label={label} />
    </div>
  )
}
