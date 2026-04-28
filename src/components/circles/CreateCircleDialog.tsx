import { useState } from 'react'
import { IconCheck, IconCopy, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/form-controls'

interface CreateCircleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<{ circleId: string; inviteCode: string } | null>
}

export function CreateCircleDialog({ open, onOpenChange, onCreate }: CreateCircleDialogProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ circleId: string; inviteCode: string } | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const close = () => {
    setName('')
    setError(null)
    setResult(null)
    setCopied(false)
    onOpenChange(false)
  }

  const create = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    const nextResult = await onCreate(name.trim())
    setLoading(false)

    if (!nextResult) {
      setError('That circle could not be created. You may already be at the limit.')
      return
    }

    setResult(nextResult)
  }

  const copyCode = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 px-4">
      <div className="app-card w-full max-w-md bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-stone-900">
              {result ? 'Circle created' : 'Create a circle'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-stone-500">
              {result
                ? 'Share this code with up to 4 friends or colleagues.'
                : 'Choose a name your people will recognise.'}
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

        {result ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-stone-50 p-4">
              <span className="flex-1 font-mono text-2xl font-semibold tracking-widest text-stone-900">
                {result.inviteCode}
              </span>
              <Button variant="outline" onClick={() => void copyCode()}>
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <Field label="Circle name">
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void create()
                }}
                placeholder="Design Leaders"
                maxLength={60}
                autoFocus
              />
            </Field>
            {error && <p className="text-sm text-negative">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button onClick={() => void create()} disabled={loading || !name.trim()}>
                {loading ? 'Creating...' : 'Create circle'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
