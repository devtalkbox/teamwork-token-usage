/**
 * 图表数据层：把「按天」和「按小时」两种聚合统一成同一个形状，
 * 这样图表组件不用关心粒度，只认 label。
 */
import type { DailyPoint, HourlyPoint } from '@ttu/core'
import { shortDate } from './format'

export interface ChartPoint {
  id: string
  label: string
  tokens: number
  costUsd: number
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  sources: Array<{ source: string; tokens: number; costUsd: number }>
}

export function dayPoints(days: DailyPoint[]): ChartPoint[] {
  return days.map((d) => ({
    id: d.date,
    label: shortDate(d.date),
    tokens: d.tokens,
    costUsd: d.costUsd,
    inputTokens: d.inputTokens,
    outputTokens: d.outputTokens,
    cachedInputTokens: d.cachedInputTokens,
    sources: d.sources,
  }))
}

/** 小时点按 source 拆开返回，这里先合并回「一个小时一行」 */
export function hourPoints(hours: HourlyPoint[]): ChartPoint[] {
  const map = new Map<string, ChartPoint & { sourceMap: Map<string, { tokens: number; costUsd: number }> }>()

  for (const h of hours) {
    const id = `${h.date}T${String(h.hour).padStart(2, '0')}`
    const point =
      map.get(id) ??
      ({
        id,
        label: `${String(h.hour).padStart(2, '0')}:00`,
        tokens: 0,
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        sources: [],
        sourceMap: new Map(),
      } as ChartPoint & { sourceMap: Map<string, { tokens: number; costUsd: number }> })

    point.tokens += h.tokens
    point.costUsd += h.costUsd
    point.inputTokens += h.inputTokens
    point.outputTokens += h.outputTokens
    point.cachedInputTokens += h.cachedInputTokens

    const slice = point.sourceMap.get(h.source) ?? { tokens: 0, costUsd: 0 }
    slice.tokens += h.tokens
    slice.costUsd += h.costUsd
    point.sourceMap.set(h.source, slice)
    map.set(id, point)
  }

  return [...map.values()].map(({ sourceMap, ...point }) => ({
    ...point,
    sources: [...sourceMap.entries()].map(([source, v]) => ({ source, ...v })),
  }))
}

/** 补齐某个日期 0-23 点，保证 x 轴稳定（没有数据的小时补 0） */
export function fillDayHours(date: string, points: ChartPoint[]): ChartPoint[] {
  const byId = new Map(points.map((p) => [p.id, p]))
  return Array.from({ length: 24 }, (_, hour) => {
    const id = `${date}T${String(hour).padStart(2, '0')}`
    return (
      byId.get(id) ?? {
        id,
        label: `${String(hour).padStart(2, '0')}:00`,
        tokens: 0,
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        sources: [],
      }
    )
  })
}
