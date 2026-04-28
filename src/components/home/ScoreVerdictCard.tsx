import { getLowestScoreDimension, getScoreLabel, buildScoreBreakdown, type WeeklyScore } from '@/lib/score-engine'

interface ScoreVerdictCardProps {
  score: WeeklyScore | null
  loading?: boolean
}

export function ScoreVerdictCard({ score, loading }: ScoreVerdictCardProps) {
  if (loading || !score) {
    return (
      <div className="app-card">
        <div className="home-metric-inner">
          <div className="home-metric-label">LinkedIn score</div>
          <div className="home-score-row">
            <div className="home-score-ring rounded-full bg-stone-100" />
            <div>
              <div className="home-score-label">Waiting for data</div>
              <div className="text-xs text-stone-400">Add analytics to unlock this.</div>
            </div>
          </div>
          <p className="home-score-meaning">Your score will explain the clearest next improvement.</p>
        </div>
      </div>
    )
  }

  const verdict = getScoreLabel(score.overallScore)
  const lowest = getLowestScoreDimension(score)
  const breakdown = buildScoreBreakdown(score)
  const circumference = 2 * Math.PI * 17
  const progress = Math.max(0, Math.min(1, score.overallScore / 100))

  return (
    <div className="app-card">
      <div className="home-metric-inner">
        <div className="home-metric-label">LinkedIn score</div>
        <div className="home-score-row">
          <div className="home-score-ring">
            <svg viewBox="0 0 44 44" width="44" height="44" aria-label={`LinkedIn score ${score.overallScore} out of 100`}>
              <circle cx="22" cy="22" r="17" fill="none" stroke="var(--color-stone-100)" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
              <text x="22" y="27" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="11" fontWeight="700" fill="var(--color-stone-800)">
                {score.overallScore}
              </text>
            </svg>
          </div>
          <div>
            <div className="home-score-label">
              <span className="home-score-dot" style={{ background: verdict.tone === 'negative' ? 'var(--color-negative)' : 'var(--color-positive)' }} />
              {verdict.label}
            </div>
            <div className="text-xs text-stone-400">Next focus: {lowest.label.toLowerCase()}</div>
          </div>
        </div>
        <div className="home-score-meaning">
          Your score is based on how consistently and effectively you are growing on LinkedIn.
        </div>
        <div className="home-score-explain">
          <p>Your lowest dimension is {lowest.label.toLowerCase()} at {lowest.score}/100.</p>
          <div className="home-dim-mini">
            {breakdown.map((item) => (
              <div className="home-dim-row" key={item.label}>
                <span className="home-dim-label">{item.label}</span>
                <div className="home-dim-track">
                  <div
                    className="home-dim-fill"
                    style={{
                      width: `${item.score}%`,
                      background: item.score < 60 ? 'var(--color-warning)' : 'var(--color-discovery)',
                    }}
                  />
                </div>
                <span className="home-dim-val">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
