// Creator identity types and generation logic

import type { OnboardingData, StrategicPurpose } from './onboarding-types'

export interface CreatorIdentity {
  type: string
  tagline: string
  summary: string
  avatarSeed: string
  primaryColor: string
}

// Creator type mappings based on goals and strategic purpose
const CREATOR_TYPES: Record<string, { type: string; tagline: string }> = {
  // Goal + Purpose combinations
  'get_hired_discovery': {
    type: 'The Rising Star',
    tagline: 'Ready to shine',
  },
  'get_hired_trust': {
    type: 'The Proven Talent',
    tagline: 'Building your case',
  },
  'get_hired_authority': {
    type: 'The Industry Voice',
    tagline: 'Leading by example',
  },
  'attract_clients_discovery': {
    type: 'The Hidden Gem',
    tagline: 'About to be discovered',
  },
  'attract_clients_trust': {
    type: 'The Trusted Expert',
    tagline: 'Earning every client',
  },
  'attract_clients_authority': {
    type: 'The Go-To Name',
    tagline: 'The one they recommend',
  },
  'build_authority_discovery': {
    type: 'The Fresh Perspective',
    tagline: 'New voice, bold ideas',
  },
  'build_authority_trust': {
    type: 'The Knowledge Builder',
    tagline: 'Stacking proof',
  },
  'build_authority_authority': {
    type: 'The Thought Leader',
    tagline: 'Shaping the conversation',
  },
  'give_back_discovery': {
    type: 'The Quiet Mentor',
    tagline: 'Helping from the heart',
  },
  'give_back_trust': {
    type: 'The Community Builder',
    tagline: 'Growing together',
  },
  'give_back_authority': {
    type: 'The Generous Expert',
    tagline: 'Lifting others up',
  },
  // Fallbacks
  'other_discovery': {
    type: 'The Emerging Voice',
    tagline: 'Finding your frequency',
  },
  'other_trust': {
    type: 'The Steady Climber',
    tagline: 'One post at a time',
  },
  'other_authority': {
    type: 'The Established Creator',
    tagline: 'Consistent and confident',
  },
}

// Avatar style - using Open Peeps for all users
const AVATAR_STYLE = 'open-peeps'

// Colours mapped to strategic purpose
const PURPOSE_COLORS: Record<StrategicPurpose, string> = {
  discovery: 'var(--color-discovery)',
  trust: 'var(--color-trust)',
  authority: 'var(--color-authority)',
}

export function generateCreatorIdentity(data: OnboardingData): CreatorIdentity {
  const goal = data.primaryGoal || 'other'
  const purpose = data.strategicPurpose || 'discovery'
  const key = `${goal}_${purpose}`
  
  const creatorType = CREATOR_TYPES[key] || CREATOR_TYPES[`other_${purpose}`]
  
  // Generate a summary sentence
  const summary = generateSummary(data)
  
  // Create avatar seed from user data for consistency
  const avatarSeed = `${data.displayName}-${data.jobTitle}-${data.primaryDiscipline}`
  
  return {
    type: creatorType.type,
    tagline: creatorType.tagline,
    summary,
    avatarSeed,
    primaryColor: PURPOSE_COLORS[purpose],
  }
}

function generateSummary(data: OnboardingData): string {
  const name = data.displayName || 'You'
  const years = data.yearsExperience
  const discipline = formatDiscipline(data.primaryDiscipline)
  const audience = formatAudience(data.targetAudience)
  const goal = formatGoal(data.primaryGoal)
  
  // Build a natural sentence
  const experiencePhrase = years 
    ? years < 3 
      ? 'an emerging' 
      : years < 7 
        ? 'an experienced' 
        : 'a seasoned'
    : 'a'
  
  let summary = `${name} is ${experiencePhrase} ${discipline}`
  
  if (audience) {
    summary += ` connecting with ${audience}`
  }
  
  if (goal) {
    summary += ` to ${goal}`
  }
  
  summary += '.'
  
  return summary
}

function formatDiscipline(discipline: string | null): string {
  const map: Record<string, string> = {
    'ux-design': 'UX designer',
    'product-design': 'product designer',
    'ui-design': 'UI designer',
    'service-design': 'service designer',
    'ux-research': 'UX researcher',
    'content-design': 'content designer',
    'design-leadership': 'design leader',
    'design-ops': 'design ops specialist',
    'product-management': 'product manager',
    'other': 'design professional',
  }
  return map[discipline || 'other'] || 'design professional'
}

function formatAudience(audiences: string[]): string {
  if (!audiences.length) return ''
  
  const map: Record<string, string> = {
    'peers': 'fellow designers',
    'hiring-managers': 'hiring managers',
    'clients': 'potential clients',
    'juniors': 'emerging designers',
    'product-managers': 'product teams',
    'developers': 'developers',
    'executives': 'leadership',
    'general': 'professionals',
  }
  
  const formatted = audiences.slice(0, 2).map(a => map[a] || a)
  
  if (formatted.length === 1) {
    return formatted[0]
  }
  return `${formatted[0]} and ${formatted[1]}`
}

function formatGoal(goal: string | null): string {
  const map: Record<string, string> = {
    'get_hired': 'land their next opportunity',
    'attract_clients': 'grow their client base',
    'build_authority': 'establish thought leadership',
    'give_back': 'help others grow',
    'other': 'make an impact',
  }
  return map[goal || 'other'] || 'make an impact'
}

export function getAvatarUrl(seed: string, _discipline: string | null, size: number = 128): string {
  return `https://api.dicebear.com/7.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=f5f5f4`
}
