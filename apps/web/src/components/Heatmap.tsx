import type { DailyPoint } from '@ttu/core'
import { shiftDate, todayISO } from '../format'

const LEVELS = ['#eef2f8', '#dbe8fb', '#b9d3f7', '#7fa9f0', '#2f6fed']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const WEEKS = 52

function levelOf(tokens: number, max: number): number {
  if (tokens <= 0) return 0
  if (max <= 0) return 1
  const ratio = tokens / max
  if (ratio > 0.66) return 4
  if (ratio > 0.33) return 3
  if (ratio > 0.08) return 2
  return 1
}

/**
 * 近似 GitHub 的贡献图：52 周 × 7 天，周日在上。
 * 纯 CSS grid，不引入图表库 —— 这一块用图表库反而更难对齐。
 */
export function Heatmap({ data }: { data: DailyPoint[] }) {
  const byDate = new Map(data.map((d) => [d.date, d.tokens]))
  const max = data.reduce((m, d) => Math.max(m, d.tokens), 0)

  const today = todayISO()
  const todayDow = new Date(`${today}T00:00:00Z`).getUTCDay()
  const lastSunday = shiftDate(today, -todayDow)

  const columns: string[][] = []
  for (let w = WEEKS - 1; w >= 0; w -= 1) {
    const sunday = shiftDate(lastSunday, -w * 7)
    columns.push(Array.from({ length: 7 }, (_, i) => shiftDate(sunday, i)))
  }

  let prevMonth = ''
  const monthLabels = columns.map((col) => {
    const date = col[0]
    const month = date.slice(0, 7)
    const day = Number(date.slice(8, 10))
    if (month !== prevMonth && day <= 7) {
      prevMonth = month
      return `${Number(date.slice(5, 7))}月`
    }
    if (month !== prevMonth && day > 7) prevMonth = month
    return ''
  })

  return (
    <div className="card heat-card">
      <div className="heat__months" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
        {monthLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="heat">
        <div className="heat__weekdays">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="heat__grid" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
          {columns.map((col) => (
            <div className="heat__col" key={col[0]}>
              {col.map((date) => {
                const tokens = byDate.get(date) ?? 0
                return (
                  <div
                    key={date}
                    className="heat__cell"
                    title={`${date} · ${tokens.toLocaleString()} tokens`}
                    style={{ background: LEVELS[levelOf(tokens, max)] }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="heat__foot">
        <span className="heat__tz">UTC+08:00</span>
        <span className="heat__legend">
          少
          {LEVELS.map((color) => (
            <i key={color} className="heat__chip" style={{ background: color }} />
          ))}
          多
        </span>
      </div>
    </div>
  )
}
