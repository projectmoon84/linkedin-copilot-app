import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheck, IconClock, IconFlame, IconPencil } from '@tabler/icons-react'
import type { NextPostSuggestion, PostingStats, CadenceRecommendation } from '@/lib/cadence-engine'
import type { Article } from '@/lib/trend-detection'

interface WeekProgressProps {
  stats: PostingStats | null
  recommendation: CadenceRecommendation | null
  nextPost: NextPostSuggestion | null
  trendingArticles: Article[]
}

const purposeLabels = {
  discovery: 'Discovery',
  trust: 'Trust',
  authority: 'Authority',
}

export function WeekProgress({ stats, recommendation, nextPost, trendingArticles }: WeekProgressProps) {
  const navigate = useNavigate()
  const [showTrending, setShowTrending] = useState(false)
  const done = stats?.totalThisWeek ?? 0
  const target = Math.max(1, Math.round(recommendation?.postsPerWeek ?? 1))
  const remaining = Math.max(0, target - done)
  const progress = Math.min(100, (done / target) * 100)
  const suggestedPurpose = nextPost?.purpose || 'trust'
  const completedItems = Math.min(done, target)

  return (
    <div className="app-card home-your-week">
      <div className="home-your-week-inner">
        <div className="home-your-week-header">
          <div className="home-your-week-title">Your week</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-positive">
              {completedItems} of {target} done
            </span>
            <IconClock size={14} className="text-stone-400" />
          </div>
        </div>

        <div className="home-week-progress-row">
          <div className="home-week-progress-track">
            <div className="home-week-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="home-week-progress-label">{Math.round(progress)}%</span>
        </div>

        <div className="home-checklist">
          {Array.from({ length: completedItems }).map((_, index) => {
            const purpose = index === 0 ? 'discovery' : index === 1 ? 'trust' : 'trust'
            return (
              <div className="home-check-item" key={`${purpose}-${index}`}>
                <div className="home-check-box done">
                  <IconCheck size={12} stroke={2.5} />
                </div>
                <div className="home-check-body">
                  <div className="home-check-label done">Write a {purposeLabels[purpose]} post</div>
                  <div className="home-check-meta">Published this week</div>
                </div>
              </div>
            )
          })}

          {dataAnalyticsRow(done)}

          {remaining > 0 && (
            <div className="home-check-item">
              <div className="home-check-box" />
              <div className="home-check-body">
                <div className="home-check-label">Write a {purposeLabels[suggestedPurpose]} post</div>
                <div className="home-check-meta">
                  {nextPost?.reason || `You have ${remaining} post${remaining === 1 ? '' : 's'} left this week.`}
                </div>
                {showTrending && trendingArticles.length > 0 && (
                  <div className="home-trending-peek">
                    <div className="mb-2 text-2xs font-semibold uppercase text-stone-500">Trending in your space</div>
                    {trendingArticles.slice(0, 3).map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        className="home-trending-article w-full text-left"
                        onClick={() => navigate(`/compose?article=${article.id}`)}
                      >
                        <div className="home-trending-dot" />
                        <div className="home-trending-text">{article.title}</div>
                        <div className="home-trending-topic">{article.detectedTopics[0] || article.sourceName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="home-check-actions">
                <button type="button" className="app-btn app-btn-primary app-btn-size-sm" onClick={() => navigate('/compose')}>
                  <IconPencil size={14} />
                  Write a post
                </button>
                <button type="button" className="app-btn app-btn-secondary app-btn-size-sm" onClick={() => setShowTrending((current) => !current)}>
                  <IconFlame size={14} />
                  What's trending
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function dataAnalyticsRow(done: number) {
  if (done === 0) return null

  return (
    <div className="home-check-item">
      <div className="home-check-box done">
        <IconCheck size={12} stroke={2.5} />
      </div>
      <div className="home-check-body">
        <div className="home-check-label done">Import analytics</div>
        <div className="home-check-meta">Updated from your latest reportable posts</div>
      </div>
    </div>
  )
}
