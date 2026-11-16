/**
 * 聚合：把「桶」变成看板需要的几种形状。
 *
 * 所有函数都先按本地日期窗口过滤，再分组累加；数字口径与 jusage 的
 * aggregate-*.ts 保持一致，方便和 http://127.0.0.1:8452 上的数字对账。
 */
import { computeBucketCost, roundCostUsd, type PricingData } from './pricing.ts'
import { localDate, localHour, shiftLocalDate, todayLocal } from './time.ts'
import type {
  DailyPoint,
  HourlyPoint,
  ModelSlice,
  PricedRow,
  ProjectSlice,
  SourceSlice,
  UsageBucket,
  UsageSummary,
} from './types.ts'

/** 五个 token 字段之和 —— 不信任 total_tokens（历史数据可能漏算 reasoning） */
function bucketTokens(b: UsageBucket): number {
  return (
    (b.input_tokens || 0) +
    (b.output_tokens || 0) +
    (b.cached_input_tokens || 0) +
    (b.cache_creation_input_tokens || 0) +
    (b.reasoning_output_tokens || 0)
  )
}

export function toRows(buckets: UsageBucket[], pricing: PricingData): PricedRow[] {
  return buckets.map((b) => ({
    ...b,
    tokens: bucketTokens(b),
    costUsd: computeBucketCost(b, pricing),
    date: localDate(b.hour_start),
    hour: localHour(b.hour_start),
  }))
}

/** 最近 n 天（含今天）的起始本地日期 */
export function windowStart(days: number): string {
  return shiftLocalDate(todayLocal(), -(Math.max(1, days) - 1))
}

function within(rows: PricedRow[], days: number): PricedRow[] {
  const start = windowStart(days)
  return rows.filter((row) => row.date >= start)
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 1000) / 10
}

export function summarize(rows: PricedRow[], statsSince: string | null): UsageSummary {
  const today = todayLocal()
  let totalTokens = 0
  let totalCostUsd = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0
  let totalCachedInputTokens = 0
  let todayTokens = 0
  let todayCostUsd = 0
  const bySource = new Map<string, { tokens: number; costUsd: number }>()

  for (const row of rows) {
    totalTokens += row.tokens
    totalCostUsd += row.costUsd
    totalInputTokens += row.input_tokens
    totalOutputTokens += row.output_tokens
    totalCachedInputTokens += row.cached_input_tokens
    if (row.date === today) {
      todayTokens += row.tokens
      todayCostUsd += row.costUsd
    }
    const entry = bySource.get(row.source) ?? { tokens: 0, costUsd: 0 }
    entry.tokens += row.tokens
    entry.costUsd += row.costUsd
    bySource.set(row.source, entry)
  }

  const sources: SourceSlice[] = [...bySource.entries()]
    .map(([source, v]) => ({
      source,
      tokens: v.tokens,
      costUsd: roundCostUsd(v.costUsd),
      pct: pct(v.tokens, totalTokens),
    }))
    .sort((a, b) => b.tokens - a.tokens)

  return {
    totalTokens,
    totalCostUsd: roundCostUsd(totalCostUsd),
    totalInputTokens,
    totalOutputTokens,
    totalCachedInputTokens,
    todayTokens,
    todayCostUsd: roundCostUsd(todayCostUsd),
    bySource: sources,
    statsSince,
  }
}

