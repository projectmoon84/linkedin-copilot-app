import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  userId: string
  displayName: string | null
  jobTitle: string | null
  yearsExperience: number | null
  companyType: string | null
  primaryDiscipline: string | null
  specialistInterests: string[]
  industries: string[]
  targetAudience: string[]
  primaryGoal: string | null
  currentLinkedinPresence: string | null
  approxFollowerCount: number | null
  stylePreferences: {
    formality: number
    style: number
  } | null
  postingFrequencyGoal: string | null
  strategicPurpose: string | null
  preferredPostingDays: string[]
  contentGoals: string[]
  aiProvider: string | null
  aiModel: string | null
  onboardingCompleted: boolean
}

interface UserProfileContextType {
  profile: UserProfile | null
  avatarUrl: string | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      if (!data) {
        setProfile(null)
        return
      }

      const row = data as Record<string, any>
      setProfile({
        userId: row.user_id,
        displayName: row.display_name,
        jobTitle: row.job_title,
        yearsExperience: row.years_experience,
        companyType: row.company_type,
        primaryDiscipline: row.primary_discipline,
        specialistInterests: row.specialist_interests || [],
        industries: row.industries || [],
        targetAudience: row.target_audience || [],
        primaryGoal: row.primary_goal,
        currentLinkedinPresence: row.current_linkedin_presence,
        approxFollowerCount: row.approx_follower_count,
        stylePreferences: row.style_preferences as UserProfile['stylePreferences'],
        postingFrequencyGoal: row.posting_frequency_goal,
        strategicPurpose: row.strategic_purpose,
        preferredPostingDays: row.preferred_posting_days || [],
        contentGoals: row.content_goals || [],
        aiProvider: row.ai_provider,
        aiModel: row.ai_model,
        onboardingCompleted: Boolean(row.onboarding_completed),
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const value = useMemo<UserProfileContextType>(
    () => ({
      profile,
      avatarUrl: null,
      loading,
      refreshProfile: fetchProfile,
    }),
    [fetchProfile, loading, profile],
  )

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)

  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }

  return context
}
