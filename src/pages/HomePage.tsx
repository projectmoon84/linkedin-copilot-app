import { useState } from 'react'
import { IconInfoCircle, IconRefresh } from '@tabler/icons-react'
import { AnalyticsDueBanner } from '@/components/home/AnalyticsDueBanner'
import { InsightsBanner } from '@/components/home/InsightsBanner'
import { RecentPostsCard } from '@/components/home/RecentPostsCard'
import { ScoreVerdictCard } from '@/components/home/ScoreVerdictCard'
import { SetupChecklistCard } from '@/components/home/SetupChecklistCard'
import { WeekProgress } from '@/components/home/WeekProgress'
import { CountUp } from '@/components/ui/count-up'
import { useUserProfile } from '@/contexts/UserProfileContext'
import type { CadenceRecommendation } from '@/lib/cadence-engine'
import type { StrategicPurpose } from '@/lib/onboarding-types'
import { useHomeData } from '@/lib/hooks/useHomeData'
import type { RecentPost } from '@/lib/services/draft-service'

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const purposes: StrategicPurpose[] = ['discovery', 'trust', 'authority']

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { profile } = useUserProfile()
  const data = useHomeData()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await data.refresh()
    } finally {
      setRefreshing(false)
    }
  }

  const weeklyPosts = data.stats?.totalThisWeek ?? 0
  const weeklyTarget = Math.max(1, Math.round(data.recommendation?.postsPerWeek ?? 1))
  const greeting = getGreeting()

  return (
    <div className="app-page mx-auto">
      <div className="home-welcome-row">
        <div>
          <h1>{profile?.displayName ? `${greeting}, ${profile.displayName.split(' ')[0]}` : greeting}</h1>
          <p>
            {weeklyPosts} of {weeklyTarget} actions done
          </p>
        </div>
        <button type="button" className="app-btn app-btn-ghost app-btn-size-xs" onClick={() => void handleRefresh()} disabled={refreshing}>
          <IconRefresh className={refreshing ? 'animate-spin' : undefined} size={14} />
          Refresh
        </button>
      </div>

      <SetupChecklistCard />

      <AnalyticsDueBanner posts={data.analyticsDuePosts} />

      <WeekProgress
        stats={data.stats}
        recommendation={data.recommendation}
        nextPost={data.nextPost}
        trendingArticles={data.trendingArticles}
      />

      <div className="home-metrics-strip">
        <ScoreVerdictCard score={data.score} loading={data.loading} />
        <PerformanceChartCard data={data} />
        <PostsThisWeekCard done={weeklyPosts} target={weeklyTarget} stats={data.stats} nextPurpose={data.nextPost?.purpose} posts={data.recentPosts} recommendation={data.recommendation} />
      </div>

      <InsightsBanner
        insights={data.insights}
        loading={data.insightsLoading}
        onDismiss={data.dismissInsight}
        generatedAt={data.generatedAt}
      />

      <div className="home-two-col">
        <AudienceCard profile={profile} recentCount={data.recentPosts.length} />
        <ContentTypeCard posts={data.recentPosts} />
      </div>

      <div className="home-zone-divider">Dig deeper</div>

      <RecentPostsCard posts={data.recentPosts} loading={data.recentPostsLoading} />
    </div>
  )
}

// Chart colours — cyan bars (impressions), indigo line (engagement)
const CHART_BAR_COLOR = '#06b6d4'   // cyan-500
const CHART_LINE_COLOR = '#6366f1'  // indigo-500

