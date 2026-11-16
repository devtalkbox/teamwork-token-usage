/**
 * 用量桶：与 jusage 的 queue JSONL 结构保持一致（`~/.ai-usage/queue/YYYY-MM.jsonl`）。
 *
 * 一条记录 = 某个 source 在某个半小时、某个模型、某个项目上的聚合用量。
 * 刻意不含 prompt / 文件路径 / 代码内容，只有可计量的数字 —— 这也是后续能安全
 * 上报到团队服务端的前提。
 */
export interface UsageBucket {
  /** UTC ISO，半小时对齐（:00 / :30） */
  hour_start: string
  /** 产品族：claude / codex / dsh / cursor ... */
  source: string
  model: string
  /** 项目标识；解析不出时为 default-workspace */
  project: string
  /** 同一产品族内的客户端形态（claude-code-cli / claude-desktop ...） */
  collector?: string
  input_tokens: number
  output_tokens: number
  cached_input_tokens: number
  cache_creation_input_tokens: number
  reasoning_output_tokens: number
  total_tokens: number
  conversation_count: number
  /** 部分渠道（Cursor）带账单口径的实际花费，优先于定价表 */
  reported_cost_usd?: number
}

/** 补齐空值后的内部行：成本与本地日期在加载时一次性算好。 */
export interface PricedRow extends UsageBucket {
  /** 五个 token 字段之和，不信任 total_tokens */
  tokens: number
  costUsd: number
  /** 本地时区日期 YYYY-MM-DD */
  date: string
  /** 本地时区小时 0-23 */
  hour: number
}

export interface SourceSlice {
  source: string
  tokens: number
  costUsd: number
  pct: number
}

export interface UsageSummary {
  totalTokens: number
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCachedInputTokens: number
  todayTokens: number
  todayCostUsd: number
  bySource: SourceSlice[]
  /** 最早一条数据的时间，用于「统计起于」提示 */
  statsSince: string | null
}

export interface DailyPoint {
  date: string
  tokens: number
  costUsd: number
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  sources: Array<{ source: string; tokens: number; costUsd: number }>
}

export interface HourlyPoint {
  date: string
  hour: number
  source: string
  tokens: number
  costUsd: number
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
}

export interface ModelSlice {
  model: string
  source: string
  tokens: number
  costUsd: number
  pct: number
  conversationCount: number
}

export interface ProjectSlice {
  project: string
  tokens: number
  costUsd: number
  pct: number
  models: number
  sources: string[]
}

export interface SyncStatus {
  lastModifiedAt: string | null
  bucketCount: number
  dataDir: string
  sources: Array<{ source: string; rows: number; tokens: number }>
}

export interface ApiEnvelope<T> {
  success: true
  message: 'ok'
  data: T
}
