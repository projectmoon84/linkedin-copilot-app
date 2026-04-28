// Content framework configuration
// Based on: The LinkedIn Copilot Playbook
// Writing high-performance posts for product leaders, founders, and design-led teams
// 
// This defines the writing rules, structures, and guidelines for AI generation
// Edit this file to evolve your content strategy

export interface ContentFramework {
  version: string
  lastUpdated: string
  
  // Core philosophy
  corePrinciple: string
  targetAudience: AudienceProfile
  
  // The strategic purpose content strategy
  strategicPurposes: StrategicPurposeConfig[]
  
  // Post anatomy
  postAnatomy: PostSection[]
  
  // Hook patterns with examples
  hookPatterns: HookPattern[]
  
  // Voice and tone guidelines
  voiceGuidelines: VoiceGuidelines
  
  // Personal voice flavour (light touch)
  voiceFlavour: PersonalVoiceFlavour
  
  // Banned words and phrases
  bannedPhrases: string[]
  
  // Sentence starters to avoid
  bannedStarters: string[]
  
  // Engagement principles
  engagementPrinciples: string[]
  
  // Content formats ranked by success
  contentFormats: ContentFormat[]
  
  // Pre-publish checklist
  prePublishChecklist: string[]
  
  // Formatting rules
  formatRules: FormatRules
}

export interface AudienceProfile {
  primary: string[]
  values: string[]
  dislikes: string[]
  engagesWhen: string
}

export interface StrategicPurposeConfig {
  id: 'discovery' | 'trust' | 'authority'
  name: string
  description: string
  purpose: string[]
  typicalContent: string[]
  toneGuidance: string
}

export interface PostSection {
  name: string
  description: string
  rules: string[]
  avoid?: string[]
}

export interface HookPattern {
  name: string
  description: string
  examples: string[]
}

export interface VoiceGuidelines {
  shouldFeelLike: string[]
  avoid: string[]
  soundsLike: string
}

export interface PersonalVoiceFlavour {
  name: string
  description: string
  techniques: string[]
  examples: {
    instead_of: string
    try: string
  }[]
  usage: string
}

export interface ContentFormat {
  type: string
  probability: 'high' | 'medium' | 'low'
  examples: string[]
}

export interface FormatRules {
  maxParagraphLines: number
  useDigitsAfter: number
  bulletPointGuidance: string
  lineBreakGuidance: string
}

// ---------------------------------------------------------------------------
// NEW: Content themes, tone modifiers, and validation rules (v3.0)
// ---------------------------------------------------------------------------

export type StrategicPurpose = 'discovery' | 'trust' | 'authority'

export interface ContentTheme {
  id: string
  purpose: StrategicPurpose
  title: string
  description: string
  exampleHooks: string[]
  isDefault: boolean  // true for built-in, false for AI-generated
}

export interface ToneModifier {
  purpose: StrategicPurpose
  systemPromptAddition: string
  maxWordCount: number
  emphasisOn: string[]
  avoid: string[]
}

export interface ValidationRule {
  id: string
  purpose: StrategicPurpose
  check: string
  severity: 'warning' | 'error'
  message: string
}


// =============================================================================
// CONTENT THEMES — default library for UX/product design users
// These are the built-in themes. AI-generated personalised themes are stored
// in user_profiles.personalised_themes and merged at runtime.
// =============================================================================

export const CONTENT_THEMES: ContentTheme[] = [
  // ── Discovery themes ────────────────────────────────────────────────────
  {
    id: 'discovery-micro-interactions',
    purpose: 'discovery',
    title: 'Micro-interaction breakdowns',
    description: 'Tiny product details most people scroll past — sign-in flows, loading states, empty states, error messages.',
    exampleHooks: [
      'I logged into [product] this morning and noticed a 4-pixel detail that prevents thousands of support tickets.',
      'Most designers skip this screen entirely. It\'s the one that matters most.',
      'There\'s a loading state in [product] that tells you more about their design culture than any case study.',
    ],
    isDefault: true,
  },
  {
    id: 'discovery-default-settings',
    purpose: 'discovery',
    title: 'Default settings that shape behaviour',
    description: 'The choices product teams make before users make any choices — and how those defaults quietly steer outcomes.',
    exampleHooks: [
      'The most powerful design decision in [product] is one no user ever sees.',
      'Change one default and you change 80% of user behaviour. Here\'s a real example.',
      'Nobody on the team chose this setting. That\'s the problem.',
    ],
    isDefault: true,
  },
  {
    id: 'discovery-copy-labelling',
    purpose: 'discovery',
    title: 'Copy and labelling decisions',
    description: 'Words that build or erode trust — button labels, error messages, confirmation dialogs, empty states.',
    exampleHooks: [
      'One word in a button label cost this team three months of trust.',
      'The difference between "Delete" and "Remove" is bigger than you think.',
      'I found the most honest error message I\'ve ever seen in a product. It broke every copywriting rule.',
    ],
    isDefault: true,
  },
  {
    id: 'discovery-transactional-touchpoints',
    purpose: 'discovery',
    title: 'Transactional touchpoints nobody designs',
    description: 'Notifications, emails, receipts, password resets — the moments between the "designed" screens.',
    exampleHooks: [
      'The best retention feature in [product] isn\'t a feature. It\'s an email.',
      'Nobody on the design team has ever looked at this screen. 60% of users see it weekly.',
      'Your password reset flow says more about your product than your landing page.',
    ],
    isDefault: true,
  },

  // ── Trust themes ────────────────────────────────────────────────────────
  {
    id: 'trust-onboarding-friction',
    purpose: 'trust',
    title: 'Why onboarding feels like reading an instruction manual',
    description: 'Breakdowns of onboarding flows that teach too much and activate too little.',
    exampleHooks: [
      'I\'ve reviewed 30+ onboarding flows this year. The same mistake appears in almost all of them.',
      'We cut our onboarding from 7 steps to 2. Activation went up 34%.',
      'The best onboarding I\'ve seen does almost nothing on the first screen.',
    ],
    isDefault: true,
  },
  {
    id: 'trust-experience-debt',
    purpose: 'trust',
    title: 'Experience debt: the UX equivalent of tech debt',
    description: 'The cost of shipped-but-unloved features, accumulated friction, and design decisions nobody revisits.',
    exampleHooks: [
      'There\'s a pattern I keep seeing in product teams, and nobody\'s naming it.',
      'We have a name for technical shortcuts that compound over time. We don\'t have one for design shortcuts. We should.',
      'Every product over 3 years old has this problem. Most teams don\'t know it yet.',
    ],
    isDefault: true,
  },
  {
    id: 'trust-stakeholder-gap',
    purpose: 'trust',
    title: 'The gap between what stakeholders ask for and what users need',
    description: 'Navigating the tension between business requests and user reality — with specific examples.',
    exampleHooks: [
      'The feature request came from someone who\'d never used the product. Naturally, it became the top priority.',
      'The hardest design problem isn\'t the interface. It\'s this.',
      'I spent two weeks designing a feature nobody asked for. It became our most-used screen.',
    ],
    isDefault: true,
  },
  {
    id: 'trust-design-systems-practice',
    purpose: 'trust',
    title: 'Design systems that look great in Figma but fall apart in production',
    description: 'The gap between component libraries and real implementation — with real numbers and examples.',
    exampleHooks: [
      'Our design system has 47 button variants. We use three.',
      'I audited our design system last month. 40% of the components had never been used in production.',
      'The design system looked perfect in Figma. Then engineering built it.',
    ],
    isDefault: true,
  },

  // ── Authority themes ────────────────────────────────────────────────────
  {
    id: 'authority-best-practice-harmful',
    purpose: 'authority',
    title: '"Best practice" that\'s actually harmful in specific contexts',
    description: 'Challenging widely accepted design principles by showing where they fail.',
    exampleHooks: [
      'There\'s a design principle every team follows without questioning. In certain contexts, it actively harms users.',
      'The most successful product decision I\'ve seen this year broke every design rule.',
      'We followed accessibility best practices to the letter. The result was less accessible.',
    ],
    isDefault: true,
  },
  {
    id: 'authority-speed-vs-craft',
    purpose: 'authority',
    title: 'Speed vs craft: when shipping fast actually slows you down',
    description: 'The counterintuitive moments where taking longer produces better outcomes — backed by experience.',
    exampleHooks: [
      'We shipped in two weeks. We spent the next six months fixing what we shipped.',
      'The team that moved slowest delivered the most impact last quarter. Here\'s why.',
      'Speed to value is overrated.',
    ],
    isDefault: true,
  },
  {
    id: 'authority-friction-as-feature',
    purpose: 'authority',
    title: 'Why some friction in UX is a feature, not a bug',
    description: 'Cases where adding friction improves outcomes, builds trust, or prevents errors.',
    exampleHooks: [
      'Friction isn\'t the enemy. Confusion is.',
      'We added a step to our checkout flow. Conversions went up.',
      'The smoothest experience isn\'t always the best one. Here\'s a case that changed my thinking.',
    ],
    isDefault: true,
  },
  {
    id: 'authority-ai-design',
    purpose: 'authority',
    title: 'AI-generated design: what it gets right and what it fundamentally misses',
    description: 'An experienced take on where AI tools help, where they fail, and what that means for design as a discipline.',
    exampleHooks: [
      'I generated 50 UI designs with AI last week. Only one was usable. But that one taught me something.',
      'AI can produce a screen in seconds. It can\'t tell you whether the screen should exist.',
      'The thing AI design tools get wrong isn\'t the pixels. It\'s the intent.',
    ],
    isDefault: true,
  },
]


