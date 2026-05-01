import * as XLSX from 'xlsx'

export interface ParsedAnalyticsImport {
  impressions: number | null
  reactions: number | null
  comments: number | null
  reposts: number | null
  saves: number | null
  membersReached: number | null
  premiumCustomButtonInteractions: number | null
  profileViewsAfter: number | null
  followersGainedFromPost: number | null
  sendsOnLinkedIn: number | null
  linkedinPostUrl: string | null
  publishedDate: string | null
  audienceDemographics: {
    companySizes?: Record<string, number>
    jobTitles?: Record<string, number>
    companies?: Record<string, number>
    industries?: Record<string, number>
    locations?: Record<string, number>
    seniority?: Record<string, number>
    topJobTitle?: string | null
    topLocation?: string | null
    topIndustry?: string | null
  } | null
}

interface ParseOptions {
  draftTitle?: string | null
  preferredUrl?: string | null
}

type MetricField =
  | 'impressions'
  | 'reactions'
  | 'comments'
  | 'reposts'
  | 'saves'
  | 'membersReached'
  | 'premiumCustomButtonInteractions'
  | 'profileViewsAfter'
  | 'followersGainedFromPost'
  | 'sendsOnLinkedIn'
  | 'linkedinPostUrl'
  | 'publishedDate'

const METRIC_SYNONYMS: Record<MetricField, string[]> = {
  impressions: ['impressions', 'impression'],
  reactions: ['reactions', 'reaction', 'likes'],
  comments: ['comments', 'comment'],
  reposts: ['reposts', 'repost', 'reshares', 'reshare', 'shares', 'share'],
  saves: ['saves', 'save', 'post saves', 'post save'],
  membersReached: ['members reached', 'member reached', 'reached', 'unique viewers', 'unique reach'],
  premiumCustomButtonInteractions: ['premium custom button interactions', 'custom button interactions'],
  profileViewsAfter: ['profile viewers from this post', 'profile viewers'],
  followersGainedFromPost: ['followers gained from this post', 'followers gained'],
  sendsOnLinkedIn: ['sends on linkedin', 'sends'],
  linkedinPostUrl: ['linkedin post url', 'post url', 'url', 'permalink', 'post link', 'link'],
  publishedDate: ['published date', 'publish date', 'published on', 'date'],
}

function normalizeLabel(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[#:]/g, '')
    .trim()
}

function parseMetricValue(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const normalized = String(value)
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
    .trim()

  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function toIsoDate(value: unknown): string | null {
  if (value == null || value === '') return null

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return null
    const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function combineDateAndTime(dateValue: unknown, timeValue: unknown): string | null {
  const dateText = String(dateValue ?? '').trim()
  const timeText = String(timeValue ?? '').trim()
  if (!dateText) return null

  const combined = timeText ? `${dateText} ${timeText}` : dateText
  const date = new Date(combined)
  return Number.isNaN(date.getTime()) ? toIsoDate(dateValue) : date.toISOString()
}

function emptyResult(): ParsedAnalyticsImport {
  return {
    impressions: null,
    reactions: null,
    comments: null,
    reposts: null,
    saves: null,
    membersReached: null,
    premiumCustomButtonInteractions: null,
    profileViewsAfter: null,
    followersGainedFromPost: null,
    sendsOnLinkedIn: null,
    linkedinPostUrl: null,
    publishedDate: null,
    audienceDemographics: null,
  }
}

function applyMappedValue(result: ParsedAnalyticsImport, key: keyof ParsedAnalyticsImport, value: unknown) {
  if (key === 'linkedinPostUrl') {
    const url = String(value ?? '').trim()
    if (url) result.linkedinPostUrl = url
    return
  }

  if (key === 'publishedDate') {
    result.publishedDate = toIsoDate(value)
    return
  }

  if (key === 'audienceDemographics') return

  result[key] = parseMetricValue(value)
}

function parseKeyValueRows(rows: unknown[][]): ParsedAnalyticsImport | null {
  const result = emptyResult()
  let found = false
  let postDateValue: unknown = null
  let postTimeValue: unknown = null

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue
    const label = normalizeLabel(row[0])
    const value = row[1]

    if (label === 'post date') postDateValue = value
    if (label === 'post publish time') postTimeValue = value
    if (label === 'top job title') {
      result.audienceDemographics = { ...(result.audienceDemographics ?? {}), topJobTitle: String(value ?? '').trim() || null }
    }
    if (label === 'top location') {
      result.audienceDemographics = { ...(result.audienceDemographics ?? {}), topLocation: String(value ?? '').trim() || null }
    }
    if (label === 'top industry') {
      result.audienceDemographics = { ...(result.audienceDemographics ?? {}), topIndustry: String(value ?? '').trim() || null }
    }

    for (const [key, aliases] of Object.entries(METRIC_SYNONYMS) as Array<[MetricField, string[]]>) {
      if (aliases.includes(label)) {
        applyMappedValue(result, key, value)
        found = true
      }
    }
  }

  if (postDateValue) {
    result.publishedDate = combineDateAndTime(postDateValue, postTimeValue)
    found = true
  }

  return found ? result : null
}

function rowContainsMatch(row: unknown[], needle: string) {
  const target = needle.trim().toLowerCase()
  if (!target) return false
  return row.some((cell) => String(cell ?? '').toLowerCase().includes(target))
}

function scoreRowMatch(row: unknown[], options: ParseOptions) {
  let score = 0
  if (options.preferredUrl && rowContainsMatch(row, options.preferredUrl)) score += 4
  if (options.draftTitle && rowContainsMatch(row, options.draftTitle)) score += 2
  return score
}

function parseTableRows(rows: unknown[][], options: ParseOptions): ParsedAnalyticsImport | null {
  const headerAliases = Object.values(METRIC_SYNONYMS).flat()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const headerRow = rows[rowIndex] ?? []
    const headerLabels = headerRow.map(normalizeLabel)
    const matchedHeaders = headerLabels.filter((label) => headerAliases.includes(label))

    if (matchedHeaders.length < 2) continue

    const headerMap = new Map<MetricField, number>()
    for (const [key, aliases] of Object.entries(METRIC_SYNONYMS) as Array<[MetricField, string[]]>) {
      const headerIndex = headerLabels.findIndex((label) => aliases.includes(label))
      if (headerIndex >= 0) headerMap.set(key, headerIndex)
    }

    const candidateRows = rows
      .slice(rowIndex + 1)
      .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''))

    if (candidateRows.length === 0) continue

    const sortedCandidates = [...candidateRows].sort((a, b) => scoreRowMatch(b, options) - scoreRowMatch(a, options))
    const pickedRow = sortedCandidates[0]
    const result = emptyResult()
    let found = false

    for (const [key, columnIndex] of headerMap.entries()) {
      applyMappedValue(result, key, pickedRow[columnIndex])
      found = true
    }

    if (found) return result
  }

  return null
}

