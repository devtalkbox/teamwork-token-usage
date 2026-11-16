// 由 scripts/build-bundle.mjs 生成，勿手改。源码见 apps/server 与 packages/core。

// apps/server/src/index.ts
import { createReadStream, existsSync as existsSync2, statSync as statSync2 } from "node:fs";
import { createServer } from "node:http";
import { extname, join as join2, normalize as normalize2, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// packages/core/src/time.ts
var TZ = process.env.TTU_TZ?.trim() || "Asia/Shanghai";
var dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
var hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  hourCycle: "h23"
});
function localDate(iso) {
  return dateFmt.format(new Date(iso));
}
function localHour(iso) {
  return Number(hourFmt.format(new Date(iso)));
}
function todayLocal(now = /* @__PURE__ */ new Date()) {
  return dateFmt.format(now);
}
function shiftLocalDate(date, deltaDays) {
  const d = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

// packages/core/src/pricing.ts
import { readFileSync } from "node:fs";
var ZERO = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
var REASONING_IN_OUTPUT = /* @__PURE__ */ new Set(["codex", "every-code"]);
var VENDOR_PREFIXES = [
  "openai",
  "anthropic",
  "deepseek",
  "google",
  "xai",
  "moonshot",
  "zhipu",
  "alibaba",
  "qwen",
  "minimax"
];
function emptyPricing() {
  return { exact: {} };
}
function loadPricingFromFile(file) {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    if (!raw || typeof raw !== "object") return emptyPricing();
    const data = raw;
    return { ...data, exact: data.exact ?? {} };
  } catch {
    return emptyPricing();
  }
}
function resolveRef(ref, data) {
  const direct = data.exact[ref];
  if (direct) return direct;
  const alias = data.alias?.[ref];
  if (alias && data.exact[alias]) return data.exact[alias];
  return null;
}
function lookupRates(model, source, data) {
  const exact = data.exact[model];
  if (exact) return exact;
  const viaSource = data.sourceAlias?.[source]?.[model];
  if (viaSource) {
    const hit = resolveRef(viaSource, data);
    if (hit) return hit;
  }
  const viaAlias = data.alias?.[model];
  if (viaAlias) {
    const hit = resolveRef(viaAlias, data);
    if (hit) return hit;
  }
  for (const rule of data.fuzzy ?? []) {
    if (model.includes(rule.match)) {
      const hit = resolveRef(rule.ref, data);
      if (hit) return hit;
    }
  }
  if (!model.includes("/")) {
    for (const vendor of VENDOR_PREFIXES) {
      const hit = data.exact[`${vendor}/${model}`];
      if (hit) return hit;
    }
  }
  return data.default ?? ZERO;
}
function normalize(rates) {
  return {
    input: rates.input ?? 0,
    output: rates.output ?? 0,
    cache_read: rates.cache_read ?? 0,
    cache_write: rates.cache_write ?? 0
  };
}
function computeBucketCost(row, data) {
  if (row.reported_cost_usd != null && Number.isFinite(row.reported_cost_usd) && row.reported_cost_usd > 0) {
    return row.reported_cost_usd;
  }
  const rates = normalize(lookupRates(row.model, row.source, data));
  const reasoningCost = REASONING_IN_OUTPUT.has(row.source) ? 0 : (row.reasoning_output_tokens || 0) * rates.output;
  const usd = (row.input_tokens || 0) * rates.input + (row.output_tokens || 0) * rates.output + (row.cached_input_tokens || 0) * rates.cache_read + (row.cache_creation_input_tokens || 0) * rates.cache_write + reasoningCost;
  return usd / 1e6;
}
function roundCostUsd(n) {
  return Math.round(n * 1e8) / 1e8;
}

