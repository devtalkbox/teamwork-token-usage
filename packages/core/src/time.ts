/**
 * 时区处理：所有「按天/按小时」的聚合都按本地时区切，不按 UTC。
 *
 * 桶本身是 UTC 半小时对齐的（jusage 的约定），但用户看的是「今天用了多少」，
 * 所以展示层的日期必须落回本地时区，否则早上 8 点前的用量会被算到前一天。
 */
const TZ = process.env.TTU_TZ?.trim() || 'Asia/Shanghai'

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  hourCycle: 'h23',
})

/** UTC ISO → 本地日期 YYYY-MM-DD */
export function localDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

/** UTC ISO → 本地小时 0-23 */
export function localHour(iso: string): number {
  return Number(hourFmt.format(new Date(iso)))
}

export function todayLocal(now: Date = new Date()): string {
  return dateFmt.format(now)
}

/** 本地日期往前推 n 天的 YYYY-MM-DD */
export function shiftLocalDate(date: string, deltaDays: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + deltaDays)
  return d.toISOString().slice(0, 10)
}

export function timezone(): string {
  return TZ
}
