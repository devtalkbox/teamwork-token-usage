/**
 * 采集器自测：造一份假日志/假数据库，验证 dsh / codex / kimi / zcode 的解析口径。
 *
 * 运行：node scripts/test-collectors.ts
 *
 * 之所以要假数据：Kimi 和 ZCode 不一定装在开发机上，没数据就没法验证；
 * 而真实格式已经按工具行为固定下来了，用固定样本能防住回归。
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseFile as parseKimi, listFiles as kimiFiles } from '../packages/core/src/collect/kimi.ts'
import { parseFile as parseZcode, dbPath as zcodeDbPath } from '../packages/core/src/collect/zcode.ts'

const require = createRequire(import.meta.url)
let failures = 0

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n   got ${JSON.stringify(actual)}\n   exp ${JSON.stringify(expected)}`}`)
  if (!ok) failures += 1
}

const root = mkdtempSync(join(tmpdir(), 'ttu-fixture-'))
process.env.TTU_HOME = join(root, 'home')

// ---------- Kimi ----------
const kimiHome = join(root, 'kimi')
const kimiSession = join(kimiHome, 'sessions', 'wd_demo-app_ab12cd', 'session-1')
mkdirSync(kimiSession, { recursive: true })
const kimiLines = [
  JSON.stringify({ type: 'config.update', modelAlias: 'moonshot/kimi-k2' }),
  JSON.stringify({
    type: 'context.append_loop_event',
    time: 1763300000000,
    event: {
      type: 'step.end',
      uuid: 'u1',
      usage: { inputOther: 100, inputCacheRead: 2000, inputCacheCreation: 10, output: 50 },
    },
  }),
  // 同一个 uuid 重复出现，应该只算一次
  JSON.stringify({
    type: 'context.append_loop_event',
    time: 1763300000000,
    event: {
      type: 'step.end',
      uuid: 'u1',
      usage: { inputOther: 100, inputCacheRead: 2000, inputCacheCreation: 10, output: 50 },
    },
  }),
  // OpenAI 风格字段
  JSON.stringify({
    type: 'context.append_loop_event',
    time: 1763300100000,
    event: {
      type: 'step.end',
      uuid: 'u2',
      usage: { input_tokens: 500, cache_read_input_tokens: 1500, output_tokens: 20 },
    },
  }),
]

const wire = join(kimiSession, 'wire.jsonl')
writeFileSync(wire, `${kimiLines.join('\n')}\n`)

check('kimi 列出 wire.jsonl', kimiFiles(kimiHome).length, 1)
const kimiBuckets = parseKimi(wire)
check('kimi 桶数量', kimiBuckets.length, 1)
check('kimi 模型名归一', kimiBuckets[0]?.model, 'kimi-k2')
check('kimi 项目名', kimiBuckets[0]?.project, 'demo-app')
check(
  'kimi token 口径',
  {
    input: kimiBuckets[0]?.input_tokens,
    cached: kimiBuckets[0]?.cached_input_tokens,
    cacheWrite: kimiBuckets[0]?.cache_creation_input_tokens,
    output: kimiBuckets[0]?.output_tokens,
  },
  { input: 600, cached: 3500, cacheWrite: 10, output: 70 },
)
check('kimi 会话数', kimiBuckets[0]?.conversation_count, 2)

// ---------- ZCode ----------
const zcodeHome = join(root, 'zcode')
const zcodeDb = zcodeDbPath(zcodeHome)
mkdirSync(join(zcodeHome, 'cli', 'db'), { recursive: true })

const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite')
const db = new DatabaseSync(zcodeDb)
db.exec(`
  CREATE TABLE message (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE model_usage (
    id TEXT PRIMARY KEY, session_id TEXT, assistant_message_id TEXT, model_id TEXT,
    started_at INTEGER, completed_at INTEGER,
    input_tokens INTEGER, output_tokens INTEGER, reasoning_tokens INTEGER,
    cache_creation_input_tokens INTEGER, cache_read_input_tokens INTEGER,
    computed_total_tokens INTEGER
  );
`)
db.prepare('INSERT INTO message (id, data) VALUES (?, ?)').run(
  'm1',
  JSON.stringify({ role: 'assistant', path: { root: '/Users/x/code/glm-project' } }),
)
db.prepare(
  `INSERT INTO model_usage
   (id, session_id, assistant_message_id, model_id, started_at, completed_at,
    input_tokens, output_tokens, reasoning_tokens, cache_creation_input_tokens,
    cache_read_input_tokens, computed_total_tokens)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run('u1', 's1', 'm1', 'glm-4.6', 1763300000000, 1763300060000, 800, 120, 30, 5, 4000, 4955)
db.close()

check('zcode 列出 db', zcodeFilesLength(zcodeHome), 1)
const zcodeBuckets = parseZcode(zcodeDb)
check('zcode 桶数量', zcodeBuckets.length, 1)
check('zcode 模型', zcodeBuckets[0]?.model, 'glm-4.6')
check('zcode 项目', zcodeBuckets[0]?.project, 'glm-project')
check(
  'zcode token 口径',
  {
    input: zcodeBuckets[0]?.input_tokens,
    cached: zcodeBuckets[0]?.cached_input_tokens,
    cacheWrite: zcodeBuckets[0]?.cache_creation_input_tokens,
    output: zcodeBuckets[0]?.output_tokens,
    reasoning: zcodeBuckets[0]?.reasoning_output_tokens,
  },
  { input: 800, cached: 4000, cacheWrite: 5, output: 120, reasoning: 30 },
)

function zcodeFilesLength(home: string): number {
  const { listFiles } = require('../packages/core/src/collect/zcode.ts') as typeof import('../packages/core/src/collect/zcode.ts')
  return listFiles(home).length
}

rmSync(root, { recursive: true, force: true })

if (failures > 0) {
  console.error(`\n${failures} 项失败`)
  process.exit(1)
}
console.log('\n全部通过')
