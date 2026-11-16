import { useState } from 'react'
import type { ModelSlice, ProjectSlice } from '@ttu/core'
import { formatTokens, formatUsd } from '../format'

const SOURCE_NAME: Record<string, string> = {
  codex: 'Codex',
  dsh: 'DeepSeek Harness',
  claude: 'Claude Code',
  cursor: 'Cursor',
  opencode: 'OpenCode',
}

const SOURCE_COLORS: Record<string, string> = {
  codex: '#2f6fed',
  dsh: '#34a853',
  claude: '#d97757',
  cursor: '#8b95a7',
}

const colorOf = (source: string) => SOURCE_COLORS[source] ?? '#7f8ea3'
const nameOf = (source: string) => SOURCE_NAME[source] ?? source

function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="bar">
      <div className="bar__fill" style={{ width: `${Math.max(pct, 1.5)}%`, background: tone }} />
    </div>
  )
}

/** 按「平台」聚合：一个平台下可能挂多个模型 */
export function PlatformBreakdown({ models }: { models: ModelSlice[] }) {
  const total = models.reduce((s, m) => s + m.tokens, 0)
  const groups = new Map<string, { tokens: number; cost: number; models: Set<string> }>()
  for (const model of models) {
    const entry = groups.get(model.source) ?? { tokens: 0, cost: 0, models: new Set<string>() }
    entry.tokens += model.tokens
    entry.cost += model.costUsd
    entry.models.add(model.model)
    groups.set(model.source, entry)
  }

  const rows = [...groups.entries()]
    .map(([source, v]) => ({
      source,
      tokens: v.tokens,
      cost: v.cost,
      models: v.models.size,
      pct: total > 0 ? (v.tokens / total) * 100 : 0,
    }))
    .sort((a, b) => b.tokens - a.tokens)

  return (
    <div className="card">
      <div className="card__head">
        <div>
          <h3 className="card__title">工具与模型用量</h3>
          <p className="card__sub">按平台比较总 Token</p>
        </div>
      </div>

      {rows.length === 0 && <p className="empty">窗口内没有数据</p>}

      <div className="rows rows--big">
        {rows.map((row) => (
          <div className="big-row" key={row.source}>
            <div className="big-row__label">
              <span className="dot" style={{ background: colorOf(row.source) }} />
              <div>
                <div className="big-row__name">{nameOf(row.source)}</div>
                <div className="big-row__meta">
                  {row.models} 个模型 · {formatUsd(row.cost)}
                </div>
              </div>
            </div>
            <div className="big-row__bar">
              <Bar pct={row.pct} tone={colorOf(row.source)} />
            </div>
            <div className="big-row__value">
              <div className="big-row__pct">{row.pct.toFixed(1)}%</div>
              <div className="big-row__tokens">{formatTokens(row.tokens)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProjectBreakdown({ projects }: { projects: ProjectSlice[] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? projects : projects.slice(0, 5)

  return (
    <div className="card">
      <div className="card__head">
        <div>
          <h3 className="card__title">项目分布</h3>
          <p className="card__sub">按项目比较总 Token</p>
        </div>
      </div>

      {projects.length === 0 && <p className="empty">窗口内没有数据</p>}

      <div className="rows rows--big">
        {shown.map((project) => (
          <div className="big-row" key={project.project}>
            <div className="big-row__label">
              <span className="folder">▤</span>
              <div>
                <div className="big-row__name" title={project.project}>
                  {project.project}
                </div>
                <div className="big-row__meta">
                  {project.models} 个模型 · {formatUsd(project.costUsd)}
                </div>
              </div>
            </div>
            <div className="big-row__bar">
              <Bar pct={project.pct} tone="#2f6fed" />
            </div>
            <div className="big-row__value">
              <div className="big-row__pct">{project.pct.toFixed(1)}%</div>
              <div className="big-row__tokens">{formatTokens(project.tokens)}</div>
            </div>
          </div>
        ))}
      </div>

      {projects.length > 5 && (
        <button className="link-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? '收起' : `查看全部（${projects.length}）`}
        </button>
      )}
    </div>
  )
}

export interface DonutItem {
  name: string
  value: number
  color: string
}

/** 纯 SVG 环形图：不引图表库，尺寸和圆角完全可控 */
export function Donut({ items, centerLabel }: { items: DonutItem[]; centerLabel: string }) {
  const total = items.reduce((s, i) => s + i.value, 0)
  const size = 176
  const radius = 62
  const stroke = 20
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const arcs = items.map((item) => {
    const fraction = total > 0 ? item.value / total : 0
    const dash = fraction * circumference
    const arc = (
      <circle
        key={item.name}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={item.color}
        strokeWidth={stroke}
        strokeDasharray={`${Math.max(dash - 2, 0)} ${circumference}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
      />
    )
    offset += dash
    return arc
  })

  return (
    <div className="donut">
      <div className="donut__chart">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef1f6" strokeWidth={stroke} />
          {arcs}
        </svg>
        <div className="donut__center">
          <div className="donut__center-value">{formatTokens(total)}</div>
          <div className="donut__center-label">{centerLabel}</div>
        </div>
      </div>

      <div className="donut__legend">
        {items.map((item) => (
          <div className="donut__legend-row" key={item.name}>
            <span className="dot" style={{ background: item.color }} />
            <span className="donut__legend-name">{item.name}</span>
            <span className="donut__legend-pct">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
