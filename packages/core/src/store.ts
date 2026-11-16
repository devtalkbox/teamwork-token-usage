/**
 * 数据加载：直接读 jusage 已经落盘的用量桶。
 *
 * Phase 1 刻意不自己采集 —— 本机只要有 jusage 在跑（或跑过一次），
 * `~/.ai-usage/queue/*.jsonl` 就是最新的。这样省掉了全部 parser 工作，
 * 先把「数据 → API → 看板」这条链跑通；Phase 2 再换成自己同步。
 *
 * 读盘按 (mtime, size) 做缓存，队列文件没变就不重复解析。
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageBucket } from './types.ts'

export const DEFAULT_DATA_DIR = join(homedir(), '.ai-usage')

export function resolveDataDir(): string {
  const override = process.env.TTU_DATA_DIR?.trim()
  return override ? override.replace(/^~/, homedir()) : DEFAULT_DATA_DIR
}

interface CacheEntry {
  signature: string
  buckets: UsageBucket[]
  lastModifiedAt: string | null
}

let cache: CacheEntry | null = null

function queueDir(dataDir: string): string {
  return join(dataDir, 'queue')
}

function listQueueFiles(dataDir: string): string[] {
  const dir = queueDir(dataDir)
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
  dataDir: string
}

export function loadBuckets(dataDir = resolveDataDir()): LoadResult {
  const files = listQueueFiles(dataDir)
  const { signature, lastModifiedAt } = signatureOf(files)

  if (cache && cache.signature === signature) {
    return { buckets: cache.buckets, lastModifiedAt: cache.lastModifiedAt, dataDir }
  }

  const buckets = new Map<string, UsageBucket>()
  for (const file of files) parseFile(file, buckets)
  const list = [...buckets.values()]
  cache = { signature, buckets: list, lastModifiedAt }
  return { buckets: list, lastModifiedAt, dataDir }
}

/** 测试/热重载用 */
export function resetCache(): void {
  cache = null
}