// =============================================================================
// TONE MODIFIERS — per-purpose additions to the system prompt
// These adjust the energy and approach without overriding the user's voice
// =============================================================================

export const TONE_MODIFIERS: Record<StrategicPurpose, ToneModifier> = {
  discovery: {
    purpose: 'discovery',
    systemPromptAddition: `Adjust the tone to be slightly more provocative and curiosity-driven.
Use a shorter, punchier hook — 1 line maximum.
Keep paragraphs to 2-3 lines. Shorter than usual.
The goal is pattern-interrupt: make the reader stop scrolling and think "wait, what?"
Prioritise curiosity over completeness. Leave the reader wanting more.
End with a surprising reframe or a line that makes people tag a colleague.`,
    maxWordCount: 200,
    emphasisOn: [
      'Curiosity and surprise',
      'Short, punchy delivery',
      'Specific product or UX details',
      'Pattern-interrupt hooks',
      'Shareability — "you need to see this"',
    ],
    avoid: [
      'Tutorial or how-to structure',
      'Long explanations',
      'Generic observations',
      'More than 200 words',
      'Teaching tone — this is a discovery, not a lesson',
    ],
  },
  trust: {
    purpose: 'trust',
    systemPromptAddition: `Adjust the tone to be measured and evidence-forward.
Include specific examples — product names, numbers, timelines, outcomes.
Show your working: explain the reasoning, not just the conclusion.
The goal is for the reader to think "this person really knows their stuff."
Structure as "here's what happened → here's what I learned → here's what it means."
Moderate length is fine — depth builds credibility here.`,
    maxWordCount: 300,
    emphasisOn: [
      'Specific evidence and examples',
      'Product names and real numbers',
      'Process and reasoning',
      'Frameworks others can reuse',
      'Depth over breadth',
    ],
    avoid: [
      'Vague claims without backing',
      'Too short to build credibility (under 100 words)',
      'Generic advice that could come from anyone',
      'Skipping the "how" — readers want the working',
    ],
  },
  authority: {
    purpose: 'authority',
    systemPromptAddition: `Adjust the tone to be confident but generous.
Take a clear position. Don't hedge with "it depends" — commit to a point of view.
But acknowledge complexity: show you've considered the other side.
Reference broader industry patterns, not just one isolated example.
The goal is for the reader to think "I want to follow this person's thinking."
End with a line that reframes the topic in a way the reader hadn't considered.`,
    maxWordCount: 280,
    emphasisOn: [
      'Clear, committed position',
      'Nuance and complexity',
      'Broader industry patterns',
      'Forward-looking perspective',
      'Generosity — share frameworks, credit others',
    ],
    avoid: [
      'Hedging or fence-sitting',
      'Self-promotional tone',
      'Obvious takes that everyone already agrees with',
      'Ignoring the counter-argument',
    ],
  },
}


// =============================================================================
// VALIDATION RULES — purpose-specific checks for the pre-publish checklist
// These supplement the general validation in validateContent()
// =============================================================================

export const VALIDATION_RULES: ValidationRule[] = [
  // ── Discovery rules ─────────────────────────────────────────────────────
  {
    id: 'discovery-too-long',
    purpose: 'discovery',
    check: 'Word count exceeds 200',
    severity: 'warning',
    message: 'Discovery posts work best under 200 words. Consider trimming — curiosity beats completeness.',
  },
  {
    id: 'discovery-reads-as-tutorial',
    purpose: 'discovery',
    check: 'Contains tutorial markers (step 1, first, how to, guide)',
    severity: 'warning',
    message: 'This reads like a tutorial. Discovery posts should reveal, not teach. Remove instructional framing.',
  },
  {
    id: 'discovery-weak-hook',
    purpose: 'discovery',
    check: 'Hook is longer than 15 words or lacks curiosity trigger',
    severity: 'error',
    message: 'Discovery hooks need to be punchy. Your opening line should make someone stop scrolling.',
  },

  // ── Trust rules ─────────────────────────────────────────────────────────
  {
    id: 'trust-no-specifics',
    purpose: 'trust',
    check: 'No product names, numbers, or concrete examples',
    severity: 'error',
    message: 'Trust posts need evidence. Add specific product names, numbers, or real examples.',
  },
  {
    id: 'trust-unsupported-claims',
    purpose: 'trust',
    check: 'Makes claims without showing reasoning',
    severity: 'warning',
    message: 'You\'re making claims without showing your working. Add "here\'s how" or "here\'s why" to build credibility.',
  },
  {
    id: 'trust-too-short',
    purpose: 'trust',
    check: 'Word count under 100',
    severity: 'warning',
    message: 'Trust posts need enough depth to build credibility. Consider expanding with specifics.',
  },

  // ── Authority rules ─────────────────────────────────────────────────────
  {
    id: 'authority-no-position',
    purpose: 'authority',
    check: 'No clear position or argument',
    severity: 'error',
    message: 'Authority posts need a clear position. What do you believe that others might not?',
  },
  {
    id: 'authority-self-promotional',
    purpose: 'authority',
    check: 'Contains self-promotional language',
    severity: 'warning',
    message: 'This feels self-promotional. Authority comes from generosity — share the insight, not the achievement.',
  },
  {
    id: 'authority-ignores-complexity',
    purpose: 'authority',
    check: 'Takes a strong position without acknowledging the other side',
    severity: 'warning',
    message: 'Strong positions are good, but acknowledge the complexity. Show you\'ve considered the counter-argument.',
  },
]


// =============================================================================
// THE FRAMEWORK - The LinkedIn Copilot Playbook
// =============================================================================

