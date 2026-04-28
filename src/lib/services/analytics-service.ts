import type { AudienceDemographics } from '@/lib/analytics-parsing'
import { supabase } from '@/lib/supabase'

export interface SaveAnalyticsParams {
  draftId: string
  linkedinPostUrl: string | null
  impressions: number | null
  reactions: number
  comments: number
  reposts: number
  saves: number | null
  membersReached: number | null
  followerCountAtPost: number | null
  audienceDemographics: AudienceDemographics | null
  publishedDateFromAnalytics: string | null
}

export async function savePostAnalytics(params: SaveAnalyticsParams): Promise<void> {
  const baseRow = {
    draft_id: params.draftId,
    linkedin_post_url: params.linkedinPostUrl,
    impressions: params.impressions,
    reactions: params.reactions,
    comments: params.comments,
    reposts: params.reposts,
    saves: params.saves,
    members_reached: params.membersReached,
    follower_count_at_post: params.followerCountAtPost,
    audience_demographics: params.audienceDemographics,
    published_date_from_analytics: params.publishedDateFromAnalytics,
  }

  await supabase.from('post_performance').delete().eq('draft_id', params.draftId)
  const { error } = await supabase.from('post_performance').insert(baseRow as any)
  if (error) throw error

  if (params.publishedDateFromAnalytics) {
    await supabase
      .from('drafts')
      .update({ published_at: new Date(params.publishedDateFromAnalytics).toISOString() })
      .eq('id', params.draftId)
  }
}
