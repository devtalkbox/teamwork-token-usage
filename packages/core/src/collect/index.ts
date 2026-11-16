/**
 * 采集总入口：扫三个工具的本地日志，按文件缓存解析结果，产出统一格式的用量桶。
 *
 * 去重靠「文件指纹」：只要 (inode, size, mtime) 没变就复用上次解析结果；
 * 变了就整份重解析——这些日志是追加写，增量读 zstd 不可行，整份重读更可靠。
 *
 * 产出写到 `~/.ttu/queue/YYYY-MM.jsonl`，格式与 jusage 完全一致，
 * 所以服务端和前端都不需要为此改动。
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageBucket } from '../types.ts'
import { bucketKey } from '../store.ts'
import * as claude from './claude.ts'
import * as codex from './codex.ts'
import * as dsh from './dsh.ts'

const SOURCES = [
  { name: dsh.SOURCE, list: dsh.listFiles, parse: dsh.parseFile },
  { name: codex.SOURCE, list: codex.listFiles, parse: codex.parseFile },
  { name: claude.SOURCE, list: claude.listFiles, parse: claude.parseFile },
]

export function collectHome(): string {
  const override = process.env.TTU_HOME?.trim()
  return override ? override.replace(/^~/, homedir()) : join(homedir(), '.ttu')
}

interface FileCache {
  path: string
  inode: number
  size: number
  mtimeMs: number
  buckets: UsageBucket[]
}

export interface CollectResult {
  scanned: number
  parsed: number
  skipped: number
  buckets: UsageBucket[]
  bySource: Record<string, { files: number; buckets: number; tokens: number }>
  queueFiles: string[]
  home: string
}

function cachePath(home: string, file: string): string {
  const hash = createHash('sha1').update(file).digest('hex').slice(0, 16)
  return join(home, 'collect', `${hash}.json`)
}

function readCache(file: string): FileCache | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as FileCache
  } catch {
    return null
  }
}

function tokensOf(bucket: UsageBucket): number {
  return (
    bucket.input_tokens +
    bucket.output_tokens +
    bucket.cached_input_tokens +
    bucket.cache_creation_input_tokens +
    bucket.reasoning_output_tokens
  )
}

export function collectAll(options: { force?: boolean } = {}): CollectResult {
  const home = collectHome()
  const cacheDir = join(home, 'collect')
  mkdirSync(cacheDir, { recursive: true })

  const all: UsageBucket[] = []
  const bySource: CollectResult['bySource'] = {}
  let scanned = 0
  let parsed = 0
  let skipped = 0

  for (const source of SOURCES) {
    let files: string[] = []
    try {
      files = source.list()
    } catch {
      files = []
    }
    const stat = { files: 0, buckets: 0, tokens: 0 }

    for (const file of files) {
      scanned += 1
      let info
      try {
        info = statSync(file)
      } catch {
        continue
      }
      const cacheFile = cachePath(home, file)
      const cached = readCache(cacheFile)

      let buckets: UsageBucket[]
      if (
        !options.force &&
        cached &&
        cached.inode === info.ino &&
        cached.size === info.size &&
        cached.mtimeMs === info.mtimeMs
      ) {
        buckets = cached.buckets
        skipped += 1
      } else {
        try {
          buckets = source.parse(file)
        } catch {
          continue
        }
        parsed += 1
        writeFileSync(
          cacheFile,
          JSON.stringify({ path: file, inode: info.ino, size: info.size, mtimeMs: info.mtimeMs, buckets }),
        )
      }

      stat.files += 1
      stat.buckets += buckets.length
      for (const bucket of buckets) {
        stat.tokens += tokensOf(bucket)
        all.push(bucket)
      }
    }
    bySource[source.name] = stat
  }

  const queueFiles = writeQueue(home, mergeBuckets(all))
  pruneCache(cacheDir, scanned)

  return { scanned, parsed, skipped, buckets: all, bySource, queueFiles, home }
}

/**
 * 合并同一个 key 的桶。
 *
 * 同一个 (小时, 模型, 项目) 往往来自多个会话文件，必须先相加再落盘 ——
 * 否则读取端按 key 去重时会只保留最后一条，直接丢数据（实测少 30%）。
 */
export function mergeBuckets(list: UsageBucket[]): UsageBucket[] {
  const merged = new Map<string, UsageBucket>()
  for (const bucket of list) {
    const key = bucketKey(bucket)
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, { ...bucket })
      continue
    }
    existing.input_tokens += bucket.input_tokens
    existing.output_tokens += bucket.output_tokens
    existing.cached_input_tokens += bucket.cached_input_tokens
    existing.cache_creation_input_tokens += bucket.cache_creation_input_tokens
    existing.reasoning_output_tokens += bucket.reasoning_output_tokens
    existing.total_tokens += bucket.total_tokens
    existing.conversation_count += bucket.conversation_count
  }
  return [...merged.values()]
}

/** 按 UTC 月份重写队列文件；每次全量重写，保证幂等 */
function writeQueue(home: string, buckets: UsageBucket[]): string[] {
  const dir = join(home, 'queue')
  mkdirSync(dir, { recursive: true })

  const months = new Map<string, UsageBucket[]>()
  for (const bucket of buckets) {
    const month = bucket.hour_start.slice(0, 7)
    const list = months.get(month) ?? []
    list.push(bucket)
    months.set(month, list)
  }

  const written: string[] = []
  for (const [month, list] of months) {
    list.sort((a, b) => a.hour_start.localeCompare(b.hour_start))
    const file = join(dir, `${month}.jsonl`)
    writeFileSync(file, `${list.map((b) => JSON.stringify(b)).join('\n')}\n`)
    written.push(file)
  }

  // 清掉已经被删掉的月份（例如强制重扫后数据变少）
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.jsonl')) continue
      if (!months.has(name.slice(0, 7))) rmSync(join(dir, name), { force: true })
    }
  }
  return written
}

/** 缓存目录里的孤儿文件（源文件已删除）清掉 */
function pruneCache(cacheDir: string, _scanned: number): void {
  if (!existsSync(cacheDir)) return
  const now = Date.now()
  for (const name of readdirSync(cacheDir)) {
    const full = join(cacheDir, name)
    try {
      const cached = readCache(full)
      if (!cached) continue
      if (!existsSync(cached.path)) rmSync(full, { force: true })
      // 兜底：半年没更新的缓存直接清掉，避免目录无限膨胀
      else if (now - statSync(full).mtimeMs > 180 * 24 * 3600 * 1000) rmSync(full, { force: true })
    } catch {
      rmSync(full, { force: true })
    }
  }
}
