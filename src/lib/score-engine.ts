export interface WeeklyScore {
  overallScore: number
  engagementScore: number
  consistencyScore: number
  growthScore: number
  mixScore: number
  completenessScore: number
  followerBracket: string
  postsWithAnalytics: number
  weekStart: string
}

export interface ScoreBreakdown {
  label: string
  score: number
  weight: number
  description: string
}

export type InsightType = 'PERFORMANCE' | 'FORMAT' | 'TIMING' | 'STRATEGY' | 'GROWTH'

export interface Insight {
  id: string
  insightType: InsightType
  content: string
  suggestedAction: string | null
  generatedAt: string
  weekStart: string
  dismissed: boolean
}

export type ScoreTone = 'positive' | 'negative' | 'neutral'

export function getFollowerBracket(count: number | null): string {
  const followerCount = count ?? 0
  if (followerCount <= 1000) return '0-1000'
  if (followerCount <= 5000) return '1001-5000'
  if (followerCount <= 15000) return '5001-15000'
  if (followerCount <= 50000) return '15001-50000'
  return '50001+'
}

export function getScoreLabel(score: number): { label: string; tone: ScoreTone } {
  if (score >= 70) return { label: 'Strong', tone: 'positive' }
  if (score >= 50) return { label: 'Growing', tone: 'neutral' }
  if (score >= 30) return { label: 'Building', tone: 'neutral' }
  return { label: 'Needs focus', tone: 'negative' }
}

export function buildScoreBreakdown(score: WeeklyScore): ScoreBreakdown[] {
  return [
    {
      label: 'Engagement',
      score: score.engagementScore,
      weight: 35,
      description: 'Reactions, comments, and reposts versus your benchmark.',
    },
    {
      label: 'Consistency',
      score: score.consistencyScore,
      weight: 25,
      description: 'How often your posting rhythm matches your goal.',
    },
    {
      label: 'Growth',
      score: score.growthScore,
      weight: 20,
      description: 'Whether reach is trending in the right direction.',
    },
    {
      label: 'Content mix',
      score: score.mixScore,
      weight: 10,
      description: 'How well this week matches your Discovery, Trust, Authority mix.',
    },
    {
      label: 'Completeness',
      score: score.completenessScore,
      weight: 10,
      description: 'How many published posts have analytics logged.',
    },
  ]
}

export function getLowestScoreDimension(score: WeeklyScore): ScoreBreakdown {
  return buildScoreBreakdown(score).sort((a, b) => a.score - b.score)[0]
}
