import type { UsageSummary, DailyPoint } from '@ttu/core'
import { formatTokens, formatUsd } from '../format'

type Tone = 'green' | 'blue' | 'amber' | 'red'

const STROKE: Record<Tone, string> = {
  green: '#22a06b',
  blue: '#2f6fed',
  amber: '#f5a524',
  red: '#e5484d',
}

/** 迷你折线：卡片右下角那根小曲线 */
function Sparkline({ values, tone }: { values: number[]; tone: Tone }) {
  if (values.length < 2) return <div className="spark" />
  const width = 132
  const height = 38
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = width / (values.length - 1)
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 6) - 3).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke={STROKE[tone]} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) {
    return <span className={`delta delta--${current > 0 ? 'up' : 'flat'}`}>{current > 0 ? '新增' : '—'}</span>
  }
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0
  const text = `${up ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`
  return <span className={`delta delta--${up ? 'up' : 'down'}`}>{text}</span>
}

function KpiCard({
  label,
  value,
  tone,
  delta,
  values,
  hint,
}: {
  label: string
  value: string
  tone: Tone
  delta: { current: number; previous: number }
  values: number[]
  hint?: string
}) {
  return (
    <div className="kpi">
      <div className="kpi__head">
        <span className="kpi__label">{label}</span>
        <Delta current={delta.current} previous={delta.previous} />
      </div>
      <div className="kpi__body">
        <div>
          <div className="kpi__value">{value}</div>
          {hint && <div className="kpi__hint">{hint}</div>}
        </div>
        <Sparkline values={values} tone={tone} />
      </div>
    </div>
  )
}

const sum = (list: DailyPoint[], pick: (d: DailyPoint) => number) => list.reduce((s, d) => s + pick(d), 0)

export function KpiCards({
  summary,
  current,
  previous,
}: {
  summary: UsageSummary
  current: DailyPoint[]
  previous: DailyPoint[]
}) {
  const cur = {
    cost: sum(current, (d) => d.costUsd),
    tokens: sum(current, (d) => d.tokens),
    input: sum(current, (d) => d.inputTokens),
    output: sum(current, (d) => d.outputTokens),
    cached: sum(current, (d) => d.cachedInputTokens),
  }
  const prev = {
    cost: sum(previous, (d) => d.costUsd),
    tokens: sum(previous, (d) => d.tokens),
    input: sum(previous, (d) => d.inputTokens),
    output: sum(previous, (d) => d.outputTokens),
  }

  return (
    <div className="kpi-grid">
      <KpiCard
        label="预估费用"
        value={formatUsd(cur.cost)}
        tone="green"
        delta={{ current: cur.cost, previous: prev.cost }}
        values={current.map((d) => d.costUsd)}
      />
      <KpiCard
        label="总 Token"
        value={formatTokens(cur.tokens)}
        tone="blue"
        delta={{ current: cur.tokens, previous: prev.tokens }}
        values={current.map((d) => d.tokens)}
        hint={`今日 ${formatTokens(summary.todayTokens)}`}
      />
      <KpiCard
        label="输入 Token"
        value={formatTokens(cur.input)}
        tone="amber"
        delta={{ current: cur.input, previous: prev.input }}
        values={current.map((d) => d.inputTokens)}
      />
      <KpiCard
        label="输出 Token"
        value={formatTokens(cur.output)}
        tone="red"
        delta={{ current: cur.output, previous: prev.output }}
        values={current.map((d) => d.outputTokens)}
        hint={`缓存读 ${formatTokens(cur.cached)}`}
      />
    </div>
  )
}
