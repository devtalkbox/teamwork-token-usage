import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DailyPoint, ModelSlice, ProjectSlice, UsageSummary } from '@ttu/core'
import { fetchDaily, fetchModels, fetchProjects, fetchSummary } from './api'
import { DailyChart, Segmented, TrendChart } from './components/Charts'
import { KpiCards } from './components/KpiCards'
import { Heatmap } from './components/Heatmap'
import { Donut, PlatformBreakdown, ProjectBreakdown } from './components/Breakdown'
import { formatTokens, formatUsd } from './format'

const RANGES = [
  { value: 1, label: '今天' },
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
] as const

export default function App() {
  const [range, setRange] = useState<number>(7)
  const [source, setSource] = useState<string>('')
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [sources, setSources] = useState<string[]>([])
  const [daily, setDaily] = useState<DailyPoint[]>([])
  const [heat, setHeat] = useState<DailyPoint[]>([])
  const [models, setModels] = useState<ModelSlice[]>([])
  const [projects, setProjects] = useState<ProjectSlice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendMode, setTrendMode] = useState<'all' | 'detail'>('all')
  const [dailyMode, setDailyMode] = useState<'token' | 'cost'>('token')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const doubled = Math.min(range * 2, 365)
      const [overall, scoped, doubleDaily, modelList, projectList, heatDaily] = await Promise.all([
        fetchSummary(),
        source ? fetchSummary(source) : Promise.resolve(null),
        fetchDaily(doubled, source || undefined),
        fetchModels(range, source || undefined),
        fetchProjects(range, source || undefined),
        fetchDaily(365, source || undefined),
      ])
      setSummary(scoped ?? overall)
      setSources(overall.bySource.map((s) => s.source))
      setDaily(doubleDaily)
      setModels(modelList)
      setProjects(projectList)
      setHeat(heatDaily)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [range, source])

  useEffect(() => {
    void load()
  }, [load])

  // daily 存的是 2×range 的窗口：后一半是本期，前一半是上期（算环比用）
  const currentWindow = useMemo(() => daily.slice(-range), [daily, range])
  const previousWindow = useMemo(
    () => daily.slice(Math.max(daily.length - range * 2, 0), Math.max(daily.length - range, 0)),
    [daily, range],
  )

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

  const modelItems = useMemo(() => {
    const palette = ['#2f6fed', '#34a853', '#f5a524', '#8b95a7', '#7f56d9']
    const top = models.slice(0, 5).map((model, i) => ({
      name: model.model,
      value: model.tokens,
      color: palette[i % palette.length],
    }))
    const rest = models.slice(5).reduce((s, m) => s + m.tokens, 0)
    if (rest > 0) top.push({ name: '其他', value: rest, color: '#cbd5e1' })
    return top
  }, [models])

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
              <p className="card__sub">总 Token 用量趋势</p>
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
              <p className="card__sub">最近 {range} 天的 Token 与费用趋势</p>
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
        <ProjectBreakdown projects={projects} />
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
        <span>
          数据来自 <code>~/.ai-usage/queue/*.jsonl</code>
        </span>
      </footer>
    </div>
  )
}
