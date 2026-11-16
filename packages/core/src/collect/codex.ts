/**
 * Codex CLI 采集器。
 *
 * 数据源：`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl(.zst)`
 * 用量：`token_usage_record` 事件的 `payload.usage`，是**单次响应**的量（不是累计），
 *       同一文件里多条直接相加即可。
 * 模型：`turn_context` 事件的 `payload.model`，按出现顺序向前生效。
 * 项目：`session_meta` 或 `turn_context` 里的 `cwd`。
 *
 * 注意字段口径：codex 的 input_tokens 含缓存、output_tokens 含 reasoning，
 * 这里要减掉，否则缓存和推理会被重复计费。
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageBucket } from '../types.ts'
import {
  parseJsonLine,
  projectFromCwd,
  readLogText,
  toHalfHourStart,
  toNonNeg,
  walkFiles,
} from './common.ts'

export const SOURCE = 'codex'
export const CODEX_ROOT = join(homedir(), '.codex', 'sessions')

export function listFiles(root = CODEX_ROOT): string[] {
  return walkFiles(root, (name) => name.startsWith('rollout-') && name.includes('.jsonl'))
}

interface CodexUsage {
  input_tokens?: number
  cached_input_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  output_tokens?: number
  reasoning_output_tokens?: number
}

export function parseFile(file: string): UsageBucket[] {
  const text = readLogText(file)
  const buckets = new Map<string, UsageBucket>()

  let project = 'unknown'
  let model = 'unknown'

  for (const line of text.split('\n')) {
    const event = parseJsonLine(line)
    if (!event) continue
    const payload = event.payload as Record<string, unknown> | undefined
    if (!payload) continue

    if (event.type === 'session_meta' || event.type === 'turn_context') {
      const cwd = payload.cwd
      if (typeof cwd === 'string' && cwd.trim()) project = projectFromCwd(cwd)
      if (typeof payload.model === 'string' && payload.model.trim()) model = payload.model.trim()
      continue
    }

    if (event.type !== 'token_usage_record') continue

    const usage = payload.usage as CodexUsage | undefined
    if (!usage) continue

    const hourStart = toHalfHourStart(event.timestamp as string | undefined)
    if (!hourStart) continue

    const cached = toNonNeg(usage.cached_input_tokens ?? usage.cache_read_input_tokens)
    const reasoning = toNonNeg(usage.reasoning_output_tokens)
    const input = Math.max(0, toNonNeg(usage.input_tokens) - cached)
    const output = Math.max(0, toNonNeg(usage.output_tokens) - reasoning)
    const cacheWrite = toNonNeg(usage.cache_creation_input_tokens)
    if (input + output + cached + reasoning + cacheWrite === 0) continue

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
    bucket.reasoning_output_tokens += reasoning
    bucket.total_tokens += input + output + cached + reasoning + cacheWrite
    bucket.conversation_count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
}
