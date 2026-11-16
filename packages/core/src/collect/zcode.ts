/**
 * ZCode（智谱 GLM 的 CLI）采集器。
 *
 * 数据源：`~/.zcode/cli/db/db.sqlite`
 * 新版把用量记在独立的 `model_usage` 表（每次请求一行，append-only）；
 * 老版本只把 usage 塞在 `message.data` 里，所以两条查询都要兜住。
 *
 * 通过 `node:sqlite`（Node ≥ 22.5）只读打开；打开失败（被占用/无此模块）就
 * 复制一份临时快照再读，绝不写回用户的库。
 */
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir, tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import type { UsageBucket } from '../types.ts'
import { toHalfHourStart, toNonNeg } from './common.ts'

export const SOURCE = 'zcode'

const require = createRequire(import.meta.url)

export function zcodeHome(): string {
  const override = process.env.ZCODE_HOME?.trim()
  return override ? override.replace(/^~/, homedir()) : join(homedir(), '.zcode')
}

export function dbPath(home = zcodeHome()): string {
  return join(home, 'cli', 'db', 'db.sqlite')
}

export function listFiles(home = zcodeHome()): string[] {
  const file = dbPath(home)
  return existsSync(file) ? [file] : []
}

interface SqliteModule {
  DatabaseSync: new (path: string, opts?: { readOnly?: boolean }) => {
    prepare: (sql: string) => { all: () => Array<Record<string, unknown>> }
    close: () => void
  }
}

function loadSqlite(): SqliteModule | null {
  try {
    return require('node:sqlite') as SqliteModule
  } catch (error) {
    if (process.env.TTU_DEBUG) console.error('[zcode] 加载 node:sqlite 失败:', error)
    return null
  }
}

function withDb<T>(file: string, fn: (db: InstanceType<SqliteModule['DatabaseSync']>) => T): T | null {
  const sqlite = loadSqlite()
  if (!sqlite || !existsSync(file)) return null

  const attempt = (path: string): T | null => {
    let db
    try {
      db = new sqlite.DatabaseSync(path, { readOnly: true })
      return fn(db)
    } catch (error) {
      if (process.env.TTU_DEBUG) console.error('[zcode] 读取失败:', error)
      return null
    } finally {
      try {
        db?.close()
      } catch {
        /* ignore */
      }
    }
  }

  const direct = attempt(file)
  if (direct != null) return direct

  // CLI 正在写库时可能拿不到读锁，复制一份快照再读
  const tmpDir = mkdtempSync(join(tmpdir(), 'ttu-zcode-'))
  try {
    const copy = join(tmpDir, 'db.sqlite')
    copyFileSync(file, copy)
    return attempt(copy)
  } catch {
    return null
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

function tableExists(db: InstanceType<SqliteModule['DatabaseSync']>, name: string): boolean {
  try {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name)
    return rows.length > 0
  } catch {
    return false
  }
}

/** 时间字段可能是毫秒/秒时间戳，也可能是 ISO 字符串 */
function toIso(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000
    return new Date(ms).toISOString()
  }
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value)
    if (Number.isFinite(asNumber) && /^\d+$/.test(value.trim())) {
      const ms = asNumber > 1e12 ? asNumber : asNumber * 1000
      return new Date(ms).toISOString()
    }
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
  }
  return null
}

function projectOf(root: unknown): string {
  if (typeof root !== 'string' || !root.trim()) return 'unknown'
  return basename(root.trim()) || 'unknown'
}

interface Totals {
  input: number
  cached: number
  cacheWrite: number
  output: number
  reasoning: number
}

function emptyTotals(): Totals {
  return { input: 0, cached: 0, cacheWrite: 0, output: 0, reasoning: 0 }
}

/** 老格式：message.data.tokens = { input, output, reasoning, cache: { read, write } } */
function totalsFromTokens(raw: unknown): Totals | null {
  if (!raw || typeof raw !== 'object') return null
  let tokens: Record<string, unknown>
  try {
    tokens = typeof raw === 'string' ? (JSON.parse(raw) as Record<string, unknown>) : (raw as Record<string, unknown>)
  } catch {
    return null
  }
  const cache = (tokens.cache ?? {}) as Record<string, unknown>
  const totals: Totals = {
    input: toNonNeg(tokens.input ?? tokens.input_tokens),
    cached: toNonNeg(cache.read ?? tokens.cache_read_input_tokens),
    cacheWrite: toNonNeg(cache.write ?? tokens.cache_creation_input_tokens),
    output: toNonNeg(tokens.output ?? tokens.output_tokens),
    reasoning: toNonNeg(tokens.reasoning ?? tokens.reasoning_output_tokens),
  }
  return totals.input + totals.cached + totals.cacheWrite + totals.output + totals.reasoning === 0 ? null : totals
}

