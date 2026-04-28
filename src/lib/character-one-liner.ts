// Maps the user's top 2 scoring dimensions to a descriptive one-liner
// about their "content character" on LinkedIn.

interface ScoreDimensions {
  engagement: number
  consistency: number
  growth: number
  mix: number
  completeness: number
}

const ONE_LINERS: Record<string, string> = {
  'engagement+growth':
    'Your content is catching fire — audiences are finding and engaging with you.',
  'consistency+engagement':
    'You show up reliably and your audience responds — a strong feedback loop.',
  'engagement+mix':
    'You keep things varied and your audience rewards you for it.',
  'completeness+engagement':
    'You track everything and your engagement shows why that matters.',
  'consistency+growth':
    'Your steady rhythm is paying off with growing reach.',
  'growth+mix':
    'A diverse content mix is fuelling your growth — keep experimenting.',
  'completeness+growth':
    'Meticulous tracking and upward momentum — your data discipline is working.',
  'consistency+mix':
    'You post regularly with a healthy variety — the foundation is solid.',
  'completeness+consistency':
    'Disciplined and consistent — reliable posting with thorough tracking.',
  'completeness+mix':
    'You balance breadth with depth — all tracked and accounted for.',
}

const FALLBACK = 'Keep posting to reveal your content character.'

export function getCharacterOneLiner(scores: ScoreDimensions): string {
  const entries = Object.entries(scores) as [keyof ScoreDimensions, number][]
  const sorted = [...entries].sort((a, b) => b[1] - a[1])

  if (sorted[0][1] === 0) return FALLBACK

  const top2 = [sorted[0][0], sorted[1][0]].sort()
  const key = top2.join('+')

  return ONE_LINERS[key] ?? FALLBACK
}
