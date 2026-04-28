import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { getTopArticles } from '@/lib/article-scoring'
import { fetchArticles } from '@/lib/article-service'
import { fetchRecentPosts } from '@/lib/services/draft-service'
import { useAnalyticsDuePosts } from '@/lib/useAnalyticsDuePosts'
import { useInsights } from '@/lib/useInsights'
import { useLinkedInScore } from '@/lib/useLinkedInScore'
import { usePostingStats } from '@/lib/usePostingStats'

export function useHomeData() {
  const { profile } = useUserProfile()
  const queryClient = useQueryClient()
  const scoreData = useLinkedInScore()
  const postingData = usePostingStats()
  const analyticsDueData = useAnalyticsDuePosts()
  const insightsData = useInsights()
  const userId = profile?.userId

  const trendingQuery = useQuery({
    queryKey: ['homeTrendingArticles', userId],
    queryFn: async () => {
      const articles = await fetchArticles({ limit: 20, daysBack: 14 })
      return getTopArticles(articles, profile, 3)
    },
    enabled: Boolean(userId),
  })

  const recentPostsQuery = useQuery({
    queryKey: ['homeRecentPosts', userId],
    queryFn: () => fetchRecentPosts(userId!, 5),
    enabled: Boolean(userId),
  })

  const loading = scoreData.loading || postingData.loading || analyticsDueData.loading

  const refresh = async () => {
    await Promise.all([
      scoreData.refresh(),
      postingData.refresh(),
      queryClient.invalidateQueries({ queryKey: ['analyticsDuePosts', userId] }),
      queryClient.invalidateQueries({ queryKey: ['insights', userId] }),
      queryClient.invalidateQueries({ queryKey: ['homeTrendingArticles', userId] }),
      queryClient.invalidateQueries({ queryKey: ['homeRecentPosts', userId] }),
    ])
  }

  return {
    ...scoreData,
    ...postingData,
    analyticsDuePosts: analyticsDueData.analyticsDuePost ? [analyticsDueData.analyticsDuePost] : [],
    draftCount: analyticsDueData.draftCount,
    insights: insightsData.allInsights,
    insightsLoading: insightsData.loading || insightsData.generating,
    insightsError: insightsData.error,
    generatedAt: insightsData.generatedAt,
    dismissInsight: insightsData.dismissInsight,
    trendingArticles: trendingQuery.data ?? [],
    trendingLoading: trendingQuery.isLoading,
    recentPosts: recentPostsQuery.data ?? [],
    recentPostsLoading: recentPostsQuery.isLoading,
    loading,
    refresh,
  }
}
