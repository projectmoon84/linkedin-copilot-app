import { IconChartBar } from '@tabler/icons-react'
import type { CSSProperties } from 'react'
import type { WeeklyPerformance } from '@/lib/useLinkedInScore'

interface ImpressionsEngagementChartProps {
  weeklyData: WeeklyPerformance[]
}

const width = 560
const height = 260
const chart = { left: 42, right: 530, top: 24, bottom: 200 }
const chartWidth = chart.right - chart.left
const chartHeight = chart.bottom - chart.top

function formatWeek(weekStart: string) {
  return new Date(`${weekStart}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatMetric(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(value)
}

export function ImpressionsEngagementChart({ weeklyData }: ImpressionsEngagementChartProps) {
  const series = weeklyData.slice(-8)
  if (series.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <IconChartBar size={20} className="mb-2 text-stone-400" />
        <p className="text-sm font-semibold text-stone-900">No performance data yet</p>
        <p className="text-xs text-stone-500">Publish posts and add analytics to see trends.</p>
      </div>
    )
  }

  const maxImpressions = Math.max(1, ...series.map((week) => week.totalImpressions))
  const maxEngagement = Math.max(1, ...series.map((week) => week.engagementRate ?? 0))
  const slotWidth = chartWidth / series.length
  const barWidth = Math.min(36, slotWidth * 0.5)
  const engagementPoints = series
    .map((week, index) => {
      if (week.engagementRate == null) return null
      return {
        x: chart.left + slotWidth * index + slotWidth / 2,
        y: chart.bottom - (week.engagementRate / maxEngagement) * chartHeight,
      }
    })
    .filter((point): point is { x: number; y: number } => Boolean(point))
  const linePath = engagementPoints.length > 1 ? `M ${engagementPoints.map((point) => `${point.x},${point.y}`).join(' L ')}` : ''

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label="Weekly impressions and engagement chart">
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1={chart.left} x2={chart.right} y1={chart.bottom - ratio * chartHeight} y2={chart.bottom - ratio * chartHeight} stroke="var(--color-stone-100)" />
        ))}
        {[0, maxImpressions / 2, maxImpressions].map((tick) => (
          <text key={tick} x={chart.left - 8} y={chart.bottom - (tick / maxImpressions) * chartHeight} textAnchor="end" dominantBaseline="central" fontSize="11" fill="var(--color-stone-500)">
            {formatMetric(Math.round(tick))}
          </text>
        ))}
        {series.map((week, index) => {
          const barHeight = (week.totalImpressions / maxImpressions) * chartHeight
          const x = chart.left + slotWidth * index + (slotWidth - barWidth) / 2
          const y = chart.bottom - barHeight
          return (
            <g key={week.weekStart}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill="color-mix(in srgb, var(--color-positive) 35%, white)"
                className="chart-bar-enter"
                style={{ '--chart-delay': `${index * 55}ms` } as CSSProperties}
              />
              <text x={chart.left + slotWidth * index + slotWidth / 2} y={chart.bottom + 24} textAnchor="middle" fontSize="11" fill="var(--color-stone-500)">
                {formatWeek(week.weekStart)}
              </text>
            </g>
          )
        })}
        {linePath && <path d={linePath} pathLength={1} className="chart-line-enter" fill="none" stroke="var(--color-chart-primary)" strokeWidth="3" strokeLinecap="round" />}
        {engagementPoints.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="var(--color-chart-primary)"
            stroke="white"
            strokeWidth="2"
            className="chart-point-enter"
            style={{ '--chart-delay': `${250 + index * 45}ms` } as CSSProperties}
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-4 px-2 text-xs text-stone-500">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-positive/30" />Impressions</span>
        <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-chart-primary" />Engagement rate</span>
      </div>
    </div>
  )
}
