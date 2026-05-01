import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { hasApiKey } from '@/lib/ai-service-secure'
import { fetchVoiceProfileRaw } from '@/lib/services/profile-service'
import { supabase } from '@/lib/supabase'

interface SetupChecklistState {
  hasApiKey: boolean
  voiceSampleCount: number
  feedSourceCount: number
}

export interface SetupChecklistStatus {
  profileComplete: boolean
  styleComplete: boolean
  aiReady: boolean
  voiceReady: boolean
  sourcesReady: boolean
  completedCount: number
  totalCount: number
  voiceSampleCount: number
  feedSourceCount: number
  loading: boolean
}

async function fetchSetupChecklistState(userId: string): Promise<SetupChecklistState> {
  const [apiKeyConfigured, voiceProfile, sourceCountResult] = await Promise.all([
    hasApiKey(),
    fetchVoiceProfileRaw(userId),
    supabase.from('content_sources').select('id', { count: 'exact', head: true }),
  ])

  const voiceSampleCount = Array.isArray(voiceProfile?.voice_samples) ? voiceProfile.voice_samples.length : 0

  if (sourceCountResult.error) {
    console.error('Error fetching content source count:', sourceCountResult.error)
  }

  return {
    hasApiKey: apiKeyConfigured,
    voiceSampleCount,
    feedSourceCount: sourceCountResult.count ?? 0,
  }
}

export function useSetupChecklist(): SetupChecklistStatus {
  const { user } = useAuth()
  const { profile } = useUserProfile()

  const checklistQuery = useQuery({
    queryKey: ['setupChecklist', user?.id],
    queryFn: () => fetchSetupChecklistState(user!.id),
    enabled: Boolean(user?.id),
  })

  return useMemo(() => {
    const hasProfileBasics = Boolean(
      profile?.displayName?.trim()
      && profile?.jobTitle?.trim()
      && profile?.primaryDiscipline?.trim(),
    )

    const hasContentStyle = Boolean(
      profile?.strategicPurpose
      && profile?.postingFrequencyGoal,
    )

    const aiReady = Boolean(
      checklistQuery.data?.hasApiKey
      && profile?.aiProvider
      && profile?.aiModel,
    )

    const voiceSampleCount = checklistQuery.data?.voiceSampleCount ?? 0
    const feedSourceCount = checklistQuery.data?.feedSourceCount ?? 0
    const voiceReady = voiceSampleCount >= 3
    const sourcesReady = feedSourceCount >= 1

    const steps = [hasProfileBasics, hasContentStyle, aiReady, voiceReady, sourcesReady]
    const completedCount = steps.filter(Boolean).length

    return {
      profileComplete: hasProfileBasics,
      styleComplete: hasContentStyle,
      aiReady,
      voiceReady,
      sourcesReady,
      completedCount,
      totalCount: steps.length,
      voiceSampleCount,
      feedSourceCount,
      loading: checklistQuery.isLoading,
    }
  }, [
    checklistQuery.data?.feedSourceCount,
    checklistQuery.data?.hasApiKey,
    checklistQuery.data?.voiceSampleCount,
    checklistQuery.isLoading,
    profile?.aiModel,
    profile?.aiProvider,
    profile?.displayName,
    profile?.jobTitle,
    profile?.postingFrequencyGoal,
    profile?.primaryDiscipline,
    profile?.strategicPurpose,
  ])
}
