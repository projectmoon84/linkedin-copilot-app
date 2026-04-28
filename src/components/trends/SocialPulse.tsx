import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconExternalLink, IconFlame, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import type { SocialTrendingTopic } from '@/lib/services/social-trends-service'
import { formatWeekOf } from '@/lib/services/social-trends-service'
import { cn } from '@/lib/utils'

interface SocialPulseProps {
  topics: SocialTrendingTopic[]
  loading?: boolean
  refreshing?: boolean
  onRefresh: () => void
  onTopicSelect: (topic: string) => void
}

function fitLabel(score: number) {
  if (score >= 8) return { label: 'Strong fit', className: 'bg-emerald-50 text-positive' }
  if (score >= 5) return { label: 'Good fit', className: 'bg-sky-50 text-chart-primary' }
  return { label: 'Low fit', className: 'bg-stone-100 text-stone-500' }
}

function sourceLabel(source: string) {
  if (source === 'hackernews') return 'HN'
  if (source === 'twitter') return 'X'
  return source.charAt(0).toUpperCase() + source.slice(1)
}

export function SocialPulse({ topics, loading, refreshing, onRefresh, onTopicSelect }: SocialPulseProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleTopics = expanded ? topics : topics.slice(0, 4)

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <IconFlame size={18} className="text-warning" />
              <h2 className="app-page-title">Trending topics and post ideas</h2>
            </div>
            <p className="text-sm text-stone-500">What is hot right now, with angles tuned to your audience.</p>
            {topics[0]?.weekOf && <p className="mt-1 text-xs text-stone-400">{formatWeekOf(topics[0].weekOf)}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <IconRefresh className={refreshing ? 'animate-spin' : undefined} size={15} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="grid gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-56" />)}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState
            embedded
            className="min-h-48"
            icon={<IconFlame size={20} />}
            heading="No social pulse yet"
            description="Refresh social trends once the scraper is deployed."
            action={{ label: 'Refresh', onClick: onRefresh }}
          />
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-4">
              {visibleTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} onTopicSelect={onTopicSelect} />
              ))}
            </div>
            {topics.length > 4 && (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => setExpanded((current) => !current)}>
                  {expanded ? 'Show fewer' : 'See all'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function TopicCard({ topic, onTopicSelect }: { topic: SocialTrendingTopic; onTopicSelect: (topic: string) => void }) {
  const navigate = useNavigate()
  const fit = fitLabel(topic.audienceFitScore)

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold leading-tight text-stone-900">{topic.topic}</h3>
        <span className={cn('app-chip shrink-0', fit.className)}>{fit.label}</span>
      </div>
      {topic.trendingReason && (
        <p className="text-sm leading-relaxed text-stone-600"><strong>Trending because:</strong> {topic.trendingReason}</p>
      )}
      {topic.postAngle && (
        <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm italic leading-relaxed text-stone-600">Your angle: {topic.postAngle}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {topic.sources.map((source) => <span key={source} className="app-chip bg-stone-100 text-stone-500">{sourceLabel(source)}</span>)}
      </div>
      {topic.samplePosts.length > 0 && (
        <div className="mt-3 space-y-2">
          {topic.samplePosts.slice(0, 2).map((post) => (
            <a key={post.url} href={post.url} target="_blank" rel="noreferrer" className="flex gap-2 text-xs leading-snug text-stone-500 hover:text-stone-900">
              <IconExternalLink size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{post.title}</span>
            </a>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => navigate(`/compose?topic=${encodeURIComponent(topic.postAngle || topic.topic)}`)}>Write about this →</Button>
        <Button variant="ghost" size="sm" onClick={() => onTopicSelect(topic.topic)}>Filter</Button>
      </div>
    </article>
  )
}
