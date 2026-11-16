# teamwork-token-usage

本机 AI Agent Token 用量看板。读取 [jusage](https://github.com/juejin-cn/juejin-usage) 已经落盘的用量桶，
渲染成和 `http://127.0.0.1:8452/dashboard` 同款的面板。

**v1 范围**：纯本地，只读本机数据，不做任何远程上报。团队同步在 v2。

## 快速开始

```bash
pnpm install
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

看板本身**不采集**，读的是 jusage 的产物：

```
~/.ai-usage/queue/YYYY-MM.jsonl      半小时粒度的用量桶
~/.ai-usage/pricing-overlay.json     模型价格表（决定成本列）
```

所以先确保本机跑过 jusage（`npx @juejin-opensource/jusage start`），否则页面是空的。

换数据目录：`TTU_DATA_DIR=/path/to/data pnpm dev`。

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
