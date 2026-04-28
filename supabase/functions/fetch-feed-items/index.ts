/**
 * fetch-feed-items — Edge Function
 *
 * Fetches content from active feed sources and upserts items into feed_items.
 *
 * Receives: { sourceId?: string }
 *   - If sourceId is provided, fetch only that source.
 *   - If omitted, fetch all sources where next_fetch_at <= now().
 *
 * Returns: { processed: number, newItems: number }
 *
 * Deploy: supabase functions deploy fetch-feed-items
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ─── Reddit ───────────────────────────────────────────────────────────────────

interface RedditPost {
  id: string
  title: string
  url: string
  permalink: string
  selftext: string
  author: string
  created_utc: number
  score: number
  upvote_ratio: number
  num_comments: number
  total_awards_received: number
  link_flair_text: string | null
  thumbnail: string | null
}

function normaliseRedditThumbnail(thumb: string | null): string | null {
  if (!thumb || thumb === 'self' || thumb === 'default' || thumb === 'nsfw') return null
  return thumb.startsWith('http') ? thumb : null
}

/** Compute a normalised engagement score for a Reddit post. */
function redditEngagementScore(post: RedditPost): number {
  // Weight: score is primary signal, comments secondary
  return post.score * 1.0 + post.num_comments * 2.5
}

async function fetchRedditSource(source: Record<string, unknown>): Promise<FeedItemInsert[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(source.fetch_url as string, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LinkedInCopilot/1.0 (content discovery)',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) throw new Error(`Reddit API ${res.status}`)

    const data = await res.json() as { data: { children: Array<{ data: RedditPost }> } }
    const posts = data.data?.children ?? []

    return posts.map(({ data: post }) => ({
      feed_source_id: source.id as string,
      user_id: source.user_id as string,
      external_id: post.id,
      title: post.title,
      link: post.permalink.startsWith('/')
        ? `https://www.reddit.com${post.permalink}`
        : post.permalink,
      description: post.selftext?.slice(0, 500) || null,
      author: post.author,
      published_at: new Date(post.created_utc * 1000).toISOString(),
      image_url: normaliseRedditThumbnail(post.thumbnail),
      categories: post.link_flair_text ? [post.link_flair_text] : [],
      reddit_score: post.score,
      reddit_upvote_ratio: post.upvote_ratio,
      reddit_num_comments: post.num_comments,
      reddit_awards: post.total_awards_received,
      engagement_score: redditEngagementScore(post),
    }))
  } finally {
    clearTimeout(timeout)
  }
}

// ─── RSS / Atom ───────────────────────────────────────────────────────────────

