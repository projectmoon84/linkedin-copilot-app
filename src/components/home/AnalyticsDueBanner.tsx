import { useNavigate } from 'react-router-dom'
import { IconArrowRight } from '@tabler/icons-react'
import type { AnalyticsDuePost } from '@/lib/useAnalyticsDuePosts'

interface AnalyticsDueBannerProps {
  posts: AnalyticsDuePost[]
}

export function AnalyticsDueBanner({ posts }: AnalyticsDueBannerProps) {
  const navigate = useNavigate()

  if (posts.length === 0) return null

  const post = posts[0]

  return (
    <button
      type="button"
      onClick={() => navigate(`/posts?highlight=${post.id}`)}
      className="app-card sticky top-16 z-30 flex w-full items-center justify-between gap-3 p-3 text-left"
      style={{
        borderColor: 'color-mix(in srgb, var(--color-warning) 35%, var(--color-border))',
        color: 'var(--color-warning)',
      }}
    >
      <span className="text-sm font-semibold">
        {posts.length} {posts.length === 1 ? 'post is' : 'posts are'} ready for analytics
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold">
        Add now
        <IconArrowRight size={16} />
      </span>
    </button>
  )
}
