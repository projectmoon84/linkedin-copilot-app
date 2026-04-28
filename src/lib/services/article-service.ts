// Article service for fetching and managing feed articles
import { supabase } from '../supabase'
import { detectBrands, detectTopics, type Article } from '../trend-detection'

const articleContentCache = new Map<string, Promise<string | null>>()

// For MVP, we'll use a CORS proxy or pre-fetched data
// In production, this would call the Supabase Edge Function

/**
 * Fetch articles from the database
 */
export async function fetchArticles(options?: {
  limit?: number
  category?: string
  sourceId?: string
  daysBack?: number | null
}): Promise<Article[]> {
  const { limit = 50, category, sourceId, daysBack = 7 } = options || {}

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
      detected_brands,
      content_sources (
        name,
        category
      )
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  // Apply date filter unless explicitly set to null (all time)
  if (daysBack != null && daysBack > 0) {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - daysBack)
    query = query.gte('fetched_at', dateFrom.toISOString())
  }

  if (sourceId) {
    query = query.eq('source_id', sourceId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }

  // Transform to Article type and apply client-side detection
  const articles: Article[] = (data || []).map((row: any) => {
    const detectedBrands = detectBrands(row.title, row.summary)
    const detectedTopics = detectTopics(row.title, row.summary)

    return {
      id: row.id,
      sourceId: row.source_id,
      sourceName: row.content_sources?.name || 'Unknown',
      title: row.title,
      url: row.url,
      summary: row.summary,
      author: row.author,
      publishedAt: row.published_at,
      fetchedAt: row.fetched_at,
      imageUrl: null, // Could extract from content
      detectedBrands,
      detectedTopics,
      category: row.content_sources?.category || 'general',
    }
  })

  // Filter by category if specified (after join)
  if (category) {
    return articles.filter(a => a.category === category)
  }

  return articles
}

/**
 * Fetch a single article by ID
 */
export async function fetchArticleById(articleId: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(`*, content_sources (name, category)`)
    .eq('id', articleId)
    .single()

  if (error || !data) return null

  const row = data as any
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.content_sources?.name || 'Unknown',
    title: row.title,
    url: row.url,
    summary: row.summary,
    author: row.author,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    imageUrl: null,
    detectedBrands: detectBrands(row.title, row.summary),
    detectedTopics: detectTopics(row.title, row.summary),
    category: row.content_sources?.category || 'general',
  }
}

/**
 * Fetch and extract plain-text content from an article URL
 * Uses the fetch-article-content edge function to avoid CORS issues
 */
export async function fetchArticleContent(url: string): Promise<string | null> {
  const cached = articleContentCache.get(url)
  if (cached) return cached

  const request = fetchArticleContentUncached(url)
  articleContentCache.set(url, request)
  return request
}

async function fetchArticleContentUncached(url: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-article-content', {
      body: { url },
    })

    if (error) {
      console.error('Error fetching article content:', error)
      return null
    }

    return data?.content || null
  } catch (err) {
    console.error('Failed to fetch article content:', err)
    return null
  }
}

export function prefetchArticleContent(url: string): void {
  if (!articleContentCache.has(url)) {
    articleContentCache.set(url, fetchArticleContentUncached(url))
  }
}

/**
 * Trigger a feed refresh (calls the edge function)
 */
export async function triggerFeedRefresh(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-feeds')
    
    if (error) {
      throw error
    }

    return {
      success: true,
      message: `Processed ${data.processed} feeds, added ${data.newArticles} new articles`,
    }
  } catch (err) {
    console.error('Error refreshing feeds:', err)
    return {
      success: false,
      message: 'Failed to refresh feeds. Try again later.',
    }
  }
}

/**
 * Seed initial articles for development/demo
 * This inserts mock articles based on real feed structures
 */
export async function seedDemoArticles(): Promise<void> {
  const demoArticles = [
    {
      source_name: 'Nielsen Norman Group',
      title: 'The New Era of AI-Powered UX Research',
      url: 'https://www.nngroup.com/articles/ai-ux-research/',
      summary: 'How artificial intelligence is transforming user research methodologies and what it means for UX professionals.',
      category: 'ux_research',
    },
    {
      source_name: 'UX Collective',
      title: 'Designing for Accessibility: A Practical Guide',
      url: 'https://uxdesign.cc/accessibility-guide-2024/',
      summary: 'Essential accessibility principles every designer needs to know, with real-world examples and implementation tips.',
      category: 'ux_general',
    },
    {
      source_name: 'Figma Blog',
      title: 'Introducing Figma AI: Design Faster with Intelligence',
      url: 'https://www.figma.com/blog/figma-ai-launch/',
      summary: 'Figma unveils new AI-powered features that help designers work more efficiently while maintaining creative control.',
      category: 'product_design',
    },
    {
      source_name: 'Smashing Magazine',
      title: 'Modern CSS Techniques for Better Component Design',
      url: 'https://www.smashingmagazine.com/2024/css-components/',
      summary: 'Exploring container queries, cascade layers, and other CSS features that make component-based design more powerful.',
      category: 'ux_general',
    },
    {
      source_name: 'Product Hunt',
      title: 'Lovable: Build Full-Stack Apps with AI',
      url: 'https://www.producthunt.com/posts/lovable-3',
      summary: 'The AI-powered development tool that lets designers and non-developers create production-ready applications.',
      category: 'tech_news',
    },
    {
      source_name: "Lenny's Newsletter",
      title: 'How Top Design Leaders Run Their Teams',
      url: 'https://www.lennysnewsletter.com/p/design-leadership/',
      summary: 'Insights from design leaders at Stripe, Airbnb, and Figma on building and scaling design organisations.',
      category: 'design_leadership',
    },
    {
      source_name: 'A List Apart',
      title: 'The Case for Sustainable Web Design',
      url: 'https://alistapart.com/article/sustainable-web-design/',
      summary: 'Why digital sustainability matters and practical steps designers can take to reduce their environmental impact.',
      category: 'ux_general',
    },
    {
      source_name: 'Intercom Blog',
      title: 'Conversational UX: Designing for AI Assistants',
      url: 'https://www.intercom.com/blog/conversational-ux-ai/',
      summary: 'Best practices for designing conversational interfaces and AI-powered customer experiences.',
      category: 'product_design',
    },
    {
      source_name: 'The A11Y Project',
      title: 'WCAG 3.0: What Designers Need to Know',
      url: 'https://www.a11yproject.com/posts/wcag-3-overview/',
      summary: 'A breakdown of the upcoming accessibility guidelines and how they will affect design decisions.',
      category: 'accessibility',
    },
    {
      source_name: 'Design Systems',
      title: 'Scaling Design Tokens Across Platforms',
      url: 'https://www.designsystems.com/design-tokens-scale/',
      summary: 'How leading companies manage design tokens across web, iOS, and Android for consistent experiences.',
      category: 'design_systems',
    },
  ]

  // Get source IDs from database
  const { data: sources } = await supabase
    .from('content_sources')
    .select('id, name')

  if (!sources) return

  const sourceMap = new Map((sources as any[]).map(s => [s.name, s.id]))

  // Insert demo articles
  for (const article of demoArticles) {
    const sourceId = sourceMap.get(article.source_name)
    if (!sourceId) continue

    await supabase.from('articles').upsert(
      {
        source_id: sourceId,
        title: article.title,
        url: article.url,
        summary: article.summary,
        published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        fetched_at: new Date().toISOString(),
      } as any,
      { onConflict: 'url', ignoreDuplicates: true }
    )
  }
}
