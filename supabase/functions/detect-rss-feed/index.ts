/**
 * detect-rss-feed — Edge Function
 *
 * Receives: { url: string }
 * Returns:  { feedUrl: string, title: string } | { error: string }
 *
 * Fetches the page at `url`, searches for RSS/Atom autodiscovery link tags,
 * and returns the canonical feed URL. Falls back to common feed paths.
 *
 * Deploy: supabase functions deploy detect-rss-feed
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Common feed path suffixes to try when autodiscovery fails
const FALLBACK_PATHS = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml', '/blog/feed', '/blog/rss']

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function isFeedContentType(ct: string | null): boolean {
  if (!ct) return false
  return ct.includes('xml') || ct.includes('rss') || ct.includes('atom')
}

async function tryFetch(url: string, signal: AbortSignal): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      signal,
      headers: { 'User-Agent': 'LinkedInCopilot-FeedDetector/1.0' },
    })
    return res
  } catch {
    return null
  }
}

/** Extract <title> from HTML/XML string */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'") : ''
}

/** Parses <link rel="alternate" type="application/...+xml" href="..."> from HTML */
function findFeedLinkTags(html: string): string[] {
  const results: string[] = []
  const re = /<link[^>]+rel\s*=\s*["']alternate["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const tag = match[0]
    if (/type\s*=\s*["'][^"']*(rss|atom|xml)[^"']*["']/i.test(tag)) {
      const hrefMatch = tag.match(/href\s*=\s*["']([^"']+)["']/i)
      if (hrefMatch) results.push(hrefMatch[1])
    }
  }
  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  let url: string
  try {
    const body = await req.json() as { url?: string }
    url = (body.url ?? '').trim()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  if (!url) return json({ error: 'Missing url.' }, 400)

  // Normalise URL
  if (!url.startsWith('http')) url = `https://${url}`
  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return json({ error: 'Invalid URL.' }, 400)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    // 1. Fetch the page and look for autodiscovery link tags
    const pageRes = await tryFetch(url, controller.signal)
    if (pageRes && pageRes.ok) {
      const ct = pageRes.headers.get('content-type') ?? ''

      // The URL is already a feed
      if (isFeedContentType(ct)) {
        const text = await pageRes.text()
        const title = extractTitle(text) || new URL(url).hostname.replace('www.', '')
        return json({ feedUrl: url, title })
      }

      const html = await pageRes.text()
      const siteTitle = extractTitle(html) || new URL(url).hostname.replace('www.', '')
      const discovered = findFeedLinkTags(html)

      if (discovered.length > 0) {
        // Resolve relative URLs
        const feedUrl = new URL(discovered[0], origin).href
        return json({ feedUrl, title: siteTitle })
      }

      // 2. Try common fallback paths
      for (const path of FALLBACK_PATHS) {
        const candidate = `${origin}${path}`
        const res = await tryFetch(candidate, controller.signal)
        if (res && res.ok && isFeedContentType(res.headers.get('content-type'))) {
          return json({ feedUrl: candidate, title: siteTitle })
        }
      }

      return json({
        error:
          "Couldn't find an RSS feed at this address. Try looking for an RSS or ⊞ icon on the site, or paste the feed URL directly.",
      })
    }

    return json({ error: "Couldn't reach this URL. Check the address and try again." })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return json({ error: 'Request timed out. The site may be slow — try pasting the feed URL directly.' })
    }
    return json({ error: 'Feed detection failed. Try pasting the RSS feed URL directly.' })
  } finally {
    clearTimeout(timeout)
  }
})
