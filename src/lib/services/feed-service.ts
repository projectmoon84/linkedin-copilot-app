import { supabase } from '@/lib/supabase'
import type { RedditDetected, RssDetected } from '@/lib/feed-url-detector'

export interface FeedSource {
  id: string
  display_url: string
  fetch_url: string
  source_type: 'reddit' | 'rss'
  title: string
  subreddit: string | null
  reddit_sort: RedditDetected['sort'] | null
  reddit_time_filter: RedditDetected['timeFilter']
  category: string | null
  fetch_interval_minutes: number
  last_fetched_at: string | null
  last_error: string | null
  next_fetch_at: string | null
  is_active: boolean
  created_at: string
}

export interface FeedItem {
  id: string
  feed_source_id: string | null
  title: string
  link: string
  description: string | null
  author: string | null
  published_at: string | null
  fetched_at: string | null
  reddit_score: number | null
  reddit_num_comments: number | null
  reddit_upvote_ratio: number | null
  engagement_score: number | null
  is_bookmarked: boolean
  is_hidden: boolean
  categories: string[]
  feed_sources: Pick<FeedSource, 'title' | 'source_type' | 'subreddit'> | null
}

export type FeedSourceUpdate = Partial<
  Pick<FeedSource, 'title' | 'display_url' | 'fetch_url' | 'category' | 'is_active'>
>

type ContentSourceRow = {
  id: string
  name: string
  url: string
  category: string | null
  is_active: boolean | null
  created_at: string
}

type ArticleFeedRow = {
  id: string
  source_id: string | null
  title: string
  url: string
  summary: string | null
  author: string | null
  published_at: string | null
  fetched_at: string | null
  content_sources: {
    name: string | null
    category: string | null
    url: string | null
  } | null
}

const BOOKMARKED_KEY = 'scout-feed-bookmarked-items'
const HIDDEN_KEY = 'scout-feed-hidden-items'

// Default polling intervals (minutes) by source type. These are UI hints when
// content_sources is used as the backing table.
const DEFAULT_INTERVAL: Record<string, number> = {
  reddit_top: 120,
  reddit_new: 45,
  reddit_rising: 45,
  rss_blog: 360,
}

function defaultInterval(sourceType: 'reddit' | 'rss', sort?: string | null): number {
  if (sourceType === 'reddit') {
    return DEFAULT_INTERVAL[`reddit_${sort ?? 'top'}`] ?? 120
  }
  return DEFAULT_INTERVAL.rss_blog
}

function getStoredIds(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [])
  } catch {
    return new Set()
  }
}

function setStoredIds(key: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify([...ids]))
}

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

function redditMetadataFromUrl(rawUrl: string): Pick<
  FeedSource,
  'source_type' | 'subreddit' | 'reddit_sort' | 'reddit_time_filter' | 'display_url'
> {
  try {
    const url = new URL(normaliseUrl(rawUrl))
    if (!url.hostname.includes('reddit.com')) {
      return {
        source_type: 'rss',
        subreddit: null,
        reddit_sort: null,
        reddit_time_filter: null,
        display_url: rawUrl,
      }
    }

    const parts = url.pathname.split('/').filter(Boolean)
    const subredditIndex = parts.findIndex((part) => part.toLowerCase() === 'r')
    const subreddit = subredditIndex >= 0 ? parts[subredditIndex + 1] : null
    const sortRaw = subredditIndex >= 0 ? parts[subredditIndex + 2]?.toLowerCase() : null
    const redditSort: RedditDetected['sort'] =
      sortRaw === 'new' ? 'new' : sortRaw === 'rising' ? 'rising' : 'top'
    const timeFilter = redditSort === 'top'
      ? ((url.searchParams.get('t') as RedditDetected['timeFilter']) || 'week')
      : null

    return {
      source_type: 'reddit',
      subreddit,
      reddit_sort: redditSort,
      reddit_time_filter: timeFilter,
      display_url: subreddit ? `reddit.com/r/${subreddit}` : rawUrl,
    }
  } catch {
    return {
      source_type: rawUrl.toLowerCase().includes('reddit.com') ? 'reddit' : 'rss',
      subreddit: null,
      reddit_sort: null,
      reddit_time_filter: null,
      display_url: rawUrl,
    }
  }
}

