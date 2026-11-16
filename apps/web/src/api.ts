/**
 * 前端只认这一组 API 契约。v2 换成团队服务端时，改 VITE_API_BASE 就够了。
 */
import type { DailyPoint, HourlyPoint, ModelSlice, ProjectSlice, UsageSummary } from '@ttu/core'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

const BASE = import.meta.env.VITE_API_BASE ?? ''

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`)
  const body = (await res.json()) as Envelope<T>
  if (!body.success) throw new Error(body.message || `${path} 失败`)
  return body.data
}

export const fetchSummary = (source?: string) =>
  get<UsageSummary>(`/functions/tud-usage-summary${qs({ source })}`)

export const fetchDaily = (days: number, source?: string) =>
  get<{ days: DailyPoint[] }>(`/functions/tud-usage-daily${qs({ days, source })}`).then((r) => r.days)

export const fetchHourly = (days: number, source?: string) =>
  get<{ hours: HourlyPoint[] }>(`/functions/tud-usage-hourly${qs({ days, source })}`).then((r) => r.hours)

export const fetchModels = (days: number, source?: string) =>
  get<{ models: ModelSlice[] }>(`/functions/tud-usage-model-breakdown${qs({ days, source })}`).then(
    (r) => r.models,
  )

export const fetchProjects = (days: number, source?: string) =>
  get<{ projects: ProjectSlice[] }>(`/functions/tud-usage-project-breakdown${qs({ days, source })}`).then(
    (r) => r.projects,
  )
