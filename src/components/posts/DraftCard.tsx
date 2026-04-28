import { IconCheck, IconCopy, IconLoader2, IconPencil, IconSend, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { Draft } from '@/lib/drafts-types'
import { PURPOSE_LABELS } from '@/lib/drafts-types'
import { formatRelativeTime } from '@/lib/trend-detection'

interface DraftCardProps {
  draft: Draft
  copiedId: string | null
  deletingId: string | null
  publishingId: string | null
  onEdit: (draftId: string) => void
  onCopy: (draft: Draft) => void
  onDelete: (draftId: string) => void
  onPublish: (draftId: string) => void
}

export function DraftCard({
  draft,
  copiedId,
  deletingId,
  publishingId,
  onEdit,
  onCopy,
  onDelete,
  onPublish,
}: DraftCardProps) {
  return (
    <article className="app-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-2xs text-stone-400">{formatRelativeTime(draft.updatedAt)}</span>
            {draft.strategicPurpose && (
              <span className={`app-purpose-pill ${draft.strategicPurpose}`}>
                {PURPOSE_LABELS[draft.strategicPurpose]}
              </span>
            )}
          </div>
          <h2 className="app-card-title line-clamp-1">{draft.title || 'Untitled draft'}</h2>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-500">
        {draft.content}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(draft.id)}>
          <IconPencil size={14} />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onCopy(draft)}>
          {copiedId === draft.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copiedId === draft.id ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPublish(draft.id)} disabled={publishingId === draft.id}>
          {publishingId === draft.id ? <IconLoader2 className="animate-spin" size={14} /> : <IconSend size={14} />}
          Mark published
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(draft.id)}
          disabled={deletingId === draft.id}
          aria-label="Delete draft"
          className="ml-auto text-stone-400 hover:text-negative"
        >
          {deletingId === draft.id ? <IconLoader2 className="animate-spin" size={14} /> : <IconTrash size={14} />}
        </Button>
      </div>
    </article>
  )
}