function parsePercentageValue(value: unknown): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  if (raw.startsWith('<')) return 1
  const parsed = Number(raw.replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

function parseTopDemographicsSheet(rows: unknown[][]) {
  const demographics: NonNullable<ParsedAnalyticsImport['audienceDemographics']> = {}

  for (const row of rows.slice(1)) {
    if (!Array.isArray(row) || row.length < 3) continue
    const category = normalizeLabel(row[0])
    const value = String(row[1] ?? '').trim()
    const percentage = parsePercentageValue(row[2])
    if (!value || percentage == null) continue

    const assign = (key: keyof NonNullable<ParsedAnalyticsImport['audienceDemographics']>) => {
      const bucket = (demographics[key] ?? {}) as Record<string, number>
      bucket[value] = percentage
      demographics[key] = bucket as any
    }

    if (category === 'company size') assign('companySizes')
    if (category === 'job title') assign('jobTitles')
    if (category === 'company') assign('companies')
    if (category === 'industry') assign('industries')
    if (category === 'location') assign('locations')
    if (category === 'seniority') assign('seniority')
  }

  return Object.keys(demographics).length > 0 ? demographics : null
}

export async function parseAnalyticsSpreadsheet(file: File, options: ParseOptions = {}): Promise<ParsedAnalyticsImport> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const performanceSheetName = workbook.SheetNames.find((name) => normalizeLabel(name) === 'performance') ?? workbook.SheetNames[0]
  if (!performanceSheetName) {
    throw new Error('The spreadsheet has no sheets.')
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[performanceSheetName], { header: 1, raw: false, defval: '' }) as unknown[][]

  const parsed =
    parseKeyValueRows(rows)
    ?? parseTableRows(rows, options)

  if (!parsed) {
    throw new Error('The spreadsheet format was not recognised. Export a single-post LinkedIn analytics file or use manual entry.')
  }

  const hasAnyMetric = [
    parsed.impressions,
    parsed.reactions,
    parsed.comments,
    parsed.reposts,
    parsed.saves,
    parsed.membersReached,
  ].some((value) => value != null)

  if (!hasAnyMetric) {
    throw new Error('The spreadsheet did not contain any supported analytics metrics.')
  }

  const demographicsSheetName = workbook.SheetNames.find((name) => normalizeLabel(name) === 'top demographics')
  if (demographicsSheetName) {
    const demographicRows = XLSX.utils.sheet_to_json(workbook.Sheets[demographicsSheetName], { header: 1, raw: false, defval: '' }) as unknown[][]
    const demographics = parseTopDemographicsSheet(demographicRows)
    if (demographics) {
      parsed.audienceDemographics = {
        ...demographics,
        ...(parsed.audienceDemographics ?? {}),
      }
    }
  }

  return parsed
}
