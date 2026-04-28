import { supabase } from '@/lib/supabase'
import type { AudienceDemographics } from '@/lib/analytics-parsing'
import type { Draft, PerformanceData } from '@/lib/drafts-types'
import type { StrategicPurpose } from '@/lib/onboarding-types'

export type DraftStatus = 'draft' | 'scheduled' | 'published'

export interface DraftRow {
  id: string
  title: string | null
  content: string
  strategicPurpose: StrategicPurpose | null
  status: DraftStatus
  articleId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RecentPost {
  id: string
  content: string
  status: string
  strategicPurpose: string | null
  publishedAt: string | null
  createdAt: string
  impressions: number | null
  reactions: number | null
  comments: number | null
  reposts: number | null
}

function mapDraftRow(row: any): DraftRow {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    strategicPurpose: row.strategic_purpose,
    status: row.status || 'draft',
    articleId: row.article_id ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPerformance(performance: any): PerformanceData | null {
  if (!performance) return null
  return {
    reactions: performance.reactions ?? 0,
    comments: performance.comments ?? 0,
    reposts: performance.reposts ?? 0,
    impressions: performance.impressions ?? null,
    membersReached: performance.members_reached ?? null,
    saves: performance.saves ?? null,
    followerCountAtPost: performance.follower_count_at_post ?? null,
    linkedinPostUrl: performance.linkedin_post_url ?? null,
    audienceDemographics: (performance.audience_demographics ?? null) as AudienceDemographics | null,
    publishedDateFromAnalytics: performance.published_date_from_analytics ?? null,
  }
}

function mapDraftWithPerformance(row: any): Draft {
  const performance = Array.isArray(row.post_performance) ? row.post_performance[0] : null
  return {
    id: row.id,
    title: row.title || titleFromContent(row.content || ''),
    content: row.content || '',
    strategicPurpose: row.strategic_purpose,
    status: row.status || 'draft',
    publishedAt: row.published_at ?? null,
    hasPerformanceData: Boolean(performance),
    performance: mapPerformance(performance),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function titleFromContent(content: string) {
  const firstLine = content.split('\n').find((line) => line.trim())
  if (!firstLine) return 'Untitled draft'
  return firstLine.trim().slice(0, 80)
}

export async function fetchDraftById(draftId: string, userId?: string): Promise<DraftRow | null> {
  let query = supabase
    .from('drafts')
    .select('id, user_id, article_id, title, content, strategic_purpose, status, published_at, created_at, updated_at')
    .eq('id', draftId)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query.maybeSingle()
  if (error || !data) {
    if (error) console.error('Error fetching draft:', error)
    return null
  }

  return mapDraftRow(data)
}

export async function fetchRecentAutosaveDraft(userId: string): Promise<DraftRow | null> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('drafts')
    .select('id, user_id, article_id, title, content, strategic_purpose, status, published_at, created_at, updated_at')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .eq('title', 'Autosaved draft')
    .gte('updated_at', weekAgo.toISOString())
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return mapDraftRow(data)
}

export async function createDraft(params: {
  userId: string
  content: string
  strategicPurpose: StrategicPurpose | null
  articleId?: string | null
  title?: string | null
}): Promise<DraftRow> {
  const now = new Date().toISOString()
  const { data, error } = await (supabase.from('drafts') as any)
    .insert({
      user_id: params.userId,
      article_id: params.articleId ?? null,
      title: params.title ?? titleFromContent(params.content),
      content: params.content,
      strategic_purpose: params.strategicPurpose,
      status: 'draft',
      updated_at: now,
    })
    .select('id, user_id, article_id, title, content, strategic_purpose, status, published_at, created_at, updated_at')
    .single()

  if (error) throw error
  return mapDraftRow(data)
}

export async function updateDraft(params: {
  id: string
  content: string
  strategicPurpose: StrategicPurpose | null
  articleId?: string | null
  title?: string | null
  status?: DraftStatus
}): Promise<DraftRow> {
  const status = params.status ?? 'draft'
  const { data, error } = await (supabase.from('drafts') as any)
    .update({
      article_id: params.articleId ?? null,
      title: params.title ?? titleFromContent(params.content),
      content: params.content,
      strategic_purpose: params.strategicPurpose,
      status,
      published_at: status === 'draft' ? null : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, user_id, article_id, title, content, strategic_purpose, status, published_at, created_at, updated_at')
    .single()

  if (error) throw error
  return mapDraftRow(data)
}

export async function fetchDrafts(userId: string): Promise<Draft[]> {
  let result = await (supabase.from('drafts') as any)
    .select(`
      id,
      user_id,
      article_id,
      title,
      content,
      strategic_purpose,
      status,
      published_at,
      created_at,
      updated_at,
      post_performance (
        reactions,
        comments,
        reposts,
        impressions,
        members_reached,
        saves,
        follower_count_at_post,
        linkedin_post_url,
        audience_demographics,
        published_date_from_analytics
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (result.error) {
    result = await (supabase.from('drafts') as any)
      .select(`
        id,
        user_id,
        article_id,
        title,
        content,
        strategic_purpose,
        status,
        published_at,
        created_at,
        updated_at,
        post_performance (
          reactions,
          comments,
          reposts,
          impressions,
          members_reached,
          saves
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
  }

  if (result.error) {
    result = await (supabase.from('drafts') as any)
      .select('id, user_id, article_id, title, content, strategic_purpose, status, published_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
  }

  if (result.error) throw result.error
  return (result.data || []).map(mapDraftWithPerformance)
}

export async function deleteDraft(id: string): Promise<void> {
  await supabase.from('post_performance').delete().eq('draft_id', id)
  const { error } = await supabase.from('drafts').delete().eq('id', id)
  if (error) throw error
}

export async function publishDraft(id: string): Promise<void> {
  const { error } = await supabase
    .from('drafts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

export async function fetchRecentPosts(userId: string, limit = 5): Promise<RecentPost[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('id, content, status, strategic_purpose, published_at, created_at, updated_at, post_performance(impressions, reactions, comments, reposts)')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    if (error) console.error('Error fetching recent posts:', error)
    return []
  }

  return data.map((draft: any) => {
    const performance = Array.isArray(draft.post_performance) ? draft.post_performance[0] : null

    return {
      id: draft.id,
      content: draft.content || '',
      status: draft.status,
      strategicPurpose: draft.strategic_purpose,
      publishedAt: draft.published_at,
      createdAt: draft.created_at,
      impressions: performance?.impressions ?? null,
      reactions: performance?.reactions ?? null,
      comments: performance?.comments ?? null,
      reposts: performance?.reposts ?? null,
    }
  })
}