/** Minimal RSS/Atom parser — no npm dep required in Deno edge functions. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function extractXmlText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(re)
  if (!match) return ''
  const inner = match[1].trim()
  // Unwrap CDATA
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
  return stripHtml(cdata ? cdata[1] : inner)
}

function extractXmlAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}\\s*=\\s*["']([^"']+)["'][^>]*>`, 'i')
  const match = xml.match(re)
  return match ? match[1] : ''
}

interface RssItem {
  guid: string
  title: string
  link: string
  description: string
  author: string
  pubDate: string
  imageUrl: string | null
  categories: string[]
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const isAtom = xml.includes('<feed') && xml.includes('xmlns')

  if (isAtom) {
    // Atom feed
    const entryRe = /<entry>([\s\S]*?)<\/entry>/gi
    let match: RegExpExecArray | null
    while ((match = entryRe.exec(xml)) !== null) {
      const entry = match[1]
      const guid = extractXmlText(entry, 'id') || extractXmlAttr(entry, 'link', 'href')
      const link = extractXmlAttr(entry, 'link', 'href') || guid
      const title = extractXmlText(entry, 'title')
      const description = extractXmlText(entry, 'summary') || extractXmlText(entry, 'content')
      const author = extractXmlText(entry, 'name') || extractXmlText(entry, 'author')
      const pubDate = extractXmlText(entry, 'updated') || extractXmlText(entry, 'published')

      if (!guid || !title) continue
      items.push({ guid, title, link, description, author, pubDate, imageUrl: null, categories: [] })
    }
  } else {
    // RSS 2.0
    const itemRe = /<item>([\s\S]*?)<\/item>/gi
    let match: RegExpExecArray | null
    while ((match = itemRe.exec(xml)) !== null) {
      const item = match[1]
      const guid = extractXmlText(item, 'guid') || extractXmlText(item, 'link')
      const link = extractXmlText(item, 'link') || guid
      const title = extractXmlText(item, 'title')
      const description = extractXmlText(item, 'description')
      const author = extractXmlText(item, 'author') || extractXmlText(item, 'dc:creator')
      const pubDate = extractXmlText(item, 'pubDate') || extractXmlText(item, 'dc:date')

      // Categories
      const catRe = /<category[^>]*>([^<]+)<\/category>/gi
      const categories: string[] = []
      let catMatch: RegExpExecArray | null
      while ((catMatch = catRe.exec(item)) !== null) categories.push(catMatch[1].trim())

      // Image from media:thumbnail or enclosure
      const mediaThumb = extractXmlAttr(item, 'media:thumbnail', 'url')
      const enclosure = extractXmlAttr(item, 'enclosure', 'url')
      const imageUrl = mediaThumb || (enclosure.match(/\.(jpe?g|png|gif|webp)$/i) ? enclosure : null)

      if (!guid || !title) continue
      items.push({ guid, title, link, description, author, pubDate, imageUrl, categories })
    }
  }

  return items.slice(0, 50) // cap at 50 items per fetch
}

async function fetchRssSource(source: Record<string, unknown>): Promise<FeedItemInsert[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(source.fetch_url as string, {
      signal: controller.signal,
      headers: { 'User-Agent': 'LinkedInCopilot/1.0 (feed reader)' },
    })

    if (!res.ok) throw new Error(`RSS fetch ${res.status}`)

    const xml = await res.text()
    const parsed = parseRssItems(xml)

    return parsed.map((item) => ({
      feed_source_id: source.id as string,
      user_id: source.user_id as string,
      external_id: item.guid.slice(0, 500), // guard against very long guids
      title: item.title,
      link: item.link,
      description: item.description?.slice(0, 600) || null,
      author: item.author || null,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      image_url: item.imageUrl,
      categories: item.categories,
      reddit_score: null,
      reddit_upvote_ratio: null,
      reddit_num_comments: null,
      reddit_awards: null,
      engagement_score: null, // RSS items have no real engagement signal at fetch time
    }))
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

interface FeedItemInsert {
  feed_source_id: string
  user_id: string
  external_id: string
  title: string
  link: string
  description: string | null
  author: string | null
  published_at: string | null
  image_url: string | null
  categories: string[]
  reddit_score: number | null
  reddit_upvote_ratio: number | null
  reddit_num_comments: number | null
  reddit_awards: number | null
  engagement_score: number | null
}

function nextFetchAt(source: Record<string, unknown>): string {
  const minutes = (source.fetch_interval_minutes as number) ?? 120
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let sourceId: string | undefined
  try {
    const body = await req.json() as { sourceId?: string }
    sourceId = body.sourceId
  } catch {
    // body is optional
  }

  // Load sources to process
  let sourcesQuery = supabase
    .from('feed_sources')
    .select('*')
    .eq('is_active', true)

  if (sourceId) {
    sourcesQuery = sourcesQuery.eq('id', sourceId)
  } else {
    sourcesQuery = sourcesQuery.lte('next_fetch_at', new Date().toISOString())
  }

  const { data: sources, error: sourcesError } = await sourcesQuery
  if (sourcesError) return json({ error: sourcesError.message }, 500)
  if (!sources?.length) return json({ processed: 0, newItems: 0 })

  let processed = 0
  let newItems = 0

  for (const source of sources) {
    try {
      const items: FeedItemInsert[] = source.source_type === 'reddit'
        ? await fetchRedditSource(source)
        : await fetchRssSource(source)

      if (items.length > 0) {
        const { data: upserted } = await supabase
          .from('feed_items')
          .upsert(items, { onConflict: 'feed_source_id,external_id', ignoreDuplicates: true })
          .select('id')

        newItems += upserted?.length ?? 0
      }

      // Update fetch timestamps and clear any previous error
      await supabase
        .from('feed_sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          next_fetch_at: nextFetchAt(source),
          last_error: null,
        })
        .eq('id', source.id)

      processed++
    } catch (err) {
      console.error(`Error fetching source ${source.id}:`, err)
      // Store the error but don't crash the batch
      await supabase
        .from('feed_sources')
        .update({
          next_fetch_at: nextFetchAt(source),
          last_error: (err as Error).message,
        })
        .eq('id', source.id)
    }
  }

  return json({ processed, newItems })
})
