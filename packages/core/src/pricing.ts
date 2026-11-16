/**
 * 定价与成本计算。
 *
 * 费率单位是「美元 / 100 万 token」，与 jusage 的 pricing-overlay.json 一致。
 * 优先读本机 overlay（`~/.ai-usage/pricing-overlay.json`，由 jusage 启动时拉取），
 * 读不到就退化成空表 —— 此时成本为 0，但 token 统计不受影响。
 *
 * 成本公式对齐 jusage 的 computeRowCost，保证两边数字能对上：
 *   (input*in + output*out + cached*cache_read + cache_creation*cache_write
 *    + reasoning*out) / 1e6
 * 例外：codex / every-code 的 reasoning 已含在 output 里，不重复计费。
 */
import { readFileSync } from 'node:fs'

export interface Rates {
  input?: number
  output?: number
  cache_read?: number
  cache_write?: number
}

export interface PricingData {
  exact: Record<string, Rates>
  alias?: Record<string, string>
  sourceAlias?: Record<string, Record<string, string>>
  fuzzy?: Array<{ match: string; ref: string }>
  default?: Rates
}

const ZERO: Required<Rates> = { input: 0, output: 0, cache_read: 0, cache_write: 0 }

/** reasoning 已计入 output 的 source，避免重复计费 */
const REASONING_IN_OUTPUT = new Set(['codex', 'every-code'])

/** 裸模型名补全厂商前缀时尝试的顺序 */
const VENDOR_PREFIXES = [
  'openai',
  'anthropic',
  'deepseek',
  'google',
  'xai',
  'moonshot',
  'zhipu',
  'alibaba',
  'qwen',
  'minimax',
]

export function emptyPricing(): PricingData {
  return { exact: {} }
}

export function loadPricingFromFile(file: string): PricingData {
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
    if (!raw || typeof raw !== 'object') return emptyPricing()
    const data = raw as PricingData
    return { ...data, exact: data.exact ?? {} }
  } catch {
    return emptyPricing()
  }
}

function resolveRef(ref: string, data: PricingData): Rates | null {
  const direct = data.exact[ref]
  if (direct) return direct
  const alias = data.alias?.[ref]
  if (alias && data.exact[alias]) return data.exact[alias]
  return null
}

function lookupRates(model: string, source: string, data: PricingData): Rates {
  const exact = data.exact[model]
  if (exact) return exact

  const viaSource = data.sourceAlias?.[source]?.[model]
  if (viaSource) {
    const hit = resolveRef(viaSource, data)
    if (hit) return hit
  }

  const viaAlias = data.alias?.[model]
  if (viaAlias) {
    const hit = resolveRef(viaAlias, data)
    if (hit) return hit
  }

  // fuzzy 是「模型名包含 match 就套用 ref 的价」的兜底（如 claude-*-5-sonnet）
  for (const rule of data.fuzzy ?? []) {
    if (model.includes(rule.match)) {
      const hit = resolveRef(rule.ref, data)
      if (hit) return hit
    }
  }

  // 定价表的键带厂商前缀（openai/gpt-6.1-sol），而用量桶里只有裸模型名。
  // 少了这一层，gpt-6.1-sol 会掉到 default（input 1 / output 5 / cache_read 0.1），
  // 成本直接算低一半（实测 $177 vs 真实的 $313）。
  if (!model.includes('/')) {
    for (const vendor of VENDOR_PREFIXES) {
      const hit = data.exact[`${vendor}/${model}`]
      if (hit) return hit
    }
  }

  return data.default ?? ZERO
}

function normalize(rates: Rates): Required<Rates> {
  return {
    input: rates.input ?? 0,
    output: rates.output ?? 0,
    cache_read: rates.cache_read ?? 0,
    cache_write: rates.cache_write ?? 0,
  }
}

export interface CostInput {
  source: string
  model: string
  input_tokens: number
  output_tokens: number
  cached_input_tokens: number
  cache_creation_input_tokens: number
  reasoning_output_tokens: number
  reported_cost_usd?: number
  total_tokens?: number
}

/** 单桶成本（美元）。reported_cost_usd 存在时直接采用（Cursor 的账单口径）。 */
export function computeBucketCost(row: CostInput, data: PricingData): number {
  if (row.reported_cost_usd != null && Number.isFinite(row.reported_cost_usd) && row.reported_cost_usd > 0) {
    return row.reported_cost_usd
  }
  const rates = normalize(lookupRates(row.model, row.source, data))
  const reasoningCost = REASONING_IN_OUTPUT.has(row.source) ? 0 : (row.reasoning_output_tokens || 0) * rates.output
  const usd =
    (row.input_tokens || 0) * rates.input +
    (row.output_tokens || 0) * rates.output +
    (row.cached_input_tokens || 0) * rates.cache_read +
    (row.cache_creation_input_tokens || 0) * rates.cache_write +
    reasoningCost
  return usd / 1_000_000
}

export function roundCostUsd(n: number): number {
  return Math.round(n * 1e8) / 1e8
}
