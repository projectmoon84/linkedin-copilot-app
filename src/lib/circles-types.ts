export interface Circle {
  id: string
  name: string
  inviteCode: string
  createdBy: string
  isWorkspace: boolean
  createdAt: string
  memberCount: number
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  avatarSeed: string
  role: 'member' | 'admin'
  shareScore: boolean
  shareImpressions: boolean
  overallScore: number | null
  prevScore: number | null
  postsThisWeek: number
  postsTarget: number
  streak: number
  impressions: number | null
  isCurrentUser: boolean
}

export type HighlightType = 'streak' | 'score_jump' | 'target_hit'

export interface Highlight {
  id: string
  type: HighlightType
  displayName: string
  message: string
}
