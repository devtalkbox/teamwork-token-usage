/**
 * 采集层公共件：时间桶、文件遍历、压缩读取、项目名解析。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { decompressZstdFrames } from './zstd.ts'

/** 归到半小时桶（UTC，与 jusage 的 hour_start 对齐） */
export function toHalfHourStart(iso: string | number | null | undefined): string | null {
  if (iso == null) return null
  const ms = typeof iso === 'number' ? iso : Date.parse(iso)
  if (!Number.isFinite(ms)) return null
  const d = new Date(Math.floor(ms / (30 * 60 * 1000)) * 30 * 60 * 1000)
  return d.toISOString()
}

/** 递归列出匹配的文件；跳过超过 maxDepth 的层级，避免扫到无关目录 */
export function walkFiles(dir: string, match: (name: string) => boolean, maxDepth = 6): string[] {
  const out: string[] = []
  const walk = (current: string, depth: number) => {
    if (depth > maxDepth) return
    let entries: string[]
    try {
      entries = readdirSync(current)
    } catch {
      return
    }
    for (const name of entries) {
      const full = join(current, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) walk(full, depth + 1)
      else if (match(name)) out.push(full)
    }
  }
  walk(dir, 0)
  return out
}

/** 读日志：按扩展名决定是否解压（.zst / .zstd） */
export function readLogText(file: string): string {
  const buf = readFileSync(file)
  if (file.endsWith('.zstd') || file.endsWith('.zst')) return decompressZstdFrames(buf)
  return buf.toString('utf8')
}

/** `/Users/x/code/Murmur` → `Murmur`；解析不出就用 unknown */
export function projectFromCwd(cwd: string | null | undefined): string {
  if (!cwd || typeof cwd !== 'string') return 'unknown'
  const name = basename(cwd.trim())
  return name || 'unknown'
}

export function toNonNeg(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function parseJsonLine(line: string): Record<string, unknown> | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed[0] !== '{') return null
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    return null
  }
}
