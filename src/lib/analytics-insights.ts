export interface PostSaveInsight {
  message: string
  color: 'emerald' | 'stone'
}

export function computePostSaveInsight(savedImpressions: number | null): PostSaveInsight {
  if (savedImpressions == null) {
    return { message: 'Analytics saved. Add impressions to unlock performance insights.', color: 'stone' }
  }

  return { message: 'Analytics saved. This post can now feed your score.', color: 'emerald' }
}
