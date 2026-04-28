import type { UserProfile } from '@/contexts/UserProfileContext'
import type { Article } from '@/lib/trend-detection'

export function scoreArticle(article: Article, profile: UserProfile | null): number {
  if (!profile) return 0

  let score = 0
  const text = `${article.title} ${article.summary || ''}`.toLowerCase()

  if (profile.primaryDiscipline) {
    const discipline = profile.primaryDiscipline.toLowerCase().replace(/[-_]/g, ' ')
    if (text.includes(discipline)) score += 3
  }

  for (const interest of profile.specialistInterests || []) {
    const term = interest.toLowerCase().replace(/[-_]/g, ' ')
    if (text.includes(term)) score += 2
  }

  score += article.detectedTopics.length
  return score
}

export function scoreArticleForUser(article: Article, profile: UserProfile | null): number {
  if (!profile) return 0.35

  const rawScore = scoreArticle(article, profile)
  const brandBoost = article.detectedBrands.length > 0 ? 1 : 0
  const categoryBoost = profile.industries.some((industry) => (
    `${article.category} ${article.title} ${article.summary || ''}`.toLowerCase().includes(industry.toLowerCase().replace(/[-_]/g, ' '))
  )) ? 2 : 0

  return Math.min(1, (rawScore + brandBoost + categoryBoost) / 10)
}

export function getTopArticles(articles: Article[], profile: UserProfile | null, limit = 3): Article[] {
  return articles
    .map((article) => ({ article, score: scoreArticle(article, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ article }) => article)
}
