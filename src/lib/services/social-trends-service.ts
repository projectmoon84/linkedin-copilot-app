import { supabase } from '@/lib/supabase'

export interface SamplePost {
  title: string
  url: string
  source: 'reddit' | 'hackernews' | 'twitter'
  score: number
  subreddit?: string
}

export interface SocialTrendingTopic {
  id: string
  topic: string
  description: string | null
  sources: string[]
  trendingScore: number
  audienceFitScore: number
  trendingReason: string | null
  audienceFitReason: string | null
  postAngle: string | null
  mentionCount: number
  samplePosts: SamplePost[]
  scrapedAt: string
  weekOf: string | null
}

export interface ScrapeResult {
  success: boolean
  message: string
  topicsFound?: number
}

function mapTopic(row: any): SocialTrendingTopic {
  return {
    id: row.id,
    topic: row.topic,
    description: row.description ?? null,
    sources: row.sources ?? [],
    trendingScore: row.trending_score ?? 0,
    audienceFitScore: row.audience_fit_score ?? 0,
    trendingReason: row.trending_reason ?? null,
    audienceFitReason: row.audience_fit_reason ?? null,
    postAngle: row.post_angle ?? null,
    mentionCount: row.mention_count ?? 0,
    samplePosts: row.sample_posts ?? [],
    scrapedAt: row.scraped_at,
    weekOf: row.week_of ?? null,
  }
}

export async function fetchSocialTrendingTopics(options?: {
  limit?: number
  minAudienceFit?: number
}): Promise<SocialTrendingTopic[]> {
  const { limit = 10, minAudienceFit = 1 } = options || {}

  const { data: latest } = await (supabase.from('social_trending_topics') as any)
    .select('week_of')
    .order('week_of', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latest?.week_of) return []

  const { data, error } = await (supabase.from('social_trending_topics') as any)
    .select('*')
    .eq('week_of', latest.week_of)
    .gte('audience_fit_score', minAudienceFit)
    .order('audience_fit_score', { ascending: false })
    .order('trending_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching social trends:', error)
    return []
  }

  return (data || []).map(mapTopic)
}

export async function triggerSocialTrendsScrape(): Promise<ScrapeResult> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-social-trends', { body: {} })
    if (error) return { success: false, message: error.message || 'Social pulse refresh failed.' }
    if (data?.success) {
      return {
        success: true,
        topicsFound: data.topicsFound,
        message: `Found ${data.topicsFound ?? 0} trending topics.`,
      }
    }
    return { success: false, message: data?.error || 'Social pulse refresh failed.' }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Social pulse refresh failed.' }
  }
}

export function formatWeekOf(weekOf: string | null): string {
  if (!weekOf) return ''
  return `Week of ${new Date(weekOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}
