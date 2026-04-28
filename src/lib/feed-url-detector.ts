import { supabase } from './supabase'

// ----- Result types -----

export interface RedditDetected {
  type: 'reddit'
  fetchUrl: string
  displayTitle: string     // e.g. "r/UXDesign"
  subreddit: string        // e.g. "UXDesign"
  sort: 'top' | 'new' | 'rising'
  timeFilter: 'day' | 'week' | 'month' | null  // only meaningful for sort=top
}

export interface RssDetected {
  type: 'rss'
  fetchUrl: string
  displayTitle: string
  confidence?: 'verified' | 'likely'
}

export interface DetectionError {
  error: string
}

export type DetectionResult = RedditDetected | RssDetected | DetectionError

export function isDetectionError(r: DetectionResult): r is DetectionError {
  return 'error' in r
}

// ----- Internal helpers -----

function normaliseUrl(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function likelyFeedFromWebsiteUrl(url: string): { feedUrl: string; title: string } {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    const feedPath = path && path !== '/' ? `${path}/feed` : '/feed'
    return {
      feedUrl: new URL(feedPath, parsed.origin).href,
      title: parsed.hostname.replace('www.', ''),
    }
  } catch {
    return { feedUrl: url, title: url }
  }
}

/**
 * Synchronous Reddit detection. Returns null when the URL is not Reddit.
 *
 * Supported shapes:
 *   reddit.com/r/UXDesign
 *   reddit.com/r/UXDesign/top
 *   reddit.com/r/UXDesign/new
 *   reddit.com/r/UXDesign/rising
 */
function detectReddit(url: string): RedditDetected | null {
  try {
    const u = new URL(normaliseUrl(url))
    if (!u.hostname.includes('reddit.com')) return null

    const parts = u.pathname.split('/').filter(Boolean)
    // Expect: ['r', '<subreddit>', (optional sort)]
    if (parts[0] !== 'r' || !parts[1]) return null

    const subreddit = parts[1]
    const sortRaw = parts[2]?.toLowerCase()
    const sort: RedditDetected['sort'] =
      sortRaw === 'new' ? 'new'
      : sortRaw === 'rising' ? 'rising'
      : 'top'

    const timeFilter: RedditDetected['timeFilter'] = sort === 'top' ? 'week' : null

    let fetchUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=50`
    if (sort === 'top' && timeFilter) fetchUrl += `&t=${timeFilter}`

    return { type: 'reddit', fetchUrl, displayTitle: `r/${subreddit}`, subreddit, sort, timeFilter }
  } catch {
    return null
  }
}

/** Returns true when the URL already looks like a raw feed endpoint. */
function looksLikeFeed(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes('/feed') ||
    lower.includes('/rss') ||
    lower.includes('/atom') ||
    lower.endsWith('.xml') ||
    lower.endsWith('.rss')
  )
}

/** Calls the `detect-rss-feed` Edge Function to do server-side RSS autodiscovery. */
async function discoverRssFeed(
  url: string,
): Promise<{ feedUrl: string; title: string; confidence: RssDetected['confidence'] } | DetectionError> {
  try {
    const { data, error } = await supabase.functions.invoke('detect-rss-feed', { body: { url } })
    if (error) {
      const fallback = likelyFeedFromWebsiteUrl(url)
      return { ...fallback, confidence: 'likely' }
    }
    if (data?.error) return { error: data.error as string }
    if (data?.feedUrl) return { feedUrl: data.feedUrl as string, title: (data.title as string) || titleFromUrl(url), confidence: 'verified' }
    return {
      error:
        "Couldn't find an RSS feed at this address. Try looking for an RSS or ⊞ icon on the site, or paste the feed URL directly.",
    }
  } catch {
    const fallback = likelyFeedFromWebsiteUrl(url)
    return { ...fallback, confidence: 'likely' }
  }
}

// ----- Public API -----

/**
 * Detect what kind of feed URL the user pasted and return structured metadata.
 *
 * - Reddit URLs are detected synchronously from the URL shape.
 * - Direct feed URLs (containing /feed, /rss, .xml, etc.) are returned immediately.
 * - Everything else triggers a server-side RSS autodiscovery call.
 */
export async function detectFeedUrl(rawUrl: string): Promise<DetectionResult> {
  const url = rawUrl.trim()
  if (!url) return { error: 'Please enter a URL.' }

  // 1. Reddit (synchronous)
  const reddit = detectReddit(url)
  if (reddit) return reddit

  // 2. Looks like a raw feed URL (synchronous)
  const normalized = normaliseUrl(url)
  if (looksLikeFeed(url)) {
    try {
      const { hostname } = new URL(normalized)
      return { type: 'rss', fetchUrl: normalized, displayTitle: hostname.replace('www.', ''), confidence: 'verified' }
    } catch {
      return { type: 'rss', fetchUrl: normalized, displayTitle: normalized, confidence: 'verified' }
    }
  }

  // 3. Autodiscovery via Edge Function
  const discovered = await discoverRssFeed(normalized)
  if ('error' in discovered) return discovered

  return {
    type: 'rss',
    fetchUrl: discovered.feedUrl,
    displayTitle: discovered.title,
    confidence: discovered.confidence,
  }
}
