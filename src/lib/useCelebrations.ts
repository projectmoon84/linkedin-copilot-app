interface CelebrationInput {
  overallScore: number | null
  prevScore: number | null
  postsDone: number
  postsTarget: number
  streakCount: number
}

interface Celebration {
  title: string
  description: string
  variant: 'default' | 'celebration'
}

const STORAGE_PREFIX = 'celebration-seen-'

function wasSeenThisWeek(key: string): boolean {
  const stored = localStorage.getItem(STORAGE_PREFIX + key)
  if (!stored) return false
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return Number(stored) > weekAgo
}

function markSeen(key: string) {
  localStorage.setItem(STORAGE_PREFIX + key, String(Date.now()))
}

export function useCelebrations(input: CelebrationInput) {
  const { overallScore, prevScore, postsDone, postsTarget, streakCount } = input
  let celebration: Celebration | null = null

  if (postsTarget > 0 && postsDone >= postsTarget && !wasSeenThisWeek('target-hit')) {
    celebration = {
      title: 'Weekly target hit',
      description: `You published ${postsDone} posts this week.`,
      variant: 'celebration',
    }
  } else if (overallScore != null && prevScore != null && overallScore > prevScore && !wasSeenThisWeek('score-up')) {
    celebration = {
      title: 'Score is climbing',
      description: `Your LinkedIn score went from ${prevScore} to ${overallScore}.`,
      variant: 'default',
    }
  } else {
    for (const milestone of [12, 8, 4]) {
      if (streakCount >= milestone && !wasSeenThisWeek(`streak-${milestone}`)) {
        celebration = {
          title: `${milestone}-week streak`,
          description: `You have been consistently posting for ${milestone} weeks.`,
          variant: 'celebration',
        }
        break
      }
    }
  }

  const dismiss = () => {
    if (postsTarget > 0 && postsDone >= postsTarget) markSeen('target-hit')
    if (overallScore != null && prevScore != null && overallScore > prevScore) markSeen('score-up')
    for (const milestone of [4, 8, 12]) {
      if (streakCount >= milestone) markSeen(`streak-${milestone}`)
    }
  }

  return { celebration, dismiss }
}