function redditRssUrl(detected: RedditDetected): string {
  const base = `https://www.reddit.com/r/${detected.subreddit}/${detected.sort}/.rss`
  return detected.sort === 'top' && detected.timeFilter
    ? `${base}?t=${detected.timeFilter}`
    : base
}

function mapContentSource(row: ContentSourceRow): FeedSource {
  const reddit = redditMetadataFromUrl(row.url)
  const title = row.name || (reddit.subreddit ? `r/${reddit.subreddit}` : row.url)

  return {
    id: row.id,
    display_url: reddit.display_url,
    fetch_url: row.url,
    source_type: reddit.source_type,
    title,
    subreddit: reddit.subreddit,
    reddit_sort: reddit.reddit_sort,
    reddit_time_filter: reddit.reddit_time_filter,
    category: row.category,
    fetch_interval_minutes: defaultInterval(reddit.source_type, reddit.reddit_sort),
    last_fetched_at: null,
    last_error: null,
    next_fetch_at: null,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
  }
}

function mapArticleToFeedItem(row: ArticleFeedRow, bookmarkedIds: Set<string>, hiddenIds: Set<string>): FeedItem {
  const sourceUrl = row.content_sources?.url ?? ''
  const reddit = redditMetadataFromUrl(sourceUrl)
  const category = row.content_sources?.category

  return {
    id: row.id,
    feed_source_id: row.source_id,
    title: row.title,
    link: row.url,
    description: row.summary,
    author: row.author,
    published_at: row.published_at,
    fetched_at: row.fetched_at,
    reddit_score: null,
    reddit_num_comments: null,
    reddit_upvote_ratio: null,
    engagement_score: null,
    is_bookmarked: bookmarkedIds.has(row.id),
    is_hidden: hiddenIds.has(row.id),
    categories: category ? [category] : [],
    feed_sources: {
      title: row.content_sources?.name || (reddit.subreddit ? `r/${reddit.subreddit}` : 'Unknown'),
      source_type: reddit.source_type,
      subreddit: reddit.subreddit,
    },
  }
}

// ----- Feed sources -----

export async function fetchFeedSources(): Promise<FeedSource[]> {
  const { data, error } = await supabase
    .from('content_sources')
    .select('id, name, url, category, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching feed sources:', error)
    return []
  }

  return ((data ?? []) as ContentSourceRow[]).map(mapContentSource)
}

export async function addFeedSource(
  detected: RedditDetected | RssDetected,
  category: string | null = null,
): Promise<FeedSource> {
  const fetchUrl = detected.type === 'reddit' ? redditRssUrl(detected) : detected.fetchUrl
  const sourceCategory = category ?? (detected.type === 'reddit' ? 'Community' : 'UX')

  const existing = await supabase
    .from('content_sources')
    .select('id, name, url, category, is_active, created_at')
    .eq('url', fetchUrl)
    .maybeSingle()

  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) return mapContentSource(existing.data as ContentSourceRow)

  const { data, error } = await supabase
    .from('content_sources')
    .insert({
      name: detected.displayTitle,
      url: fetchUrl,
      category: sourceCategory,
      is_default: false,
      is_active: true,
    } as never)
    .select('id, name, url, category, is_active, created_at')
    .single()

  if (error) throw new Error(error.message)
  return mapContentSource(data as ContentSourceRow)
}

