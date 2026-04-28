import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconChartBar } from '@tabler/icons-react'
import type { RecentPost } from '@/lib/services/draft-service'

interface RecentPostsCardProps {
  posts: RecentPost[]
  loading?: boolean
}

function getTitle(post: RecentPost) {
  const firstLine = post.content.split('\n').find((line) => line.trim())
  return firstLine?.slice(0, 140) || 'Untitled post'
}

function formatDate(date: string | null) {
  if (!date) return 'Unpublished'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function engagementRate(post: RecentPost) {
  if (!post.impressions) return null
  const engagement = (post.reactions ?? 0) + (post.comments ?? 0) + (post.reposts ?? 0)
  return (engagement / post.impressions) * 100
}

function purposeClass(purpose: string | null) {
  if (purpose === 'discovery' || purpose === 'trust' || purpose === 'authority') return purpose
  return 'trust'
}

export function RecentPostsCard({ posts, loading }: RecentPostsCardProps) {
  const navigate = useNavigate()
  const averageImpressions = useMemo(() => {
    const withImpressions = posts.filter((post) => post.impressions != null)
    if (withImpressions.length === 0) return null
    return withImpressions.reduce((sum, post) => sum + (post.impressions ?? 0), 0) / withImpressions.length
  }, [posts])

  if (loading) {
    return (
      <div className="app-card">
        <div className="home-posts-inner">
          <div className="app-card-title">Recent posts</div>
          <p className="mt-3 text-sm text-stone-400">Loading performance context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-card">
      <div className="home-posts-inner">
        <div className="mb-3 flex items-center justify-between">
          <div className="app-card-title">Recent posts</div>
          <span className="text-2xs text-stone-400">With performance context</span>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-stone-500">Publish your first post and it will appear here.</p>
        ) : (
          posts.map((post) => {
            const aboveAverage = averageImpressions != null && post.impressions != null && post.impressions >= averageImpressions
            const rate = engagementRate(post)
            const hasAnalytics = post.impressions != null

            return (
              <article key={post.id} className="home-post-row">
                <div className="home-post-body">
                  <div className="home-post-text">{getTitle(post)}</div>
                  <div className="home-post-meta">
                    <span className={`app-purpose-pill ${purposeClass(post.strategicPurpose)}`}>
                      {post.strategicPurpose || 'Trust'}
                    </span>
                    <span className="home-post-time">{formatDate(post.publishedAt)}</span>
                    {hasAnalytics ? (
                      <span className={`home-perf-signal ${aboveAverage ? 'above' : 'below'}`}>
                        {aboveAverage ? '↑ Above your avg' : '↓ Below your avg'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/posts?highlight=${post.id}`)}
                        className="home-perf-signal avg inline-flex items-center gap-1"
                      >
                        <IconChartBar size={12} />
                        Add analytics
                      </button>
                    )}
                  </div>
                </div>
                <div className="home-post-stats">
                  <div>
                    <div className="home-post-stat-val">{post.impressions != null ? post.impressions.toLocaleString() : '--'}</div>
                    <div className="home-post-stat-label">impressions</div>
                  </div>
                  <div>
                    <div className="home-post-stat-val">{rate != null ? `${rate.toFixed(1)}%` : '--'}</div>
                    <div className="home-post-stat-label">engagement</div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
