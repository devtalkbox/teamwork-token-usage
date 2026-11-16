/**
 * Claude Code 采集器。
 *
 * 数据源：`~/.claude/projects/<编码后的 cwd>/<session-uuid>.jsonl`
 * 用量：`assistant` 事件的 `message.usage`（input / cache_read / cache_creation / output）。
 * 模型：`message.model`；项目：事件里的 `cwd`，没有就从目录名末段猜。
 *
 * 同一个 message.id 可能因为流式更新出现多次，这里按 id 取最后一条，避免重复计数。
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

export const SOURCE = 'claude'
export const CLAUDE_ROOT = join(homedir(), '.claude', 'projects')

export function listFiles(root = CLAUDE_ROOT): string[] {
  return walkFiles(root, (name) => name.endsWith('.jsonl'))
}

interface ClaudeUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number }
}

interface Pending {
  id: string
  hourStart: string
  model: string
  project: string
  usage: ClaudeUsage
}

/** 从 `-Users-x-code-Murmur` 这种编码目录名里猜最后一段 */
function projectFromDir(file: string): string {
  const parts = file.split('/')
  const index = parts.lastIndexOf('projects')
  const dirName = index >= 0 ? parts[index + 1] : ''
  if (!dirName) return 'unknown'
  const segments = dirName.replace(/^-/, '').split('-').filter(Boolean)
  return segments.at(-1) ?? 'unknown'
}

export function parseFile(file: string): UsageBucket[] {
  const text = readLogText(file)
  const seen = new Map<string, Pending>()

  for (const line of text.split('\n')) {
    const event = parseJsonLine(line)
    if (!event || event.type !== 'assistant') continue

    const message = event.message as { id?: string; model?: string; usage?: ClaudeUsage } | undefined
    const usage = message?.usage
    if (!usage) continue

    const hourStart = toHalfHourStart(event.timestamp as string | undefined)
    if (!hourStart) continue

    const cwd = typeof event.cwd === 'string' ? event.cwd : null
    const project = cwd ? projectFromCwd(cwd) : projectFromDir(file)
    const model = typeof message?.model === 'string' ? message.model : 'unknown'
    // 没有 message.id 时用时间+模型兜底，保证同一条消息不会被数两次
    const id = typeof message?.id === 'string' ? message.id : `${hourStart}|${model}|${event.timestamp}`

    seen.set(id, { id, hourStart, model, project, usage })
  }

  const buckets = new Map<string, UsageBucket>()
  for (const item of seen.values()) {
    const usage = item.usage
    const input = toNonNeg(usage.input_tokens)
    const output = toNonNeg(usage.output_tokens)
    const cached = toNonNeg(usage.cache_read_input_tokens)
    const cacheWrite =
      toNonNeg(usage.cache_creation_input_tokens) ||
      toNonNeg(usage.cache_creation?.ephemeral_5m_input_tokens) +
        toNonNeg(usage.cache_creation?.ephemeral_1h_input_tokens)
    if (input + output + cached + cacheWrite === 0) continue

    const key = `${item.hourStart}|${item.model}|${item.project}`
    const bucket =
      buckets.get(key) ??
      ({
        hour_start: item.hourStart,
        source: SOURCE,
        model: item.model,
        project: item.project,
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
    bucket.total_tokens += input + output + cached + cacheWrite
    bucket.conversation_count += 1
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
}
