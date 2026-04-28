export interface DetectedBrand {
  name: string
  linkedinHandle: string
  category: string
  mentionCount: number
}

export interface Article {
  id: string
  sourceId: string
  sourceName: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: string | null
  fetchedAt: string
  imageUrl: string | null
  detectedBrands: DetectedBrand[]
  detectedTopics: string[]
  category: string
}

const BRANDS = [
  { name: 'Figma', aliases: ['figma'], linkedinHandle: 'figma', category: 'design_tool' },
  { name: 'OpenAI', aliases: ['openai', 'chatgpt', 'gpt'], linkedinHandle: 'openai', category: 'ai' },
  { name: 'Anthropic', aliases: ['anthropic', 'claude'], linkedinHandle: 'anthropic', category: 'ai' },
  { name: 'Apple', aliases: ['apple', 'ios'], linkedinHandle: 'apple', category: 'tech' },
  { name: 'Google', aliases: ['google', 'android'], linkedinHandle: 'google', category: 'tech' },
  { name: 'Microsoft', aliases: ['microsoft'], linkedinHandle: 'microsoft', category: 'tech' },
]

const TOPICS = [
  'accessibility',
  'ai',
  'career',
  'design-systems',
  'figma',
  'leadership',
  'mobile',
  'product',
  'research',
  'usability',
  'writing',
]

export function detectBrands(title: string, summary: string | null): DetectedBrand[] {
  const text = `${title} ${summary || ''}`.toLowerCase()

  const detected: DetectedBrand[] = []

  for (const brand of BRANDS) {
    const mentionCount = brand.aliases.reduce((count, alias) => {
      return count + (text.match(new RegExp(`\\b${alias}\\b`, 'g'))?.length ?? 0)
    }, 0)

    if (mentionCount > 0) {
      detected.push({
        name: brand.name,
        linkedinHandle: brand.linkedinHandle,
        category: brand.category,
        mentionCount,
      })
    }
  }

  return detected
}

export function detectTopics(title: string, summary: string | null): string[] {
  const text = `${title} ${summary || ''}`.toLowerCase()
  const detected = TOPICS.filter((topic) => text.includes(topic.replace('-', ' ')) || text.includes(topic))

  if (text.includes('ux') && !detected.includes('usability')) detected.push('usability')
  if (text.includes('user interview') && !detected.includes('research')) detected.push('research')
  if (text.includes('machine learning') && !detected.includes('ai')) detected.push('ai')

  return [...new Set(detected)]
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Recently'

  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 60) return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
