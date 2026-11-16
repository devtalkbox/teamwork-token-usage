/**
 * Kimi Code CLI 采集器。
 *
 * 数据源：`~/.kimi-code/sessions/**` 下的 `wire.jsonl`（旧版在 `~/.kimi`）。
 * 一行一个事件；真正带用量的是 `step.end`（外层可能是 `context.append_loop_event`）。
 * 模型来自 `config.update` 的 `modelAlias`，按出现顺序向前生效。
 * 项目名从路径里的 `wd_<名字>_<hash>` 段解析。
 *
 * 同一个 `uuid` 只计一次，避免重放/续写时重复计数。
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageBucket } from '../types.ts'
import { parseJsonLine, readLogText, toHalfHourStart, toNonNeg, walkFiles } from './common.ts'

export const SOURCE = 'kimi'

export function kimiHome(): string {
  const override = process.env.KIMI_CODE_HOME?.trim()
  return override ? override.replace(/^~/, homedir()) : join(homedir(), '.kimi-code')
}

export function listFiles(home = kimiHome()): string[] {
  return walkFiles(join(home, 'sessions'), (name) => name === 'wire.jsonl', 8)
}

interface KimiUsage {
  inputOther?: number
  inputCacheRead?: number
  inputCacheCreation?: number
  output?: number
  input_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  output_tokens?: number
  input_tokens_details?: { cached_tokens?: number }
}

/** Kimi 原生字段（inputOther 系列）和 OpenAI 风格字段都要认 */
function normalizeUsage(usage: KimiUsage) {
  if (usage.inputOther != null) {
    return {
      input: toNonNeg(usage.inputOther),
      cached: toNonNeg(usage.inputCacheRead),
      cacheWrite: toNonNeg(usage.inputCacheCreation),
      output: toNonNeg(usage.output),
    }
  }
  if (usage.cache_read_input_tokens != null) {
    return {
      input: toNonNeg(usage.input_tokens),
      cached: toNonNeg(usage.cache_read_input_tokens),
      cacheWrite: toNonNeg(usage.cache_creation_input_tokens),
      output: toNonNeg(usage.output_tokens),
    }
  }
  const cached = toNonNeg(usage.input_tokens_details?.cached_tokens)
  return {
    input: Math.max(0, toNonNeg(usage.input_tokens) - cached),
    cached,
    cacheWrite: toNonNeg(usage.cache_creation_input_tokens),
    output: toNonNeg(usage.output_tokens),
  }
}

function projectFromPath(file: string): string {
  const segments = file.split('/')
  const wd = segments.find((s) => /^wd_.+_[0-9a-f]+$/i.test(s))
  if (wd) {
    const match = /^wd_(.+)_[0-9a-f]+$/i.exec(wd)
    if (match?.[1]) return match[1]
  }
  const sessionsIndex = segments.lastIndexOf('sessions')
  return sessionsIndex >= 0 ? segments[sessionsIndex + 1] ?? 'unknown' : 'unknown'
}

export function parseFile(file: string): UsageBucket[] {
  const buckets = new Map<string, UsageBucket>()
  const seen = new Set<string>()
  const project = projectFromPath(file)
  let model = 'kimi'

  for (const line of readLogText(file).split('\n')) {
    const entry = parseJsonLine(line)
    if (!entry) continue

    if (entry.type === 'config.update') {
      const alias = entry.modelAlias
      if (typeof alias === 'string' && alias.trim()) {
        model = alias.includes('/') ? (alias.split('/').pop() ?? alias) : alias
      }
      continue
    }

    const event =
      entry.type === 'context.append_loop_event' && entry.event && typeof entry.event === 'object'
        ? (entry.event as Record<string, unknown>)
        : entry

    if (event.type !== 'step.end') continue

    const usage = event.usage as KimiUsage | undefined
    if (!usage) continue

    const uuid = typeof event.uuid === 'string' ? event.uuid : null
    if (uuid && seen.has(uuid)) continue
    if (uuid) seen.add(uuid)

    const ms = entry.time ?? event.time
    const hourStart = toHalfHourStart(typeof ms === 'number' ? ms : String(ms ?? ''))
    if (!hourStart) continue

    const { input, cached, cacheWrite, output } = normalizeUsage(usage)
    if (input + cached + cacheWrite + output === 0) continue

    const key = `${hourStart}|${model}|${project}`
    const bucket =
      buckets.get(key) ??
      ({
        hour_start: hourStart,
        source: SOURCE,
        model,
        project,
        collector: SOURCE,
        input_tokens: 0,
        output_tokens: 0,
        cached_input_tokens: 0,
        cache_creation_input_tokens: 0,
        reasoning_output_tokens: 0,
        total_tokens: 0,
        conversation_count: 0,
      } satisfies UsageBucket)

    bucket.input_tokens += input
    bucket.output_tokens += output
    bucket.cached_input_tokens += cached
    bucket.cache_creation_input_tokens += cacheWrite
    bucket.total_tokens += input + cached + cacheWrite + output
    bucket.conversation_count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
}
