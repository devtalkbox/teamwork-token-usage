# teamwork-token-usage

本机 AI Agent Token 用量看板。**自己扫描本地日志**（DeepSeek Harness / Codex / Claude Code），
汇总成用量桶后渲染成和 `http://127.0.0.1:8452/dashboard` 同款的面板。

**范围**：纯本地，只读本机数据，不做任何远程上报。团队同步在 v2。

## 同事直接用（不需要 clone）

```bash
npx -y github:devtalkbox/teamwork-token-usage#v0.4.0 --open
```

会先扫描本机日志，再拉起看板并打开 <http://127.0.0.1:8460/dashboard>。
首次运行会下载仓库（约 0.6MB），之后走 npx 缓存。

参数：`--port 8460`、`--host 127.0.0.1`、`--open`、`--no-sync`（跳过采集）。

只需要采集时：

```bash
npx -y github:devtalkbox/teamwork-token-usage#v0.4.0 sync
```

## 本地开发

```bash
pnpm install
pnpm test:collect   # 用假数据验证各 parser 口径
pnpm dev
```

打开 <http://127.0.0.1:5273/dashboard>。

生产模式（单进程同时提供 API 和静态页）：

```bash
pnpm build
pnpm start
# http://127.0.0.1:8460/dashboard
```

端口可用环境变量覆盖：`PORT=9000 pnpm start`。

## 数据从哪来

自己扫，不需要装 jusage：

| 工具 | 日志位置 | 采集要点 |
| --- | --- | --- |
| DeepSeek Harness | `~/.dsh/sessions/**/session.*.jsonl(.zstd)` | 多帧 zstd，需按帧切开逐帧解压 |
| Codex | `~/.codex/sessions/**/rollout-*.jsonl(.zst)` | `token_usage_record` 是单次量；input 含缓存、output 含 reasoning，要减掉 |
| Claude Code | `~/.claude/projects/**/*.jsonl` | 同一 message.id 可能流式出现多次，按 id 取最后一条 |
| Kimi Code CLI | `~/.kimi-code/sessions/**/wire.jsonl` | 取 `step.end` 事件的 usage；同 uuid 只计一次 |
| ZCode（GLM） | `~/.zcode/cli/db/db.sqlite` | 优先读 `model_usage` 表，老版本回退 `message` 表 |

产出写到 `~/.ttu/queue/YYYY-MM.jsonl`（半小时桶），格式与 jusage 一致。
老数据兼容：如果本机有 `~/.ai-usage/queue`，会一起读；**同一个 source 以我们自己采集的为准**，
避免两套数据各算一遍。

环境要求：**Node ≥ 20**。dsh/codex 的日志是 zstd 压缩：Node ≥ 22.15 用内置解压，
低于 22.15 自动退回纯 JS 的 fzstd（首次全量解析约 3 秒，之后走缓存）。

价格：优先用 `~/.ai-usage/pricing-overlay.json`，没有就退回内置快照
（`packages/core/src/pricing/builtin.ts`），所以**没装 jusage 也能算出成本**。

换数据目录：`TTU_HOME=/path/to/home`；只看 jusage 的：`TTU_DATA_DIR=/path/to/data`。

> 队列文件是**追加日志**：同一个桶会反复追写（本机实测最多重复 29 次），
> 所以加载时必须按 `hour_start|source|model|project|collector` 去重取最后一条，
> 直接求和会放大 7 倍。这条逻辑在 `packages/core/src/store.ts`。

## 目录结构

```
packages/core/src/
  types.ts        用量桶与 API 数据形状
  store.ts        读 queue、去重、按 mtime 缓存
  aggregate.ts    按天/小时/模型/项目聚合
  pricing.ts      定价查表与成本计算（对齐 jusage 口径）
  time.ts         本地时区切日

apps/server/src/
  index.ts        /functions/tud-usage-* API + 托管前端产物

apps/web/src/
  App.tsx         页面骨架与数据加载
  components/     KPI 卡、热力图、图表、分布、环形图
```

## 交互

- 顶部切换 `今天 / 7D / 30D / 90D`，右侧下拉按渠道过滤
- 选「今天」时，两张图表自动切成**按小时**（0 点到当前小时），其余范围按天
- 地址栏可分享：`?range=1&source=codex`

## API

与 jusage 同形，方便 v2 直接切到团队服务端：

| 路由 | 说明 |
| --- | --- |
| `/functions/tud-usage-summary` | 总/今日 Token、成本、按来源拆分 |
| `/functions/tud-usage-daily?days=7` | 按天，含来源拆分 |
| `/functions/tud-usage-hourly?days=1` | 按小时 |
| `/functions/tud-usage-model-breakdown?days=7` | 按模型 |
| `/functions/tud-usage-project-breakdown?days=7` | 按项目 |
| `/functions/tud-sync-status` | 数据文件时间、桶数量、来源统计 |

所有接口都支持 `&source=codex` 之类的渠道筛选，返回 `{ success, message, data }`。

## 已知边界

- 只读本机数据，没有远程同步、没有多设备
- 没有账号额度卡片（Codex 5h/7d、DeepSeek 余额）—— 需要各产品自己的接口
- 热力图按 52 周渲染，历史数据不足时会大面积留白（正常）

## 下一步（v2）

1. `POST /ingest` + 成员鉴权 + 幂等入库
2. `ttu` 采集 CLI（`npx github:devtalkbox/teamwork-token-usage`）
3. 团队/成员维度看板与排行榜
