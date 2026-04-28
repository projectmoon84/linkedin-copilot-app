// Onboarding form data types

export interface OnboardingData {
  // Step 1: Role & experience
  displayName: string
  jobTitle: string
  yearsExperience: number | null
  companyType: CompanyType | null

  // Step 2: Professional focus
  primaryDiscipline: string | null
  specialistInterests: string[]
  industries: string[]

  // Step 3: Audience & goals
  targetAudience: string[]
  primaryGoal: PrimaryGoal | null
  currentLinkedinPresence: LinkedinPresence | null
  approxFollowerCount: FollowerRange | null

  // Step 4: Voice analysis
  toneSamples: string[]

  // Step 5: Strategic purpose
  strategicPurpose: StrategicPurpose | null

  // Step 6: Content preferences
  toneFormality: number // 1-5 scale: formal to conversational
  toneStyle: number // 1-5 scale: educational to provocative
  postingFrequencyGoal: PostingFrequency | null

  // NEW: Content goals & cadence (step 6 expansion)
  contentGoals: ContentGoal[]
  preferredPostingDays: string[]
}

export type CompanyType = 'agency' | 'in_house' | 'freelance' | 'startup' | 'enterprise' | 'other'

export type PrimaryGoal = 'get_hired' | 'attract_clients' | 'build_authority' | 'give_back' | 'other'

export type LinkedinPresence = 'new' | 'occasional' | 'regular'

export type FollowerRange = '0-500' | '500-1000' | '1000-5000' | '5000-10000' | '10000+'

export type StrategicPurpose = 'discovery' | 'trust' | 'authority'

export type PostingFrequency = 'daily' | 'few_times_week' | 'weekly' | 'fortnightly'

// NEW: Content goals — what success looks like for the user on LinkedIn
export type ContentGoal =
  | 'get_noticed'       // Get noticed by hiring managers
  | 'attract_clients'   // Attract freelance or consulting clients
  | 'build_reputation'  // Build a reputation as an expert
  | 'share_knowledge'   // Share knowledge and give back
  | 'promote_product'   // Promote a product or service
  | 'grow_network'      // Grow professional network

// Option lists for form selects

export const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: 'in_house', label: 'In-house' },
  { value: 'agency', label: 'Agency' },
  { value: 'freelance', label: 'Freelance / Independent' },
  { value: 'startup', label: 'Startup' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'other', label: 'Other' },
]

export const DISCIPLINES: { value: string; label: string }[] = [
  { value: 'ux-design', label: 'UX Design' },
  { value: 'product-design', label: 'Product Design' },
  { value: 'ui-design', label: 'UI Design' },
  { value: 'service-design', label: 'Service Design' },
  { value: 'ux-research', label: 'UX Research' },
  { value: 'content-design', label: 'Content Design' },
  { value: 'design-leadership', label: 'Design Leadership' },
  { value: 'design-ops', label: 'Design Ops' },
  { value: 'product-management', label: 'Product Management' },
  { value: 'other', label: 'Other' },
]

export const SPECIALIST_INTERESTS: { value: string; label: string }[] = [
  { value: 'design-systems', label: 'Design systems' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'ai-ml', label: 'AI & machine learning' },
  { value: 'mobile', label: 'Mobile design' },
  { value: 'web', label: 'Web design' },
  { value: 'prototyping', label: 'Prototyping' },
  { value: 'user-research', label: 'User research' },
  { value: 'data-visualisation', label: 'Data visualisation' },
  { value: 'motion-design', label: 'Motion design' },
  { value: 'design-tokens', label: 'Design tokens' },
  { value: 'figma', label: 'Figma' },
  { value: 'design-leadership', label: 'Design leadership' },
  { value: 'career-growth', label: 'Career growth' },
  { value: 'hiring', label: 'Hiring & interviews' },
]

export const INDUSTRIES: { value: string; label: string }[] = [
  { value: 'tech', label: 'Tech / Software' },
  { value: 'fintech', label: 'Fintech / Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'saas', label: 'SaaS / B2B' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'travel', label: 'Travel / Hospitality' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government / Public sector' },
  { value: 'agency', label: 'Agency / Consultancy' },
  { value: 'other', label: 'Other' },
]

