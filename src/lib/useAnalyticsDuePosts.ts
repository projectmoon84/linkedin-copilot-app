import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export interface AnalyticsDuePost {
  id: string
  content: string
  publishedAt: string
}

async function fetchAnalyticsDueData(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [dueResult, countResult] = await Promise.all([
    supabase
      .from('drafts')
      .select('id, content, published_at, post_performance(id)')
      .eq('user_id', userId)
      .eq('status', 'published')
      .lte('published_at', sevenDaysAgo)
      .order('published_at', { ascending: true })
      .limit(10),
    supabase
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'draft'),
  ])

  let analyticsDuePost: AnalyticsDuePost | null = null
  const rows = (dueResult.data || []) as any[]
  const due = rows.find((draft) => {
    const performance = Array.isArray(draft.post_performance) ? draft.post_performance : []
    return performance.length === 0
  })

  if (due) {
    analyticsDuePost = {
      id: due.id,
      content: due.content || '',
      publishedAt: due.published_at || '',
    }
  }

  return {
    analyticsDuePost,
    draftCount: countResult.count ?? 0,
  }
}

export function useAnalyticsDuePosts() {
  const { user } = useAuth()
  const userId = user?.id

  const { data, isLoading } = useQuery({
    queryKey: ['analyticsDuePosts', userId],
    queryFn: () => fetchAnalyticsDueData(userId!),
    enabled: Boolean(userId),
  })

  return {
    analyticsDuePost: data?.analyticsDuePost ?? null,
    draftCount: data?.draftCount ?? 0,
    loading: isLoading,
  }
}
