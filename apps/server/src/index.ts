/**
 * 本地 HTTP 服务：JSON API + 托管前端构建产物。
 *
 * 路由和 jusage 的 `/functions/tud-usage-*` 同名同形，好处是前端只认这套契约：
 * 将来把数据源换成团队服务端，页面代码一行都不用动。
 *
 * v1 只读本机 `~/.ai-usage/queue/*.jsonl`，不做任何远程同步。
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  aggregateDaily,
  aggregateHourly,
  aggregateModels,
  aggregateProjects,
  BUILTIN_PRICING,
  collectAll,
  loadBuckets,
  loadPricingFromFile,
  resolveDataDir,
  resolveDataDirs,
  summarize,
  toRows,
  type ApiEnvelope,
  type PricedRow,
  type PricingData,
} from '@ttu/core'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const WEB_DIST = process.env.TTU_WEB_DIST
  ? resolve(process.env.TTU_WEB_DIST)
  : resolve(__dirname, '../../web/dist')
const PORT = Number(process.env.PORT ?? 8460)
const HOST = process.env.HOST ?? '127.0.0.1'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

let pricingCache: { mtimeMs: number; data: PricingData } | null = null

/** 定价表跟着文件改动走：jusage 每次启动会重写 overlay */
function pricing(dataDir: string): PricingData {
  const file = join(dataDir, 'pricing-overlay.json')
  try {
    const mtimeMs = statSync(file).mtimeMs
    if (pricingCache && pricingCache.mtimeMs === mtimeMs) return pricingCache.data
    const data = loadPricingFromFile(file)
    pricingCache = { mtimeMs, data }
    return data
  } catch {
    // 没有 jusage 的 overlay 时退回内置快照，成本才不会全变 0
    return pricingCache?.data ?? BUILTIN_PRICING
  }
}

function envelope<T>(data: T): ApiEnvelope<T> {
  return { success: true, message: 'ok', data }
}

function clampDays(raw: string | null): number {
  const n = Number.parseInt(raw ?? '7', 10)
  if (!Number.isFinite(n)) return 7
  return Math.min(365, Math.max(1, n))
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
  })
  res.end(JSON.stringify(body))
}

/** 可选的渠道筛选：`?source=codex`，留空表示全部 */
function filterSource(rows: PricedRow[], source: string | null): PricedRow[] {
  const value = source?.trim()
  if (!value || value === 'all') return rows
  return rows.filter((row) => row.source === value)
}

function route(pathname: string, query: URLSearchParams): { status: number; body: unknown } | null {
  if (pathname === '/health') return { status: 200, body: { ok: true } }
  if (!pathname.startsWith('/functions/')) return null

  const name = pathname.slice('/functions/'.length)
  const dataDir = resolveDataDir()
  const { buckets, lastModifiedAt } = loadBuckets()
  const rows = filterSource(toRows(buckets, pricing(dataDir)), query.get('source'))
  const days = clampDays(query.get('days'))

  switch (name) {
    case 'tud-usage-summary': {
      const scoped = filterSource(toRows(buckets, pricing(dataDir)), query.get('source'))
      const statsSince = scoped.reduce<string | null>(
        (min, b) => (min == null || b.hour_start < min ? b.hour_start : min),
        null,
      )
      return { status: 200, body: envelope(summarize(scoped, statsSince)) }
    }
    case 'tud-usage-daily':
      return { status: 200, body: envelope({ days: aggregateDaily(rows, days) }) }
    case 'tud-usage-hourly':
      return { status: 200, body: envelope({ hours: aggregateHourly(rows, days) }) }
    case 'tud-usage-model-breakdown':
      return { status: 200, body: envelope({ models: aggregateModels(rows, days) }) }
    case 'tud-usage-project-breakdown':
      return { status: 200, body: envelope({ projects: aggregateProjects(rows, days) }) }
    case 'tud-sync-status': {
      const bySource = new Map<string, { rows: number; tokens: number }>()
      for (const row of rows) {
        const entry = bySource.get(row.source) ?? { rows: 0, tokens: 0 }
        entry.rows += 1
        entry.tokens += row.tokens
        bySource.set(row.source, entry)
      }
      return {
        status: 200,
        body: envelope({
          lastModifiedAt,
          bucketCount: buckets.length,
          dataDir,
          dataDirs: resolveDataDirs(),
          sources: [...bySource.entries()]
            .map(([source, v]) => ({ source, ...v }))
            .sort((a, b) => b.tokens - a.tokens),
        }),
      }
    }
    default:
      return { status: 404, body: { success: false, message: `unknown function: ${name}` } }
  }
}

function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string): void {
  const decoded = decodeURIComponent(pathname.split('?')[0] || '/')
  const target = normalize(join(WEB_DIST, decoded === '/' ? '/index.html' : decoded))
  if (!target.startsWith(normalize(WEB_DIST))) {
    res.writeHead(403).end('Forbidden')
    return
  }
  const file = existsSync(target) && statSync(target).isFile() ? target : join(WEB_DIST, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('前端未构建。先运行: pnpm --filter @ttu/web build')
    return
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}

if (process.env.TTU_SYNC === '1') {
  const started = Date.now()
  const result = collectAll({ force: process.env.TTU_FORCE_SYNC === '1' })
  const parts = Object.entries(result.bySource)
    .filter(([, v]) => v.files > 0)
    .map(([name, v]) => `${name} ${v.files} 个文件/${v.buckets} 个桶`)
  console.log(
    `采集完成: 扫描 ${result.scanned} 个文件（解析 ${result.parsed}，命中缓存 ${result.skipped}），` +
      `${result.buckets.length} 个桶，用时 ${Date.now() - started}ms`,
  )
  if (parts.length > 0) console.log(`  ${parts.join(' · ')}`)
  console.log(`  输出: ${result.queueFiles.join(', ') || '（无数据）'}`)
  if (process.env.TTU_SYNC_ONLY === '1') process.exit(0)
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`)
  const matched = route(url.pathname, url.searchParams)
  if (matched) {
    sendJson(res, matched.status, matched.body)
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method not allowed')
    return
  }
  serveStatic(req, res, url.pathname)
})

server.listen(PORT, HOST, () => {
  console.log(`Token 看板: http://${HOST}:${PORT}/dashboard`)
  console.log(`数据目录: ${resolveDataDirs().join(' + ')}`)
})
