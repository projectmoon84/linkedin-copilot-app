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
  premiumCustomButtonInteractions: number | null
  profileViewsAfter: number | null
  followersGainedFromPost: number | null
  sendsOnLinkedIn: number | null
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
    premium_custom_button_interactions: params.premiumCustomButtonInteractions,
    profile_views_after: params.profileViewsAfter,
    followers_gained_from_post: params.followersGainedFromPost,
    sends_on_linkedin: params.sendsOnLinkedIn,
    follower_count_at_post: params.followerCountAtPost,
    audience_demographics: params.audienceDemographics,
    top_job_title: params.audienceDemographics?.topJobTitle ?? null,
    top_location: params.audienceDemographics?.topLocation ?? null,
    top_industry: params.audienceDemographics?.topIndustry ?? null,
    published_date_from_analytics: params.publishedDateFromAnalytics,
  }

  await supabase.from('post_performance').delete().eq('draft_id', params.draftId)
  const { error } = await supabase.from('post_performance').insert(baseRow as any)
  if (error) throw error

  const draftUpdates: Record<string, string> = {}
  if (params.publishedDateFromAnalytics) {
    draftUpdates.published_at = new Date(params.publishedDateFromAnalytics).toISOString()
  }
  if (params.linkedinPostUrl) {
    draftUpdates.linkedin_post_url = params.linkedinPostUrl
  }

  if (Object.keys(draftUpdates).length > 0) {
    const { error: draftError } = await supabase
      .from('drafts')
      .update(draftUpdates as any)
      .eq('id', params.draftId)

    if (draftError) throw draftError
  }
}
