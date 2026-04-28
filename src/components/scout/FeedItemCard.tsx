import { useState } from 'react'
import {
  IconArrowUpRight,
  IconBookmark,
  IconBookmarkFilled,
  IconBrandReddit,
  IconMessageCircle,
  IconPencil,
  IconRss,
  IconX,
} from '@tabler/icons-react'
import { setItemBookmarked, setItemHidden, type FeedItem } from '@/lib/services/feed-service'

interface FeedItemCardProps {
  item: FeedItem
  onHide: (id: string) => void
  onBookmarkChange?: (id: string, bookmarked: boolean) => void
  onWriteAboutThis?: (item: FeedItem) => void
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function FeedItemCard({ item, onHide, onBookmarkChange, onWriteAboutThis }: FeedItemCardProps) {
  const [bookmarked, setBookmarked] = useState(item.is_bookmarked)
  const [bookmarkPending, setBookmarkPending] = useState(false)
  const isReddit = item.feed_sources?.source_type === 'reddit'

  const handleBookmark = async () => {
    if (bookmarkPending) return
    setBookmarkPending(true)
    const next = !bookmarked
    setBookmarked(next)
    try {
      await setItemBookmarked(item.id, next)
      onBookmarkChange?.(item.id, next)
    } catch {
      setBookmarked(!next) // revert on error
    } finally {
      setBookmarkPending(false)
    }
  }

  const handleHide = async () => {
    await setItemHidden(item.id)
    onHide(item.id)
  }

  return (
    <div className="group flex flex-col gap-2 rounded-xl border border-border bg-white px-4 py-3.5 transition-shadow hover:shadow-sm">
      {/* Header row: source + time + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-400">
          {isReddit ? (
            <IconBrandReddit size={13} className="text-orange-400" />
          ) : (
            <IconRss size={13} className="text-amber-400" />
          )}
          <span className="font-medium text-stone-500">{item.feed_sources?.title ?? 'Unknown'}</span>
          {item.published_at && (
            <>
              <span>·</span>
              <span>{formatRelativeTime(item.published_at)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            onClick={() => void handleBookmark()}
            className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            {bookmarked
              ? <IconBookmarkFilled size={14} className="text-indigo-500" />
              : <IconBookmark size={14} />
            }
          </button>
          <button
            type="button"
            title="Hide this item"
            onClick={() => void handleHide()}
            className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-1 font-semibold leading-snug text-stone-900 hover:text-indigo-600"
      >
        <span>{item.title}</span>
        <IconArrowUpRight size={14} className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
      </a>

      {/* Excerpt */}
      {item.description && (
        <p className="line-clamp-2 text-sm text-stone-500">{item.description}</p>
      )}

      {/* Reddit engagement stats */}
      {isReddit && item.reddit_score != null && (
        <div className="flex items-center gap-4 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M6 0L8.2 4.4 13 5.1 9.5 8.5 10.4 13.3 6 11 1.6 13.3 2.5 8.5 -1 5.1 3.8 4.4Z" />
            </svg>
            {formatScore(item.reddit_score)}
          </span>
          {item.reddit_num_comments != null && (
            <span className="flex items-center gap-1">
              <IconMessageCircle size={12} />
              {formatScore(item.reddit_num_comments)}
            </span>
          )}
          {item.reddit_upvote_ratio != null && (
            <span>{Math.round(item.reddit_upvote_ratio * 100)}% upvoted</span>
          )}
        </div>
      )}

      {/* Categories / flair */}
      {item.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.categories.slice(0, 3).map((cat) => (
            <span key={cat} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Write about this */}
      {onWriteAboutThis && (
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={() => onWriteAboutThis(item)}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <IconPencil size={12} />
            Write about this
          </button>
        </div>
      )}
    </div>
  )
}
