/** 展示层的数字格式：token 用 K/M/B，钱保留两位小数 */
export function formatTokens(n: number): string {
  const v = Math.abs(n)
  if (v >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(Math.round(n))
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`
}

/** 本地日期往前推 n 天 */
export function shiftDate(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 2026-11-13 → 11/13 */
export function shortDate(date: string): string {
  const [, m, d] = date.split('-')
  return `${Number(m)}/${Number(d)}`
}