export const TARGET_AUDIENCES: { value: string; label: string }[] = [
  { value: 'peers', label: 'Peers (other designers)' },
  { value: 'hiring-managers', label: 'Hiring managers / Recruiters' },
  { value: 'clients', label: 'Potential clients' },
  { value: 'juniors', label: 'Junior designers' },
  { value: 'product-managers', label: 'Product managers' },
  { value: 'developers', label: 'Developers' },
  { value: 'executives', label: 'Executives / Leadership' },
  { value: 'general', label: 'General professional audience' },
]

export const PRIMARY_GOALS: { value: PrimaryGoal; label: string; description: string }[] = [
  { value: 'get_hired', label: 'Get hired', description: 'Find my next role or opportunity' },
  { value: 'attract_clients', label: 'Attract clients', description: 'Build a pipeline for freelance or consulting work' },
  { value: 'build_authority', label: 'Build authority', description: 'Establish myself as a thought leader' },
  { value: 'give_back', label: 'Give back', description: 'Share knowledge and help others grow' },
  { value: 'other', label: 'Other', description: 'Something else entirely' },
]

export const LINKEDIN_PRESENCE: { value: LinkedinPresence; label: string; description: string }[] = [
  { value: 'new', label: 'New to posting', description: "I rarely or never post" },
  { value: 'occasional', label: 'Occasional poster', description: 'I post every now and then' },
  { value: 'regular', label: 'Regular poster', description: 'I post at least weekly' },
]

export const FOLLOWER_RANGES: { value: FollowerRange; label: string }[] = [
  { value: '0-500', label: 'Under 500' },
  { value: '500-1000', label: '500 – 1,000' },
  { value: '1000-5000', label: '1,000 – 5,000' },
  { value: '5000-10000', label: '5,000 – 10,000' },
  { value: '10000+', label: '10,000+' },
]

export const POSTING_FREQUENCIES: { value: PostingFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'few_times_week', label: 'A few times a week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: 'Every couple of weeks' },
]

export const STRATEGIC_PURPOSES: { value: StrategicPurpose; label: string; description: string; color: string }[] = [
  {
    value: 'discovery',
    label: 'Discovery',
    description: "Get found by new people. Shareable, surprising posts that make people tag a colleague. Micro UX details, tiny product decisions, things hidden in plain sight.",
    color: 'emerald',
  },
  {
    value: 'trust',
    label: 'Trust',
    description: "Build credibility with your audience. Evidence-forward posts that show your working. Frameworks, case studies, behind-the-scenes deep dives.",
    color: 'sky',
  },
  {
    value: 'authority',
    label: 'Authority',
    description: "Convert followers into advocates. Confident positions that acknowledge nuance. Contrarian takes, industry direction, challenging the status quo.",
    color: 'violet',
  },
]

// NEW: Content goals options for onboarding and settings
export const CONTENT_GOALS: { value: ContentGoal; label: string; description: string }[] = [
  { value: 'get_noticed', label: 'Get noticed by hiring managers', description: 'Increase visibility with people who hire' },
  { value: 'attract_clients', label: 'Attract freelance or consulting clients', description: 'Build a pipeline of inbound leads' },
  { value: 'build_reputation', label: 'Build a reputation as an expert', description: 'Become a go-to voice in your field' },
  { value: 'share_knowledge', label: 'Share knowledge and give back', description: 'Help others learn from your experience' },
  { value: 'promote_product', label: 'Promote a product or service', description: 'Drive awareness for something you\'re building' },
  { value: 'grow_network', label: 'Grow my professional network', description: 'Connect with more people in your industry' },
]

// NEW: Days of the week for preferred posting days picker
export const DAYS_OF_WEEK: { value: string; label: string; short: string }[] = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
]

// Initial empty state
export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  displayName: '',
  jobTitle: '',
  yearsExperience: null,
  companyType: null,
  primaryDiscipline: null,
  specialistInterests: [],
  industries: [],
  targetAudience: [],
  primaryGoal: null,
  currentLinkedinPresence: null,
  approxFollowerCount: null,
  toneSamples: [],
  strategicPurpose: null,
  toneFormality: 3,
  toneStyle: 3,
  postingFrequencyGoal: null,
  contentGoals: [],
  preferredPostingDays: [],
}