/** 按天聚合；缺失的日期补 0，保证图表 x 轴连续 */
export function aggregateDaily(rows: PricedRow[], days: number): DailyPoint[] {
  const points = new Map<string, DailyPoint & { sourceMap: Map<string, { tokens: number; costUsd: number }> }>()
  const start = windowStart(days)

  for (let i = 0; i < days; i += 1) {
    const date = shiftLocalDate(start, i)
    points.set(date, {
      date,
      tokens: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      sources: [],
      sourceMap: new Map(),
    })
  }

  for (const row of within(rows, days)) {
    const point = points.get(row.date)
    if (!point) continue
    point.tokens += row.tokens
    point.costUsd += row.costUsd
    point.inputTokens += row.input_tokens
    point.outputTokens += row.output_tokens
    point.cachedInputTokens += row.cached_input_tokens
    const slice = point.sourceMap.get(row.source) ?? { tokens: 0, costUsd: 0 }
    slice.tokens += row.tokens
    slice.costUsd += row.costUsd
    point.sourceMap.set(row.source, slice)
  }

  return [...points.values()].map((point) => ({
    date: point.date,
    tokens: point.tokens,
    costUsd: roundCostUsd(point.costUsd),
    inputTokens: point.inputTokens,
    outputTokens: point.outputTokens,
    cachedInputTokens: point.cachedInputTokens,
    sources: [...point.sourceMap.entries()]
      .map(([source, v]) => ({ source, tokens: v.tokens, costUsd: roundCostUsd(v.costUsd) }))
      .sort((a, b) => b.tokens - a.tokens),
  }))
}

/** 按「日期 + 小时」聚合，热力图和小时分布用 */
export function aggregateHourly(rows: PricedRow[], days: number): HourlyPoint[] {
  const map = new Map<string, HourlyPoint>()
  for (const row of within(rows, days)) {
    const key = `${row.date}|${row.hour}|${row.source}`
    const point = map.get(key) ?? {
      date: row.date,
      hour: row.hour,
      source: row.source,
      tokens: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
    }
    point.tokens += row.tokens
    point.costUsd += row.costUsd
    point.inputTokens += row.input_tokens
    point.outputTokens += row.output_tokens
    point.cachedInputTokens += row.cached_input_tokens
    map.set(key, point)
  }
  return [...map.values()]
    .map((point) => ({ ...point, costUsd: roundCostUsd(point.costUsd) }))
    .sort((a, b) => (a.date === b.date ? a.hour - b.hour : a.date < b.date ? -1 : 1))
}

export function aggregateModels(rows: PricedRow[], days: number): ModelSlice[] {
  const map = new Map<string, ModelSlice>()
  let total = 0
  for (const row of within(rows, days)) {
    total += row.tokens
    const key = `${row.source}|${row.model}`
    const slice = map.get(key) ?? {
      model: row.model,
      source: row.source,
      tokens: 0,
      costUsd: 0,
      pct: 0,
      conversationCount: 0,
    }
    slice.tokens += row.tokens
    slice.costUsd += row.costUsd
    slice.conversationCount += row.conversation_count
    map.set(key, slice)
  }
  return [...map.values()]
    .map((slice) => ({ ...slice, costUsd: roundCostUsd(slice.costUsd), pct: pct(slice.tokens, total) }))
    .sort((a, b) => b.tokens - a.tokens)
}

export function aggregateProjects(rows: PricedRow[], days: number): ProjectSlice[] {
  const map = new Map<string, ProjectSlice & { modelSet: Set<string>; sourceSet: Set<string> }>()
  let total = 0
  for (const row of within(rows, days)) {
    total += row.tokens
    const slice = map.get(row.project) ?? {
      project: row.project,
      tokens: 0,
      costUsd: 0,
      pct: 0,
      models: 0,
      sources: [],
      modelSet: new Set<string>(),
      sourceSet: new Set<string>(),
    }
    slice.tokens += row.tokens
    slice.costUsd += row.costUsd
    slice.modelSet.add(row.model)
    slice.sourceSet.add(row.source)
    map.set(row.project, slice)
  }
  return [...map.values()]
    .map((slice) => ({
      project: slice.project,
      tokens: slice.tokens,
      costUsd: roundCostUsd(slice.costUsd),
      pct: pct(slice.tokens, total),
      models: slice.modelSet.size,
      sources: [...slice.sourceSet].sort(),
    }))
    .sort((a, b) => b.tokens - a.tokens)
}