export async function updateFeedSource(id: string, changes: FeedSourceUpdate): Promise<void> {
  const update: Record<string, string | boolean | null> = {}

  if ('title' in changes) update.name = changes.title ?? null
  if ('fetch_url' in changes) update.url = changes.fetch_url ?? null
  if ('display_url' in changes && !('fetch_url' in changes)) update.url = changes.display_url ?? null
  if ('category' in changes) update.category = changes.category ?? null
  if ('is_active' in changes) update.is_active = changes.is_active ?? true

  if (Object.keys(update).length === 0) return

  const { error } = await supabase
    .from('content_sources')
    .update(update as never)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteFeedSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('content_sources')
    .delete()
    .eq('id', id)

  if (!error) return

  const { error: deactivateError } = await supabase
    .from('content_sources')
    .update({ is_active: false } as never)
    .eq('id', id)

  if (deactivateError) throw new Error(error.message)
}

// ----- Feed items -----

export interface FeedItemsOptions {
  limit?: number
  sourceType?: 'reddit' | 'rss' | 'all'
  category?: string | null
  sort?: 'relevance' | 'newest' | 'engagement'
  bookmarkedOnly?: boolean
  feedSourceId?: string
}

export async function fetchFeedItems(options: FeedItemsOptions = {}): Promise<FeedItem[]> {
  const {
    limit = 50,
    sourceType = 'all',
    bookmarkedOnly = false,
    sort = 'newest',
    feedSourceId,
    category,
  } = options

  let query = supabase
    .from('articles')
    .select(`
      id,
      source_id,
      title,
      url,
      summary,
      author,
      published_at,
      fetched_at,
      content_sources (
        name,
        category,
        url
      )
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (feedSourceId) query = query.eq('source_id', feedSourceId)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching feed items:', error)
    return []
  }

  const bookmarkedIds = getStoredIds(BOOKMARKED_KEY)
  const hiddenIds = getStoredIds(HIDDEN_KEY)

  let items = ((data ?? []) as unknown as ArticleFeedRow[])
    .map((row) => mapArticleToFeedItem(row, bookmarkedIds, hiddenIds))
    .filter((item) => !item.is_hidden)

  if (bookmarkedOnly) items = items.filter((item) => item.is_bookmarked)
  if (sourceType !== 'all') items = items.filter((item) => item.feed_sources?.source_type === sourceType)
  if (category) items = items.filter((item) => item.categories.includes(category))

  if (sort === 'engagement' || sort === 'relevance') {
    items = [...items].sort((a, b) => {
      const aScore = a.engagement_score ?? a.reddit_score ?? 0
      const bScore = b.engagement_score ?? b.reddit_score ?? 0
      if (bScore !== aScore) return bScore - aScore
      return new Date(b.published_at ?? b.fetched_at ?? 0).getTime() - new Date(a.published_at ?? a.fetched_at ?? 0).getTime()
    })
  }

  return items
}

export async function setItemBookmarked(id: string, bookmarked: boolean): Promise<void> {
  const bookmarkedIds = getStoredIds(BOOKMARKED_KEY)
  if (bookmarked) {
    bookmarkedIds.add(id)
  } else {
    bookmarkedIds.delete(id)
  }
  setStoredIds(BOOKMARKED_KEY, bookmarkedIds)
}

export async function setItemHidden(id: string): Promise<void> {
  const hiddenIds = getStoredIds(HIDDEN_KEY)
  hiddenIds.add(id)
  setStoredIds(HIDDEN_KEY, hiddenIds)
}

// ----- Trigger fetch runs -----

export async function triggerSourceFetch(sourceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-feeds', {
      body: { sourceId },
    })
    if (error) return { success: false, message: error.message || 'Fetch failed.' }
    return {
      success: true,
      message: `Processed ${(data?.processed as number) ?? 0} feeds, added ${(data?.newArticles as number) ?? 0} new articles.`,
    }
  } catch {
    return { success: false, message: 'Fetch failed. Try again later.' }
  }
}

export async function triggerAllFeedsFetch(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-feeds')
    if (error) return { success: false, message: error.message || 'Fetch failed.' }
    return {
      success: true,
      message: `Processed ${(data?.processed as number) ?? 0} feeds, added ${(data?.newArticles as number) ?? 0} new articles.`,
    }
  } catch {
    return { success: false, message: 'Fetch failed. Try again later.' }
  }
}
