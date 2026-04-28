import { IconArticle, IconX } from '@tabler/icons-react'
import type { Article } from '@/lib/trend-detection'

interface ArticleContextCardProps {
  article: Article
  selectedAngle: string | null
  onRemove: () => void
}

export function ArticleContextCard({ article, selectedAngle, onRemove }: ArticleContextCardProps) {
  return (
    <div className="w-full flex items-start gap-3 px-4 py-3 bg-card border border-border rounded-lg mb-5">
      <IconArticle size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {article.sourceName && (
          <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
            {article.sourceName}
          </p>
        )}
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-1">
          {article.title}
        </p>
        {selectedAngle && (
          <p className="text-2xs text-muted-foreground mt-1 line-clamp-1">
            Angle: "{selectedAngle}"
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        aria-label="Remove article"
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
      >
        <IconX size={14} />
      </button>
    </div>
  )
}