export const CONTENT_FRAMEWORK: ContentFramework = {
  version: '3.1.0',
  lastUpdated: '2026-02-09',

  // ---------------------------------------------------------------------------
  // CORE PRINCIPLE
  // ---------------------------------------------------------------------------
  corePrinciple: `The most effective LinkedIn posts are not lectures.
They are field notes from real product experiences.

High-performing posts are built on:
- specific observations
- real moments
- subtle but meaningful insight
- confident framing without over-explaining

The goal is not to teach.
The goal is to make smart people pause mid-scroll.`,

  // ---------------------------------------------------------------------------
  // TARGET AUDIENCE
  // ---------------------------------------------------------------------------
  targetAudience: {
    primary: [
      'Product leaders',
      'Founders',
      'Heads of Product',
      'Product managers and owners',
      'Senior designers involved in strategy',
    ],
    values: [
      'Clarity over hype',
      'Nuance',
      'Real experience over theory',
    ],
    dislikes: [
      'Cheesy engagement bait',
      'Generic thought leadership',
      'Hype and buzzwords',
    ],
    engagesWhen: 'They recognise a problem they\'ve lived through',
  },

  // ---------------------------------------------------------------------------
  // STRATEGIC PURPOSE CONTENT STRATEGY
  // Each post should sit clearly in ONE purpose
  // Peak performance comes from moving between them over time
  // ---------------------------------------------------------------------------
  strategicPurposes: [
    {
      id: 'discovery',
      name: 'Discovery',
      description: 'Get found by new people. Reveal what\'s hidden in plain sight.',
      purpose: [
        'Trigger curiosity and earn "see more" clicks',
        'Create posts people share with "you need to see this"',
        'Stop the scroll with unexpected observations',
      ],
      typicalContent: [
        'Micro-interaction breakdowns',
        'Default settings that shape behaviour',
        'Copy that builds or erodes trust',
        'Transactional touchpoints nobody designs',
        'The problem everyone feels but can\'t name',
      ],
      toneGuidance: 'Provocative, punchy hooks, shorter paragraphs, curiosity-driven. End with a surprising reframe.',
    },
    {
      id: 'trust',
      name: 'Trust',
      description: 'Build credibility with your audience. Name what people already feel.',
      purpose: [
        'Deepen trust with people already following you',
        'Show your expertise through depth, not claims',
        'Provide frameworks and processes others can use',
      ],
      typicalContent: [
        'Frameworks for common problems',
        'Case studies with real numbers',
        'Behind-the-scenes deep dives',
        'Design systems in practice (vs theory)',
        'Quiet friction audits of your own work',
      ],
      toneGuidance: 'Measured, evidence-forward, shows your working. Include specifics — product names, numbers, timelines. Structure as "here\'s how I did it".',
    },
    {
      id: 'authority',
      name: 'Authority',
      description: 'Convert followers into advocates. Challenge what people assume.',
      purpose: [
        'Shape industry conversation',
        'Position yourself as a reference point',
        'Provoke thoughtful debate',
      ],
      typicalContent: [
        'Contrarian takes backed by experience',
        'Best practices gone wrong',
        'Industry direction predictions',
        'Naming new patterns ("feature theatre")',
        'Generous provocations',
      ],
      toneGuidance: 'Confident, forward-looking, generous. Acknowledge nuance. Take a clear position but show you\'ve considered the other side.',
    },
  ],

  // ---------------------------------------------------------------------------
  // POST ANATOMY
  // All posts should follow this structure
  // ---------------------------------------------------------------------------
  postAnatomy: [
    {
      name: 'The Hook (scroll-stopper)',
      description: 'The opening line must earn the "see more" click.',
      rules: [
        'Do ONE of: reveal a discovery, introduce stakes, or frame a contradiction',
        'Be specific, not generic',
        'Promise insight, not opinion',
      ],
      avoid: [
        'Generic opinions',
        'Essay-style introductions',
        '"Lately I\'ve been thinking…"',
        'Numbered lists in the hook',
      ],
    },
    {
      name: 'The Setup (ground it in reality)',
      description: 'Within the first 2-3 lines, establish context.',
      rules: [
        'Name the product or context',
        'Describe the moment of interaction',
        'Identify the friction or surprise',
        'Specific beats abstract',
        'Observed beats theoretical',
      ],
    },
    {
      name: 'The Observation (the core moment)',
      description: 'Describe the exact thing that happened.',
      rules: [
        'Focus on: a label, a flow, a decision, a small behavioural cue',
        'Do not explain yet',
        'Let the reader picture it',
        'This section drives dwell time',
      ],
    },
    {
      name: 'The Meaning (light zoom-out)',
      description: 'Connect the observation to a broader insight — briefly.',
      rules: [
        'Make one point only',
        'Use plain language',
        'Stop one step earlier than feels necessary',
      ],
      avoid: [
        'Frameworks',
        'Jargon',
        'Over-explaining',
      ],
    },
    {
      name: 'The Provocation (without asking questions)',
      description: 'End with a statement that invites response, not a direct question.',
      rules: [
        'Draw a clear line (e.g., "Speed to value is overrated.")',
        'Reframe a belief (e.g., "Friction isn\'t the enemy. Confusion is.")',
        'Name a trade-off (e.g., "This makes power users happy — and everyone else leave.")',
      ],
      avoid: [
        '"What do you think?"',
        '"Thoughts?"',
        'Any engagement bait',
        'Direct questions at the end',
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // HOOK PATTERNS
  // The first 2 lines are everything. These patterns stop the scroll.
  // ---------------------------------------------------------------------------
  hookPatterns: [
    {
      name: 'Discovery reveal',
      description: 'Share something you noticed that others haven\'t articulated.',
      examples: [
        'Today I noticed a tiny product detail that changed how I think about onboarding.',
        'I logged into [product] and something felt off.',
        'I\'ve reviewed 200 checkout flows. Only 3 did this one thing.',
        'The apps I use most have one thing in common.',
      ],
    },
    {
      name: 'Stakes introduction',
      description: 'Lead with what\'s at risk or what changed.',
      examples: [
        'This looks like a small change. It isn\'t.',
        'This is where most products quietly lose momentum.',
        'We lost 40% of our users in one update.',
        'Three pixels changed our conversion rate by 23%.',
      ],
    },
    {
      name: 'Contradiction framing',
      description: 'Challenge conventional wisdom or frame a tension.',
      examples: [
        'The best onboarding I\'ve seen does almost nothing.',
        'Your product doesn\'t have a retention problem. It has a promise problem.',
        'Speed to value is overrated.',
        'Friction isn\'t the enemy. Confusion is.',
      ],
    },
    {
      name: 'Personal admission',
      description: 'Vulnerability beats authority. Admit something uncomfortable.',
      examples: [
        'I shipped a feature I knew would fail.',
        'I argued against a change that turned out to be right.',
        'I\'ve been doing this for 10 years and I still get this wrong.',
        'My design got ripped apart in the critique yesterday.',
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // VOICE GUIDELINES
  // How the content should sound and feel
  // ---------------------------------------------------------------------------
  voiceGuidelines: {
    shouldFeelLike: [
      'Observational',
      'Calm but confident',
      'Slightly opinionated',
      'Human and grounded',
    ],
    avoid: [
      'Hype',
      'Buzzwords',
      'AI evangelism',
      'Corporate or academic tone',
      'Generic "thought leadership"',
    ],
    soundsLike: 'I was using a product this morning, and something quietly interesting happened.',
  },

  // ---------------------------------------------------------------------------
  // PERSONAL VOICE FLAVOUR
  // A light touch of dry wit – the insight is the meal, this is the seasoning
  // ---------------------------------------------------------------------------
  voiceFlavour: {
    name: 'Dry observer',
    description: 'Slightly amused by the absurdity of product work. Not cynical – just noticing the gap between what we say and what we do.',
    techniques: [
      'State something obvious, then quietly undermine it',
      'Self-deprecating without being weak – own your mistakes with a shrug, not an apology',
      'Notice the absurdity in mundane product moments',
      'Dry, understated delivery – let the observation land without overselling it',
      'One wry line is enough – don\'t stack jokes',
    ],
    examples: [
      {
        instead_of: 'Most onboarding flows are too long and this causes drop-off.',
        try: 'We spent three sprints reducing onboarding friction. Users now drop off faster than ever. Progress.',
      },
      {
        instead_of: 'I made a mistake by not testing with real users.',
        try: 'I was so confident in my solution that I skipped user testing. The users were not equally confident.',
      },
      {
        instead_of: 'Design systems are often overcomplicated.',
        try: 'Our design system has 47 button variants. We use three.',
      },
      {
        instead_of: 'Stakeholders often ask for features that don\'t help users.',
        try: 'The feature request came from someone who\'d never used the product. Naturally, it became the top priority.',
      },
    ],
    usage: 'Use sparingly – one dry observation per post maximum. The insight must still land clearly for product leaders and founders. The wit makes it memorable, not clever.',
  },

  // ---------------------------------------------------------------------------
  // BANNED PHRASES
  // These make content feel generic or AI-generated. Never use them.
  // ---------------------------------------------------------------------------
  bannedPhrases: [
    // Engagement bait
    'What do you think?',
    'Thoughts?',
    'Agree?',
    'Let me know in the comments',
    'Drop a comment',
    // Generic LinkedIn-isms
    'And honestly',
    'To be honest',
    'Here\'s the thing',
    'Let\'s dive in',
    'At the end of the day',
    'Game changer',
    'Game changing',
    'Unpopular opinion',
    'Hot take',
    'This is your sign to',
    'Let me explain',
    'Let that sink in',
    'Read that again',
    'I\'ll say it louder for the people in the back',
    'Full stop',
    'Period.',
    'That\'s it. That\'s the post.',
    'Mic drop',
    'Mind = blown',
    'So much this.',
    'Can we talk about',
    'We need to talk about',
    'Nobody is talking about',
    'Why is nobody talking about',
    'Normalize',
    'It\'s giving',
    'The way that',
    'Not me doing X',
    'Tell me you\'re X without telling me',
    // AI-specific tells
    'Delve',
    'Delving',
    'Leverage',
    'Leveraging',
    'Landscape',
    'Paradigm',
    'Synergy',
    'Utilize',
    'Utilise',
    'Facilitate',
    'Robust',
    'Seamless',
    'Cutting-edge',
    'Holistic',
    'Streamline',
    'Empower',
    'Pivotal',
    'Navigate',
    'Embark',
    'Unpack',
    'Uncover',
    'Realm',
    'Tapestry',
    'Beacon',
    'It\'s important to note',
    'It\'s worth noting',
    'In today\'s fast-paced',
    'In today\'s world',
    'In conclusion',
    'To summarize',
    'To sum up',
    'At its core',
    'Dive deep',
    'Deep dive',
    'Double down',
    'Move the needle',
    'Circle back',
    'Low-hanging fruit',
    'Think outside the box',
    'Best-in-class',
    'World-class',
    'Next-level',
    'Take it to the next level',
    'Level up',
    'Supercharge',
    'Unlock',
    'Unlock the power',
    'Harness',
    'Harness the power',
    'Revolutionary',
    'Groundbreaking',
    'Transformative',
    'Here\'s the kicker',
  ],

  // ---------------------------------------------------------------------------
  // BANNED SENTENCE STARTERS
  // Never begin a post or paragraph with these
  // ---------------------------------------------------------------------------
  bannedStarters: [
    'In today\'s',
    'In the world of',
    'In the realm of',
    'As a designer',
    'As a product person',
    'As someone who',
    'I\'ve been thinking a lot about',
    'Lately I\'ve been thinking',
    'Here are X things',
    'Here are X ways',
    'Here are X tips',
    'X things I learned',
    'X ways to',
    'X tips for',
    'Ever noticed',
    'Have you ever',
    'Did you know',
    'Fun fact',
    'Pro tip',
    'Hot take:',
    'Unpopular opinion:',
    'Controversial opinion:',
    'Let\'s talk about',
    'Can we talk about',
    'I need to talk about',
    'We need to discuss',
    'It goes without saying',
    'Needless to say',
    'It\'s no secret that',
    'The fact of the matter is',
    'At this point in time',
  ],

  // ---------------------------------------------------------------------------
  // ENGAGEMENT PRINCIPLES
  // How posts escape the test batch and reach wider audiences
  // ---------------------------------------------------------------------------
  engagementPrinciples: [
    'Early engagement matters more than total followers',
    'Posts should invite discussion, not agreement',
    'Comments should naturally extend the idea (security, trust, trade-offs, alternatives)',
    'Replies should deepen the conversation, not just acknowledge praise',
    'Posts that generate longer comments perform better',
    'Back-and-forth discussion signals quality to the algorithm',
    'Multiple viewpoints increase reach',
    'People will respond without being asked — don\'t use engagement bait',
  ],

  // ---------------------------------------------------------------------------
  // CONTENT FORMATS BY SUCCESS RATE
  // ---------------------------------------------------------------------------
  contentFormats: [
    {
      type: 'Micro UX observations',
      probability: 'high',
      examples: ['Tiny product details', 'Labels and defaults', 'Subtle friction points'],
    },
    {
      type: 'Before/after moments',
      probability: 'high',
      examples: ['Product changes', 'Design iterations', 'A/B test results'],
    },
    {
      type: 'Live product changes',
      probability: 'high',
      examples: ['Real artefacts', 'Screens', 'Emails', 'Flows'],
    },
    {
      type: 'Onboarding strategies',
      probability: 'medium',
      examples: ['First-run experience', 'Activation moments', 'Time to value'],
    },
    {
      type: 'Product maturity insights',
      probability: 'medium',
      examples: ['Scaling challenges', 'Technical debt', 'Experience debt'],
    },
    {
      type: 'Trust and behaviour',
      probability: 'medium',
      examples: ['User psychology', 'Decision-making', 'Confidence building'],
    },
    {
      type: 'Abstract culture commentary',
      probability: 'low',
      examples: ['Team dynamics', 'Company culture', 'Industry trends'],
    },
    {
      type: 'Generic AI takes',
      probability: 'low',
      examples: ['AI predictions', 'Tool comparisons without tension'],
    },
    {
      type: 'Diary-style updates',
      probability: 'low',
      examples: ['Personal milestones', 'Work anniversaries'],
    },
  ],

  // ---------------------------------------------------------------------------
  // PRE-PUBLISH CHECKLIST
  // Check these before generating or approving a draft
  // ---------------------------------------------------------------------------
  prePublishChecklist: [
    'Is this based on a real or realistic product moment?',
    'Is the hook promising insight, not opinion?',
    'Is the observation concrete and easy to visualise?',
    'Did the explanation stop early?',
    'Does the ending provoke response without asking for it?',
    'Would a smart product person pause mid-scroll for this?',
  ],

  // ---------------------------------------------------------------------------
  // FORMATTING RULES
  // ---------------------------------------------------------------------------
  formatRules: {
    maxParagraphLines: 3,
    useDigitsAfter: 10,
    bulletPointGuidance: 'Avoid bullet points in posts. Use them only for genuine lists of 3+ items. Prose is more engaging.',
    lineBreakGuidance: 'Use line breaks liberally for readability. One thought per line works well on mobile.',
  },
}


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert the framework to a prompt-friendly string for AI generation
 */
export function frameworkToPrompt(framework: ContentFramework): string {
  let prompt = `## CONTENT FRAMEWORK (v${framework.version})

### CORE PRINCIPLE
${framework.corePrinciple}

### TARGET AUDIENCE
Primary readers: ${framework.targetAudience.primary.join(', ')}
They value: ${framework.targetAudience.values.join(', ')}
They dislike: ${framework.targetAudience.dislikes.join(', ')}
They engage when: ${framework.targetAudience.engagesWhen}

### POST STRUCTURE
Follow this anatomy for every post:

`

  framework.postAnatomy.forEach((section, i) => {
    prompt += `${i + 1}. **${section.name}**
   ${section.description}
   Rules: ${section.rules.join('; ')}
${section.avoid ? `   Avoid: ${section.avoid.join('; ')}` : ''}

`
  })

  prompt += `### HOOK PATTERNS (use one of these)
`
  framework.hookPatterns.forEach(pattern => {
    prompt += `- **${pattern.name}**: ${pattern.description}
  Examples: ${pattern.examples.slice(0, 2).map(e => `"${e}"`).join(', ')}
`
  })

  prompt += `
### VOICE
Should feel: ${framework.voiceGuidelines.shouldFeelLike.join(', ')}
Sounds like: "${framework.voiceGuidelines.soundsLike}"
Avoid: ${framework.voiceGuidelines.avoid.join(', ')}

### PERSONAL VOICE FLAVOUR: ${framework.voiceFlavour.name}
${framework.voiceFlavour.description}

Techniques (use sparingly – one per post max):
${framework.voiceFlavour.techniques.map(t => `- ${t}`).join('\n')}

Examples of the tone:
${framework.voiceFlavour.examples.slice(0, 2).map(e => `Instead of: "${e.instead_of}"
Try: "${e.try}"`).join('\n\n')}

${framework.voiceFlavour.usage}

### BANNED PHRASES (never use these)
${framework.bannedPhrases.slice(0, 30).map(p => `"${p}"`).join(', ')}

### BANNED STARTERS (never begin with these)
${framework.bannedStarters.slice(0, 15).map(s => `"${s}"`).join(', ')}

### FORMATTING
- Max ${framework.formatRules.maxParagraphLines} lines per paragraph
- ${framework.formatRules.lineBreakGuidance}
- ${framework.formatRules.bulletPointGuidance}

### FINAL CHECK
Before finishing, verify:
${framework.prePublishChecklist.map(c => `- ${c}`).join('\n')}
`

  return prompt
}

/**
 * Get strategic purpose guidance for prompt
 */
export function getStrategicPurposeGuidance(purposeId: StrategicPurpose): string {
  const framework = CONTENT_FRAMEWORK
  const purpose = framework.strategicPurposes.find(p => p.id === purposeId)
  
  if (!purpose) return ''
  
  return `### STRATEGIC PURPOSE: ${purpose.name.toUpperCase()}
${purpose.description}

Purpose of this post:
${purpose.purpose.map(p => `- ${p}`).join('\n')}

Typical content for this purpose:
${purpose.typicalContent.map(c => `- ${c}`).join('\n')}

Tone guidance:
${purpose.toneGuidance}
`
}

/**
 * Get the tone modifier prompt addition for a given purpose
 */
export function getToneModifierPrompt(purposeId: StrategicPurpose): string {
  const modifier = TONE_MODIFIERS[purposeId]
  if (!modifier) return ''

  return `## TONE ADJUSTMENT FOR ${purposeId.toUpperCase()} POST

${modifier.systemPromptAddition}

Emphasise: ${modifier.emphasisOn.join('; ')}
Avoid: ${modifier.avoid.join('; ')}
Target word count: under ${modifier.maxWordCount} words.
`
}

/**
 * Get content themes for a given purpose
 * Merges default themes with any personalised themes from the user profile
 */
export function getThemesForPurpose(
  purposeId: StrategicPurpose,
  personalisedThemes?: ContentTheme[] | null
): ContentTheme[] {
  const defaults = CONTENT_THEMES.filter(t => t.purpose === purposeId)
  
  if (!personalisedThemes || personalisedThemes.length === 0) {
    return defaults
  }

  const personalised = personalisedThemes.filter(t => t.purpose === purposeId)
  return [...personalised, ...defaults]
}

/**
 * Convert a content theme to a prompt-friendly string
 */
export function themeToPrompt(theme: ContentTheme): string {
  return `## CONTENT THEME: ${theme.title}
${theme.description}

Example hooks for this theme:
${theme.exampleHooks.map(h => `- "${h}"`).join('\n')}

Use this theme to guide the topic and angle of the post. The hook examples are for inspiration — don't copy them directly.
`
}

/**
 * Validate content against the framework (general checks)
 * Returns a score 0-100 and specific issues found
 */
export function validateContent(content: string): {
  score: number
  issues: { type: string; message: string; severity: 'error' | 'warning' }[]
} {
  const issues: { type: string; message: string; severity: 'error' | 'warning' }[] = []
  let score = 100
  
  const lowerContent = content.toLowerCase()
  
  // Check for banned phrases (with smarter matching for short phrases)
  CONTENT_FRAMEWORK.bannedPhrases.forEach(phrase => {
    const lowerPhrase = phrase.toLowerCase()
    // For short phrases, check they're standalone (not part of longer sentences)
    if (lowerPhrase.length <= 6) {
      // Match as whole phrase with word boundaries
      const escapedPhrase = lowerPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(^|\\s|\\n)${escapedPhrase}(\\s|\\n|$)`, 'i')
      if (regex.test(content)) {
        issues.push({
          type: 'banned_phrase',
          message: `Contains banned phrase: "${phrase}"`,
          severity: 'error',
        })
        score -= 10
      }
    } else if (lowerContent.includes(lowerPhrase)) {
      issues.push({
        type: 'banned_phrase',
        message: `Contains banned phrase: "${phrase}"`,
        severity: 'error',
      })
      score -= 10
    }
  })
  
  // Check for banned starters
  const lines = content.split('\n').filter(l => l.trim())
  CONTENT_FRAMEWORK.bannedStarters.forEach(starter => {
    if (lines[0]?.toLowerCase().startsWith(starter.toLowerCase())) {
      issues.push({
        type: 'banned_starter',
        message: `Starts with banned phrase: "${starter}"`,
        severity: 'error',
      })
      score -= 15
    }
  })
  
  // Check paragraph length
  const paragraphs = content.split('\n\n')
  paragraphs.forEach((para, i) => {
    const lineCount = para.split('\n').length
    if (lineCount > CONTENT_FRAMEWORK.formatRules.maxParagraphLines) {
      issues.push({
        type: 'paragraph_length',
        message: `Paragraph ${i + 1} exceeds ${CONTENT_FRAMEWORK.formatRules.maxParagraphLines} lines`,
        severity: 'warning',
      })
      score -= 3
    }
  })
  
  // Check for engagement bait questions at the end
  const engagementBait = ['what do you think?', 'thoughts?', 'agree?', 'let me know']
  const lastLine = lines[lines.length - 1]?.toLowerCase() || ''
  engagementBait.forEach(bait => {
    if (lastLine.includes(bait)) {
      issues.push({
        type: 'engagement_bait',
        message: `Ends with engagement bait: "${bait}"`,
        severity: 'error',
      })
      score -= 15
    }
  })
  
  // Check for direct questions at the end (the playbook says to avoid)
  if (lastLine.endsWith('?')) {
    issues.push({
      type: 'ends_with_question',
      message: 'Ends with a question — use a provocative statement instead',
      severity: 'warning',
    })
    score -= 5
  }
  
  // Check for hook quality (first line should be compelling)
  const firstLine = lines[0] || ''
  if (firstLine.length > 150) {
    issues.push({
      type: 'hook_too_long',
      message: 'Opening line is too long — hooks should be punchy',
      severity: 'warning',
    })
    score -= 5
  }
  
  // Check for specificity (good posts have concrete details)
  const hasNumbers = /\d+/.test(content)
  const hasProductNames = /figma|notion|slack|stripe|linear|vercel|webflow/i.test(content)
  if (!hasNumbers && !hasProductNames && content.length > 300) {
    issues.push({
      type: 'lacks_specificity',
      message: 'Consider adding specific details: numbers, product names, or concrete examples',
      severity: 'warning',
    })
    score -= 5
  }
  
  // Check minimum length (too short might lack substance)
  const wordCount = content.split(/\s+/).filter(Boolean).length
  if (wordCount < 50) {
    issues.push({
      type: 'too_short',
      message: 'Post may be too short to provide value',
      severity: 'warning',
    })
    score -= 5
  }
  
  // Check maximum length (LinkedIn has limits and attention spans are short)
  if (wordCount > 350) {
    issues.push({
      type: 'too_long',
      message: 'Consider trimming — shorter posts often perform better',
      severity: 'warning',
    })
    score -= 3
  }
  
  return {
    score: Math.max(0, score),
    issues,
  }
}

/**
 * Validate content with purpose-specific rules on top of general checks
 * Call this instead of validateContent() when the purpose is known
 */
export function validateContentForPurpose(
  content: string,
  purposeId: StrategicPurpose
): {
  score: number
  issues: { type: string; message: string; severity: 'error' | 'warning' }[]
} {
  // Start with general validation
  const result = validateContent(content)
  
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const lines = content.split('\n').filter(l => l.trim())
  const firstLine = lines[0] || ''
  const lowerContent = content.toLowerCase()

  // ── Discovery-specific checks ───────────────────────────────────────────
  if (purposeId === 'discovery') {
    // Too long for discovery
    if (wordCount > 200) {
      result.issues.push({
        type: 'discovery_too_long',
        message: 'Discovery posts work best under 200 words. Consider trimming — curiosity beats completeness.',
        severity: 'warning',
      })
      result.score -= 5
    }

    // Reads like a tutorial
    const tutorialMarkers = ['step 1', 'step 2', 'first,', 'second,', 'how to', 'a guide', 'here\'s how', 'follow these']
    const hasTutorialMarkers = tutorialMarkers.some(m => lowerContent.includes(m))
    if (hasTutorialMarkers) {
      result.issues.push({
        type: 'discovery_tutorial',
        message: 'This reads like a tutorial. Discovery posts should reveal, not teach.',
        severity: 'warning',
      })
      result.score -= 5
    }

    // Weak hook (too long for discovery)
    if (firstLine.split(/\s+/).length > 15) {
      result.issues.push({
        type: 'discovery_weak_hook',
        message: 'Discovery hooks should be punchy — aim for under 15 words in the opening line.',
        severity: 'warning',
      })
      result.score -= 5
    }
  }

  // ── Trust-specific checks ───────────────────────────────────────────────
  if (purposeId === 'trust') {
    // No specifics
    const hasNumbers = /\d+/.test(content)
    const hasProductNames = /figma|notion|slack|stripe|linear|vercel|webflow|shopify|mailchimp|hubspot|intercom|amplitude/i.test(content)
    if (!hasNumbers && !hasProductNames) {
      result.issues.push({
        type: 'trust_no_specifics',
        message: 'Trust posts need evidence. Add product names, numbers, or concrete examples.',
        severity: 'error',
      })
      result.score -= 10
    }

    // Too short
    if (wordCount < 100) {
      result.issues.push({
        type: 'trust_too_short',
        message: 'Trust posts need depth to build credibility. Consider expanding with specifics.',
        severity: 'warning',
      })
      result.score -= 5
    }

    // Claims without evidence
    const claimMarkers = ['always', 'never', 'every team', 'nobody', 'everyone knows', 'the truth is', 'the reality is']
    const evidenceMarkers = ['for example', 'specifically', 'we found', 'the data', 'in practice', 'I measured', 'the result', '%', 'increased', 'decreased']
    const hasClaims = claimMarkers.some(m => lowerContent.includes(m))
    const hasEvidence = evidenceMarkers.some(m => lowerContent.includes(m))
    if (hasClaims && !hasEvidence) {
      result.issues.push({
        type: 'trust_unsupported',
        message: 'You\'re making broad claims without evidence. Add "here\'s how" or specific results.',
        severity: 'warning',
      })
      result.score -= 5
    }
  }

  // ── Authority-specific checks ───────────────────────────────────────────
  if (purposeId === 'authority') {
    // No clear position
    const positionMarkers = ['I believe', 'I think', 'the problem is', 'we should', 'we need to', 'it\'s time', 'this matters because', 'here\'s why']
    const contradictionMarkers = ['but', 'however', 'the truth is', 'actually', 'in reality', 'contrary to', 'despite']
    const hasPosition = positionMarkers.some(m => lowerContent.includes(m)) || contradictionMarkers.some(m => lowerContent.includes(m))
    if (!hasPosition && wordCount > 80) {
      result.issues.push({
        type: 'authority_no_position',
        message: 'Authority posts need a clear position. What do you believe that others might not?',
        severity: 'warning',
      })
      result.score -= 5
    }

    // Self-promotional
    const promoMarkers = ['check out my', 'link in bio', 'dm me', 'I offer', 'I can help you', 'hire me', 'my course', 'my newsletter', 'sign up']
    const isPromotional = promoMarkers.some(m => lowerContent.includes(m))
    if (isPromotional) {
      result.issues.push({
        type: 'authority_self_promo',
        message: 'This feels self-promotional. Authority comes from generosity — share the insight, not the pitch.',
        severity: 'warning',
      })
      result.score -= 8
    }

    // No nuance / ignores complexity
    const nuanceMarkers = ['but', 'however', 'that said', 'of course', 'the exception', 'it depends', 'in some cases', 'the trade-off', 'the tension']
    const hasNuance = nuanceMarkers.some(m => lowerContent.includes(m))
    const hasStrongPosition = ['wrong', 'broken', 'failing', 'mistake', 'harmful', 'overrated'].some(m => lowerContent.includes(m))
    if (hasStrongPosition && !hasNuance) {
      result.issues.push({
        type: 'authority_no_nuance',
        message: 'Strong positions are good, but acknowledge complexity. Show you\'ve considered the counter-argument.',
        severity: 'warning',
      })
      result.score -= 5
    }
  }

  result.score = Math.max(0, result.score)
  return result
}


// =============================================================================
// POST FRAMEWORKS — from LI-post-generator.md
// =============================================================================

export const POST_FRAMEWORKS = [
  {
    id: 'story',
    name: 'Story',
    description: 'Personal narrative → business lesson',
    guidance: 'Open in the middle of a real moment. Ground it in specifics — a product launch, a bad hire, a decision that backfired. End with the lesson, not the story.',
  },
  {
    id: 'framework',
    name: 'Framework',
    description: 'Step-by-step breakdown',
    guidance: 'Present a clear process or mental model. Use → arrows for each step. Make it immediately applicable — readers should be able to use it today.',
  },
  {
    id: 'hot-take',
    name: 'Hot take',
    description: 'Contrarian opinion → proof → lesson',
    guidance: 'State the opposite of what most people believe. Spend most of the post proving it with evidence. End with the principle behind the take.',
  },
  {
    id: 'case-study',
    name: 'Case study',
    description: 'Specific results with data',
    guidance: 'Use exact numbers. Name the company, product, or team. Show the before and after. Let the data do the arguing.',
  },
  {
    id: 'behind-the-scenes',
    name: 'Behind the scenes',
    description: 'Process or "messy middle" reveal',
    guidance: 'Show the work that most people hide. The failed sprint, the scrapped design, the argument in the retro. Honesty beats polish.',
  },
] as const

export type PostFrameworkId = typeof POST_FRAMEWORKS[number]['id']


// =============================================================================
// CTA TYPES — from LI-post-generator.md
// =============================================================================

export const CTA_TYPES = [
  {
    id: 'question',
    name: 'Question',
    description: 'Ask the audience something',
    example: 'What\'s your experience with X?',
    guidance: 'Ask one genuine, specific question. Avoid vague openers like "What do you think?" Tie it back to the post\'s core tension.',
  },
  {
    id: 'resource',
    name: 'Resource (DMs)',
    description: 'Offer something free via DM',
    example: 'I put together a free [X]. Comment [KEYWORD] and I\'ll DM it.',
    guidance: 'Name the resource specifically. Use a single trigger keyword. Make the value of the resource obvious from the CTA itself.',
  },
  {
    id: 'handraiser',
    name: 'Handraiser',
    description: 'Ask for a comment keyword to signal interest',
    example: 'Comment "AUDIT" below if you want me to review your setup.',
    guidance: 'Pick a keyword that feels natural, not robotic. The handraiser creates a visible signal of intent without requiring a DM exchange first.',
  },
] as const

export type CtaTypeId = typeof CTA_TYPES[number]['id']


// =============================================================================
// EPIPHANY BRIDGE — post structure from LI-post-generator.md
// =============================================================================

export const EPIPHANY_BRIDGE = `## POST STRUCTURE: THE EPIPHANY BRIDGE

Every post follows this 6-part arc:

**1. Hook (Lines 1–2)**
The scroll-stopper. The reader must feel: "I need to read this."
Must be under 200 characters. First sentence under 12 words.

**2. Agitation (Lines 3–6)**
Validate the reader's pain. Make them nod. "That's me."
Be visceral and specific. Not "Sales is hard." Instead: "You spent 4 hours in the DMs and have £0 to show for it."

**3. The Shift (Lines 7–12)**
Introduce the New Way. Discredit the Old Way.
Old Way = what everyone else does.
New Way = your unique insight or framework.

**4. Evidence (Lines 13–18)**
Specific result, case study, or data point. Move from Opinion to Fact.
Use exact numbers. "We cut the onboarding drop-off from 62% to 31% in 6 weeks."

**5. Takeaway (Lines 19–24)**
3–5 actionable bullets using → arrows. The "save-able" part of the post.
Each bullet must stand alone as useful advice.

**6. CTA (Final lines)**
One ask. Never stack multiple CTAs.`


// =============================================================================
// VIRAL HOOK FRAMEWORKS — from LI-viral-hook-writer.md
// =============================================================================

export const VIRAL_HOOK_FRAMEWORKS = [
  {
    id: 'contrarian',
    name: 'Contrarian (pattern interrupt)',
    description: 'State the opposite of what the audience believes.',
    templates: [
      '[Common belief] is wrong. Here\'s why.',
      'Stop doing [popular tactic]. It\'s costing you [specific loss].',
    ],
    examples: [
      'Your hiring process is designed to fail.',
      'Stop asking for user feedback. You\'re getting the wrong answers.',
    ],
  },
  {
    id: 'specificity',
    name: 'Specificity hook (data-backed)',
    description: 'Use precise numbers. The brain trusts specific data.',
    templates: [
      'I [action] [exact number] [things]. [Unexpected result].',
      '[Exact metric] in [exact timeframe]. Here\'s the system.',
    ],
    examples: [
      'I reviewed 200 product specs. 90% had the same fatal flaw.',
      '4x pipeline growth in 11 weeks. One process change.',
    ],
  },
  {
    id: 'negative-bias',
    name: 'Negative bias (loss aversion)',
    description: 'Focus on mistakes, failures, or danger.',
    templates: [
      'The [topic] mistake costing you [specific loss].',
      'If you are still doing [old way], read this.',
    ],
    examples: [
      'The onboarding mistake killing your activation rate.',
      'If you\'re still writing PRDs like it\'s 2018, read this.',
    ],
  },
  {
    id: 'story-opener',
    name: 'Story opener (in media res)',
    description: 'Start in the middle of the action. No context, no setup.',
    templates: [
      '[Dramatic moment]. [One-line setup].',
      'I stared at [specific thing]. [Unexpected observation].',
    ],
    examples: [
      'The design review went quiet. Nobody knew what to say.',
      'I stared at our retention chart for 20 minutes. Something was wrong.',
    ],
  },
] as const

export type ViralHookFrameworkId = typeof VIRAL_HOOK_FRAMEWORKS[number]['id']


// =============================================================================
// HOOK HARD CONSTRAINTS — from LI-viral-hook-writer.md
// =============================================================================

export const HOOK_CONSTRAINTS = `## HOOK HARD CONSTRAINTS

1. NO question openers ("Did you know?" or "Are you struggling?")
2. NO label openers ("Here is how to..." or "5 Tips for...")
3. Each hook must be under 200 characters (one line on mobile)
4. NO hashtags
5. NO emojis
6. NO "I'm excited to share" or any variation
7. First sentence must be under 12 words
8. Must sound like a human, not a press release`


// =============================================================================
// TIERED CONSTRAINT SYSTEM
// Tier 1: Always on — the absolute worst AI clichés, always banned
// Tier 2: Guided — the rest of the banned list, used at lower penalty
// =============================================================================

export const TIER_1_BANNED: string[] = [
  'unleash',
  'game-changer',
  'game changer',
  'dive deep',
  'deep dive',
  'delve',
  'delving',
  'leverage',
  'leveraging',
  'synergy',
  'thought leader',
  'disrupt',
  'transform',
  'transformative',
  'elevate',
  'seamless',
  'robust',
  'foster',
  'empower',
  'holistic',
]


// =============================================================================
// ADDITIONAL BANNED VOCABULARY — from LI-post-generator.md + LI-viral-hook-writer.md
// =============================================================================

export const ADDITIONAL_BANNED_VOCAB: string[] = [
  // From LI-post-generator.md (not already in CONTENT_FRAMEWORK.bannedPhrases)
  'tapestry',
  'game-changer',
  'foster',
  'utilize',
  'synergy',
  'in today\'s world',
  'I\'m excited to share',
  'let\'s talk about',
  // From LI-viral-hook-writer.md
  'unleash',
  'landscape',
  'elevate',
  // Formatting anti-patterns
  'In conclusion',
  'Furthermore',
  'To summarise',
  'It goes without saying',
]


// =============================================================================
// FORMATTING CONSTRAINTS — from LI-post-generator.md
// =============================================================================

export const POST_FORMATTING_CONSTRAINTS = `## FORMATTING RULES (non-negotiable)

- No paragraph longer than 2 lines
- Blank line between every paragraph
- Use → for bullet lists, never numbered lists in the body
- No hashtags in the body (3 max at the very end if needed)
- No emojis
- No external links in the post body (kills reach significantly)
- No "In conclusion," "Furthermore," or filler transitions
- Every sentence must pass the Bar Test: would you say this at a bar?`


// =============================================================================
// HELPER: build viral hook framework prompt string
// =============================================================================

export function viralHookFrameworksToPrompt(): string {
  return VIRAL_HOOK_FRAMEWORKS.map(f => `**${f.name}**
${f.description}
Templates:
${f.templates.map(t => `- "${t}"`).join('\n')}
Examples:
${f.examples.map(e => `- "${e}"`).join('\n')}`).join('\n\n')
}


// =============================================================================
// HELPER: build post frameworks prompt string
// =============================================================================

export function postFrameworksToPrompt(preferredFramework?: string): string {
  const intro = preferredFramework
    ? `Use the **${preferredFramework}** framework for this post.`
    : `Choose the framework that best fits the content. Declare your choice in the output JSON as "framework".`

  const list = POST_FRAMEWORKS.map(f =>
    `**${f.name}** — ${f.description}\n${f.guidance}`
  ).join('\n\n')

  return `## POST FRAMEWORKS\n\n${intro}\n\n${list}`
}


// =============================================================================
// HELPER: build CTA type prompt string
// =============================================================================

export function ctaTypeToPrompt(ctaId: CtaTypeId): string {
  const cta = CTA_TYPES.find(c => c.id === ctaId)
  if (!cta) return ''
  return `## CTA TYPE: ${cta.name.toUpperCase()}

${cta.guidance}

Example: "${cta.example}"`
}


// =============================================================================
// UX DOMAIN KNOWLEDGE — distilled from UX & product design knowledge base
// Injected into the system prompt so the AI writes with genuine UX expertise
// =============================================================================

export const UX_DOMAIN_KNOWLEDGE = `## UX & PRODUCT DESIGN DOMAIN KNOWLEDGE

You are writing for and from the perspective of someone with deep UX and product design expertise. Apply this knowledge naturally when generating or evaluating content — use it to make posts more insightful and specific, not to lecture.

### Core principles to draw on

**Cognitive load**: The brain holds roughly 4 chunks in working memory. Good design minimises unnecessary decisions. Key patterns: progressive disclosure, sensible defaults, chunking (3–5 items), recognition over recall, consistency. These make compelling post topics because most teams violate them daily.

**Visual hierarchy**: Users scan in 3 seconds. One dominant element per view — if everything is emphasised, nothing is. Size, weight, contrast, and whitespace create hierarchy, not decoration. The F-pattern (text-heavy) and Z-pattern (visual) govern where attention lands.

**Feedback loops**: Silence is the enemy of good UX. Immediate (<100ms) for clicks/toggles, skeleton screens for anything >1 second (not spinners — skeletons show structure), clear success and error states. Error messages must answer: what happened, why, what now?

**Decision architecture**: Default bias (most users accept defaults — make defaults optimal), anchoring (first option sets expectations), choice paralysis (beyond 5–7 options, quality drops), loss aversion ("Don't lose your progress" outperforms "Save your progress").

**Key UX laws** (use naturally, not as labels):
- Hick's Law: fewer choices → faster decisions
- Fitts's Law: important targets should be large and close to the cursor/thumb
- Jakob's Law: users prefer interfaces that work like ones they already know
- Peak-end rule: people judge experiences by the peak moment and the ending
- Gestalt proximity: elements placed close together are perceived as related

**Flow design, not screen design**: Happy path, edge cases (0 items? 1,000 items? missing data?), error recovery, empty states (opportunity, not dead end), loading states (skeleton > spinner).

**Microcopy**: Words are part of the interface. Button labels should use verbs that describe outcomes ("Save changes" not "Submit"). Error messages answer three questions. Empty states explain what will appear and provide the action to fill it.

**Emotional design**: First impressions form in 3 seconds. Reduce anxiety around irreversible actions with confirmation and undo. Match tone to emotional state — calm for errors, encouraging for onboarding, serious for destructive actions.

**Accessibility as UX**: Accessible design is better design for everyone. Touch targets 44×44px minimum, 4.5:1 contrast ratio, colour independence, keyboard navigation, visible focus indicators.

### UX/product terminology to use fluently

Information architecture, cognitive load, progressive disclosure, affordance, mental model, user flow, friction, onboarding, activation, retention, churn, conversion, A/B test, usability, accessibility, WCAG, design system, component library, design tokens, empty state, error state, loading state, skeleton screen, modal, tooltip, microcopy, CTA, affordance, wireframe, prototype, usability testing, think-aloud, task completion rate, drop-off, funnel, heatmap, session recording, product-market fit, feature theatre, experience debt, technical debt.

### What makes a strong UX/product design post

The most compelling posts in this space are built on:
- A specific observation from a real product (name it if you can)
- A gap between how something was designed and how it's actually used
- A decision most teams make wrong, with the reasoning behind the better approach
- A UX law or principle shown in action — not explained academically
- Numbers that prove the point (conversion uplift, drop-off rate, time-to-value change)

Avoid academic or theoretical framing. Write like someone who's shipped real products and noticed something worth naming.`


// =============================================================================
// REPURPOSE FORMATS — from content-repurposer skill
// =============================================================================

export const REPURPOSE_FORMATS = [
  {
    id: 'twitter-thread' as const,
    name: 'Twitter / X thread',
    description: 'A punchy thread with one insight per tweet',
    icon: '𝕏',
    prompt: `Transform this LinkedIn post into a Twitter/X thread.

Rules:
- Hook tweet: standalone, under 280 characters, creates curiosity without relying on the original post's context
- 5–7 body tweets: one key insight per tweet, each must stand alone and be worth reading on its own
- Final tweet: a soft CTA (follow, reply, or save)
- No hashtags in the thread body
- Never copy-paste text from the original — rewrite for the Twitter voice (more punchy, more direct, shorter sentences)
- Each tweet numbered at the end: (1/8), (2/8) etc.

Return only the thread tweets, one per paragraph, separated by blank lines.`,
  },
  {
    id: 'email-snippet' as const,
    name: 'Email snippet',
    description: 'A newsletter extract with subject line options',
    icon: '✉',
    prompt: `Transform this LinkedIn post into an email newsletter snippet.

Rules:
- Provide 3 subject line options: one curiosity-driven, one benefit-led, one urgency-based
- Write 150–250 words expanding on the strongest insight from the post
- More personal and intimate tone than the social media original — write as if to a trusted subscriber
- One CTA at the end (reply, click, save)
- Never copy-paste the original — rewrite from scratch for the email format

Format:
Subject lines:
1. [Curiosity]
2. [Benefit]
3. [Urgency]

---

[Email body]`,
  },
  {
    id: 'carousel' as const,
    name: 'Carousel outline',
    description: 'A slide-by-slide breakdown for LinkedIn or Instagram',
    icon: '▤',
    prompt: `Transform this LinkedIn post into a visual carousel outline.

Rules:
- Cover slide: rewrite the hook for a visual format (bold, short, designed to stop the scroll)
- 6–8 content slides: one insight per slide, max 20 words of text each
- Each slide should have: a headline + 1–2 supporting points or a short example
- Final slide: a follow/save/comment CTA
- Include a brief note on what visual treatment would suit each slide (e.g. "before/after comparison", "single stat", "short list")
- Never just reformat the post text — think in slides, not paragraphs

Format each slide as:
Slide [N]: [Headline]
Visual note: [suggestion]
Content: [text]`,
  },
  {
    id: 'video-script' as const,
    name: 'Video script (60s)',
    description: 'A short-form video script for TikTok, Reels, or Shorts',
    icon: '▶',
    prompt: `Transform this LinkedIn post into a 60-second short-form video script.

Rules:
- Hook (first 3 seconds): one line of spoken dialogue + a text-on-screen overlay suggestion
- Body (45 seconds): 3 key points delivered conversationally — like talking to a colleague, not presenting
- CTA (final 12 seconds): what to do next (follow, save, comment, check link)
- Include a brief visual suggestion for each section
- Write it to be spoken naturally — short sentences, no corporate language, contractions fine
- Approximate timing for each section

Format:
[0–3s] HOOK
Spoken: "..."
On screen: "..."

[3–48s] BODY
Point 1 (~15s): ...
Visual: ...
Point 2 (~15s): ...
Visual: ...
Point 3 (~15s): ...
Visual: ...

[48–60s] CTA
Spoken: "..."`,
  },
  {
    id: 'quote-cards' as const,
    name: 'Quote cards',
    description: 'Three to five standalone quotes for social sharing',
    icon: '❝',
    prompt: `Extract 3–5 quote cards from this LinkedIn post.

Rules:
- Each quote must be genuinely quotable: punchy, under 15 words, stands alone without context
- No quotes that require reading the post to understand — each must land cold
- Format: "[Quote]"
- After each quote, note which emotion or reaction it targets: (Curiosity / Agreement / Surprise / Provocation / Validation)
- Suggest recommended image dimensions: 1080×1080 for square or 1080×1350 for portrait

Return only the quotes in this format:
"[Quote]"
Reaction: [type]
Format: [dimensions]`,
  },
] as const

export type RepurposeFormatId = typeof REPURPOSE_FORMATS[number]['id']

export function repurposeFormatToPrompt(formatId: RepurposeFormatId, originalPost: string): string {
  const format = REPURPOSE_FORMATS.find(f => f.id === formatId)
  if (!format) return ''

  return `${format.prompt}

---

## ORIGINAL POST

${originalPost}

---

Important: maintain the author's voice and perspective. The core insight belongs to them — your job is to reformat it for a new platform without losing what made the original work.`
}
