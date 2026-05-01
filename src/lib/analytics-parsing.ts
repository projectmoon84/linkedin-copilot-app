export interface AudienceDemographics {
  companySizes?: Record<string, number>
  jobTitles?: Record<string, number>
  companies?: Record<string, number>
  jobFunctions?: Record<string, number>
  seniority?: Record<string, number>
  industries?: Record<string, number>
  locations?: Record<string, number>
  topJobTitle?: string | null
  topLocation?: string | null
  topIndustry?: string | null
}
