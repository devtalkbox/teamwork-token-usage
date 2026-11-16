/**
 * 数据加载：读用量桶的 jsonl（可能来自我们自己采集，也可能来自 jusage）。
 *
 * v1 时只有一个数据源；现在有两个：
 *   ~/.ai-usage/queue   jusage 写的（历史兼容）
 *   ~/.ttu/queue        我们自己采集的（优先）
 *
 * 两个目录一起读，按 key 去重，后读到的覆盖先读到的 —— 所以自己的数据放最后。
 *
 * 读盘按 (mtime, size) 做缓存，文件没变就不重复解析。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageBucket } from './types.ts'

export const DEFAULT_DATA_DIR = join(homedir(), '.ai-usage')

/** jusage 的数据目录（历史数据 + 定价表所在处） */
export function resolveDataDir(): string {
  const override = process.env.TTU_DATA_DIR?.trim()
  return override ? override.replace(/^~/, homedir()) : DEFAULT_DATA_DIR
}

/** 我们自己的数据目录 */
export function resolveOwnDir(): string {
  const override = process.env.TTU_HOME?.trim()
  return override ? override.replace(/^~/, homedir()) : join(homedir(), '.ttu')
}

/** 按优先级返回所有数据目录：先 jusage，后自己的（后者覆盖前者） */
export function resolveDataDirs(): string[] {
  const dirs: string[] = []
  const jusage = resolveDataDir()
  if (existsSync(jusage)) dirs.push(jusage)
  const own = resolveOwnDir()
  if (existsSync(own)) dirs.push(own)
  if (dirs.length === 0) dirs.push(jusage)
  return dirs
}

interface CacheEntry {
  signature: string
  buckets: UsageBucket[]
  lastModifiedAt: string | null
}

let cache: CacheEntry | null = null

function listQueueFiles(dataDir: string): string[] {
  const dir = join(dataDir, 'queue')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.jsonl'))
    .map((name) => join(dir, name))
    .sort()
}

function signatureOf(files: string[]): { signature: string; lastModifiedAt: string | null } {
  let signature = ''
  let latest = 0
  for (const file of files) {
    const st = statSync(file)
    signature += `${file}:${st.size}:${st.mtimeMs}|`
    if (st.mtimeMs > latest) latest = st.mtimeMs
  }
  return {
    signature,
    lastModifiedAt: latest > 0 ? new Date(latest).toISOString() : null,
  }
}

function parseFile(file: string, into: Map<string, UsageBucket>): void {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      const raw = JSON.parse(trimmed) as Partial<UsageBucket>
      if (!raw.hour_start || !raw.source) continue
      const bucket: UsageBucket = {
        hour_start: raw.hour_start,
        source: raw.source,
        model: raw.model ?? 'unknown',
        project: raw.project ?? 'default-workspace',
        collector: raw.collector,
        input_tokens: raw.input_tokens ?? 0,
        output_tokens: raw.output_tokens ?? 0,
        cached_input_tokens: raw.cached_input_tokens ?? 0,
        cache_creation_input_tokens: raw.cache_creation_input_tokens ?? 0,
        reasoning_output_tokens: raw.reasoning_output_tokens ?? 0,
        total_tokens: raw.total_tokens ?? 0,
        conversation_count: raw.conversation_count ?? 0,
        reported_cost_usd: raw.reported_cost_usd,
      }
      // 队列是追加日志：同一桶会被反复追写，后写的才是最新累计值。
      // 直接求和会放大数倍（本机实测 8.4B vs 真实 1.2B），必须按键覆盖。
      into.set(bucketKey(bucket), bucket)
    } catch {
      // 半行/损坏行直接跳过，不能让一条脏数据打挂整个看板
    }
  }
}

/** 用量桶的去重键 —— 团队上报的幂等键也用这个 */
export function bucketKey(b: UsageBucket): string {
  return [b.hour_start, b.source, b.model, b.project, b.collector ?? ''].join('|')
}

export interface LoadResult {
  buckets: UsageBucket[]
  lastModifiedAt: string | null
  dataDirs: string[]
}

export function loadBuckets(dirs: string[] = resolveDataDirs()): LoadResult {
  const files = dirs.flatMap(listQueueFiles)
  const { signature, lastModifiedAt } = signatureOf(files)

  if (cache && cache.signature === signature) {
    return { buckets: cache.buckets, lastModifiedAt: cache.lastModifiedAt, dataDirs: dirs }
  }

  // 按目录顺序读；后面的目录（我们自己的采集）对同一个 source 拥有最终解释权。
  // 否则同一个 source 会被两套数据各算一遍（实测 codex 会多出 60%）。
  const perDir = dirs.map((dir) => {
    const map = new Map<string, UsageBucket>()
    for (const file of listQueueFiles(dir)) parseFile(file, map)
    return map
  })

  const ownSources = new Set([...perDir.at(-1)!.values()].map((b) => b.source))
  const merged = new Map<string, UsageBucket>()
  perDir.forEach((map, index) => {
    const isOwn = index === perDir.length - 1
    for (const [key, bucket] of map) {
      if (!isOwn && ownSources.has(bucket.source)) continue
      merged.set(key, bucket)
    }
  })

  const list = [...merged.values()]
  cache = { signature, buckets: list, lastModifiedAt }
  return { buckets: list, lastModifiedAt, dataDirs: dirs }
}

/** 测试/热重载用 */
export function resetCache(): void {
  cache = null
}
