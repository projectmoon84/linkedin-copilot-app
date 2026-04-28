import { useEffect, useMemo, useState } from 'react'
import { IconCheck, IconKey, IconLoader2, IconPalette, IconTrash, IconUser } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  CardChoiceGroup,
  ChipGroup,
  Field,
  RangeInput,
  SelectInput,
  TextInput,
} from '@/components/ui/form-controls'
import { PageHeader } from '@/components/ui/page-header'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/contexts/UserProfileContext'
import { deleteApiKey, hasOpenAiKey, saveApiKey, testApiKeySecure } from '@/lib/ai-service-secure'
import {
  COMPANY_TYPES,
  DAYS_OF_WEEK,
  DISCIPLINES,
  FOLLOWER_RANGES,
  INDUSTRIES,
  LINKEDIN_PRESENCE,
  POSTING_FREQUENCIES,
  PRIMARY_GOALS,
  SPECIALIST_INTERESTS,
  STRATEGIC_PURPOSES,
  TARGET_AUDIENCES,
  type FollowerRange,
} from '@/lib/onboarding-types'
import { upsertUserProfile } from '@/lib/services/profile-service'
import { useTheme, type ThemePreference } from '@/lib/useTheme'
import { cn } from '@/lib/utils'

type SectionId = 'about' | 'style' | 'app'

interface AboutForm {
  displayName: string
  jobTitle: string
  yearsExperience: number | null
  companyType: string
  approxFollowerCount: FollowerRange | ''
  primaryDiscipline: string
  specialistInterests: string[]
  industries: string[]
  targetAudience: string[]
  primaryGoal: string
  currentLinkedinPresence: string
}

interface StyleForm {
  strategicPurpose: string
  postingFrequencyGoal: string
  preferredPostingDays: string[]
  toneFormality: number
  toneStyle: number
}

const EMPTY_ABOUT: AboutForm = {
  displayName: '',
  jobTitle: '',
  yearsExperience: null,
  companyType: '',
  approxFollowerCount: '',
  primaryDiscipline: '',
  specialistInterests: [],
  industries: [],
  targetAudience: [],
  primaryGoal: '',
  currentLinkedinPresence: '',
}

const EMPTY_STYLE: StyleForm = {
  strategicPurpose: '',
  postingFrequencyGoal: '',
  preferredPostingDays: [],
  toneFormality: 3,
  toneStyle: 3,
}

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof IconUser }> = [
  { id: 'about', label: 'About you', icon: IconUser },
  { id: 'style', label: 'Content style', icon: IconPalette },
  { id: 'app', label: 'App', icon: IconKey },
]