// packages/core/src/store.ts
import { existsSync, readdirSync, readFileSync as readFileSync2, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var DEFAULT_DATA_DIR = join(homedir(), ".ai-usage");
function resolveDataDir() {
  const override = process.env.TTU_DATA_DIR?.trim();
  return override ? override.replace(/^~/, homedir()) : DEFAULT_DATA_DIR;
}
var cache = null;
function queueDir(dataDir) {
  return join(dataDir, "queue");
}
function listQueueFiles(dataDir) {
  const dir = queueDir(dataDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(".jsonl")).map((name) => join(dir, name)).sort();
}
function signatureOf(files) {
  let signature = "";
  let latest = 0;
  for (const file of files) {
    const st = statSync(file);
    signature += `${file}:${st.size}:${st.mtimeMs}|`;
    if (st.mtimeMs > latest) latest = st.mtimeMs;
  }
  return {
    signature,
    lastModifiedAt: latest > 0 ? new Date(latest).toISOString() : null
  };
}
function parseFile(file, into) {
  for (const line of readFileSync2(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const raw = JSON.parse(trimmed);
      if (!raw.hour_start || !raw.source) continue;
      const bucket = {
        hour_start: raw.hour_start,
        source: raw.source,
        model: raw.model ?? "unknown",
        project: raw.project ?? "default-workspace",
        collector: raw.collector,
        input_tokens: raw.input_tokens ?? 0,
        output_tokens: raw.output_tokens ?? 0,
        cached_input_tokens: raw.cached_input_tokens ?? 0,
        cache_creation_input_tokens: raw.cache_creation_input_tokens ?? 0,
        reasoning_output_tokens: raw.reasoning_output_tokens ?? 0,
        total_tokens: raw.total_tokens ?? 0,
        conversation_count: raw.conversation_count ?? 0,
        reported_cost_usd: raw.reported_cost_usd
      };
      into.set(bucketKey(bucket), bucket);
    } catch {
    }
  }
}
function bucketKey(b) {
  return [b.hour_start, b.source, b.model, b.project, b.collector ?? ""].join("|");
}
function loadBuckets(dataDir = resolveDataDir()) {
  const files = listQueueFiles(dataDir);
  const { signature, lastModifiedAt } = signatureOf(files);
  if (cache && cache.signature === signature) {
    return { buckets: cache.buckets, lastModifiedAt: cache.lastModifiedAt, dataDir };
  }
  const buckets = /* @__PURE__ */ new Map();
  for (const file of files) parseFile(file, buckets);
  const list = [...buckets.values()];
  cache = { signature, buckets: list, lastModifiedAt };
  return { buckets: list, lastModifiedAt, dataDir };
}

// packages/core/src/aggregate.ts
function bucketTokens(b) {
  return (b.input_tokens || 0) + (b.output_tokens || 0) + (b.cached_input_tokens || 0) + (b.cache_creation_input_tokens || 0) + (b.reasoning_output_tokens || 0);
}
function toRows(buckets, pricing2) {
  return buckets.map((b) => ({
    ...b,
    tokens: bucketTokens(b),
    costUsd: computeBucketCost(b, pricing2),
    date: localDate(b.hour_start),
    hour: localHour(b.hour_start)
  }));
}
function windowStart(days) {
  return shiftLocalDate(todayLocal(), -(Math.max(1, days) - 1));
}
function within(rows, days) {
  const start = windowStart(days);
  return rows.filter((row) => row.date >= start);
}
function pct(part, total) {
  if (total <= 0) return 0;
  return Math.round(part / total * 1e3) / 10;
}
function summarize(rows, statsSince) {
  const today = todayLocal();
  let totalTokens = 0;
  let totalCostUsd = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCachedInputTokens = 0;
  let todayTokens = 0;
  let todayCostUsd = 0;
  const bySource = /* @__PURE__ */ new Map();
  for (const row of rows) {
    totalTokens += row.tokens;
    totalCostUsd += row.costUsd;
    totalInputTokens += row.input_tokens;
    totalOutputTokens += row.output_tokens;
    totalCachedInputTokens += row.cached_input_tokens;
    if (row.date === today) {
      todayTokens += row.tokens;
      todayCostUsd += row.costUsd;
    }
    const entry = bySource.get(row.source) ?? { tokens: 0, costUsd: 0 };
    entry.tokens += row.tokens;
    entry.costUsd += row.costUsd;
    bySource.set(row.source, entry);
  }
  const sources = [...bySource.entries()].map(([source, v]) => ({
    source,
    tokens: v.tokens,
    costUsd: roundCostUsd(v.costUsd),
    pct: pct(v.tokens, totalTokens)
  })).sort((a, b) => b.tokens - a.tokens);
  return {
    totalTokens,
    totalCostUsd: roundCostUsd(totalCostUsd),
    totalInputTokens,
    totalOutputTokens,
    totalCachedInputTokens,
    todayTokens,
    todayCostUsd: roundCostUsd(todayCostUsd),
    bySource: sources,
    statsSince
  };
}
function aggregateDaily(rows, days) {
  const points = /* @__PURE__ */ new Map();
  const start = windowStart(days);
  for (let i = 0; i < days; i += 1) {
    const date = shiftLocalDate(start, i);
    points.set(date, {
      date,
      tokens: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      sources: [],
      sourceMap: /* @__PURE__ */ new Map()
    });
  }
  for (const row of within(rows, days)) {
    const point = points.get(row.date);
    if (!point) continue;
    point.tokens += row.tokens;
    point.costUsd += row.costUsd;
    point.inputTokens += row.input_tokens;
    point.outputTokens += row.output_tokens;
    point.cachedInputTokens += row.cached_input_tokens;
    const slice = point.sourceMap.get(row.source) ?? { tokens: 0, costUsd: 0 };
    slice.tokens += row.tokens;
    slice.costUsd += row.costUsd;
    point.sourceMap.set(row.source, slice);
  }
  return [...points.values()].map((point) => ({
    date: point.date,
    tokens: point.tokens,
    costUsd: roundCostUsd(point.costUsd),
    inputTokens: point.inputTokens,
    outputTokens: point.outputTokens,
    cachedInputTokens: point.cachedInputTokens,
    sources: [...point.sourceMap.entries()].map(([source, v]) => ({ source, tokens: v.tokens, costUsd: roundCostUsd(v.costUsd) })).sort((a, b) => b.tokens - a.tokens)
  }));
}
function aggregateHourly(rows, days) {
  const map = /* @__PURE__ */ new Map();
  for (const row of within(rows, days)) {
    const key = `${row.date}|${row.hour}|${row.source}`;
    const point = map.get(key) ?? {
      date: row.date,
      hour: row.hour,
      source: row.source,
      tokens: 0,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0
    };
    point.tokens += row.tokens;
    point.costUsd += row.costUsd;
    point.inputTokens += row.input_tokens;
    point.outputTokens += row.output_tokens;
    point.cachedInputTokens += row.cached_input_tokens;
    map.set(key, point);
  }
  return [...map.values()].map((point) => ({ ...point, costUsd: roundCostUsd(point.costUsd) })).sort((a, b) => a.date === b.date ? a.hour - b.hour : a.date < b.date ? -1 : 1);
}
function aggregateModels(rows, days) {
  const map = /* @__PURE__ */ new Map();
  let total = 0;
  for (const row of within(rows, days)) {
    total += row.tokens;
    const key = `${row.source}|${row.model}`;
    const slice = map.get(key) ?? {
      model: row.model,
      source: row.source,
      tokens: 0,
      costUsd: 0,
      pct: 0,
      conversationCount: 0
    };
    slice.tokens += row.tokens;
    slice.costUsd += row.costUsd;
    slice.conversationCount += row.conversation_count;
    map.set(key, slice);
  }
  return [...map.values()].map((slice) => ({ ...slice, costUsd: roundCostUsd(slice.costUsd), pct: pct(slice.tokens, total) })).sort((a, b) => b.tokens - a.tokens);
}
function aggregateProjects(rows, days) {
  const map = /* @__PURE__ */ new Map();
  let total = 0;
  for (const row of within(rows, days)) {
    total += row.tokens;
    const entry = map.get(row.project) ?? {
      project: row.project,
      tokens: 0,
      costUsd: 0,
      models: /* @__PURE__ */ new Map(),
      sources: /* @__PURE__ */ new Set()
    };
    entry.tokens += row.tokens;
    entry.costUsd += row.costUsd;
    entry.sources.add(row.source);
    const key = `${row.source}|${row.model}`;
    const model = entry.models.get(key) ?? { source: row.source, tokens: 0, costUsd: 0 };
    model.tokens += row.tokens;
    model.costUsd += row.costUsd;
    entry.models.set(key, model);
    map.set(row.project, entry);
  }
  return [...map.values()].map((entry) => ({
    project: entry.project,
    tokens: entry.tokens,
    costUsd: roundCostUsd(entry.costUsd),
    pct: pct(entry.tokens, total),
    models: entry.models.size,
    sources: [...entry.sources].sort(),
    breakdown: [...entry.models.entries()].map(([key, v]) => ({
      model: key.slice(key.indexOf("|") + 1),
      source: v.source,
      tokens: v.tokens,
      costUsd: roundCostUsd(v.costUsd),
      pct: pct(v.tokens, entry.tokens)
    })).sort((a, b) => b.tokens - a.tokens)
  })).sort((a, b) => b.tokens - a.tokens);
}

// apps/server/src/index.ts
var __dirname = fileURLToPath(new URL(".", import.meta.url));
var WEB_DIST = process.env.TTU_WEB_DIST ? resolve(process.env.TTU_WEB_DIST) : resolve(__dirname, "../../web/dist");
var PORT = Number(process.env.PORT ?? 8460);
var HOST = process.env.HOST ?? "127.0.0.1";
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2"
};
var pricingCache = null;
function pricing(dataDir) {
  const file = join2(dataDir, "pricing-overlay.json");
  try {
    const mtimeMs = statSync2(file).mtimeMs;
    if (pricingCache && pricingCache.mtimeMs === mtimeMs) return pricingCache.data;
    const data = loadPricingFromFile(file);
    pricingCache = { mtimeMs, data };
    return data;
  } catch {
    return pricingCache?.data ?? { exact: {} };
  }
}
function envelope(data) {
  return { success: true, message: "ok", data };
}
function clampDays(raw) {
  const n = Number.parseInt(raw ?? "7", 10);
  if (!Number.isFinite(n)) return 7;
  return Math.min(365, Math.max(1, n));
}
function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  });
  res.end(JSON.stringify(body));
}
function filterSource(rows, source) {
  const value = source?.trim();
  if (!value || value === "all") return rows;
  return rows.filter((row) => row.source === value);
}
function route(pathname, query) {
  if (pathname === "/health") return { status: 200, body: { ok: true } };
  if (!pathname.startsWith("/functions/")) return null;
  const name = pathname.slice("/functions/".length);
  const dataDir = resolveDataDir();
  const { buckets, lastModifiedAt } = loadBuckets(dataDir);
  const rows = filterSource(toRows(buckets, pricing(dataDir)), query.get("source"));
  const days = clampDays(query.get("days"));
  switch (name) {
    case "tud-usage-summary": {
      const scoped = filterSource(toRows(buckets, pricing(dataDir)), query.get("source"));
      const statsSince = scoped.reduce(
        (min, b) => min == null || b.hour_start < min ? b.hour_start : min,
        null
      );
      return { status: 200, body: envelope(summarize(scoped, statsSince)) };
    }
    case "tud-usage-daily":
      return { status: 200, body: envelope({ days: aggregateDaily(rows, days) }) };
    case "tud-usage-hourly":
      return { status: 200, body: envelope({ hours: aggregateHourly(rows, days) }) };
    case "tud-usage-model-breakdown":
      return { status: 200, body: envelope({ models: aggregateModels(rows, days) }) };
    case "tud-usage-project-breakdown":
      return { status: 200, body: envelope({ projects: aggregateProjects(rows, days) }) };
    case "tud-sync-status": {
      const bySource = /* @__PURE__ */ new Map();
      for (const row of rows) {
        const entry = bySource.get(row.source) ?? { rows: 0, tokens: 0 };
        entry.rows += 1;
        entry.tokens += row.tokens;
        bySource.set(row.source, entry);
      }
      return {
        status: 200,
        body: envelope({
          lastModifiedAt,
          bucketCount: buckets.length,
          dataDir,
          sources: [...bySource.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.tokens - a.tokens)
        })
      };
    }
    default:
      return { status: 404, body: { success: false, message: `unknown function: ${name}` } };
  }
}
function serveStatic(req, res, pathname) {
  const decoded = decodeURIComponent(pathname.split("?")[0] || "/");
  const target = normalize2(join2(WEB_DIST, decoded === "/" ? "/index.html" : decoded));
  if (!target.startsWith(normalize2(WEB_DIST))) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  const file = existsSync2(target) && statSync2(target).isFile() ? target : join2(WEB_DIST, "index.html");
  if (!existsSync2(file)) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end("\u524D\u7AEF\u672A\u6784\u5EFA\u3002\u5148\u8FD0\u884C: pnpm --filter @ttu/web build");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}
var server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const matched = route(url.pathname, url.searchParams);
  if (matched) {
    sendJson(res, matched.status, matched.body);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end("Method not allowed");
    return;
  }
  serveStatic(req, res, url.pathname);
});
server.listen(PORT, HOST, () => {
  console.log(`Token \u770B\u677F: http://${HOST}:${PORT}/dashboard`);
  console.log(`\u6570\u636E\u76EE\u5F55: ${resolveDataDir()}`);
});
