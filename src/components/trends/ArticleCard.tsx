import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowUpRight, IconBookmark, IconBookmarkFilled, IconPencil } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { prefetchArticleContent } from '@/lib/services/article-service'
import type { Article } from '@/lib/trend-detection'
import { formatRelativeTime } from '@/lib/trend-detection'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  article: Article
  relevance: number
  saved: boolean
  onToggleSaved: (articleId: string) => void
  onTopicClick: (topic: string) => void
  onBrandClick: (brand: string) => void
}

function relevanceMeta(score: number) {
  if (score >= 0.7) return { label: 'Strong fit', className: 'bg-positive', textClassName: 'text-positive' }
  if (score >= 0.4) return { label: 'Good fit', className: 'bg-warning', textClassName: 'text-warning' }
  return { label: 'Light fit', className: 'bg-stone-300', textClassName: 'text-stone-500' }
}

export function ArticleCard({ article, relevance, saved, onToggleSaved, onTopicClick, onBrandClick }: ArticleCardProps) {
  const navigate = useNavigate()
  const [contentWarmed, setContentWarmed] = useState(false)
  const meta = relevanceMeta(relevance)
  const rating = Math.round(relevance * 100)
  const visibleTopics = article.detectedTopics.slice(0, 4)
  const visibleBrands = article.detectedBrands.slice(0, 3)

  const warmArticleContent = () => {
    if (contentWarmed) return
    setContentWarmed(true)
    prefetchArticleContent(article.url)
  }

  const handleWrite = () => {
    warmArticleContent()
    navigate(`/compose?article=${article.id}`)
  }

  return (
    <article className="app-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={cn('size-2 rounded-full', meta.className)} />
            <span className="text-2xs text-stone-400">{article.sourceName}</span>
            <span className="text-2xs text-stone-300">·</span>
            <span className="text-2xs text-stone-400">{formatRelativeTime(article.publishedAt || article.fetchedAt)}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={warmArticleContent}
            className="group/title inline-flex items-start gap-1 font-heading text-lg font-semibold leading-tight text-stone-900 transition-colors hover:text-indigo-600"
          >
            <span>{article.title}</span>
            <IconArrowUpRight size={16} className="mt-0.5 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
          </a>
          {article.summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">{article.summary}</p>}
        </div>
        <button
          type="button"
          onClick={() => onToggleSaved(article.id)}
          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-900"
          aria-label={saved ? 'Remove bookmark' : 'Save article'}
        >
          {saved ? <IconBookmarkFilled size={18} className="text-warning" /> : <IconBookmark size={18} />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={cn('app-chip bg-stone-100 font-semibold', meta.textClassName)}>
          {rating}% {meta.label}
        </span>
        {visibleTopics.map((topic) => (
          <button key={topic} type="button" className="app-chip bg-stone-100 text-stone-500 hover:bg-stone-200" onClick={() => onTopicClick(topic)}>
            {topic}
          </button>
        ))}
        {visibleBrands.map((brand) => (
          <button key={brand.name} type="button" className="app-chip bg-sky-50 text-chart-primary" onClick={() => onBrandClick(brand.name)}>
            {brand.name}
          </button>
        ))}
        {visibleTopics.length === 0 && visibleBrands.length === 0 && article.category && (
          <span className="app-chip bg-stone-100 text-stone-500">{article.category}</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" onMouseEnter={warmArticleContent} onClick={handleWrite}>
          <IconPencil size={14} />
          Write from this
        </Button>
        <span className="text-xs text-stone-400">Opens the article context in Composer.</span>
      </div>
    </article>
  )
}