function numberToFollowerRange(value: number | null | undefined): FollowerRange | '' {
  if (value == null) return ''
  if (value <= 500) return '0-500'
  if (value <= 1000) return '500-1000'
  if (value <= 5000) return '1000-5000'
  if (value <= 10000) return '5000-10000'
  return '10000+'
}

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

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function SettingsPage() {
  const { user } = useAuth()
  const { profile, refreshProfile } = useUserProfile()
  const { preference, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<SectionId>('about')
  const [about, setAbout] = useState<AboutForm>(EMPTY_ABOUT)
  const [style, setStyle] = useState<StyleForm>(EMPTY_STYLE)
  const [initialAbout, setInitialAbout] = useState<AboutForm>(EMPTY_ABOUT)
  const [initialStyle, setInitialStyle] = useState<StyleForm>(EMPTY_STYLE)
  const [savingSection, setSavingSection] = useState<SectionId | null>(null)
  const [savedSection, setSavedSection] = useState<SectionId | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [openAiConfigured, setOpenAiConfigured] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null)

  useEffect(() => {
    if (!profile) return

    const nextAbout: AboutForm = {
      displayName: profile.displayName || '',
      jobTitle: profile.jobTitle || '',
      yearsExperience: profile.yearsExperience,
      companyType: profile.companyType || '',
      approxFollowerCount: numberToFollowerRange(profile.approxFollowerCount),
      primaryDiscipline: profile.primaryDiscipline || '',
      specialistInterests: profile.specialistInterests || [],
      industries: profile.industries || [],
      targetAudience: profile.targetAudience || [],
      primaryGoal: profile.primaryGoal || '',
      currentLinkedinPresence: profile.currentLinkedinPresence || '',
    }
    const nextStyle: StyleForm = {
      strategicPurpose: profile.strategicPurpose || '',
      postingFrequencyGoal: profile.postingFrequencyGoal || '',
      preferredPostingDays: profile.preferredPostingDays || [],
      toneFormality: profile.stylePreferences?.formality || 3,
      toneStyle: profile.stylePreferences?.style || 3,
    }

    setAbout(nextAbout)
    setStyle(nextStyle)
    setInitialAbout(nextAbout)
    setInitialStyle(nextStyle)
  }, [profile])

  useEffect(() => {
    void hasOpenAiKey().then(setOpenAiConfigured)
  }, [])

  const dirty = useMemo(
    () => ({
      about: !sameValue(about, initialAbout),
      style: !sameValue(style, initialStyle),
      app: apiKey.trim().length > 0,
    }),
    [about, apiKey, initialAbout, initialStyle, style],
  )

  const markSaved = (section: SectionId) => {
    setSavedSection(section)
    window.setTimeout(() => setSavedSection((current) => (current === section ? null : current)), 3000)
  }

  const saveAbout = async () => {
    if (!user) return

    setSavingSection('about')
    try {
      await upsertUserProfile({
        user_id: user.id,
        display_name: about.displayName,
        job_title: about.jobTitle,
        years_experience: about.yearsExperience,
        company_type: about.companyType || null,
        approx_follower_count: followerRangeToNumber(about.approxFollowerCount),
        primary_discipline: about.primaryDiscipline || null,
        specialist_interests: about.specialistInterests,
        industries: about.industries,
        target_audience: about.targetAudience,
        primary_goal: about.primaryGoal || null,
        current_linkedin_presence: about.currentLinkedinPresence || null,
        onboarding_completed: true,
      })
      await refreshProfile()
      setInitialAbout(about)
      markSaved('about')
    } finally {
      setSavingSection(null)
    }
  }

  const saveStyle = async () => {
    if (!user) return

    setSavingSection('style')
    try {
      await upsertUserProfile({
        user_id: user.id,
        strategic_purpose: style.strategicPurpose || null,
        posting_frequency_goal: style.postingFrequencyGoal || null,
        preferred_posting_days: style.preferredPostingDays,
        style_preferences: {
          formality: style.toneFormality,
          style: style.toneStyle,
        },
        onboarding_completed: true,
      })
      await refreshProfile()
      setInitialStyle(style)
      markSaved('style')
    } finally {
      setSavingSection(null)
    }
  }

  const saveApp = async () => {
    setSavingSection('app')
    setAppError(null)

    try {
      if (apiKey.trim()) {
        const saved = await saveApiKey(apiKey.trim())
        if (!saved) {
          setAppError('The API key could not be saved.')
          return
        }
        setOpenAiConfigured(true)
        setApiKey('')
        setShowKey(false)
      }

      markSaved('app')
    } finally {
      setSavingSection(null)
    }
  }

  const testKey = async () => {
    setTestingKey(true)
    setAppError(null)
    setTestResult(null)

    try {
      if (apiKey.trim()) {
        const saved = await saveApiKey(apiKey.trim())
        if (!saved) {
          setAppError('Save the key before testing it.')
          setTestResult('invalid')
          return
        }
        setOpenAiConfigured(true)
        setApiKey('')
      }

      const result = await testApiKeySecure()
      setTestResult(result.success ? 'valid' : 'invalid')
      if (!result.success) setAppError(result.error || 'The API key did not pass the connection test.')
    } finally {
      setTestingKey(false)
    }
  }

  const removeKey = async () => {
    const removed = await deleteApiKey()
    if (removed) {
      setOpenAiConfigured(false)
      setApiKey('')
      setTestResult(null)
      markSaved('app')
    } else {
      setAppError('The API key could not be removed.')
    }
  }

  const sectionStatus = (section: SectionId) => {
    if (savedSection === section) return 'Saved'
    if (dirty[section]) return 'Unsaved changes'
    return null
  }

  return (
    <div className="app-page mx-auto">
      <PageHeader title="Settings" description="Keep your profile, content style, and app preferences current." />

      <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const active = activeSection === section.id
              const status = sectionStatus(section.id)

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon size={17} />
                    {section.label}
                  </span>
                  {status && (
                    <span className={cn('mt-1 block text-2xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                      {status}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="app-card p-5 sm:p-6">
          {activeSection === 'about' && (
            <section className="space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">About you</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your role, focus, audience, and current LinkedIn presence.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <TextInput value={about.displayName} onChange={(event) => setAbout({ ...about, displayName: event.target.value })} />
                </Field>
                <Field label="Job title">
                  <TextInput value={about.jobTitle} onChange={(event) => setAbout({ ...about, jobTitle: event.target.value })} />
                </Field>
                <Field label="Years experience">
                  <TextInput
                    type="number"
                    min={0}
                    max={60}
                    value={about.yearsExperience ?? ''}
                    onChange={(event) => setAbout({ ...about, yearsExperience: event.target.value ? Number(event.target.value) : null })}
                  />
                </Field>
                <Field label="Company type">
                  <SelectInput value={about.companyType} onChange={(value) => setAbout({ ...about, companyType: value })} options={COMPANY_TYPES} />
                </Field>
                <Field label="Follower count">
                  <SelectInput value={about.approxFollowerCount} onChange={(value) => setAbout({ ...about, approxFollowerCount: value as FollowerRange })} options={FOLLOWER_RANGES} />
                </Field>
                <Field label="Primary discipline">
                  <SelectInput value={about.primaryDiscipline} onChange={(value) => setAbout({ ...about, primaryDiscipline: value })} options={DISCIPLINES} />
                </Field>
              </div>
              <Field label="Specialist interests">
                <ChipGroup options={SPECIALIST_INTERESTS} value={about.specialistInterests} onChange={(value) => setAbout({ ...about, specialistInterests: value })} />
              </Field>
              <Field label="Industries">
                <ChipGroup options={INDUSTRIES} value={about.industries} onChange={(value) => setAbout({ ...about, industries: value })} />
              </Field>
              <Field label="Target audience">
                <ChipGroup options={TARGET_AUDIENCES} value={about.targetAudience} onChange={(value) => setAbout({ ...about, targetAudience: value })} />
              </Field>
              <Field label="Primary goal">
                <CardChoiceGroup options={PRIMARY_GOALS} value={about.primaryGoal} onChange={(value) => setAbout({ ...about, primaryGoal: value })} columns="two" />
              </Field>
              <Field label="LinkedIn presence">
                <CardChoiceGroup options={LINKEDIN_PRESENCE} value={about.currentLinkedinPresence} onChange={(value) => setAbout({ ...about, currentLinkedinPresence: value })} columns="three" />
              </Field>
              <SaveRow section="about" dirty={dirty.about} saved={savedSection === 'about'} saving={savingSection === 'about'} onSave={() => void saveAbout()} />
            </section>
          )}

          {activeSection === 'style' && (
            <section className="space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">Content style</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your strategic purpose, cadence, and tone preferences.</p>
              </div>
              <Field label="Strategic purpose">
                <CardChoiceGroup
                  options={STRATEGIC_PURPOSES.map(({ value, label, description }) => ({ value, label, description }))}
                  value={style.strategicPurpose}
                  onChange={(value) => setStyle({ ...style, strategicPurpose: value })}
                  columns="one"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Posting frequency">
                  <SelectInput value={style.postingFrequencyGoal} onChange={(value) => setStyle({ ...style, postingFrequencyGoal: value })} options={POSTING_FREQUENCIES} />
                </Field>
                <Field label="Preferred days">
                  <ChipGroup options={DAYS_OF_WEEK.map(({ value, short }) => ({ value, label: short }))} value={style.preferredPostingDays} onChange={(value) => setStyle({ ...style, preferredPostingDays: value })} />
                </Field>
              </div>
              <Field label="Tone formality">
                <RangeInput value={style.toneFormality} onChange={(value) => setStyle({ ...style, toneFormality: value })} leftLabel="Formal" rightLabel="Conversational" />
              </Field>
              <Field label="Tone style">
                <RangeInput value={style.toneStyle} onChange={(value) => setStyle({ ...style, toneStyle: value })} leftLabel="Educational" rightLabel="Provocative" />
              </Field>
              <SaveRow section="style" dirty={dirty.style} saved={savedSection === 'style'} saving={savingSection === 'style'} onSave={() => void saveStyle()} />
            </section>
          )}

          {activeSection === 'app' && (
            <section className="space-y-6">
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">App</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your OpenAI connection and appearance preference.</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">OpenAI API key</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {openAiConfigured ? 'A key is configured. Add a new key to replace it.' : 'Add your key to enable AI generation.'}
                    </p>
                  </div>
                  {openAiConfigured && (
                    <Button variant="ghost" size="sm" onClick={() => void removeKey()}>
                      <IconTrash size={16} />
                      Remove
                    </Button>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <TextInput
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => {
                      setApiKey(event.target.value)
                      setTestResult(null)
                      setAppError(null)
                    }}
                    placeholder={openAiConfigured ? 'sk-...' : 'Paste your API key'}
                    className="font-mono text-sm"
                  />
                  <Button type="button" variant="outline" onClick={() => setShowKey((current) => !current)}>
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void testKey()} disabled={testingKey || (!apiKey && !openAiConfigured)}>
                    {testingKey && <IconLoader2 className="animate-spin" size={16} />}
                    Test
                  </Button>
                </div>
                {testResult === 'valid' && <p className="mt-2 text-sm text-positive">Connection works.</p>}
                {appError && <p className="mt-2 text-sm text-negative">{appError}</p>}
              </div>
              <Field label="Theme">
                <div className="grid gap-3 sm:grid-cols-3">
                  {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setTheme(theme)}
                      className={cn(
                        'rounded-lg border p-4 text-left capitalize transition-colors',
                        preference === theme ? 'border-primary bg-muted text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <span className="text-sm font-semibold">{theme}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <SaveRow section="app" dirty={dirty.app} saved={savedSection === 'app'} saving={savingSection === 'app'} onSave={() => void saveApp()} />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function SaveRow({
  dirty,
  saved,
  saving,
  onSave,
}: {
  section: SectionId
  dirty: boolean
  saved: boolean
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
      {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      {saved && (
        <span className="flex items-center gap-1 text-sm text-positive">
          <IconCheck size={16} />
          Saved
        </span>
      )}
      <Button onClick={onSave} disabled={saving || (!dirty && !saved)}>
        {saving && <IconLoader2 className="animate-spin" size={16} />}
        Save
      </Button>
    </div>
  )
}
