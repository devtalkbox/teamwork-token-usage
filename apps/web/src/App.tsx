import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DailyPoint, HourlyPoint, ModelSlice, ProjectSlice, UsageSummary } from '@ttu/core'
import { fetchDaily, fetchHourly, fetchModels, fetchProjects, fetchSummary } from './api'
import { DailyChart, Segmented, TrendChart } from './components/Charts'
import { KpiCards } from './components/KpiCards'
import { Heatmap } from './components/Heatmap'
import { Donut, PlatformBreakdown, ProjectBreakdown } from './components/Breakdown'
import { dayPoints, fillDayHours, hourPoints } from './chartData'
import { formatTokens, formatUsd, shiftDate, todayISO } from './format'

const MODEL_PALETTE = ['#2f6fed', '#34a853', '#f5a524', '#8b95a7', '#7f56d9']

const RANGES = [
  { value: 1, label: '今天' },
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
] as const

const VALID_RANGES = [1, 7, 30, 90]

function initialRange(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('range'))
  return VALID_RANGES.includes(raw) ? raw : 7
}

export default function App() {
  const [range, setRange] = useState<number>(initialRange)
  const [source, setSource] = useState<string>(() => new URLSearchParams(window.location.search).get('source') ?? '')
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [daily, setDaily] = useState<DailyPoint[]>([])
  const [hourly, setHourly] = useState<HourlyPoint[]>([])
  const [heat, setHeat] = useState<DailyPoint[]>([])
  const [models, setModels] = useState<ModelSlice[]>([])
  const [projects, setProjects] = useState<ProjectSlice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendMode, setTrendMode] = useState<'all' | 'detail'>('all')
  const [dailyMode, setDailyMode] = useState<'token' | 'cost'>('token')

  const isToday = range === 1

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const scoped = source || undefined
      const [overall, scopedSummary, series, modelList, projectList, heatDaily] = await Promise.all([
        fetchSummary(),
        source ? fetchSummary(source) : Promise.resolve(null),
        // 「今天」按小时看，否则按天
        isToday ? fetchHourly(2, scoped) : fetchDaily(Math.min(range * 2, 365), scoped),
        fetchModels(range, scoped),
        fetchProjects(range, scoped),
        fetchDaily(365, scoped),
      ])

      setSummary(scopedSummary ?? overall)
      setSources(overall.bySource.map((s) => s.source))
      setModels(modelList)
      setProjects(projectList)
      setHeat(heatDaily)
      if (isToday) {
        setHourly(series as HourlyPoint[])
        setDaily([])
      } else {
        setDaily(series as DailyPoint[])
        setHourly([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [range, source, isToday])

  useEffect(() => {
    void load()
  }, [load])

  // 让范围/渠道可分享：把状态写回地址栏
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('range', String(range))
    if (source) params.set('source', source)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [range, source])

  /** 当前窗口 / 上一窗口：按天是「近 N 天 vs 前 N 天」，按小时是「今天 vs 昨天同一时段」 */
  const { currentWindow, previousWindow } = useMemo(() => {
    if (isToday) {
      const today = todayISO()
      const yesterday = shiftDate(today, -1)
      const points = hourPoints(hourly)
      const nowHour = new Date().getHours()
      return {
        currentWindow: fillDayHours(today, points).slice(0, nowHour + 1),
        previousWindow: fillDayHours(yesterday, points).slice(0, nowHour + 1),
      }
    }
    const points = dayPoints(daily)
    return {
      currentWindow: points.slice(-range),
      previousWindow: points.slice(Math.max(points.length - range * 2, 0), Math.max(points.length - range, 0)),
    }
  }, [isToday, hourly, daily, range])

  const sourceItems = useMemo(() => {
    const totals = new Map<string, number>()
    for (const model of models) totals.set(model.source, (totals.get(model.source) ?? 0) + model.tokens)
    return [...totals.entries()]
      .map(([name, value]) => ({
        name,
        value,
        color: name === 'codex' ? '#2f6fed' : name === 'dsh' ? '#34a853' : name === 'claude' ? '#d97757' : '#8b95a7',
      }))
      .sort((a, b) => b.value - a.value)
  }, [models])

  /** 模型 → 颜色：和「模型分布」环形图共用一套，避免同一个模型两种颜色 */
  const modelColors = useMemo(() => {
    const map: Record<string, string> = {}
    models.slice(0, 5).forEach((model, i) => {
      map[model.model] = MODEL_PALETTE[i % MODEL_PALETTE.length]
    })
    return map
  }, [models])

  const modelItems = useMemo(() => {
    const top = models.slice(0, 5).map((model, i) => ({
      name: model.model,
      value: model.tokens,
      color: MODEL_PALETTE[i % MODEL_PALETTE.length],
    }))
    const rest = models.slice(5).reduce((s, m) => s + m.tokens, 0)
    if (rest > 0) top.push({ name: '其他', value: rest, color: '#cbd5e1' })
    return top
  }, [models])

  const rangeLabel = isToday ? '今天按小时' : `最近 ${range} 天`

  return (
    <div className="page">
      <header className="toolbar">
        <div className="toolbar__left">
          <Segmented
            value={String(range)}
            options={RANGES.map((r) => ({ value: String(r.value), label: r.label }))}
            onChange={(value) => setRange(Number(value))}
          />
          <label className="select">
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">全部渠道</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s === 'dsh' ? 'DeepSeek Harness' : s === 'codex' ? 'Codex' : s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="toolbar__right">
          <button className="icon-btn" onClick={() => void load()} disabled={loading} title="刷新">
            ⟳
          </button>
        </div>
      </header>

      {error && <div className="error">加载失败：{error}</div>}

      {summary && <KpiCards summary={summary} current={currentWindow} previous={previousWindow} />}

      <Heatmap data={heat} />

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">Token 用量</h3>
              <p className="card__sub">{isToday ? '今天的小时用量趋势' : '总 Token 用量趋势'}</p>
            </div>
            <Segmented
              value={trendMode}
              options={[
                { value: 'all', label: '全部' },
                { value: 'detail', label: '详细' },
              ]}
              onChange={setTrendMode}
            />
          </div>
          <TrendChart data={currentWindow} mode={trendMode} />
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">每日趋势</h3>
              <p className="card__sub">{isToday ? '今天按小时的 Token 与费用' : `最近 ${range} 天的 Token 与费用趋势`}</p>
            </div>
            <Segmented
              value={dailyMode}
              options={[
                { value: 'token', label: 'Token' },
                { value: 'cost', label: '费用' },
              ]}
              onChange={setDailyMode}
            />
          </div>
          <DailyChart data={currentWindow} mode={dailyMode} />
        </div>
      </div>

      <div className="grid grid--2">
        <PlatformBreakdown models={models} />
        <ProjectBreakdown projects={projects} modelColors={modelColors} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">工具分布</h3>
              <p className="card__sub">按编程工具与 Agent 查看用量占比</p>
            </div>
          </div>
          <Donut items={sourceItems} centerLabel="总 Token" />
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">模型分布</h3>
              <p className="card__sub">按模型查看 Token 与费用占比</p>
            </div>
          </div>
          <Donut items={modelItems} centerLabel="总 Token" />
        </div>
      </div>

      <footer className="footer">
        {summary && (
          <span>
            统计起于 {summary.statsSince?.slice(0, 10) ?? '—'} · 累计{' '}
            {formatTokens(summary.totalTokens)} · {formatUsd(summary.totalCostUsd)}
          </span>
        )}
        <span className="footer__sep">·</span>
        <span>{rangeLabel}</span>
      </footer>
    </div>
  )
}
