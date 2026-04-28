import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBookmark, IconBookmarkFilled, IconPencil } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime, type Article } from '@/lib/trend-detection'

interface TrendingNowProps {
  articles: Article[]
  loading?: boolean
}

const STORAGE_KEY = 'bookmarked-article-ids'

function readBookmarks(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

export function TrendingNow({ articles, loading }: TrendingNowProps) {
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<string[]>(readBookmarks)
  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks])

  const toggleBookmark = (articleId: string) => {
    setBookmarks((current) => {
      const next = current.includes(articleId)
        ? current.filter((id) => id !== articleId)
        : [...current, articleId]

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Trending now</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </section>
    )
  }

  if (articles.length === 0) return null

  return (
    <section className="space-y-3" aria-label="Trending now">
      <h2 className="font-heading text-lg font-semibold text-foreground">Trending now</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {articles.map((article) => {
          const bookmarked = bookmarkSet.has(article.id)
          return (
            <article key={article.id} className="app-card flex min-h-52 flex-col p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-2xs font-semibold text-muted-foreground">{article.sourceName}</span>
                <span className="shrink-0 text-2xs text-muted-foreground">{formatRelativeTime(article.publishedAt)}</span>
              </div>
              <h3 className="mt-3 line-clamp-3 text-sm font-semibold leading-snug text-foreground">{article.title}</h3>
              {article.summary && <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{article.summary}</p>}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => toggleBookmark(article.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {bookmarked ? <IconBookmarkFilled size={15} /> : <IconBookmark size={15} />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/compose?article=${article.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <IconPencil size={15} />
                  Write about this
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
