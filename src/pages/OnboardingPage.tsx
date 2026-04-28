import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconArrowLeft, IconArrowRight, IconCheck, IconLoader2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  CardChoiceGroup,
  ChipGroup,
  Field,
  RangeInput,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/ui/form-controls'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import {
  COMPANY_TYPES,
  DAYS_OF_WEEK,
  DISCIPLINES,
  FOLLOWER_RANGES,
  INDUSTRIES,
  INITIAL_ONBOARDING_DATA,
  POSTING_FREQUENCIES,
  SPECIALIST_INTERESTS,
  STRATEGIC_PURPOSES,
  TARGET_AUDIENCES,
  type FollowerRange,
  type OnboardingData,
} from '@/lib/onboarding-types'
import { insertToneSamples, upsertUserProfile, upsertVoiceProfile } from '@/lib/services/profile-service'

const STEPS = ['About you', 'Your focus', 'Content style', 'Voice sample']

function followerRangeToNumber(range: FollowerRange | string | null): number | null {
  if (!range) return null
  const map: Record<string, number> = {
    '0-500': 250,
    '500-1000': 750,
    '1000-5000': 3000,
    '5000-10000': 7500,
    '10000+': 15000,
  }
  return map[range] ?? null
}

export function OnboardingPage() {
  const { user } = useAuth()
  const { refreshProfile } = useUserProfile()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA)
  const [voiceSample, setVoiceSample] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((current) => ({ ...current, ...updates }))
  }

  const canContinue = () => {
    if (step === 0) return Boolean(data.displayName.trim() && data.jobTitle.trim())
    if (step === 1) return Boolean(data.primaryDiscipline)
    if (step === 2) return Boolean(data.strategicPurpose && data.postingFrequencyGoal)
    return true
  }

  const handleComplete = async () => {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      await upsertUserProfile({
        user_id: user.id,
        display_name: data.displayName,
        job_title: data.jobTitle,
        years_experience: data.yearsExperience,
        company_type: data.companyType,
        primary_discipline: data.primaryDiscipline,
        specialist_interests: data.specialistInterests,
        industries: data.industries,
        target_audience: data.targetAudience,
        primary_goal: data.primaryGoal,
        current_linkedin_presence: data.currentLinkedinPresence,
        approx_follower_count: followerRangeToNumber(data.approxFollowerCount),
        strategic_purpose: data.strategicPurpose,
        style_preferences: {
          formality: data.toneFormality,
          style: data.toneStyle,
        },
        posting_frequency_goal: data.postingFrequencyGoal,
        content_goals: data.contentGoals,
        preferred_posting_days: data.preferredPostingDays,
        onboarding_completed: true,
      })

      if (voiceSample.trim()) {
        await insertToneSamples([
          {
            user_id: user.id,
            content: voiceSample.trim(),
            source_type: 'linkedin_post',
          },
        ])

        await upsertVoiceProfile({
          user_id: user.id,
          voice_samples: [voiceSample.trim()],
          updated_at: new Date().toISOString(),
        })
      }

      await refreshProfile()
      navigate('/home', { replace: true })
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      setError('Something went wrong saving your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1)
      return
    }

    void handleComplete()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <main className="w-full max-w-xl space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => index < step && setStep(index)}
                aria-label={`Go to ${item}`}
                className={`flex size-8 items-center justify-center rounded-full border text-sm font-semibold ${
                  index === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : index < step
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <section className="app-card p-6 sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">About you</h1>
                <p className="mt-1 text-sm text-muted-foreground">A few basics so the app can write from the right professional context.</p>
              </div>
              <Field label="Display name">
                <TextInput value={data.displayName} onChange={(event) => updateData({ displayName: event.target.value })} />
              </Field>
              <Field label="Job title">
                <TextInput value={data.jobTitle} onChange={(event) => updateData({ jobTitle: event.target.value })} placeholder="Senior Product Designer" />
              </Field>
              <Field label="Years of experience">
                <TextInput
                  type="number"
                  min={0}
                  max={60}
                  value={data.yearsExperience ?? ''}
                  onChange={(event) => updateData({ yearsExperience: event.target.value ? Number(event.target.value) : null })}
                />
              </Field>
              <Field label="Company type">
                <SelectInput value={data.companyType || ''} onChange={(value) => updateData({ companyType: value as OnboardingData['companyType'] })} options={COMPANY_TYPES} />
              </Field>
              <Field label="Follower count">
                <SelectInput value={data.approxFollowerCount || ''} onChange={(value) => updateData({ approxFollowerCount: value as FollowerRange })} options={FOLLOWER_RANGES} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Your focus</h1>
                <p className="mt-1 text-sm text-muted-foreground">Choose the areas and audiences you want your content to orbit.</p>
              </div>
              <Field label="Primary discipline">
                <SelectInput value={data.primaryDiscipline || ''} onChange={(value) => updateData({ primaryDiscipline: value })} options={DISCIPLINES} />
              </Field>
              <Field label="Specialist interests">
                <ChipGroup options={SPECIALIST_INTERESTS} value={data.specialistInterests} onChange={(value) => updateData({ specialistInterests: value })} />
              </Field>
              <Field label="Industries">
                <ChipGroup options={INDUSTRIES} value={data.industries} onChange={(value) => updateData({ industries: value })} />
              </Field>
              <Field label="Target audience">
                <ChipGroup options={TARGET_AUDIENCES} value={data.targetAudience} onChange={(value) => updateData({ targetAudience: value })} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Content style</h1>
                <p className="mt-1 text-sm text-muted-foreground">Set the strategic purpose and cadence for your first drafts.</p>
              </div>
              <Field label="Strategic purpose">
                <CardChoiceGroup
                  options={STRATEGIC_PURPOSES.map(({ value, label, description }) => ({ value, label, description }))}
                  value={data.strategicPurpose}
                  onChange={(value) => updateData({ strategicPurpose: value as OnboardingData['strategicPurpose'] })}
                  columns="one"
                />
              </Field>
              <Field label="Posting frequency">
                <SelectInput value={data.postingFrequencyGoal || ''} onChange={(value) => updateData({ postingFrequencyGoal: value as OnboardingData['postingFrequencyGoal'] })} options={POSTING_FREQUENCIES} />
              </Field>
              <Field label="Preferred days">
                <ChipGroup options={DAYS_OF_WEEK.map(({ value, short }) => ({ value, label: short }))} value={data.preferredPostingDays} onChange={(value) => updateData({ preferredPostingDays: value })} />
              </Field>
              <Field label="Tone formality" description="Set where your writing sits between polished and conversational.">
                <RangeInput value={data.toneFormality} onChange={(value) => updateData({ toneFormality: value })} leftLabel="Formal" rightLabel="Conversational" />
              </Field>
              <Field label="Tone style" description="Set where your writing sits between teaching and taking a position.">
                <RangeInput value={data.toneStyle} onChange={(value) => updateData({ toneStyle: value })} leftLabel="Educational" rightLabel="Provocative" />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-heading text-xl font-semibold text-foreground">Voice sample</h1>
                <p className="mt-1 text-sm text-muted-foreground">Paste one of your best LinkedIn posts so future drafts sound closer to you.</p>
              </div>
              <Field label="LinkedIn post" description="Optional, you can add more samples later.">
                <TextArea
                  value={voiceSample}
                  onChange={(event) => setVoiceSample(event.target.value)}
                  placeholder="Paste a post you are proud of..."
                  className="min-h-52"
                />
              </Field>
            </div>
          )}

          {error && <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-negative">{error}</p>}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || saving}
              className={step === 0 ? 'invisible' : ''}
            >
              <IconArrowLeft size={16} />
              Back
            </Button>
            <Button type="button" onClick={handleNext} disabled={!canContinue() || saving}>
              {saving ? <IconLoader2 className="animate-spin" size={16} /> : step === STEPS.length - 1 ? <IconCheck size={16} /> : null}
              {step === STEPS.length - 1 ? 'Complete setup' : 'Continue'}
              {step < STEPS.length - 1 && <IconArrowRight size={16} />}
            </Button>
          </div>
        </section>

        <p className="text-center text-sm text-muted-foreground">
          <button type="button" onClick={() => navigate('/home')} className="hover:text-foreground">
            Skip for now
          </button>
        </p>
      </main>
    </div>
  )
}
