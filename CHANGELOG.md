# Changelog

## v0.5.1

### Changed

- 去掉底部「数据来自 ~/.ai-usage/queue」的提示

## v0.5.0

### Added

- 新增 Kimi Code CLI 采集（`~/.kimi-code/sessions/**/wire.jsonl`）
  - 兼容 Kimi 原生 `inputOther/inputCacheRead` 与 OpenAI 风格字段
  - 同 `uuid` 只计一次；模型从 `config.update` 的 alias 归一
- 新增 ZCode（GLM）采集（`~/.zcode/cli/db/db.sqlite`）
  - 优先读 `model_usage` 表，老版本回退 `message` 表
  - 通过 `node:sqlite` 只读打开，被占用时先复制快照
- 采集失败不再静默：统计失败文件数并提示 Node 版本要求
- `pnpm test:collect`：用固定样本验证 dsh/codex/kimi/zcode 的字段口径

## v0.4.0

### Added

- **自带采集器**：直接读本地日志，不再依赖 jusage
  - DeepSeek Harness（多帧 zstd 需自行按帧解压）
  - Codex（`token_usage_record`，input 含缓存、output 含 reasoning，已按口径扣减）
  - Claude Code（按 message.id 去重，避免流式重复计数）
- `ttu sync` 只采集；`ttu` 默认「采集后启动」，`--no-sync` 可跳过
- 按文件指纹（inode/size/mtime）缓存解析结果，重复运行只扫变更文件
- 内置定价表快照，未安装 jusage 也能算成本
- 同一 source 优先用自己采集的数据，避免与 jusage 队列重复计算

### Fixed

- 同一 (小时, 模型, 项目) 被多个会话分片写入时未合并，导致统计少 30%

## v0.2.0

### Added

- 「今天」视图的两个图表改为**按小时**展示（0 点至当前小时），环比基准改为昨天同一时段
- 地址栏支持 `?range=1|7|30|90&source=<渠道>`，可直接分享视图
- 项目分布的条改为按模型分段染色，悬停显示来源 / 模型 / 用量 / 花费 / 项目内占比

### Fixed

- 项目条原本全部撑满 100%，改为**条长表示项目占比**、条内再按模型分配
- 定价查表补全厂商前缀（`gpt-6.1-sol` → `openai/gpt-6.1-sol`），成本与 jusage 面板逐模型对齐
- 关闭 recharts 动画，避免首屏或切换范围时渲染出空图

## v0.1.0

首个版本：本机 Token 用量看板。

- 读取 jusage 落盘的 `~/.ai-usage/queue/*.jsonl`，按 key 去重
- KPI 卡（费用 / 总量 / 输入 / 输出）、52 周热力图、趋势与分布、环形图
- `/functions/tud-usage-*` API 与 jusage 同形