interface ParsedRow {
  id: string
  model: string
  project: string
  hourStart: string
  totals: Totals
}

function parseFromUsageTable(db: InstanceType<SqliteModule['DatabaseSync']>): ParsedRow[] {
  const rows = db
    .prepare(
      `SELECT
         u.id AS id,
         u.model_id AS model,
         u.started_at AS startedAt,
         u.input_tokens AS inputTokens,
         u.output_tokens AS outputTokens,
         u.reasoning_tokens AS reasoningTokens,
         u.cache_creation_input_tokens AS cacheWrite,
         u.cache_read_input_tokens AS cacheRead,
         u.computed_total_tokens AS total,
         json_extract(m.data, '$.path.root') AS rootPath
       FROM model_usage u
       LEFT JOIN message m ON m.id = u.assistant_message_id
       WHERE u.computed_total_tokens > 0`,
    )
    .all()

  const out: ParsedRow[] = []
  for (const row of rows) {
    const hourStart = toHalfHourStart(toIso(row.startedAt))
    if (!hourStart) continue
    const totals: Totals = {
      input: toNonNeg(row.inputTokens),
      cached: toNonNeg(row.cacheRead),
      cacheWrite: toNonNeg(row.cacheWrite),
      output: toNonNeg(row.outputTokens),
      reasoning: toNonNeg(row.reasoningTokens),
    }
    if (totals.input + totals.cached + totals.cacheWrite + totals.output + totals.reasoning === 0) continue
    out.push({
      id: String(row.id ?? `${hourStart}-${out.length}`),
      model: typeof row.model === 'string' && row.model ? row.model : 'glm',
      project: projectOf(row.rootPath),
      hourStart,
      totals,
    })
  }
  return out
}

function parseFromMessageTable(db: InstanceType<SqliteModule['DatabaseSync']>): ParsedRow[] {
  const rows = db
    .prepare(
      `SELECT
         id AS id,
         json_extract(data, '$.time.created') AS created,
         json_extract(data, '$.modelID') AS modelID,
         json_extract(data, '$.model') AS model,
         json_extract(data, '$.tokens') AS tokens,
         json_extract(data, '$.path.root') AS rootPath
       FROM message
       WHERE json_extract(data, '$.role') = 'assistant'`,
    )
    .all()

  const out: ParsedRow[] = []
  for (const row of rows) {
    const hourStart = toHalfHourStart(toIso(row.created))
    if (!hourStart) continue
    const totals = totalsFromTokens(row.tokens)
    if (!totals) continue
    const model = typeof row.modelID === 'string' && row.modelID
      ? row.modelID
      : typeof row.model === 'string' && row.model
        ? row.model
        : 'glm'
    out.push({
      id: String(row.id ?? `${hourStart}-${out.length}`),
      model,
      project: projectOf(row.rootPath),
      hourStart,
      totals,
    })
  }
  return out
}

export function parseFile(file: string): UsageBucket[] {
  const rows = withDb(file, (db) => {
    if (tableExists(db, 'model_usage')) {
      const fromUsage = parseFromUsageTable(db)
      if (fromUsage.length > 0) return fromUsage
    }
    return tableExists(db, 'message') ? parseFromMessageTable(db) : []
  })
  if (!rows) return []

  const buckets = new Map<string, UsageBucket>()
  const seen = new Set<string>()

  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)

    const key = `${row.hourStart}|${row.model}|${row.project}`
    const bucket =
      buckets.get(key) ??
      ({
        hour_start: row.hourStart,
        source: SOURCE,
        model: row.model,
        project: row.project,
        collector: SOURCE,
        input_tokens: 0,
        output_tokens: 0,
        cached_input_tokens: 0,
        cache_creation_input_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 0,
        conversation_count: 0,
      } satisfies UsageBucket)

    bucket.input_tokens += row.totals.input
    bucket.output_tokens += row.totals.output
    bucket.cached_input_tokens += row.totals.cached
    bucket.cache_creation_input_tokens += row.totals.cacheWrite
    bucket.reasoning_output_tokens += row.totals.reasoning
    bucket.total_tokens +=
      row.totals.input + row.totals.cached + row.totals.cacheWrite + row.totals.output + row.totals.reasoning
    bucket.conversation_count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
}
