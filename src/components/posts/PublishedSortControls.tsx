import { IconArrowsSort } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { PublishedSort } from '@/lib/drafts-types'

interface PublishedSortControlsProps {
  currentSort: PublishedSort
  onSortChange: (sort: PublishedSort) => void
}

const SORT_OPTIONS: [PublishedSort, string][] = [
  ['date', 'Date'],
  ['impressions', 'Impressions'],
  ['reactions', 'Reactions'],
  ['comments', 'Comments'],
  ['engagement', 'Engagement'],
]

export function PublishedSortControls({ currentSort, onSortChange }: PublishedSortControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconArrowsSort size={16} className="text-stone-400" />
      {SORT_OPTIONS.map(([key, label]) => (
        <Button
          key={key}
          variant={currentSort === key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSortChange(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