function PerformanceChartCard({ data }: { data: ReturnType<typeof useHomeData> }) {
  const weeks = data.impressionsHistory.slice(-7)
  const n = Math.max(1, weeks.length)
  const maxImpressions = Math.max(1, ...weeks.map((w) => w.totalImpressions))
  const maxEngagement = Math.max(1, ...weeks.map((w) => w.engagementRate ?? 0))

  const VIEWBOX_W = 300
  const VIEWBOX_H = 163
  const BAR_AREA_H = 136
  const BAR_BASE_Y = 148
  const GAP = 2
  const DOT_CELL = 3  // pattern cell size in SVG units

  const slotW = VIEWBOX_W / n
  // Snap barW to a multiple of DOT_CELL so the grid fits whole cells —
  // the rightmost dot always sits 0.75px inside the bar edge, never clipped.
  const barW = Math.floor((slotW - GAP) / DOT_CELL) * DOT_CELL

  // Pre-compute bar positions so we can use them in both <defs> and the render
  const bars = weeks.map((week, i) => {
    const barH = Math.max(6, (week.totalImpressions / maxImpressions) * BAR_AREA_H)
    const barX = i * slotW + GAP / 2
    const barY = BAR_BASE_Y - barH
    return { week, i, barH, barX, barY }
  })

  const engagementPoints = weeks.map((week, i) => {
    const cx = i * slotW + slotW / 2
    const y = BAR_BASE_Y - BAR_AREA_H - 4 + ((1 - (week.engagementRate ?? 0) / maxEngagement) * (BAR_AREA_H - 4))
    return `${cx.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <div className="app-card">
      <div className="home-metric-inner">
        <div className="home-metric-label mb-3">Impressions &amp; engagement</div>

        <div className="home-chart-area">
          <svg
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            aria-label="Weekly impressions and engagement chart"
          >
            <defs>
              {/*
                One pattern per bar, with x={barX} so the dot grid origin
                aligns to that bar's left edge. Combined with barW being a
                multiple of DOT_CELL, every dot sits fully inside its bar.
              */}
              {bars.map(({ i, barX }) => (
                <pattern
                  key={i}
                  id={`chartDots${i}`}
                  x={barX}
                  y={0}
                  width={DOT_CELL}
                  height={DOT_CELL}
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx={DOT_CELL / 2} cy={DOT_CELL / 2} r={0.75} fill={CHART_BAR_COLOR} />
                </pattern>
              ))}
              {/* Top-to-bottom fade: dots visible at top, dissolve toward baseline */}
              <linearGradient id="barFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Grid lines — evenly spaced across the bar area (top=12, base=148) */}
            <line x1="0" y1={BAR_BASE_Y - BAR_AREA_H + BAR_AREA_H / 4} x2={VIEWBOX_W} y2={BAR_BASE_Y - BAR_AREA_H + BAR_AREA_H / 4} stroke="var(--color-stone-100)" strokeWidth="0.5" />
            <line x1="0" y1={BAR_BASE_Y - BAR_AREA_H / 2} x2={VIEWBOX_W} y2={BAR_BASE_Y - BAR_AREA_H / 2} stroke="var(--color-stone-100)" strokeWidth="0.5" />
            <line x1="0" y1={BAR_BASE_Y - BAR_AREA_H / 4} x2={VIEWBOX_W} y2={BAR_BASE_Y - BAR_AREA_H / 4} stroke="var(--color-stone-100)" strokeWidth="0.5" />

            {weeks.length === 0 ? (
              <text x="150" y="58" textAnchor="middle" fontSize="9" fill="var(--color-stone-400)">Analytics will appear here</text>
            ) : (
              bars.map(({ week, i, barH, barX, barY }) => {
                const labelX = i * slotW + slotW / 2
                return (
                  <g key={week.weekStart}>
                    <g style={{ mixBlendMode: 'multiply' }}>
                      <rect x={barX} y={barY} width={barW} height={barH} fill={`url(#chartDots${i})`} />
                      <rect x={barX} y={barY} width={barW} height={barH} fill="url(#barFade)" />
                    </g>
                    <text x={labelX} y={barY - 3} textAnchor="middle" fontSize="7.5" fill="var(--color-stone-400)">
                      {week.postCount > 0 ? week.postCount : ''}
                    </text>
                    <text x={labelX} y={BAR_BASE_Y + 9} textAnchor="middle" fontSize="8" fill="var(--color-stone-400)">
                      {new Date(`${week.weekStart}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </text>
                  </g>
                )
              })
            )}

            {weeks.length > 1 && (
              <polyline
                points={engagementPoints}
                fill="none"
                stroke={CHART_LINE_COLOR}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>

        <div className="home-chart-legend">
          <div className="home-legend-item">
            <div className="home-legend-dot" style={{ background: CHART_BAR_COLOR }} />
            Impressions
          </div>
          <div className="home-legend-item">
            <div className="home-legend-dot" style={{ background: CHART_LINE_COLOR }} />
            Engagement %
          </div>
        </div>
      </div>
    </div>
  )
}

// Returns an array of length 7 (Mon–Sun) where each entry is the purpose of
// a post published that day this week, or null if no post was made.
function getThisWeekDayPurposes(posts: RecentPost[]): (StrategicPurpose | null)[] {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek === 0 ? 7 : dayOfWeek) - 1))
  monday.setHours(0, 0, 0, 0)

  const result: (StrategicPurpose | null)[] = Array(7).fill(null)
  for (const post of posts) {
    if (!post.publishedAt) continue
    const d = new Date(post.publishedAt)
    if (d < monday) continue
    const idx = (d.getDay() + 6) % 7 // 0 = Mon
    result[idx] = (post.strategicPurpose as StrategicPurpose) ?? 'trust'
  }
  return result
}

// Map JS getDay() (0=Sun) to weekDays index (0=Mon)
function getTodayIndex() {
  return (new Date().getDay() + 6) % 7
}

const PURPOSE_TILE: Record<StrategicPurpose, { bg: string; color: string }> = {
  discovery: { bg: 'var(--color-discovery)', color: 'white' },
  trust:     { bg: 'var(--color-trust)',      color: 'white' },
  authority: { bg: 'var(--color-authority)',  color: 'white' },
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
}

function PostsThisWeekCard({
  done,
  target,
  stats,
  nextPurpose,
  posts,
  recommendation,
}: {
  done: number
  target: number
  stats: ReturnType<typeof useHomeData>['stats']
  nextPurpose?: StrategicPurpose
  posts: RecentPost[]
  recommendation: CadenceRecommendation | null
}) {
  const todayIndex = getTodayIndex()
  const dayPurposes = getThisWeekDayPurposes(posts)
  const scheduledIndices = new Set(
    (recommendation?.suggestedDays ?? []).map((d) => DAY_NAME_TO_INDEX[d.toLowerCase()]).filter((i) => i !== undefined)
  )
  const mix = stats?.thisWeek ?? { discovery: 0, trust: 0, authority: 0 }
  const remaining = Math.max(0, target - done)

  return (
    <div className="app-card flex h-full flex-col">
      <div className="flex flex-1 flex-col px-[18px] py-4">
        <div className="home-metric-label">Posts this week</div>
        <div className="home-posts-big-num"><CountUp end={done} /></div>
        <div className="home-posts-target">
          of {target} target · {remaining} left
        </div>

        {/* Push day tiles + mix to fill remaining space */}
        <div className="mt-3 flex flex-1 flex-col justify-end gap-4">
          <div className="home-posts-week-row">
            {weekDays.map((day, index) => {
              const purpose = dayPurposes[index]
              const isToday = index === todayIndex
              const isScheduled = scheduledIndices.has(index)
              const tileStyle = purpose
                ? PURPOSE_TILE[purpose]
                : isToday
                ? { bg: '#ecfeff', color: '#0891b2', outline: '1px solid #06b6d4' }
                : isScheduled
                ? { bg: 'var(--color-stone-50)', color: 'var(--color-stone-400)', outline: '1.5px dashed var(--color-stone-300)' }
                : { bg: 'var(--color-stone-100)', color: 'var(--color-stone-300)' }
              return (
                <div
                  key={`${day}-${index}`}
                  className="home-post-day"
                  style={{
                    background: tileStyle.bg,
                    color: tileStyle.color,
                    outline: 'outline' in tileStyle ? tileStyle.outline : undefined,
                  }}
                >
                  {day}
                </div>
              )
            })}
          </div>

          <div>
            <div className="mb-2 text-xs text-stone-500">This week's mix</div>
            <div className="flex flex-wrap gap-1.5">
              {purposes.map((purpose) => {
                const active = mix[purpose] > 0 || purpose === nextPurpose
                return (
                  <span
                    key={purpose}
                    className={active ? `app-purpose-pill ${purpose}` : 'rounded-full border border-stone-200 px-2 py-0.5 text-xs capitalize text-stone-400'}
                  >
                    {purpose}{mix[purpose] > 1 ? ` ×${mix[purpose]}` : ''}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AudienceCard({ profile, recentCount }: { profile: ReturnType<typeof useUserProfile>['profile']; recentCount: number }) {
  const audience = profile?.targetAudience?.slice(0, 2).join(' and ') || 'your target audience'
  const industries = profile?.industries?.slice(0, 2).join(' and ') || 'your key industries'
  const discipline = profile?.primaryDiscipline?.replace(/-/g, ' ') || 'your field'

  return (
    <div className="app-card">
      <div className="home-audience-inner">
        <div className="flex items-center justify-between gap-3">
          <div className="app-card-title">Your audience</div>
          <button type="button" className="app-btn app-btn-sky app-btn-size-xs">Write for this audience</button>
        </div>
        <div className="home-audience-summary">
          Your content is aimed at <strong>{audience}</strong> in <strong>{industries}</strong>, grounded in <strong>{discipline}</strong>. Based on {recentCount} recent posts in this rebuild view.
        </div>
      </div>
    </div>
  )
}

function ContentTypeCard({ posts }: { posts: ReturnType<typeof useHomeData>['recentPosts'] }) {
  const counts = purposes.map((purpose) => {
    const purposePosts = posts.filter((post) => post.strategicPurpose === purpose)
    const postsWithImpressions = purposePosts.filter((post) => post.impressions != null)
    const avgReach = postsWithImpressions.length > 0
      ? Math.round(postsWithImpressions.reduce((sum, post) => sum + (post.impressions ?? 0), 0) / postsWithImpressions.length)
      : 0
    const avgEngagement = postsWithImpressions.length > 0
      ? postsWithImpressions.reduce((sum, post) => {
          const engagement = (post.reactions ?? 0) + (post.comments ?? 0) + (post.reposts ?? 0)
          return sum + (post.impressions ? (engagement / post.impressions) * 100 : 0)
        }, 0) / postsWithImpressions.length
      : 0

    return { purpose, count: purposePosts.length, avgReach, avgEngagement }
  })
  const strongest = counts.sort((a, b) => b.avgReach - a.avgReach)[0]

  return (
    <div className="app-card">
      <div className="home-snap-inner">
        <div className="app-card-title mb-3">By content type</div>
        <table className="home-snap-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Posts</th>
              <th>Eng.</th>
              <th>Reach</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ purpose, count, avgEngagement, avgReach }) => (
              <tr key={purpose}>
                <td><span className={`app-purpose-pill ${purpose}`}>{purpose}</span></td>
                <td>{count}</td>
                <td style={{ color: avgEngagement > 0 ? 'var(--color-positive)' : 'var(--color-stone-500)', fontWeight: avgEngagement > 0 ? 500 : 400 }}>
                  {avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : '--'}
                </td>
                <td>{avgReach > 0 ? <CountUp end={avgReach} /> : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="home-snap-conclusion">
          <IconInfoCircle size={13} className="text-stone-400" />
          <span><strong className="capitalize">{strongest?.purpose || 'Discovery'}</strong> is your strongest format in the current data.</span>
        </div>
      </div>
    </div>
  )
}
