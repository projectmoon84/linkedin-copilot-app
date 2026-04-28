import type { Highlight, LeaderboardEntry } from '@/lib/circles-types'

const STREAK_MILESTONES = [3, 5, 8, 10, 15, 20, 30, 52]

export function generateHighlights(entries: LeaderboardEntry[]): Highlight[] {
  const highlights: Highlight[] = []

  for (const entry of entries) {
    const firstName = entry.displayName.split(' ')[0] || entry.displayName

    if (STREAK_MILESTONES.includes(entry.streak)) {
      highlights.push({
        id: `streak-${entry.userId}`,
        type: 'streak',
        displayName: entry.displayName,
        message: `${firstName} hit a ${entry.streak}-week streak.`,
      })
    }

    if (entry.overallScore != null && entry.prevScore != null) {
      const delta = entry.overallScore - entry.prevScore
      if (delta >= 10) {
        highlights.push({
          id: `score-jump-${entry.userId}`,
          type: 'score_jump',
          displayName: entry.displayName,
          message: `${firstName}'s LinkedIn score jumped ${delta} points.`,
        })
      }
    }

    if (entry.postsTarget > 0 && entry.postsThisWeek >= entry.postsTarget) {
      highlights.push({
        id: `target-${entry.userId}`,
        type: 'target_hit',
        displayName: entry.displayName,
        message: `${firstName} hit their weekly posting target.`,
      })
    }
  }

  const typeOrder: Record<Highlight['type'], number> = {
    streak: 0,
    score_jump: 1,
    target_hit: 2,
  }

  return highlights
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
    .slice(0, 6)
}
