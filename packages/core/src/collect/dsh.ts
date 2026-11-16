/**
 * DeepSeek Harness（dsh）采集器。
 *
 * 数据源：`~/.dsh/sessions/<编码后的 cwd>/session-<uuid>/session.v4.jsonl.zstd`
 * 格式：多帧 zstd 的 JSONL，一行一个事件。
 * 用量：`assistant/message` 事件的 `data.usage`（camelCase），每条消息一次完整值。
 * 模型：`data.message.source.model`；项目：session 首行的 `cwd`。
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

export const SOURCE = 'dsh'
export const DSH_ROOT = join(homedir(), '.dsh', 'sessions')

export function listFiles(root = DSH_ROOT): string[] {
  return walkFiles(root, (name) => name.includes('.jsonl'))
}

interface UsageLike {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
  reasoningTokens?: number
  totalTokens?: number
}

export function parseFile(file: string): UsageBucket[] {
  const text = readLogText(file)
  const buckets = new Map<string, UsageBucket>()

  let project = 'unknown'
  let sawSession = false

  for (const line of text.split('\n')) {
    const event = parseJsonLine(line)
    if (!event) continue

    if (!sawSession && event.type === 'session') {
      sawSession = true
      project = projectFromCwd(event.cwd as string)
      continue
    }

    if (event.type !== 'assistant/message') continue

    const data = event.data as Record<string, unknown> | undefined
    const usage = data?.usage as UsageLike | undefined
    if (!usage) continue

    const message = data?.message as { source?: { model?: string } } | undefined
    const model = typeof message?.source?.model === 'string' ? message.source.model : 'unknown'

    const hourStart = toHalfHourStart(event.time as number | string | undefined)
    if (!hourStart) continue

    const input = toNonNeg(usage.inputTokens)
    const output = toNonNeg(usage.outputTokens)
    const cached = toNonNeg(usage.cacheReadTokens)
    const cacheWrite = toNonNeg(usage.cacheWriteTokens)
    const reasoning = toNonNeg(usage.reasoningTokens)
    if (input + output + cached + cacheWrite + reasoning === 0) continue

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
    bucket.total_tokens += input + output + cached + cacheWrite + reasoning
    bucket.conversation_count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
}
