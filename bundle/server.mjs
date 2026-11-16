// 由 scripts/build-bundle.mjs 生成，勿手改。源码见 apps/server 与 packages/core。

// apps/server/src/index.ts
import { createReadStream, existsSync as existsSync4, statSync as statSync4 } from "node:fs";
import { createServer } from "node:http";
import { extname, join as join9, normalize as normalize2, resolve } from "node:path";
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

// packages/core/src/pricing/builtin.ts
var BUILTIN_PRICING = { "exact": { "alibaba/qvq-max": { "input": 1.2, "output": 4.8 }, "alibaba/qwen-flash": { "input": 0.05, "output": 0.4, "cache_read": 0.01, "cache_write": 0.0625 }, "alibaba/qwen-max": { "input": 1.6, "output": 6.4 }, "alibaba/qwen-mt-plus": { "input": 2.46, "output": 7.37 }, "alibaba/qwen-mt-turbo": { "input": 0.16, "output": 0.49 }, "alibaba/qwen-omni-turbo": { "input": 0.07, "output": 0.27 }, "alibaba/qwen-plus-character-ja": { "input": 0.5, "output": 1.4 }, "alibaba/qwen-plus": { "input": 0.4, "output": 1.2, "cache_read": 0.08, "cache_write": 0.5 }, "alibaba/qwen-turbo": { "input": 0.05, "output": 0.2 }, "alibaba/qwen-vl-max": { "input": 0.8, "output": 3.2 }, "alibaba/qwen-vl-ocr": { "input": 0.07, "output": 0.16 }, "alibaba/qwen-vl-plus": { "input": 0.21, "output": 0.63 }, "alibaba/qwen2-5-14b-instruct": { "input": 0.35, "output": 1.4 }, "alibaba/qwen2-5-32b-instruct": { "input": 0.7, "output": 2.8 }, "alibaba/qwen2-5-72b-instruct": { "input": 1.4, "output": 5.6 }, "alibaba/qwen2-5-7b-instruct": { "input": 0.175, "output": 0.7 }, "alibaba/qwen2-5-omni-7b": { "input": 0.1, "output": 0.4 }, "alibaba/qwen2-5-vl-72b-instruct": { "input": 2.8, "output": 8.4 }, "alibaba/qwen2-5-vl-7b-instruct": { "input": 0.35, "output": 1.05 }, "alibaba/qwen3-14b": { "input": 0.35, "output": 1.4 }, "alibaba/qwen3-235b-a22b": { "input": 0.7, "output": 2.8 }, "alibaba/qwen3-32b": { "input": 0.7, "output": 2.8 }, "alibaba/qwen3-8b": { "input": 0.18, "output": 0.7 }, "alibaba/qwen3-asr-flash": { "input": 0.035, "output": 0.035 }, "alibaba/qwen3-coder-30b-a3b-instruct": { "input": 0.45, "output": 2.25 }, "alibaba/qwen3-coder-480b-a35b-instruct": { "input": 1.5, "output": 7.5 }, "alibaba/qwen3-coder-flash": { "input": 0.3, "output": 1.5, "cache_read": 0.06, "cache_write": 0.375 }, "alibaba/qwen3-coder-plus": { "input": 1, "output": 5 }, "alibaba/qwen3-max": { "input": 1.2, "output": 6 }, "alibaba/qwen3-next-80b-a3b-instruct": { "input": 0.5, "output": 2 }, "alibaba/qwen3-next-80b-a3b-thinking": { "input": 0.5, "output": 6 }, "alibaba/qwen3-omni-flash": { "input": 0.43, "output": 1.66 }, "alibaba/qwen3-vl-235b-a22b": { "input": 0.7, "output": 2.8 }, "alibaba/qwen3-vl-30b-a3b": { "input": 0.2, "output": 0.8 }, "alibaba/qwen3-vl-plus": { "input": 0.2, "output": 1.6, "cache_read": 0.04, "cache_write": 0.25 }, "alibaba/qwen3.5-122b-a10b": { "input": 0.4, "output": 3.2 }, "alibaba/qwen3.5-27b": { "input": 0.3, "output": 2.4 }, "alibaba/qwen3.5-35b-a3b": { "input": 0.25, "output": 2 }, "alibaba/qwen3.5-397b-a17b": { "input": 0.6, "output": 3.6 }, "alibaba/qwen3.5-plus": { "input": 0.4, "output": 2.4 }, "alibaba/qwen3.6-27b": { "input": 0.6, "output": 3.6 }, "alibaba/qwen3.6-35b-a3b": { "input": 0.375, "output": 2.25 }, "alibaba/qwen3.6-flash": { "input": 0.25, "output": 1.5, "cache_read": 0.025, "cache_write": 0.3125 }, "alibaba/qwen3.6-max-preview": { "input": 1.3, "output": 7.8, "cache_read": 0.13, "cache_write": 1.625 }, "alibaba/qwen3.6-plus": { "input": 0.5, "output": 3, "cache_read": 0.05, "cache_write": 0.625 }, "alibaba/qwen3.7-max": { "input": 2.5, "output": 7.5, "cache_read": 0.5, "cache_write": 3.125 }, "alibaba/qwen3.7-plus": { "input": 0.4, "output": 1.6, "cache_read": 0.08, "cache_write": 0.5 }, "alibaba/qwq-plus": { "input": 0.8, "output": 2.4 }, "alibaba/qwen3.8-max": { "input": 2, "output": 6, "cache_read": 0.25, "cache_write": 2.5 }, "alibaba/qwen-coder": { "input": 0.3, "output": 1.5 }, "alibaba/qwen3-coder-next": { "input": 0.6, "output": 2.4 }, "alibaba/qwen3.7-flash": { "input": 0.03, "output": 0.13, "cache_read": 6e-3, "cache_write": 0.0375 }, "alibaba/qwen3.8-2.4t-a95b": { "input": 2, "output": 6, "cache_read": 0.25 }, "alibaba/qwen3.8-27b": { "input": 0.5, "output": 3, "cache_read": 0.1 }, "alibaba/qwen3.8-flash": { "input": 0.15, "output": 0.47, "cache_read": 0.016, "cache_write": 0.2 }, "alibaba-cn/qvq-max": { "input": 1.147, "output": 4.588 }, "alibaba-cn/qwen-deep-research": { "input": 7.742, "output": 23.367 }, "alibaba-cn/qwen-doc-turbo": { "input": 0.087, "output": 0.144 }, "alibaba-cn/qwen-flash": { "input": 0.022, "output": 0.216, "cache_read": 44e-4, "cache_write": 0.0275 }, "alibaba-cn/qwen-long": { "input": 0.072, "output": 0.287 }, "alibaba-cn/qwen-math-plus": { "input": 0.574, "output": 1.721 }, "alibaba-cn/qwen-math-turbo": { "input": 0.287, "output": 0.861 }, "alibaba-cn/qwen-max": { "input": 0.345, "output": 1.377 }, "alibaba-cn/qwen-mt-plus": { "input": 0.259, "output": 0.775 }, "alibaba-cn/qwen-mt-turbo": { "input": 0.101, "output": 0.28 }, "alibaba-cn/qwen-omni-turbo": { "input": 0.058, "output": 0.23 }, "alibaba-cn/qwen-plus-character": { "input": 0.115, "output": 0.287 }, "alibaba-cn/qwen-plus": { "input": 0.115, "output": 0.287, "cache_read": 0.023, "cache_write": 0.144 }, "alibaba-cn/qwen-turbo": { "input": 0.044, "output": 0.087 }, "alibaba-cn/qwen-vl-max": { "input": 0.23, "output": 0.574 }, "alibaba-cn/qwen-vl-ocr": { "input": 0.043, "output": 0.072 }, "alibaba-cn/qwen-vl-plus": { "input": 0.115, "output": 0.287 }, "alibaba-cn/qwen2-5-14b-instruct": { "input": 0.144, "output": 0.431 }, "alibaba-cn/qwen2-5-32b-instruct": { "input": 0.287, "output": 0.861 }, "alibaba-cn/qwen2-5-72b-instruct": { "input": 0.574, "output": 1.721 }, "alibaba-cn/qwen2-5-7b-instruct": { "input": 0.072, "output": 0.144 }, "alibaba-cn/qwen2-5-coder-32b-instruct": { "input": 0.287, "output": 0.861 }, "alibaba-cn/qwen2-5-coder-7b-instruct": { "input": 0.144, "output": 0.287 }, "alibaba-cn/qwen2-5-math-72b-instruct": { "input": 0.574, "output": 1.721 }, "alibaba-cn/qwen2-5-math-7b-instruct": { "input": 0.144, "output": 0.287 }, "alibaba-cn/qwen2-5-omni-7b": { "input": 0.087, "output": 0.345 }, "alibaba-cn/qwen2-5-vl-72b-instruct": { "input": 2.294, "output": 6.881 }, "alibaba-cn/qwen2-5-vl-7b-instruct": { "input": 0.287, "output": 0.717 }, "alibaba-cn/qwen3-14b": { "input": 0.144, "output": 0.574 }, "alibaba-cn/qwen3-235b-a22b": { "input": 0.287, "output": 1.147 }, "alibaba-cn/qwen3-32b": { "input": 0.287, "output": 1.147 }, "alibaba-cn/qwen3-8b": { "input": 0.072, "output": 0.287 }, "alibaba-cn/qwen3-asr-flash": { "input": 0.032, "output": 0.032 }, "alibaba-cn/qwen3-coder-30b-a3b-instruct": { "input": 0.216, "output": 0.861 }, "alibaba-cn/qwen3-coder-480b-a35b-instruct": { "input": 0.861, "output": 3.441 }, "alibaba-cn/qwen3-coder-flash": { "input": 0.144, "output": 0.574, "cache_read": 0.0288, "cache_write": 0.18 }, "alibaba-cn/qwen3-max": { "input": 0.359, "output": 1.434 }, "alibaba-cn/qwen3-next-80b-a3b-instruct": { "input": 0.144, "output": 0.574 }, "alibaba-cn/qwen3-next-80b-a3b-thinking": { "input": 0.144, "output": 1.434 }, "alibaba-cn/qwen3-omni-flash": { "input": 0.258, "output": 0.989 }, "alibaba-cn/qwen3-vl-235b-a22b": { "input": 0.286705, "output": 1.14682 }, "alibaba-cn/qwen3-vl-30b-a3b": { "input": 0.108, "output": 0.431 }, "alibaba-cn/qwen3-vl-plus": { "input": 0.143353, "output": 1.433525, "cache_read": 0.028671, "cache_write": 0.179191 }, "alibaba-cn/qwen3.5-397b-a17b": { "input": 0.172, "output": 1.032 }, "alibaba-cn/qwen3.5-flash": { "input": 0.029, "output": 0.287 }, "alibaba-cn/qwen3.5-plus": { "input": 0.115, "output": 0.688 }, "alibaba-cn/qwen3.6-max-preview": { "input": 1.32, "output": 7.9, "cache_read": 0.132 }, "alibaba-cn/qwen3.6-plus": { "input": 0.276, "output": 1.651, "cache_read": 0.0276, "cache_write": 0.345 }, "alibaba-cn/qwen3.7-flash": { "input": 0.02962, "output": 0.1185, "cache_read": 5924e-6, "cache_write": 0.03703 }, "alibaba-cn/qwen3.7-plus": { "input": 0.276, "output": 1.101, "cache_read": 0.0552, "cache_write": 0.345 }, "alibaba-cn/qwen3.8-max": { "input": 1.77744, "output": 5.33231, "cache_read": 0.22218, "cache_write": 2.22179 }, "alibaba-cn/qwq-32b": { "input": 0.287, "output": 0.861 }, "alibaba-cn/qwq-plus": { "input": 0.23, "output": 0.574 }, "alibaba-cn/tongyi-intent-detect-v3": { "input": 0.058, "output": 0.144 }, "anthropic/claude-fable-5": { "input": 10, "output": 50, "cache_read": 1, "cache_write": 12.5 }, "anthropic/claude-fable-5-1": { "input": 10, "output": 50, "cache_read": 0.25, "cache_write": 12.5 }, "anthropic/claude-haiku-4-5-20251001": { "input": 1, "output": 5, "cache_read": 0.1, "cache_write": 1.25 }, "anthropic/claude-opus-4-5-20251101": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-opus-4-6": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-opus-4-7": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-3-haiku": { "input": 0.25, "output": 1.25, "cache_read": 0.03 }, "anthropic/claude-3-opus": { "input": 15, "output": 75, "cache_read": 1.5 }, "anthropic/claude-3.5-haiku": { "input": 0.8, "output": 4, "cache_read": 0.08 }, "deepseek/deepseek-coder": { "input": 0.14, "output": 0.28 }, "deepseek/deepseek-r1": { "input": 0.55, "output": 2.19, "cache_read": 0.14 }, "deepseek/deepseek-v3": { "input": 0.27, "output": 1.1, "cache_read": 0.07 }, "deepseek/deepseek-v3.1": { "input": 0.56, "output": 1.68, "cache_read": 0.07 }, "deepseek/deepseek-v3.2": { "input": 0.28, "output": 0.42, "cache_read": 0.028 }, "deepseek/deepseek-v4-flash": { "input": 0.15, "output": 0.6, "cache_read": 3e-3 }, "deepseek/deepseek-v4.1-flash-1017": { "input": 0.15, "output": 0.6, "cache_read": 3e-3 }, "deepseek/deepseek-v4-pro": { "input": 0.66, "output": 1.98, "cache_read": 0.022 }, "anthropic/claude-3.5-sonnet": { "input": 3, "output": 15, "cache_read": 0.3 }, "anthropic/claude-3.7-sonnet": { "input": 3, "output": 15, "cache_read": 0.3 }, "anthropic/claude-mythos-5": { "input": 10, "output": 50, "cache_read": 1 }, "anthropic/claude-opus-4": { "input": 15, "output": 75, "cache_read": 1.5 }, "anthropic/claude-opus-4-1": { "input": 15, "output": 75, "cache_read": 1.5 }, "anthropic/claude-opus-4-8-fast": { "input": 10, "output": 50, "cache_read": 1 }, "anthropic/claude-opus-5-fast": { "input": 10, "output": 50, "cache_read": 1 }, "anthropic/claude-sonnet-4": { "input": 3, "output": 15, "cache_read": 0.3 }, "google/gemini-1.5-flash": { "input": 0.075, "output": 0.3, "cache_read": 0.01875 }, "google/gemini-1.5-pro": { "input": 3.5, "output": 10.5 }, "google/gemini-2.0-flash": { "input": 0.1, "output": 0.4, "cache_read": 0.025 }, "google/gemini-2.0-flash-lite": { "input": 0.075, "output": 0.3, "cache_read": 0.01875 }, "google/gemini-2.5-flash": { "input": 0.3, "output": 2.5, "cache_read": 0.03 }, "google/gemini-3-flash": { "input": 0.5, "output": 3, "cache_read": 0.05 }, "google/gemini-3-pro": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-3-pro-preview": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-3.1-pro": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-3.5-flash-lite": { "input": 0.3, "output": 2.5, "cache_read": 0.03 }, "google/gemini-3.5-flash-preview": { "input": 1.5, "output": 9, "cache_read": 0.15 }, "google/gemini-3.6-flash": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "google/gemini-3.7-flash": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "google/gemini-3.7-flash-batch": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "google/gemini-3.7-flash-fast": { "input": 2.7, "output": 13.5, "cache_read": 0.27 }, "google/gemini-3.7-flash-flex": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "google/gemini-3.8-flash": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "anthropic/claude-opus-4-8": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-opus-5": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-sonnet-4-5-20250929": { "input": 3, "output": 15, "cache_read": 0.3, "cache_write": 3.75 }, "anthropic/claude-sonnet-4-5": { "input": 3, "output": 15, "cache_read": 0.3, "cache_write": 3.75 }, "anthropic/claude-sonnet-4-6": { "input": 3, "output": 15, "cache_read": 0.3, "cache_write": 3.75 }, "anthropic/claude-sonnet-5": { "input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2.5 }, "deepseek/deepseek-chat": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "deepseek/deepseek-reasoner": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "deepseek/deepseek-v4-flash-vision-exp": { "input": 0.15, "output": 0.6, "cache_read": 3e-3 }, "google/deep-research-max-preview-04-2026": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/deep-research-preview-04-2026": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-2.5-computer-use-preview-10-2025": { "input": 1.25, "output": 10 }, "google/gemini-2.5-flash-lite": { "input": 0.1, "output": 0.4, "cache_read": 0.01 }, "google/gemini-2.5-pro": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "google/gemini-3-flash-preview": { "input": 0.5, "output": 3, "cache_read": 0.05 }, "google/gemini-3.1-flash-lite-preview": { "input": 0.25, "output": 1.5, "cache_read": 0.025 }, "google/gemini-3.1-flash-lite": { "input": 0.25, "output": 1.5, "cache_read": 0.025 }, "google/gemini-3.1-pro-preview-customtools": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-3.1-pro-preview": { "input": 2, "output": 12, "cache_read": 0.2 }, "google/gemini-3.5-flash": { "input": 1.5, "output": 9, "cache_read": 0.15 }, "google/gemini-3.5-live-translate-preview": { "input": 3.5, "output": 21 }, "google/gemini-flash-latest": { "input": 0.75, "output": 3.75, "cache_read": 0.075 }, "google/gemini-flash-lite-latest": { "input": 0.3, "output": 2.5, "cache_read": 0.03 }, "google/gemini-omni-flash-preview": { "input": 1.5, "output": 17.5 }, "minimax/MiniMax-M2.1": { "input": 0.3, "output": 1.2, "cache_read": 0.03, "cache_write": 0.375 }, "minimax/MiniMax-M2.5-highspeed": { "input": 0.6, "output": 2.4, "cache_read": 0.03, "cache_write": 0.375 }, "mistral/codestral-2508": { "input": 0.3, "output": 0.9, "cache_read": 0.03 }, "mistral/ministral-14b-2512": { "input": 0.2, "output": 0.2, "cache_read": 0.02 }, "mistral/ministral-3b-2512": { "input": 0.1, "output": 0.1, "cache_read": 0.01 }, "mistral/ministral-8b-2512": { "input": 0.15, "output": 0.15, "cache_read": 0.015 }, "mistral/mistral-medium-3-5": { "input": 1.5, "output": 7.5 }, "minimax/MiniMax-M2.5": { "input": 0.3, "output": 1.2, "cache_read": 0.03, "cache_write": 0.375 }, "minimax/MiniMax-M2.7-highspeed": { "input": 0.6, "output": 2.4, "cache_read": 0.06, "cache_write": 0.375 }, "moonshotai/k2p6": { "input": 0.95, "output": 4, "cache_read": 0.16 }, "moonshotai/kimi-for-coding": { "input": 0.6, "output": 3, "cache_read": 0.1 }, "moonshotai/kimi-for-coding-highspeed": { "input": 1.8, "output": 9, "cache_read": 0.3 }, "moonshotai/kimi-k2": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai/kimi-k2.7-code": { "input": 0.95, "output": 4, "cache_read": 0.19 }, "moonshotai/kimi-k3": { "input": 3, "output": 15, "cache_read": 0.3, "cache_write": 3 }, "moonshotai/moonshot-v1-128k": { "input": 2, "output": 5 }, "moonshotai/moonshot-v1-32k": { "input": 1, "output": 3 }, "moonshotai/moonshot-v1-8k": { "input": 0.2, "output": 2 }, "minimax/MiniMax-M2.7": { "input": 0.3, "output": 1.2, "cache_read": 0.06, "cache_write": 0.375 }, "minimax/MiniMax-M2": { "input": 0.3, "output": 1.2 }, "minimax/MiniMax-M3": { "input": 0.3, "output": 1.2, "cache_read": 0.06 }, "minimax-cn/MiniMax-M2.1": { "input": 0.3137, "output": 1.2549, "cache_read": 0.0314, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M2.5-highspeed": { "input": 0.6275, "output": 2.5098, "cache_read": 0.0314, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M2.5": { "input": 0.3137, "output": 1.2549, "cache_read": 0.0314, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M2.7-highspeed": { "input": 0.6275, "output": 2.5098, "cache_read": 0.0627, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M2.7": { "input": 0.3137, "output": 1.2549, "cache_read": 0.0627, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M2": { "input": 0.3137, "output": 1.2549, "cache_read": 0.0314, "cache_write": 0.3922 }, "minimax-cn/MiniMax-M3": { "input": 0.3137, "output": 1.2549, "cache_read": 0.0627 }, "mistral/codestral-latest": { "input": 0.3, "output": 0.9, "cache_read": 0.03 }, "mistral/devstral-2512": { "input": 0.4, "output": 2 }, "mistral/devstral-latest": { "input": 0.4, "output": 2 }, "mistral/devstral-medium-2507": { "input": 0.4, "output": 2 }, "mistral/devstral-medium-latest": { "input": 0.4, "output": 2 }, "mistral/devstral-small-2505": { "input": 0.1, "output": 0.3 }, "mistral/devstral-small-2507": { "input": 0.1, "output": 0.3 }, "mistral/magistral-medium-latest": { "input": 2, "output": 5 }, "mistral/magistral-small": { "input": 0.5, "output": 1.5 }, "mistral/ministral-3b-latest": { "input": 0.1, "output": 0.1, "cache_read": 0.01 }, "mistral/ministral-8b-latest": { "input": 0.15, "output": 0.15, "cache_read": 0.015 }, "mistral/mistral-embed": { "input": 0.1, "output": 0 }, "mistral/mistral-large-2411": { "input": 2, "output": 6 }, "mistral/mistral-large-2512": { "input": 0.5, "output": 1.5, "cache_read": 0.05 }, "mistral/mistral-large-latest": { "input": 0.5, "output": 1.5, "cache_read": 0.05 }, "mistral/mistral-medium-2505": { "input": 0.4, "output": 2 }, "mistral/mistral-medium-2508": { "input": 0.4, "output": 2 }, "mistral/mistral-medium-2604": { "input": 1.5, "output": 7.5, "cache_read": 0.15 }, "openai/codex-mini-latest": { "input": 1.5, "output": 6, "cache_read": 0.375 }, "volcengine/doubao-lite-128k": { "input": 0.041, "output": 0.083, "cache_read": 8e-3 }, "volcengine/doubao-pro-128k": { "input": 0.111, "output": 0.277, "cache_read": 0.022 }, "volcengine/doubao-seed-2.0-code": { "input": 0.449, "output": 2.282, "cache_read": 0.09 }, "volcengine/doubao-seed-2.0-lite": { "input": 0.083, "output": 0.498, "cache_read": 0.017 }, "volcengine/doubao-seed-2.0-mini": { "input": 0.028, "output": 0.277, "cache_read": 6e-3 }, "volcengine/doubao-seed-2.0-pro": { "input": 0.442, "output": 2.213, "cache_read": 0.088 }, "volcengine/doubao-seed-2.1-pro": { "input": 0.829, "output": 4.147, "cache_read": 0.166 }, "xai/grok-3-beta": { "input": 3, "output": 15, "cache_read": 0.75 }, "xai/grok-4": { "input": 3, "output": 15, "cache_read": 0.75 }, "xai/grok-4-0709": { "input": 3, "output": 15, "cache_read": 0.75 }, "xai/grok-4-fast-non-reasoning": { "input": 0.2, "output": 0.5, "cache_read": 0.05 }, "xai/grok-4-fast-reasoning": { "input": 0.2, "output": 0.5, "cache_read": 0.05 }, "xai/grok-4.20": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.20-multi-agent": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.20-non-reasoning": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.20-reasoning": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-code-fast-1": { "input": 0.2, "output": 1.5, "cache_read": 0.02 }, "volcengine/doubao-seed-2.1-turbo": { "input": 0.415, "output": 2.073, "cache_read": 0.083 }, "volcengine/doubao-seed-code": { "input": 0.166, "output": 1.106, "cache_read": 0.033 }, "openai/gpt-5": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "openai/gpt-5-codex": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "openai/gpt-5.1-codex": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "openai/gpt-5.1-codex-max": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "openai/gpt-5.1-codex-mini": { "input": 0.25, "output": 2, "cache_read": 0.025 }, "openai/gpt-5.2-codex": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.4-codex": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.5-codex": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.5-fast": { "input": 12.5, "output": 75, "cache_read": 1.25 }, "openai/gpt-5.5-flex": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.6-cyber": { "input": 12.5, "output": 75, "cache_read": 1.25 }, "openai/gpt-5.6-luna-batch": { "input": 0.1, "output": 0.6, "cache_read": 0.01 }, "openai/gpt-5.6-luna-fast": { "input": 0.4, "output": 2.4, "cache_read": 0.04 }, "openai/gpt-5.6-luna-flex": { "input": 0.1, "output": 0.6, "cache_read": 0.01 }, "openai/gpt-5.6-sol-batch": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.6-sol-fast": { "input": 10, "output": 60, "cache_read": 1 }, "zhipuai/glm-4.5-airx": { "input": 1.1, "output": 4.5 }, "zhipuai/glm-4.5-x": { "input": 2.2, "output": 8.9 }, "zhipuai/glm-5-code": { "input": 1.2, "output": 5, "cache_read": 0.3 }, "openai/gpt-5.6-sol-flex": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.6-terra-batch": { "input": 1, "output": 6, "cache_read": 0.1 }, "openai/gpt-5.6-terra-fast": { "input": 4, "output": 24, "cache_read": 0.4 }, "openai/gpt-5.6-terra-flex": { "input": 1, "output": 6, "cache_read": 0.1 }, "openai/o1-mini": { "input": 1.1, "output": 4.4, "cache_read": 0.55 }, "openai/o1-preview": { "input": 15, "output": 60, "cache_read": 7.5 }, "mistral/mistral-nemo": { "input": 0.15, "output": 0.15 }, "mistral/mistral-small-2506": { "input": 0.1, "output": 0.3 }, "mistral/mistral-small-2603": { "input": 0.15, "output": 0.6, "cache_read": 0.015 }, "mistral/mistral-small-latest": { "input": 0.15, "output": 0.6, "cache_read": 0.015 }, "mistral/open-mistral-7b": { "input": 0.25, "output": 0.25 }, "mistral/open-mistral-nemo": { "input": 0.15, "output": 0.15 }, "mistral/open-mixtral-8x22b": { "input": 2, "output": 6 }, "mistral/open-mixtral-8x7b": { "input": 0.7, "output": 0.7 }, "mistral/pixtral-12b": { "input": 0.15, "output": 0.15 }, "mistral/pixtral-large-latest": { "input": 2, "output": 6 }, "moonshotai/kimi-k2-0711-preview": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai/kimi-k2-0905-preview": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai/kimi-k2-thinking-turbo": { "input": 1.15, "output": 8, "cache_read": 0.15 }, "moonshotai/kimi-k2-thinking": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai/kimi-k2-turbo-preview": { "input": 2.4, "output": 10, "cache_read": 0.6 }, "moonshotai/kimi-k2.5": { "input": 0.6, "output": 3, "cache_read": 0.1 }, "moonshotai/kimi-k2.6": { "input": 0.95, "output": 4, "cache_read": 0.16 }, "openai/gpt-3.5-turbo": { "input": 0.5, "output": 1.5, "cache_read": 0 }, "openai/gpt-4-turbo": { "input": 10, "output": 30 }, "openai/gpt-4.1-mini": { "input": 0.4, "output": 1.6, "cache_read": 0.1 }, "openai/gpt-4.1-nano": { "input": 0.1, "output": 0.4, "cache_read": 0.025 }, "openai/gpt-4.1": { "input": 2, "output": 8, "cache_read": 0.5 }, "openai/gpt-4": { "input": 30, "output": 60 }, "openai/gpt-4o-2024-05-13": { "input": 5, "output": 15 }, "openai/gpt-4o-2024-08-06": { "input": 2.5, "output": 10, "cache_read": 1.25 }, "openai/gpt-4o-2024-11-20": { "input": 2.5, "output": 10, "cache_read": 1.25 }, "openai/gpt-4o-mini": { "input": 0.15, "output": 0.6, "cache_read": 0.075 }, "openai/gpt-4o": { "input": 2.5, "output": 10, "cache_read": 1.25 }, "openai/gpt-5-mini": { "input": 0.25, "output": 2, "cache_read": 0.025 }, "openai/gpt-5-nano": { "input": 0.05, "output": 0.4, "cache_read": 5e-3 }, "openai/gpt-5-pro": { "input": 15, "output": 120 }, "openai/gpt-5.1": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "openai/gpt-5.2-chat-latest": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.2-pro": { "input": 21, "output": 168 }, "openai/gpt-5.2": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.3-chat-latest": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.3-codex-spark": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.3-codex": { "input": 1.75, "output": 14, "cache_read": 0.175 }, "openai/gpt-5.4-mini": { "input": 0.75, "output": 4.5, "cache_read": 0.075 }, "openai/gpt-5.4-nano": { "input": 0.2, "output": 1.25, "cache_read": 0.02 }, "openai/gpt-5.4-pro": { "input": 30, "output": 180 }, "openai/gpt-5.4": { "input": 2.5, "output": 15, "cache_read": 0.25 }, "openai/gpt-5.5-pro": { "input": 30, "output": 180 }, "openai/gpt-5.5": { "input": 5, "output": 30, "cache_read": 0.5 }, "openai/gpt-5.6-luna": { "input": 0.2, "output": 1.2, "cache_read": 0.02, "cache_write": 0.25 }, "openai/gpt-5.6-sol": { "input": 4, "output": 20, "cache_read": 0.4, "cache_write": 5 }, "openai/gpt-5.6-terra": { "input": 2, "output": 12, "cache_read": 0.2, "cache_write": 2.5 }, "openai/gpt-6-astra": { "input": 10, "output": 50, "cache_read": 1, "cache_write": 12.5 }, "openai/gpt-5.6": { "input": 4, "output": 20, "cache_read": 0.4, "cache_write": 5 }, "openai/o1-pro": { "input": 150, "output": 600 }, "openai/o1": { "input": 15, "output": 60, "cache_read": 7.5 }, "openai/o3-mini": { "input": 1.1, "output": 4.4, "cache_read": 0.55 }, "openai/o3-pro": { "input": 20, "output": 80 }, "openai/o3": { "input": 2, "output": 8, "cache_read": 0.5 }, "openai/o4-mini": { "input": 1.1, "output": 4.4, "cache_read": 0.275 }, "volcengine/doubao-seed-evolving": { "input": 0.8906, "output": 4.45301, "cache_read": 0.17812 }, "xai/grok-4.20-0309-non-reasoning": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.20-0309-reasoning": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.20-multi-agent-0309": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.3": { "input": 1.25, "output": 2.5, "cache_read": 0.2 }, "xai/grok-4.5": { "input": 2, "output": 6, "cache_read": 0.3 }, "xai/grok-4.6": { "input": 2, "output": 6, "cache_read": 0.5 }, "xai/grok-build-0.1": { "input": 1, "output": 2, "cache_read": 0.2 }, "xiaomi/mimo-v2-flash": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "xiaomi/mimo-v2-omni": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "xiaomi/mimo-v2-pro": { "input": 0.435, "output": 0.87, "cache_read": 36e-4 }, "xiaomi/mimo-v2.5-pro-ultraspeed": { "input": 1.305, "output": 2.61, "cache_read": 0.0108 }, "xiaomi/mimo-v2.5-pro": { "input": 0.435, "output": 0.87, "cache_read": 36e-4 }, "xiaomi/mimo-v2.5": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "xiaomi/mimo-v2.6-flash": { "input": 0.14, "output": 0.28, "cache_read": 28e-4 }, "xiaomi/mimo-v2.6-pro": { "input": 0.435, "output": 0.87, "cache_read": 36e-4 }, "xiaomi/mimo-v2.6-pro-ultraspeed": { "input": 4.35, "output": 8.7, "cache_read": 0.036 }, "zai/glm-4.5-air": { "input": 0.2, "output": 1.1, "cache_read": 0.03, "cache_write": 0 }, "zai/glm-4.5": { "input": 0.6, "output": 2.2, "cache_read": 0.11, "cache_write": 0 }, "zai/glm-4.5v": { "input": 0.6, "output": 1.8, "cache_read": 0.11, "cache_write": 0 }, "zai/glm-4.6": { "input": 0.6, "output": 2.2, "cache_read": 0.11, "cache_write": 0 }, "zai/glm-4.6v": { "input": 0.3, "output": 0.9, "cache_read": 0.05, "cache_write": 0 }, "zai/glm-4.7-flashx": { "input": 0.07, "output": 0.4, "cache_read": 0.01, "cache_write": 0 }, "zai/glm-4.7": { "input": 0.6, "output": 2.2, "cache_read": 0.11, "cache_write": 0 }, "zai/glm-5-turbo": { "input": 1.2, "output": 4, "cache_read": 0.24, "cache_write": 0 }, "zai/glm-5v-turbo": { "input": 1.2, "output": 4, "cache_read": 0.24, "cache_write": 0 }, "zhipuai/glm-4.5": { "input": 0.6, "output": 2.2, "cache_read": 0.11, "cache_write": 0 }, "zhipuai/glm-4.5-air": { "input": 0.11952, "output": 0.89637, "cache_read": 0.0239, "cache_write": 0 }, "zhipuai/glm-4.5v": { "input": 0.29879, "output": 0.89637, "cache_read": 0.05976, "cache_write": 0 }, "zhipuai/glm-4.6": { "input": 0.6, "output": 2.2, "cache_read": 0.11, "cache_write": 0 }, "zhipuai/glm-4.6v": { "input": 0.1494, "output": 0.44819, "cache_read": 0.02988, "cache_write": 0 }, "zhipuai/glm-4.7": { "input": 0.44819, "output": 2.09153, "cache_read": 0.08964, "cache_write": 0 }, "zhipuai/glm-4.7-flashx": { "input": 0.0747, "output": 0.44819, "cache_read": 0.01494, "cache_write": 0 }, "zhipuai/glm-5": { "input": 0.59758, "output": 2.68911, "cache_read": 0.1494, "cache_write": 0 }, "zhipuai/glm-5.1": { "input": 0.89637, "output": 3.58548, "cache_read": 0.19421, "cache_write": 0 }, "zhipuai/glm-5.2": { "input": 1.19516, "output": 4.18306, "cache_read": 0.29879, "cache_write": 0 }, "zhipuai/glm-5.3": { "input": 1.19516, "output": 4.18306, "cache_read": 0.29879, "cache_write": 0 }, "zhipuai/glm-5.3-flash": { "input": 0.11952, "output": 0.41831, "cache_read": 0.03436, "cache_write": 0 }, "zhipuai/glm-5v-turbo": { "input": 0.74698, "output": 3.28669, "cache_read": 0.17927, "cache_write": 0 }, "meta/muse-spark-1.1": { "input": 1.25, "output": 4.25, "cache_read": 0.15 }, "cursor/auto": { "input": 1.25, "output": 6, "cache_read": 0.25 }, "cursor/composer-1": { "input": 1.25, "output": 10, "cache_read": 0.125 }, "cursor/composer-1.5": { "input": 3.5, "output": 17.5, "cache_read": 0.35 }, "cursor/composer-2": { "input": 0.5, "output": 2.5, "cache_read": 0.2 }, "cursor/composer-2.5": { "input": 0.5, "output": 2.5, "cache_read": 0.2 }, "tencent/hy3": { "input": 0.15, "output": 0.59, "cache_read": 0.0375 }, "tencent/hy3-preview": { "input": 0.18, "output": 0.59, "cache_read": 0.06 }, "stepfun/step-3.5-flash": { "input": 0.10461, "output": 0.31384, "cache_read": 0.02092 }, "stepfun/step-3.7-flash": { "input": 0.20175, "output": 1.21052, "cache_read": 0.04035 }, "inclusionai/ling-2.6-1t": { "input": 0.625, "output": 2.5 }, "inclusionai/ling-2.6-flash": { "input": 0.083, "output": 0.25 }, "inclusionai/ling-3.0-flash": { "input": 0.069, "output": 0.208 }, "inclusionai/ring-2.6-1t": { "input": 0.625, "output": 2.5 }, "meituan/longcat-2.0": { "input": 0.694, "output": 2.778, "cache_read": 0.014 }, "sapiens/agnes-2.0-flash": { "input": 0.03, "output": 0.15 }, "sapiens/agnes-2.5-flash": { "input": 0.03, "output": 0.15 }, "sapiens/agnes-2.5-pro": { "input": 0.45, "output": 0.9, "cache_read": 38e-4 }, "sapiens/agnes-2.5-pro-alpha": { "input": 0.45, "output": 0.9, "cache_read": 38e-4 }, "meta/muse-spark-1.2": { "input": 1.25, "output": 4.25, "cache_read": 0.15 }, "meta/muse-spark-1.2-contributor": { "input": 0.1, "output": 0.2, "cache_read": 2e-3 }, "moonshotai/kimi-k2.7-code-highspeed": { "input": 1.9, "output": 8, "cache_read": 0.38 }, "anthropic/claude-opus-4-5": { "input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25 }, "anthropic/claude-haiku-4-5": { "input": 1, "output": 5, "cache_read": 0.1, "cache_write": 1.25 }, "zai/glm-4.5-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "zai/glm-5": { "input": 1, "output": 3.2, "cache_read": 0.2, "cache_write": 0 }, "zai/glm-5.3": { "input": 1.4, "output": 4.4, "cache_read": 0.26, "cache_write": 0 }, "zai/glm-5.2": { "input": 1.4, "output": 4.4, "cache_read": 0.26, "cache_write": 0 }, "zai/glm-5.1": { "input": 1.4, "output": 4.4, "cache_read": 0.26, "cache_write": 0 }, "zai/glm-4.7-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "zai/glm-5.3-flash": { "input": 0.15, "output": 0.5, "cache_read": 0.03, "cache_write": 0 }, "alibaba-cn/qwen3.7-max": { "input": 1.65, "output": 4.951, "cache_read": 0.33, "cache_write": 2.0625 }, "alibaba-cn/qwen3.6-flash": { "input": 0.165, "output": 0.99, "cache_read": 0.0165, "cache_write": 0.20625 }, "alibaba-cn/qwen3-coder-plus": { "input": 0.574, "output": 2.296 }, "stepfun/step-3.5-flash-2603": { "input": 0.10461, "output": 0.31384, "cache_read": 0.02092 }, "stepfun/step-2-16k": { "input": 5.21, "output": 16.44, "cache_read": 1.04 }, "stepfun/step-1-32k": { "input": 2.05, "output": 9.59, "cache_read": 0.41 }, "volcengine/doubao-seed-2-0-pro-260215": { "input": 0.47499, "output": 2.37494, "cache_read": 0.095 }, "volcengine/doubao-seed-1-6-251015": { "input": 0.11875, "output": 1.18747, "cache_read": 0.02375 }, "volcengine/doubao-seed-2-1-pro-260628": { "input": 0.8906, "output": 4.45301, "cache_read": 0.17812 }, "volcengine/doubao-seed-1-6-flash-250828": { "input": 0.02227, "output": 0.22265, "cache_read": 445e-5 }, "volcengine/doubao-seed-2-0-lite-260428": { "input": 0.08906, "output": 0.53436, "cache_read": 0.01781 }, "volcengine/doubao-seed-2-0-code-preview-260215": { "input": 0.47499, "output": 2.37494, "cache_read": 0.095 }, "volcengine/doubao-seed-1-6-vision-250815": { "input": 0.11875, "output": 1.18747, "cache_read": 0.02375 }, "volcengine/doubao-seed-2-0-mini-260428": { "input": 0.02969, "output": 0.29687, "cache_read": 594e-5 }, "volcengine/doubao-seed-2-1-turbo-260628": { "input": 0.4453, "output": 2.22651, "cache_read": 0.08906 }, "volcengine/doubao-seed-character-260628": { "input": 0.11875, "output": 0.29687, "cache_read": 0.02375 }, "volcengine/doubao-seed-1-8-251228": { "input": 0.11875, "output": 1.18747, "cache_read": 0.02375 }, "zhipuai/glm-4.7-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "zhipuai/glm-4.5-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "mistral/labs-devstral-small-2512": { "input": 0, "output": 0 }, "mistral/voxtral-small-latest": { "input": 0.1, "output": 0.3 }, "mistral/mistral-medium-latest": { "input": 1.5, "output": 7.5, "cache_read": 0.15 }, "moonshotai-cn/kimi-k2.6": { "input": 0.9711, "output": 4.0337, "cache_read": 0.1643 }, "moonshotai-cn/kimi-k2-thinking": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai-cn/kimi-k2.7-code-highspeed": { "input": 1.9421, "output": 8.0673, "cache_read": 0.3884 }, "moonshotai-cn/kimi-k2-turbo-preview": { "input": 2.4, "output": 10, "cache_read": 0.6 }, "moonshotai-cn/kimi-k2-0905-preview": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai-cn/kimi-k2.5": { "input": 0.6, "output": 3, "cache_read": 0.1 }, "moonshotai-cn/kimi-k2-thinking-turbo": { "input": 1.15, "output": 8, "cache_read": 0.15 }, "moonshotai-cn/kimi-k2-0711-preview": { "input": 0.6, "output": 2.5, "cache_read": 0.15 }, "moonshotai-cn/kimi-k3": { "input": 2.9879, "output": 14.9395, "cache_read": 0.2988, "cache_write": 2.9879 }, "moonshotai-cn/kimi-k2.7-code": { "input": 0.9711, "output": 4.0337, "cache_read": 0.1942 }, "alibaba-cn/qwen3.8-flash": { "input": 0.11875, "output": 0.40073, "cache_read": 0.014844, "cache_write": 0.185547 }, "meta/muse-spark-1.3": { "input": 1.25, "output": 4.25, "cache_read": 0.15 }, "meta/muse-spark-1.3-contributor": { "input": 0.1, "output": 0.2, "cache_read": 2e-3 }, "deepseek/deepseek-flash": { "input": 0.15, "output": 0.6, "cache_read": 3e-3 }, "tencent/hy4-preview": { "input": 0.834, "output": 2.501, "cache_read": 0.042 }, "zhipuai/glm-5.3-flashx": { "input": 0.29879, "output": 1.04577, "cache_read": 0.08516, "cache_write": 0 }, "zhipuai/glm-4.6v-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "xai/grok-4.7": { "input": 2, "output": 6, "cache_read": 0.5 }, "zai/glm-5.3-flashx": { "input": 0.37, "output": 1.25, "cache_read": 0.075, "cache_write": 0 }, "zai/glm-4.6v-flash": { "input": 0, "output": 0, "cache_read": 0, "cache_write": 0 }, "anthropic/claude-opus-5-5": { "input": 4, "output": 20, "cache_read": 0.2, "cache_write": 5 }, "openai/gpt-6-sol": { "input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2.5 }, "openai/gpt-6-luna": { "input": 0.1, "output": 0.5, "cache_read": 0.01, "cache_write": 0.125 }, "anthropic/claude-sonnet-5-5": { "input": 2, "output": 10, "cache_read": 0.1, "cache_write": 2.5 }, "alibaba/qwen3.5-flash": { "input": 0.1, "output": 0.4, "cache_read": 0.01, "cache_write": 0.125 }, "alibaba/qwen3.8-omni-flash": { "input": 0.15, "output": 0.47, "cache_read": 0.016 }, "stepfun/step-5-preview": { "input": 1.04613, "output": 2.98895, "cache_read": 0.10461 }, "openai/gpt-daybreak-blue-latest": { "input": 4, "output": 20, "cache_read": 0.4, "cache_write": 5 }, "openai/gpt-daybreak-red-latest": { "input": 12.5, "output": 75, "cache_read": 1.25, "cache_write": 15.625 }, "alibaba-cn/qwen3.8-omni-flash": { "input": 0.113, "output": 0.382, "cache_read": 0.014 }, "anthropic/claude-haiku-5-5": { "input": 0.1, "output": 0.5, "cache_read": 0.01, "cache_write": 0.125 }, "mistral/mistral-large-4": { "input": 1.36, "output": 4.18, "cache_read": 0.14 }, "mistral/labs-leanstral-1-5-1": { "input": 0, "output": 0 }, "openai/gpt-6.1-sol": { "input": 2, "output": 10, "cache_read": 0.1, "cache_write": 2.5 }, "meta/muse-wonder-1.0": { "input": 4, "output": 20, "cache_read": 0.2 }, "google/gemini-4-argon": { "input": 2, "output": 10, "cache_read": 0.1 }, "minimax-cn/MiniMax-M3.1-Flash": { "input": 0.1494, "output": 0.5976, "cache_read": 0.0149 }, "minimax/MiniMax-M3.1-Flash": { "input": 0.15, "output": 0.6, "cache_read": 0.015 }, "moonshotai/kimi-k3.1-pro": { "input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2 }, "moonshotai/kimi-k3.1-pro-highspeed": { "input": 4, "output": 20, "cache_read": 0.2, "cache_write": 4 }, "moonshotai-cn/kimi-k3.1-pro": { "input": 1.9437, "output": 10.1671, "cache_read": 0.1944, "cache_write": 1.9437 }, "moonshotai-cn/kimi-k3.1-pro-highspeed": { "input": 3.8874, "output": 20.3342, "cache_read": 0.1944, "cache_write": 3.8874 }, "google/gemini-pro-latest": { "input": 2, "output": 12, "cache_read": 0.2 } }, "_meta": { "units": "usd_per_million_tokens", "generated_at": "2026-10-25T00:00:00.000Z", "note": "Official-channel-only pricing bundle from models.dev. Scoped to anthropic/openai/google/google-vertex(/anthropic)/xai/deepseek/alibaba(/-cn)/moonshotai(/-cn)/minimax(/-cn)/xiaomi/mistral(/-cn)/zai/zhipuai/volcengine. Excludes audio/video/image/embedding/tts/stt/realtime/transcription/moderation models. All third-party / community / AWS ARN / region variants were removed 2026-08-27 \u2014 any (source, model) emitted by the parsers resolves to the official price via matcher prefix-strip. Build stats: kept=426. Manually supplemented 118 entries on 2026-08-27 from an external price feed (claude-3.x, claude-mythos-5, opus-4/-4-1/-4-8-fast/-5-fast, sonnet-4, gpt-5, gpt-5.x-codex, gpt-5.5-fast/flex, gpt-5.6-*-batch/fast/flex, o1-mini/preview, gemini-1.5/2.0/3.x, deepseek-coder/r1/v3.x/v4, qwen-coder/qwen3.7-flash/qwen3.8, glm-4.5-airx/x/glm-5-code, kimi-k2/k2.7-code/k3/kimi-for-coding/moonshot-v1, mistral-medium-3-5/ministral/codestral-2508, grok-3/4/4.20/code-fast, cursor, hy3, doubao-seed-2.x, step, ling/ring, longcat, agnes). Incremental models.dev sync on 2026-08-28: kept=416 (added=73, changed=13, removed=54). Gemini-only sync on 2026-09-03: kept=417 (added=google/gemini-3.8-flash, changed=0, removed=0). GPT-6 Astra sync on 2026-09-05: kept=418 (added=openai/gpt-6-astra, changed=0, removed=0). GPT-6 Astra cache rates supplemented on 2026-09-07 from the OpenAI model page: cache_read=1, cache_write=12.5 (changed=1). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-09-17: kept=423 (added=4, changed=8, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-09-22: kept=429 (added=5, changed=2, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-09-22: kept=432 (added=3, changed=0, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-09-23: kept=435 (added=3, changed=3, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-09-29: kept=442 (added=7, changed=9, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-10-09: kept=446 (added=4, changed=10, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-10-14: kept=448 (added=2, changed=0, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Incremental models.dev sync on 2026-10-19: kept=450 (added=2, changed=4, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped. Manually supplemented deepseek/deepseek-v4.1-flash-1017 on 2026-10-19 using models.dev official deepseek/deepseek-flash rates (input=0.15, output=0.6, cache_read=0.003); kept=451. The versioned ID is not listed in the official provider catalog. Incremental models.dev sync on 2026-10-25: kept=456 (added=5, changed=52, removed=0). Official-only: cross-vendor hosting and cloud-partnership channels dropped." }, "alias": { "claude-sonnet-4.5": "anthropic/claude-sonnet-4-5", "ox-alpha": "zhipuai/glm-5.3-flash", "ox-alpha-free": "zhipuai/glm-5.3-flash", "ox_alpha": "zhipuai/glm-5.3-flash", "oxalpha": "zhipuai/glm-5.3-flash", "Ox-Alpha": "zhipuai/glm-5.3-flash", "OX-ALPHA": "zhipuai/glm-5.3-flash", "opencode-go/ox-alpha-free": "zhipuai/glm-5.3-flash" }, "fuzzy": [{ "match": "claude-opus-4-7", "ref": "anthropic/claude-opus-4-7" }, { "match": "claude-opus-4-6", "ref": "anthropic/claude-opus-4-6" }, { "match": "claude-opus-4-5", "ref": "anthropic/claude-opus-4-5-20251101" }, { "match": "claude-opus-4-1", "ref": "anthropic/claude-opus-4-1" }, { "match": "claude-sonnet-4-5", "ref": "anthropic/claude-sonnet-4-5" }, { "match": "claude-haiku-4-5", "ref": "anthropic/claude-haiku-4-5-20251001" }, { "match": "claude-opus", "ref": "anthropic/claude-opus-4-6" }, { "match": "claude-sonnet", "ref": "anthropic/claude-sonnet-4-5" }, { "match": "claude-haiku", "ref": "anthropic/claude-haiku-4-5-20251001" }, { "match": "claude-3-haiku", "ref": "anthropic/claude-3-haiku" }, { "match": "claude-3-opus", "ref": "anthropic/claude-3-opus" }, { "match": "claude-3.5-haiku", "ref": "anthropic/claude-3.5-haiku" }, { "match": "claude-3.5-sonnet", "ref": "anthropic/claude-3.5-sonnet" }, { "match": "claude-3.7-sonnet", "ref": "anthropic/claude-3.7-sonnet" }, { "match": "claude-mythos-5", "ref": "anthropic/claude-mythos-5" }, { "match": "claude-fable-5-1", "ref": "anthropic/claude-fable-5-1" }, { "match": "claude-fable-5", "ref": "anthropic/claude-fable-5" }, { "match": "claude-opus-4", "ref": "anthropic/claude-opus-4" }, { "match": "claude-opus-4-8-fast", "ref": "anthropic/claude-opus-4-8-fast" }, { "match": "claude-opus-5-fast", "ref": "anthropic/claude-opus-5-fast" }, { "match": "claude-sonnet-4", "ref": "anthropic/claude-sonnet-4" }, { "match": "claude-4.6-opus", "ref": "anthropic/claude-opus-4-6" }, { "match": "claude", "ref": "anthropic/claude-sonnet-4-5" }, { "match": "gpt-5.3-codex", "ref": "openai/gpt-5.3-codex" }, { "match": "gpt-5-codex", "ref": "openai/gpt-5-codex" }, { "match": "codex-mini-latest", "ref": "openai/codex-mini-latest" }, { "match": "gpt-5.1-codex", "ref": "openai/gpt-5.1-codex" }, { "match": "gpt-5.1-codex-max", "ref": "openai/gpt-5.1-codex-max" }, { "match": "gpt-5.1-codex-mini", "ref": "openai/gpt-5.1-codex-mini" }, { "match": "gpt-5.2-codex", "ref": "openai/gpt-5.2-codex" }, { "match": "gpt-5.4-codex", "ref": "openai/gpt-5.4-codex" }, { "match": "gpt-5.5-codex", "ref": "openai/gpt-5.5-codex" }, { "match": "gpt-5.5-fast", "ref": "openai/gpt-5.5-fast" }, { "match": "gpt-5.5-flex", "ref": "openai/gpt-5.5-flex" }, { "match": "gpt-5.6-cyber", "ref": "openai/gpt-5.6-cyber" }, { "match": "gpt-5.6-luna-batch", "ref": "openai/gpt-5.6-luna-batch" }, { "match": "gpt-5.6-luna-fast", "ref": "openai/gpt-5.6-luna-fast" }, { "match": "gpt-5.6-luna-flex", "ref": "openai/gpt-5.6-luna-flex" }, { "match": "gpt-5.6-sol-batch", "ref": "openai/gpt-5.6-sol-batch" }, { "match": "gpt-5.6-sol-fast", "ref": "openai/gpt-5.6-sol-fast" }, { "match": "gpt-5.6-sol-flex", "ref": "openai/gpt-5.6-sol-flex" }, { "match": "gpt-5.6-terra-batch", "ref": "openai/gpt-5.6-terra-batch" }, { "match": "gpt-5.6-terra-fast", "ref": "openai/gpt-5.6-terra-fast" }, { "match": "gpt-5.6-terra-flex", "ref": "openai/gpt-5.6-terra-flex" }, { "match": "codex", "ref": "openai/gpt-5.3-codex" }, { "match": "gpt-5.4-mini", "ref": "openai/gpt-5.4-mini" }, { "match": "gpt-5.4", "ref": "openai/gpt-5.4" }, { "match": "gpt-5.1", "ref": "openai/gpt-5.1" }, { "match": "gpt-5.5", "ref": "openai/gpt-5.5" }, { "match": "gpt-5.6-sol", "ref": "openai/gpt-5.6-sol" }, { "match": "gpt-5.6-terra", "ref": "openai/gpt-5.6-terra" }, { "match": "gpt-6-astra", "ref": "openai/gpt-6-astra" }, { "match": "gpt-5", "ref": "openai/gpt-5" }, { "match": "gpt-4o", "ref": "openai/gpt-4o" }, { "match": "o1-pro", "ref": "openai/o1-pro" }, { "match": "o1-mini", "ref": "openai/o1-mini" }, { "match": "o1-preview", "ref": "openai/o1-preview" }, { "match": "o1", "ref": "openai/o1" }, { "match": "o3-pro", "ref": "openai/o3-pro" }, { "match": "o3-mini", "ref": "openai/o3-mini" }, { "match": "o3", "ref": "openai/o3" }, { "match": "o4-mini", "ref": "openai/o4-mini" }, { "match": "o4", "ref": "openai/o4-mini" }, { "match": "gpt-4.1", "ref": "openai/gpt-4.1" }, { "match": "gpt-4", "ref": "openai/gpt-4" }, { "match": "gemini-3-pro", "ref": "google/gemini-3.1-pro-preview" }, { "match": "gemini-2.5-pro", "ref": "google/gemini-2.5-pro" }, { "match": "gemini-2.5-flash", "ref": "google/gemini-2.5-flash" }, { "match": "gemini-1.5-flash", "ref": "google/gemini-1.5-flash" }, { "match": "gemini-1.5-pro", "ref": "google/gemini-1.5-pro" }, { "match": "gemini-2.0-flash", "ref": "google/gemini-2.0-flash" }, { "match": "gemini-2.0-flash-lite", "ref": "google/gemini-2.0-flash-lite" }, { "match": "gemini-3-flash", "ref": "google/gemini-3-flash" }, { "match": "gemini-3.5-flash-lite", "ref": "google/gemini-3.5-flash-lite" }, { "match": "gemini-3.5-flash-preview", "ref": "google/gemini-3.5-flash-preview" }, { "match": "gemini-3.6-flash", "ref": "google/gemini-3.6-flash" }, { "match": "gemini-3.7-flash", "ref": "google/gemini-3.7-flash" }, { "match": "gemini-3.7-flash-batch", "ref": "google/gemini-3.7-flash-batch" }, { "match": "gemini-3.7-flash-fast", "ref": "google/gemini-3.7-flash-fast" }, { "match": "gemini-3.7-flash-flex", "ref": "google/gemini-3.7-flash-flex" }, { "match": "gemini-3.8-flash", "ref": "google/gemini-3.8-flash" }, { "match": "gemini", "ref": "google/gemini-2.5-pro" }, { "match": "grok-4.5", "ref": "xai/grok-4.5" }, { "match": "grok-4.3", "ref": "xai/grok-4.3" }, { "match": "grok-4.6", "ref": "xai/grok-4.6" }, { "match": "grok-4", "ref": "xai/grok-4" }, { "match": "grok-3-beta", "ref": "xai/grok-3-beta" }, { "match": "grok-4-0709", "ref": "xai/grok-4-0709" }, { "match": "grok-4-fast-non-reasoning", "ref": "xai/grok-4-fast-non-reasoning" }, { "match": "grok-4-fast-reasoning", "ref": "xai/grok-4-fast-reasoning" }, { "match": "grok-4.20", "ref": "xai/grok-4.20" }, { "match": "grok-4.20-multi-agent", "ref": "xai/grok-4.20-multi-agent" }, { "match": "grok-4.20-non-reasoning", "ref": "xai/grok-4.20-non-reasoning" }, { "match": "grok-4.20-reasoning", "ref": "xai/grok-4.20-reasoning" }, { "match": "grok-code-fast-1", "ref": "xai/grok-code-fast-1" }, { "match": "grok", "ref": "xai/grok-4.5" }, { "match": "deepseek-r1", "ref": "deepseek/deepseek-r1" }, { "match": "deepseek-v3", "ref": "deepseek/deepseek-v3" }, { "match": "deepseek-coder", "ref": "deepseek/deepseek-coder" }, { "match": "deepseek-v3.1", "ref": "deepseek/deepseek-v3.1" }, { "match": "deepseek-v3.2", "ref": "deepseek/deepseek-v3.2" }, { "match": "deepseek-v4-flash", "ref": "deepseek/deepseek-v4-flash" }, { "match": "deepseek-v4-pro", "ref": "deepseek/deepseek-v4-pro" }, { "match": "deepseek", "ref": "deepseek/deepseek-chat" }, { "match": "qwen3-coder-480b", "ref": "alibaba-cn/qwen3-coder-480b-a35b-instruct" }, { "match": "qwen3-coder-30b", "ref": "alibaba-cn/qwen3-coder-30b-a3b-instruct" }, { "match": "qwen3-coder-flash", "ref": "alibaba-cn/qwen3-coder-flash" }, { "match": "qwen3-coder", "ref": "alibaba-cn/qwen3-coder-30b-a3b-instruct" }, { "match": "qwen3-max", "ref": "alibaba-cn/qwen3-max" }, { "match": "qwen3-plus", "ref": "alibaba-cn/qwen3-max" }, { "match": "qwen3-235b", "ref": "alibaba-cn/qwen3-235b-a22b" }, { "match": "qwen-coder", "ref": "alibaba/qwen-coder" }, { "match": "qwen3-coder-next", "ref": "alibaba/qwen3-coder-next" }, { "match": "qwen3.7-flash", "ref": "alibaba/qwen3.7-flash" }, { "match": "qwen3.8-2.4t-a95b", "ref": "alibaba/qwen3.8-2.4t-a95b" }, { "match": "qwen3.8-27b", "ref": "alibaba/qwen3.8-27b" }, { "match": "qwen3.8-flash", "ref": "alibaba/qwen3.8-flash" }, { "match": "qwen3", "ref": "alibaba-cn/qwen3-max" }, { "match": "qwen", "ref": "alibaba-cn/qwen3-max" }, { "match": "qwq", "ref": "alibaba-cn/qwq-plus" }, { "match": "glm-4.7", "ref": "zai/glm-4.7" }, { "match": "glm-4.6", "ref": "zai/glm-4.6" }, { "match": "glm-4.5", "ref": "zai/glm-4.5" }, { "match": "glm-5", "ref": "zai/glm-5-turbo" }, { "match": "glm-4.5-airx", "ref": "zhipuai/glm-4.5-airx" }, { "match": "glm-4.5-x", "ref": "zhipuai/glm-4.5-x" }, { "match": "glm-5-code", "ref": "zhipuai/glm-5-code" }, { "match": "glm", "ref": "zai/glm-4.6" }, { "match": "kimi-k2.6", "ref": "moonshotai/kimi-k2.6" }, { "match": "kimi-k2.5", "ref": "moonshotai/kimi-k2.5" }, { "match": "kimi-k2-thinking", "ref": "moonshotai/kimi-k2-thinking" }, { "match": "kimi-k2-0905", "ref": "moonshotai/kimi-k2-0905-preview" }, { "match": "kimi-k2", "ref": "moonshotai/kimi-k2-0905-preview" }, { "match": "k2p6", "ref": "moonshotai/k2p6" }, { "match": "kimi-for-coding", "ref": "moonshotai/kimi-for-coding" }, { "match": "kimi-for-coding-highspeed", "ref": "moonshotai/kimi-for-coding-highspeed" }, { "match": "kimi-k2.7-code", "ref": "moonshotai/kimi-k2.7-code" }, { "match": "kimi-k3", "ref": "moonshotai/kimi-k3" }, { "match": "moonshot-v1-8k", "ref": "moonshotai/moonshot-v1-8k" }, { "match": "moonshot-v1-32k", "ref": "moonshotai/moonshot-v1-32k" }, { "match": "moonshot-v1-128k", "ref": "moonshotai/moonshot-v1-128k" }, { "match": "kimi", "ref": "moonshotai/kimi-k2-0905-preview" }, { "match": "minimax-m2.7-highspeed", "ref": "minimax/MiniMax-M2.7-highspeed" }, { "match": "minimax-m2.7", "ref": "minimax/MiniMax-M2.7" }, { "match": "minimax-m2.5-highspeed", "ref": "minimax/MiniMax-M2.5-highspeed" }, { "match": "minimax-m2.5", "ref": "minimax/MiniMax-M2.5" }, { "match": "minimax-m2.1", "ref": "minimax/MiniMax-M2.1" }, { "match": "minimax-m2", "ref": "minimax/MiniMax-M2" }, { "match": "minimax", "ref": "minimax/MiniMax-M2.7" }, { "match": "mimo-v2.6-pro-ultraspeed", "ref": "xiaomi/mimo-v2.6-pro-ultraspeed" }, { "match": "mimo-v2.6-pro", "ref": "xiaomi/mimo-v2.6-pro" }, { "match": "mimo-v2.6-flash", "ref": "xiaomi/mimo-v2.6-flash" }, { "match": "mimo-v2.5-pro", "ref": "xiaomi/mimo-v2.5-pro" }, { "match": "mimo-v2-pro", "ref": "xiaomi/mimo-v2-pro" }, { "match": "mimo-v2-flash", "ref": "xiaomi/mimo-v2-flash" }, { "match": "mimo", "ref": "xiaomi/mimo-v2-pro" }, { "match": "mistral-large-latest", "ref": "mistral/mistral-large-latest" }, { "match": "mistral-large-2512", "ref": "mistral/mistral-large-2512" }, { "match": "mistral-medium-3-5", "ref": "mistral/mistral-medium-3-5" }, { "match": "ministral-3b-2512", "ref": "mistral/ministral-3b-2512" }, { "match": "ministral-8b-2512", "ref": "mistral/ministral-8b-2512" }, { "match": "ministral-14b-2512", "ref": "mistral/ministral-14b-2512" }, { "match": "mistral-large", "ref": "mistral/mistral-large-latest" }, { "match": "codestral-latest", "ref": "mistral/codestral-latest" }, { "match": "codestral-2508", "ref": "mistral/codestral-2508" }, { "match": "codestral", "ref": "mistral/codestral-latest" }, { "match": "devstral-medium-latest", "ref": "mistral/devstral-medium-latest" }, { "match": "devstral-small-latest", "ref": "mistral/devstral-small-2507" }, { "match": "devstral", "ref": "mistral/devstral-latest" }, { "match": "hy4-preview", "ref": "tencent/hy4-preview" }, { "match": "hy3", "ref": "tencent/hy3" }, { "match": "hy3-preview", "ref": "tencent/hy3-preview" }, { "match": "doubao-seed-evolving", "ref": "volcengine/doubao-seed-evolving" }, { "match": "doubao-seed-2.0-code", "ref": "volcengine/doubao-seed-2.0-code" }, { "match": "doubao-seed-2.0-lite", "ref": "volcengine/doubao-seed-2.0-lite" }, { "match": "doubao-seed-2.0-mini", "ref": "volcengine/doubao-seed-2.0-mini" }, { "match": "doubao-seed-2.0-pro", "ref": "volcengine/doubao-seed-2.0-pro" }, { "match": "doubao-seed-2.1-pro", "ref": "volcengine/doubao-seed-2.1-pro" }, { "match": "doubao-seed-2.1-turbo", "ref": "volcengine/doubao-seed-2.1-turbo" }, { "match": "doubao-seed-code", "ref": "volcengine/doubao-seed-code" }, { "match": "doubao-lite-128k", "ref": "volcengine/doubao-lite-128k" }, { "match": "doubao-pro-128k", "ref": "volcengine/doubao-pro-128k" }, { "match": "step-3.5-flash", "ref": "stepfun/step-3.5-flash" }, { "match": "step-3.7-flash", "ref": "stepfun/step-3.7-flash" }, { "match": "ling-2.6-1t", "ref": "inclusionai/ling-2.6-1t" }, { "match": "ling-2.6-flash", "ref": "inclusionai/ling-2.6-flash" }, { "match": "ling-3.0-flash", "ref": "inclusionai/ling-3.0-flash" }, { "match": "ring-2.6-1t", "ref": "inclusionai/ring-2.6-1t" }, { "match": "longcat-2.0", "ref": "meituan/longcat-2.0" }, { "match": "agnes-2.0-flash", "ref": "sapiens/agnes-2.0-flash" }, { "match": "agnes-2.5-flash", "ref": "sapiens/agnes-2.5-flash" }, { "match": "agnes-2.5-pro", "ref": "sapiens/agnes-2.5-pro" }, { "match": "agnes-2.5-pro-alpha", "ref": "sapiens/agnes-2.5-pro-alpha" }, { "match": "muse-spark-1.1", "ref": "meta/muse-spark-1.1" }, { "match": "composer-2-fast", "ref": "cursor/composer-2" }, { "match": "composer-2.5-fast", "ref": "cursor/composer-2.5" }], "sourceAlias": { "claude": { "auto": "anthropic/claude-sonnet-4-5", "sonnet": "anthropic/claude-sonnet-4-5", "opus": "anthropic/claude-opus-4-6", "haiku": "anthropic/claude-haiku-4-5-20251001" }, "codex": { "auto": "openai/gpt-5.3-codex" }, "gemini": { "auto": "google/gemini-2.5-pro", "pro": "google/gemini-2.5-pro", "flash": "google/gemini-2.5-flash-lite" }, "codebuddy": { "auto": "tencent/hy4-preview" } }, "default": { "input": 1, "output": 5, "cache_read": 0.1, "cache_write": 1.25 } };

// packages/core/src/pricing.ts
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
function resolveOwnDir() {
  const override = process.env.TTU_HOME?.trim();
  return override ? override.replace(/^~/, homedir()) : join(homedir(), ".ttu");
}
function resolveDataDirs() {
  const dirs = [];
  const jusage = resolveDataDir();
  if (existsSync(jusage)) dirs.push(jusage);
  const own = resolveOwnDir();
  if (existsSync(own)) dirs.push(own);
  if (dirs.length === 0) dirs.push(jusage);
  return dirs;
}
var cache = null;
function listQueueFiles(dataDir) {
  const dir = join(dataDir, "queue");
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
function loadBuckets(dirs = resolveDataDirs()) {
  const files = dirs.flatMap(listQueueFiles);
  const { signature, lastModifiedAt } = signatureOf(files);
  if (cache && cache.signature === signature) {
    return { buckets: cache.buckets, lastModifiedAt: cache.lastModifiedAt, dataDirs: dirs };
  }
  const perDir = dirs.map((dir) => {
    const map = /* @__PURE__ */ new Map();
    for (const file of listQueueFiles(dir)) parseFile(file, map);
    return map;
  });
  const ownSources = new Set([...perDir.at(-1).values()].map((b) => b.source));
  const merged = /* @__PURE__ */ new Map();
  perDir.forEach((map, index) => {
    const isOwn = index === perDir.length - 1;
    for (const [key, bucket] of map) {
      if (!isOwn && ownSources.has(bucket.source)) continue;
      merged.set(key, bucket);
    }
  });
  const list = [...merged.values()];
  cache = { signature, buckets: list, lastModifiedAt };
  return { buckets: list, lastModifiedAt, dataDirs: dirs };
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

// packages/core/src/collect/index.ts
import { createHash } from "node:crypto";
import { existsSync as existsSync3, mkdirSync, readdirSync as readdirSync3, readFileSync as readFileSync4, rmSync as rmSync2, statSync as statSync3, writeFileSync } from "node:fs";
import { homedir as homedir7 } from "node:os";
import { join as join8 } from "node:path";

// packages/core/src/collect/claude.ts
import { homedir as homedir2 } from "node:os";
import { join as join3 } from "node:path";

// packages/core/src/collect/common.ts
import { readFileSync as readFileSync3, readdirSync as readdirSync2, statSync as statSync2 } from "node:fs";
import { basename, join as join2 } from "node:path";

// node_modules/.pnpm/fzstd@0.1.1/node_modules/fzstd/esm/index.mjs
var ab = ArrayBuffer;
var u8 = Uint8Array;
var u16 = Uint16Array;
var i16 = Int16Array;
var i32 = Int32Array;
var slc = function(v, s, e) {
  if (u8.prototype.slice)
    return u8.prototype.slice.call(v, s, e);
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  var n = new u8(e - s);
  n.set(v.subarray(s, e));
  return n;
};
var fill = function(v, n, s, e) {
  if (u8.prototype.fill)
    return u8.prototype.fill.call(v, n, s, e);
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  for (; s < e; ++s)
    v[s] = n;
  return v;
};
var cpw = function(v, t, s, e) {
  if (u8.prototype.copyWithin)
    return u8.prototype.copyWithin.call(v, t, s, e);
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  while (s < e) {
    v[t++] = v[s++];
  }
};
var ec = [
  "invalid zstd data",
  "window size too large (>2046MB)",
  "invalid block type",
  "FSE accuracy too high",
  "match distance too far back",
  "unexpected EOF"
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var rb = function(d, b, n) {
  var i = 0, o = 0;
  for (; i < n; ++i)
    o |= d[b++] << (i << 3);
  return o;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var rzfh = function(dat, w) {
  var n3 = dat[0] | dat[1] << 8 | dat[2] << 16;
  if (n3 == 3126568 && dat[3] == 253) {
    var flg = dat[4];
    var ss = flg >> 5 & 1, cc = flg >> 2 & 1, df = flg & 3, fcf = flg >> 6;
    if (flg & 8)
      err(0);
    var bt = 6 - ss;
    var db = df == 3 ? 4 : df;
    var di = rb(dat, bt, db);
    bt += db;
    var fsb = fcf ? 1 << fcf : ss;
    var fss = rb(dat, bt, fsb) + (fcf == 1 && 256);
    var ws = fss;
    if (!ss) {
      var wb = 1 << 10 + (dat[5] >> 3);
      ws = wb + (wb >> 3) * (dat[5] & 7);
    }
    if (ws > 2145386496)
      err(1);
    var buf = new u8((w == 1 ? fss || ws : w ? 0 : ws) + 12);
    buf[0] = 1, buf[4] = 4, buf[8] = 8;
    return {
      b: bt + fsb,
      y: 0,
      l: 0,
      d: di,
      w: w && w != 1 ? w : buf.subarray(12),
      e: ws,
      o: new i32(buf.buffer, 0, 3),
      u: fss,
      c: cc,
      m: Math.min(131072, ws)
    };
  } else if ((n3 >> 4 | dat[3] << 20) == 25481893) {
    return b4(dat, 4) + 8;
  }
  err(0);
};
var msb = function(val) {
  var bits = 0;
  for (; 1 << bits <= val; ++bits)
    ;
  return bits - 1;
};
var rfse = function(dat, bt, mal) {
  var tpos = (bt << 3) + 4;
  var al = (dat[bt] & 15) + 5;
  if (al > mal)
    err(3);
  var sz = 1 << al;
  var probs = sz, sym = -1, re = -1, i = -1, ht = sz;
  var buf = new ab(512 + (sz << 2));
  var freq = new i16(buf, 0, 256);
  var dstate = new u16(buf, 0, 256);
  var nstate = new u16(buf, 512, sz);
  var bb1 = 512 + (sz << 1);
  var syms = new u8(buf, bb1, sz);
  var nbits = new u8(buf, bb1 + sz);
  while (sym < 255 && probs > 0) {
    var bits = msb(probs + 1);
    var cbt = tpos >> 3;
    var msk = (1 << bits + 1) - 1;
    var val = (dat[cbt] | dat[cbt + 1] << 8 | dat[cbt + 2] << 16) >> (tpos & 7) & msk;
    var msk1fb = (1 << bits) - 1;
    var msv = msk - probs - 1;
    var sval = val & msk1fb;
    if (sval < msv)
      tpos += bits, val = sval;
    else {
      tpos += bits + 1;
      if (val > msk1fb)
        val -= msv;
    }
    freq[++sym] = --val;
    if (val == -1) {
      probs += val;
      syms[--ht] = sym;
    } else
      probs -= val;
    if (!val) {
      do {
        var rbt = tpos >> 3;
        re = (dat[rbt] | dat[rbt + 1] << 8) >> (tpos & 7) & 3;
        tpos += 2;
        sym += re;
      } while (re == 3);
    }
  }
  if (sym > 255 || probs)
    err(0);
  var sympos = 0;
  var sstep = (sz >> 1) + (sz >> 3) + 3;
  var smask = sz - 1;
  for (var s = 0; s <= sym; ++s) {
    var sf = freq[s];
    if (sf < 1) {
      dstate[s] = -sf;
      continue;
    }
    for (i = 0; i < sf; ++i) {
      syms[sympos] = s;
      do {
        sympos = sympos + sstep & smask;
      } while (sympos >= ht);
    }
  }
  if (sympos)
    err(0);
  for (i = 0; i < sz; ++i) {
    var ns = dstate[syms[i]]++;
    var nb = nbits[i] = al - msb(ns);
    nstate[i] = (ns << nb) - sz;
  }
  return [tpos + 7 >> 3, {
    b: al,
    s: syms,
    n: nbits,
    t: nstate
  }];
};
var rhu = function(dat, bt) {
  var i = 0, wc = -1;
  var buf = new u8(292), hb = dat[bt];
  var hw = buf.subarray(0, 256);
  var rc = buf.subarray(256, 268);
  var ri = new u16(buf.buffer, 268);
  if (hb < 128) {
    var _a = rfse(dat, bt + 1, 6), ebt = _a[0], fdt = _a[1];
    bt += hb;
    var epos = ebt << 3;
    var lb = dat[bt];
    if (!lb)
      err(0);
    var st1 = 0, st2 = 0, btr1 = fdt.b, btr2 = btr1;
    var fpos = (++bt << 3) - 8 + msb(lb);
    for (; ; ) {
      fpos -= btr1;
      if (fpos < epos)
        break;
      var cbt = fpos >> 3;
      st1 += (dat[cbt] | dat[cbt + 1] << 8) >> (fpos & 7) & (1 << btr1) - 1;
      hw[++wc] = fdt.s[st1];
      fpos -= btr2;
      if (fpos < epos)
        break;
      cbt = fpos >> 3;
      st2 += (dat[cbt] | dat[cbt + 1] << 8) >> (fpos & 7) & (1 << btr2) - 1;
      hw[++wc] = fdt.s[st2];
      btr1 = fdt.n[st1];
      st1 = fdt.t[st1];
      btr2 = fdt.n[st2];
      st2 = fdt.t[st2];
    }
    if (++wc > 255)
      err(0);
  } else {
    wc = hb - 127;
    for (; i < wc; i += 2) {
      var byte = dat[++bt];
      hw[i] = byte >> 4;
      hw[i + 1] = byte & 15;
    }
    ++bt;
  }
  var wes = 0;
  for (i = 0; i < wc; ++i) {
    var wt = hw[i];
    if (wt > 11)
      err(0);
    wes += wt && 1 << wt - 1;
  }
  var mb = msb(wes) + 1;
  var ts = 1 << mb;
  var rem = ts - wes;
  if (rem & rem - 1)
    err(0);
  hw[wc++] = msb(rem) + 1;
  for (i = 0; i < wc; ++i) {
    var wt = hw[i];
    ++rc[hw[i] = wt && mb + 1 - wt];
  }
  var hbuf = new u8(ts << 1);
  var syms = hbuf.subarray(0, ts), nb = hbuf.subarray(ts);
  ri[mb] = 0;
  for (i = mb; i > 0; --i) {
    var pv = ri[i];
    fill(nb, i, pv, ri[i - 1] = pv + rc[i] * (1 << mb - i));
  }
  if (ri[0] != ts)
    err(0);
  for (i = 0; i < wc; ++i) {
    var bits = hw[i];
    if (bits) {
      var code = ri[bits];
      fill(syms, i, code, ri[bits] = code + (1 << mb - bits));
    }
  }
  return [bt, {
    n: nb,
    b: mb,
    s: syms
  }];
};
var dllt = rfse(/* @__PURE__ */ new u8([
  81,
  16,
  99,
  140,
  49,
  198,
  24,
  99,
  12,
  33,
  196,
  24,
  99,
  102,
  102,
  134,
  70,
  146,
  4
]), 0, 6)[1];
var dmlt = rfse(/* @__PURE__ */ new u8([
  33,
  20,
  196,
  24,
  99,
  140,
  33,
  132,
  16,
  66,
  8,
  33,
  132,
  16,
  66,
  8,
  33,
  68,
  68,
  68,
  68,
  68,
  68,
  68,
  68,
  36,
  9
]), 0, 6)[1];
var doct = rfse(/* @__PURE__ */ new u8([
  32,
  132,
  16,
  66,
  102,
  70,
  68,
  68,
  68,
  68,
  36,
  73,
  2
]), 0, 5)[1];
var b2bl = function(b, s) {
  var len = b.length, bl = new i32(len);
  for (var i = 0; i < len; ++i) {
    bl[i] = s;
    s += 1 << b[i];
  }
  return bl;
};
var llb = /* @__PURE__ */ new u8((/* @__PURE__ */ new i32([
  0,
  0,
  0,
  0,
  16843009,
  50528770,
  134678020,
  202050057,
  269422093
])).buffer, 0, 36);
var llbl = /* @__PURE__ */ b2bl(llb, 0);
var mlb = /* @__PURE__ */ new u8((/* @__PURE__ */ new i32([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  16843009,
  50528770,
  117769220,
  185207048,
  252579084,
  16
])).buffer, 0, 53);
var mlbl = /* @__PURE__ */ b2bl(mlb, 3);
var dhu = function(dat, out, hu) {
  var len = dat.length, ss = out.length, lb = dat[len - 1], msk = (1 << hu.b) - 1, eb = -hu.b;
  if (!lb)
    err(0);
  var st = 0, btr = hu.b, pos = (len << 3) - 8 + msb(lb) - btr, i = -1;
  for (; pos > eb && i < ss; ) {
    var cbt = pos >> 3;
    var val = (dat[cbt] | dat[cbt + 1] << 8 | dat[cbt + 2] << 16) >> (pos & 7);
    st = (st << btr | val) & msk;
    out[++i] = hu.s[st];
    pos -= btr = hu.n[st];
  }
  if (pos != eb || i + 1 != ss)
    err(0);
};
var dhu4 = function(dat, out, hu) {
  var bt = 6;
  var ss = out.length, sz1 = ss + 3 >> 2, sz2 = sz1 << 1, sz3 = sz1 + sz2;
  dhu(dat.subarray(bt, bt += dat[0] | dat[1] << 8), out.subarray(0, sz1), hu);
  dhu(dat.subarray(bt, bt += dat[2] | dat[3] << 8), out.subarray(sz1, sz2), hu);
  dhu(dat.subarray(bt, bt += dat[4] | dat[5] << 8), out.subarray(sz2, sz3), hu);
  dhu(dat.subarray(bt), out.subarray(sz3), hu);
};
var rzb = function(dat, st, out) {
  var _a;
  var bt = st.b;
  var b0 = dat[bt], btype = b0 >> 1 & 3;
  st.l = b0 & 1;
  var sz = b0 >> 3 | dat[bt + 1] << 5 | dat[bt + 2] << 13;
  var ebt = (bt += 3) + sz;
  if (btype == 1) {
    if (bt >= dat.length)
      return;
    st.b = bt + 1;
    if (out) {
      fill(out, dat[bt], st.y, st.y += sz);
      return out;
    }
    return fill(new u8(sz), dat[bt]);
  }
  if (ebt > dat.length)
    return;
  if (btype == 0) {
    st.b = ebt;
    if (out) {
      out.set(dat.subarray(bt, ebt), st.y);
      st.y += sz;
      return out;
    }
    return slc(dat, bt, ebt);
  }
  if (btype == 2) {
    var b3 = dat[bt], lbt = b3 & 3, sf = b3 >> 2 & 3;
    var lss = b3 >> 4, lcs = 0, s4 = 0;
    if (lbt < 2) {
      if (sf & 1)
        lss |= dat[++bt] << 4 | (sf & 2 && dat[++bt] << 12);
      else
        lss = b3 >> 3;
    } else {
      s4 = sf;
      if (sf < 2)
        lss |= (dat[++bt] & 63) << 4, lcs = dat[bt] >> 6 | dat[++bt] << 2;
      else if (sf == 2)
        lss |= dat[++bt] << 4 | (dat[++bt] & 3) << 12, lcs = dat[bt] >> 2 | dat[++bt] << 6;
      else
        lss |= dat[++bt] << 4 | (dat[++bt] & 63) << 12, lcs = dat[bt] >> 6 | dat[++bt] << 2 | dat[++bt] << 10;
    }
    ++bt;
    var buf = out ? out.subarray(st.y, st.y + st.m) : new u8(st.m);
    var spl = buf.length - lss;
    if (lbt == 0)
      buf.set(dat.subarray(bt, bt += lss), spl);
    else if (lbt == 1)
      fill(buf, dat[bt++], spl);
    else {
      var hu = st.h;
      if (lbt == 2) {
        var hud = rhu(dat, bt);
        lcs += bt - (bt = hud[0]);
        st.h = hu = hud[1];
      } else if (!hu)
        err(0);
      (s4 ? dhu4 : dhu)(dat.subarray(bt, bt += lcs), buf.subarray(spl), hu);
    }
    var ns = dat[bt++];
    if (ns) {
      if (ns == 255)
        ns = (dat[bt++] | dat[bt++] << 8) + 32512;
      else if (ns > 127)
        ns = ns - 128 << 8 | dat[bt++];
      var scm = dat[bt++];
      if (scm & 3)
        err(0);
      var dts = [dmlt, doct, dllt];
      for (var i = 2; i > -1; --i) {
        var md = scm >> (i << 1) + 2 & 3;
        if (md == 1) {
          var rbuf = new u8([0, 0, dat[bt++]]);
          dts[i] = {
            s: rbuf.subarray(2, 3),
            n: rbuf.subarray(0, 1),
            t: new u16(rbuf.buffer, 0, 1),
            b: 0
          };
        } else if (md == 2) {
          _a = rfse(dat, bt, 9 - (i & 1)), bt = _a[0], dts[i] = _a[1];
        } else if (md == 3) {
          if (!st.t)
            err(0);
          dts[i] = st.t[i];
        }
      }
      var _b = st.t = dts, mlt = _b[0], oct = _b[1], llt = _b[2];
      var lb = dat[ebt - 1];
      if (!lb)
        err(0);
      var spos = (ebt << 3) - 8 + msb(lb) - llt.b, cbt = spos >> 3, oubt = 0;
      var lst = (dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << llt.b) - 1;
      cbt = (spos -= oct.b) >> 3;
      var ost = (dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << oct.b) - 1;
      cbt = (spos -= mlt.b) >> 3;
      var mst = (dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << mlt.b) - 1;
      for (++ns; --ns; ) {
        var llc = llt.s[lst];
        var lbtr = llt.n[lst];
        var mlc = mlt.s[mst];
        var mbtr = mlt.n[mst];
        var ofc = oct.s[ost];
        var obtr = oct.n[ost];
        cbt = (spos -= ofc) >> 3;
        var ofp = 1 << ofc;
        var off = ofp + ((dat[cbt] | dat[cbt + 1] << 8 | dat[cbt + 2] << 16 | dat[cbt + 3] << 24) >>> (spos & 7) & ofp - 1);
        cbt = (spos -= mlb[mlc]) >> 3;
        var ml = mlbl[mlc] + ((dat[cbt] | dat[cbt + 1] << 8 | dat[cbt + 2] << 16) >> (spos & 7) & (1 << mlb[mlc]) - 1);
        cbt = (spos -= llb[llc]) >> 3;
        var ll = llbl[llc] + ((dat[cbt] | dat[cbt + 1] << 8 | dat[cbt + 2] << 16) >> (spos & 7) & (1 << llb[llc]) - 1);
        cbt = (spos -= lbtr) >> 3;
        lst = llt.t[lst] + ((dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << lbtr) - 1);
        cbt = (spos -= mbtr) >> 3;
        mst = mlt.t[mst] + ((dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << mbtr) - 1);
        cbt = (spos -= obtr) >> 3;
        ost = oct.t[ost] + ((dat[cbt] | dat[cbt + 1] << 8) >> (spos & 7) & (1 << obtr) - 1);
        if (off > 3) {
          st.o[2] = st.o[1];
          st.o[1] = st.o[0];
          st.o[0] = off -= 3;
        } else {
          var idx = off - (ll != 0);
          if (idx) {
            off = idx == 3 ? st.o[0] - 1 : st.o[idx];
            if (idx > 1)
              st.o[2] = st.o[1];
            st.o[1] = st.o[0];
            st.o[0] = off;
          } else
            off = st.o[0];
        }
        for (var i = 0; i < ll; ++i) {
          buf[oubt + i] = buf[spl + i];
        }
        oubt += ll, spl += ll;
        var stin = oubt - off;
        if (stin < 0) {
          var len = -stin;
          var bs = st.e + stin;
          if (len > ml)
            len = ml;
          for (var i = 0; i < len; ++i) {
            buf[oubt + i] = st.w[bs + i];
          }
          oubt += len, ml -= len, stin = 0;
        }
        for (var i = 0; i < ml; ++i) {
          buf[oubt + i] = buf[stin + i];
        }
        oubt += ml;
      }
      if (oubt != spl) {
        while (spl < buf.length) {
          buf[oubt++] = buf[spl++];
        }
      } else
        oubt = buf.length;
      if (out)
        st.y += oubt;
      else
        buf = slc(buf, 0, oubt);
    } else if (out) {
      st.y += lss;
      if (spl) {
        for (var i = 0; i < lss; ++i) {
          buf[i] = buf[spl + i];
        }
      }
    } else if (spl)
      buf = slc(buf, spl);
    st.b = ebt;
    return buf;
  }
  err(2);
};
var cct = function(bufs, ol) {
  if (bufs.length == 1)
    return bufs[0];
  var buf = new u8(ol);
  for (var i = 0, b = 0; i < bufs.length; ++i) {
    var chk = bufs[i];
    buf.set(chk, b);
    b += chk.length;
  }
  return buf;
};
function decompress(dat, buf) {
  var bufs = [], nb = +!buf;
  var bt = 0, ol = 0;
  for (; dat.length; ) {
    var st = rzfh(dat, nb || buf);
    if (typeof st == "object") {
      if (nb) {
        buf = null;
        if (st.w.length == st.u) {
          bufs.push(buf = st.w);
          ol += st.u;
        }
      } else {
        bufs.push(buf);
        st.e = 0;
      }
      for (; !st.l; ) {
        var blk = rzb(dat, st, buf);
        if (!blk)
          err(5);
        if (buf)
          st.e = st.y;
        else {
          bufs.push(blk);
          ol += blk.length;
          cpw(st.w, 0, blk.length);
          st.w.set(blk, st.w.length - blk.length);
        }
      }
      bt = st.b + st.c * 4;
    } else
      bt = st;
    dat = dat.subarray(bt);
  }
  return cct(bufs, ol);
}

// packages/core/src/collect/zstd.ts
import * as zlib from "node:zlib";
var ZSTD_MAGIC = 4247762216;
var nativeZstd = zlib.zstdDecompressSync;
function decodeFrame(frame) {
  if (typeof nativeZstd === "function") return nativeZstd(frame).toString("utf8");
  return Buffer.from(decompress(new Uint8Array(frame))).toString("utf8");
}
function frameEnd(buf, start) {
  if (start + 5 > buf.length) return -1;
  if (buf.readUInt32LE(start) !== ZSTD_MAGIC) return -1;
  const desc = buf[start + 4];
  const fcsFlag = desc >> 6 & 3;
  const singleSegment = desc >> 5 & 1;
  const hasChecksum = desc >> 2 & 1;
  const dictFlag = desc & 3;
  let offset = start + 5;
  if (!singleSegment) offset += 1;
  offset += [0, 1, 2, 4][dictFlag];
  offset += fcsFlag === 0 ? singleSegment ? 1 : 0 : [0, 2, 4, 8][fcsFlag];
  if (offset > buf.length) return -1;
  for (; ; ) {
    if (offset + 3 > buf.length) return -1;
    const header = buf[offset] | buf[offset + 1] << 8 | buf[offset + 2] << 16;
    const last = header & 1;
    const type = header >> 1 & 3;
    const size = header >>> 3;
    offset += 3;
    offset += type === 0 ? size : type === 1 ? 1 : size;
    if (offset > buf.length) return -1;
    if (last) break;
  }
  if (hasChecksum) offset += 4;
  return offset > buf.length ? -1 : offset;
}
function decompressZstdFrames(buf) {
  const parts = [];
  let offset = 0;
  while (offset < buf.length) {
    const end = frameEnd(buf, offset);
    if (end < 0) break;
    parts.push(decodeFrame(buf.subarray(offset, end)));
    offset = end;
  }
  return parts.join("");
}

// packages/core/src/collect/common.ts
function toHalfHourStart(iso) {
  if (iso == null) return null;
  const ms = typeof iso === "number" ? iso : Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(Math.floor(ms / (30 * 60 * 1e3)) * 30 * 60 * 1e3);
  return d.toISOString();
}
function walkFiles(dir, match, maxDepth = 6) {
  const out = [];
  const walk = (current, depth) => {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync2(current);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = join2(current, name);
      let st;
      try {
        st = statSync2(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full, depth + 1);
      else if (match(name)) out.push(full);
    }
  };
  walk(dir, 0);
  return out;
}
function readLogText(file) {
  const buf = readFileSync3(file);
  if (file.endsWith(".zstd") || file.endsWith(".zst")) return decompressZstdFrames(buf);
  return buf.toString("utf8");
}
function projectFromCwd(cwd) {
  if (!cwd || typeof cwd !== "string") return "unknown";
  const name = basename(cwd.trim());
  return name || "unknown";
}
function toNonNeg(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function parseJsonLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed[0] !== "{") return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// packages/core/src/collect/claude.ts
var SOURCE = "claude";
var CLAUDE_ROOT = join3(homedir2(), ".claude", "projects");
function listFiles(root = CLAUDE_ROOT) {
  return walkFiles(root, (name) => name.endsWith(".jsonl"));
}
function projectFromDir(file) {
  const parts = file.split("/");
  const index = parts.lastIndexOf("projects");
  const dirName = index >= 0 ? parts[index + 1] : "";
  if (!dirName) return "unknown";
  const segments = dirName.replace(/^-/, "").split("-").filter(Boolean);
  return segments.at(-1) ?? "unknown";
}
function parseFile2(file) {
  const text = readLogText(file);
  const seen = /* @__PURE__ */ new Map();
  for (const line of text.split("\n")) {
    const event = parseJsonLine(line);
    if (!event || event.type !== "assistant") continue;
    const message = event.message;
    const usage = message?.usage;
    if (!usage) continue;
    const hourStart = toHalfHourStart(event.timestamp);
    if (!hourStart) continue;
    const cwd = typeof event.cwd === "string" ? event.cwd : null;
    const project = cwd ? projectFromCwd(cwd) : projectFromDir(file);
    const model = typeof message?.model === "string" ? message.model : "unknown";
    const id = typeof message?.id === "string" ? message.id : `${hourStart}|${model}|${event.timestamp}`;
    seen.set(id, { id, hourStart, model, project, usage });
  }
  const buckets = /* @__PURE__ */ new Map();
  for (const item of seen.values()) {
    const usage = item.usage;
    const input = toNonNeg(usage.input_tokens);
    const output = toNonNeg(usage.output_tokens);
    const cached = toNonNeg(usage.cache_read_input_tokens);
    const cacheWrite = toNonNeg(usage.cache_creation_input_tokens) || toNonNeg(usage.cache_creation?.ephemeral_5m_input_tokens) + toNonNeg(usage.cache_creation?.ephemeral_1h_input_tokens);
    if (input + output + cached + cacheWrite === 0) continue;
    const key = `${item.hourStart}|${item.model}|${item.project}`;
    const bucket = buckets.get(key) ?? {
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
      conversation_count: 0
    };
    bucket.input_tokens += input;
    bucket.output_tokens += output;
    bucket.cached_input_tokens += cached;
    bucket.cache_creation_input_tokens += cacheWrite;
    bucket.total_tokens += input + output + cached + cacheWrite;
    bucket.conversation_count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

// packages/core/src/collect/codex.ts
import { homedir as homedir3 } from "node:os";
import { join as join4 } from "node:path";
var SOURCE2 = "codex";
var CODEX_ROOT = join4(homedir3(), ".codex", "sessions");
function listFiles2(root = CODEX_ROOT) {
  return walkFiles(root, (name) => name.startsWith("rollout-") && name.includes(".jsonl"));
}
function parseFile3(file) {
  const text = readLogText(file);
  const buckets = /* @__PURE__ */ new Map();
  let project = "unknown";
  let model = "unknown";
  for (const line of text.split("\n")) {
    const event = parseJsonLine(line);
    if (!event) continue;
    const payload = event.payload;
    if (!payload) continue;
    if (event.type === "session_meta" || event.type === "turn_context") {
      const cwd = payload.cwd;
      if (typeof cwd === "string" && cwd.trim()) project = projectFromCwd(cwd);
      if (typeof payload.model === "string" && payload.model.trim()) model = payload.model.trim();
      continue;
    }
    if (event.type !== "token_usage_record") continue;
    const usage = payload.usage;
    if (!usage) continue;
    const hourStart = toHalfHourStart(event.timestamp);
    if (!hourStart) continue;
    const cached = toNonNeg(usage.cached_input_tokens ?? usage.cache_read_input_tokens);
    const reasoning = toNonNeg(usage.reasoning_output_tokens);
    const input = Math.max(0, toNonNeg(usage.input_tokens) - cached);
    const output = Math.max(0, toNonNeg(usage.output_tokens) - reasoning);
    const cacheWrite = toNonNeg(usage.cache_creation_input_tokens);
    if (input + output + cached + reasoning + cacheWrite === 0) continue;
    const key = `${hourStart}|${model}|${project}`;
    const bucket = buckets.get(key) ?? {
      hour_start: hourStart,
      source: SOURCE2,
      model,
      project,
      collector: SOURCE2,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      cache_creation_input_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 0,
      conversation_count: 0
    };
    bucket.input_tokens += input;
    bucket.output_tokens += output;
    bucket.cached_input_tokens += cached;
    bucket.cache_creation_input_tokens += cacheWrite;
    bucket.reasoning_output_tokens += reasoning;
    bucket.total_tokens += input + output + cached + reasoning + cacheWrite;
    bucket.conversation_count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

// packages/core/src/collect/dsh.ts
import { homedir as homedir4 } from "node:os";
import { join as join5 } from "node:path";
var SOURCE3 = "dsh";
var DSH_ROOT = join5(homedir4(), ".dsh", "sessions");
function listFiles3(root = DSH_ROOT) {
  return walkFiles(root, (name) => name.includes(".jsonl"));
}
function parseFile4(file) {
  const text = readLogText(file);
  const buckets = /* @__PURE__ */ new Map();
  let project = "unknown";
  let sawSession = false;
  for (const line of text.split("\n")) {
    const event = parseJsonLine(line);
    if (!event) continue;
    if (!sawSession && event.type === "session") {
      sawSession = true;
      project = projectFromCwd(event.cwd);
      continue;
    }
    if (event.type !== "assistant/message") continue;
    const data = event.data;
    const usage = data?.usage;
    if (!usage) continue;
    const message = data?.message;
    const model = typeof message?.source?.model === "string" ? message.source.model : "unknown";
    const hourStart = toHalfHourStart(event.time);
    if (!hourStart) continue;
    const input = toNonNeg(usage.inputTokens);
    const output = toNonNeg(usage.outputTokens);
    const cached = toNonNeg(usage.cacheReadTokens);
    const cacheWrite = toNonNeg(usage.cacheWriteTokens);
    const reasoning = toNonNeg(usage.reasoningTokens);
    if (input + output + cached + cacheWrite + reasoning === 0) continue;
    const key = `${hourStart}|${model}|${project}`;
    const bucket = buckets.get(key) ?? {
      hour_start: hourStart,
      source: SOURCE3,
      model,
      project,
      collector: SOURCE3,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      cache_creation_input_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 0,
      conversation_count: 0
    };
    bucket.input_tokens += input;
    bucket.output_tokens += output;
    bucket.cached_input_tokens += cached;
    bucket.cache_creation_input_tokens += cacheWrite;
    bucket.reasoning_output_tokens += reasoning;
    bucket.total_tokens += input + output + cached + cacheWrite + reasoning;
    bucket.conversation_count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

// packages/core/src/collect/kimi.ts
import { homedir as homedir5 } from "node:os";
import { join as join6 } from "node:path";
var SOURCE4 = "kimi";
function kimiHome() {
  const override = process.env.KIMI_CODE_HOME?.trim();
  return override ? override.replace(/^~/, homedir5()) : join6(homedir5(), ".kimi-code");
}
function listFiles4(home = kimiHome()) {
  return walkFiles(join6(home, "sessions"), (name) => name === "wire.jsonl", 8);
}
function normalizeUsage(usage) {
  if (usage.inputOther != null) {
    return {
      input: toNonNeg(usage.inputOther),
      cached: toNonNeg(usage.inputCacheRead),
      cacheWrite: toNonNeg(usage.inputCacheCreation),
      output: toNonNeg(usage.output)
    };
  }
  if (usage.cache_read_input_tokens != null) {
    return {
      input: toNonNeg(usage.input_tokens),
      cached: toNonNeg(usage.cache_read_input_tokens),
      cacheWrite: toNonNeg(usage.cache_creation_input_tokens),
      output: toNonNeg(usage.output_tokens)
    };
  }
  const cached = toNonNeg(usage.input_tokens_details?.cached_tokens);
  return {
    input: Math.max(0, toNonNeg(usage.input_tokens) - cached),
    cached,
    cacheWrite: toNonNeg(usage.cache_creation_input_tokens),
    output: toNonNeg(usage.output_tokens)
  };
}
function projectFromPath(file) {
  const segments = file.split("/");
  const wd = segments.find((s) => /^wd_.+_[0-9a-f]+$/i.test(s));
  if (wd) {
    const match = /^wd_(.+)_[0-9a-f]+$/i.exec(wd);
    if (match?.[1]) return match[1];
  }
  const sessionsIndex = segments.lastIndexOf("sessions");
  return sessionsIndex >= 0 ? segments[sessionsIndex + 1] ?? "unknown" : "unknown";
}
function parseFile5(file) {
  const buckets = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  const project = projectFromPath(file);
  let model = "kimi";
  for (const line of readLogText(file).split("\n")) {
    const entry = parseJsonLine(line);
    if (!entry) continue;
    if (entry.type === "config.update") {
      const alias = entry.modelAlias;
      if (typeof alias === "string" && alias.trim()) {
        model = alias.includes("/") ? alias.split("/").pop() ?? alias : alias;
      }
      continue;
    }
    const event = entry.type === "context.append_loop_event" && entry.event && typeof entry.event === "object" ? entry.event : entry;
    if (event.type !== "step.end") continue;
    const usage = event.usage;
    if (!usage) continue;
    const uuid = typeof event.uuid === "string" ? event.uuid : null;
    if (uuid && seen.has(uuid)) continue;
    if (uuid) seen.add(uuid);
    const ms = entry.time ?? event.time;
    const hourStart = toHalfHourStart(typeof ms === "number" ? ms : String(ms ?? ""));
    if (!hourStart) continue;
    const { input, cached, cacheWrite, output } = normalizeUsage(usage);
    if (input + cached + cacheWrite + output === 0) continue;
    const key = `${hourStart}|${model}|${project}`;
    const bucket = buckets.get(key) ?? {
      hour_start: hourStart,
      source: SOURCE4,
      model,
      project,
      collector: SOURCE4,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      cache_creation_input_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 0,
      conversation_count: 0
    };
    bucket.input_tokens += input;
    bucket.output_tokens += output;
    bucket.cached_input_tokens += cached;
    bucket.cache_creation_input_tokens += cacheWrite;
    bucket.total_tokens += input + cached + cacheWrite + output;
    bucket.conversation_count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

// packages/core/src/collect/zcode.ts
import { copyFileSync, existsSync as existsSync2, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir as homedir6, tmpdir } from "node:os";
import { basename as basename2, join as join7 } from "node:path";
var SOURCE5 = "zcode";
var require2 = createRequire(import.meta.url);
function zcodeHome() {
  const override = process.env.ZCODE_HOME?.trim();
  return override ? override.replace(/^~/, homedir6()) : join7(homedir6(), ".zcode");
}
function dbPath(home = zcodeHome()) {
  return join7(home, "cli", "db", "db.sqlite");
}
function listFiles5(home = zcodeHome()) {
  const file = dbPath(home);
  return existsSync2(file) ? [file] : [];
}
function loadSqlite() {
  try {
    return require2("node:sqlite");
  } catch (error) {
    if (process.env.TTU_DEBUG) console.error("[zcode] \u52A0\u8F7D node:sqlite \u5931\u8D25:", error);
    return null;
  }
}
function withDb(file, fn) {
  const sqlite = loadSqlite();
  if (!sqlite || !existsSync2(file)) return null;
  const attempt = (path) => {
    let db;
    try {
      db = new sqlite.DatabaseSync(path, { readOnly: true });
      return fn(db);
    } catch (error) {
      if (process.env.TTU_DEBUG) console.error("[zcode] \u8BFB\u53D6\u5931\u8D25:", error);
      return null;
    } finally {
      try {
        db?.close();
      } catch {
      }
    }
  };
  const direct = attempt(file);
  if (direct != null) return direct;
  const tmpDir = mkdtempSync(join7(tmpdir(), "ttu-zcode-"));
  try {
    const copy = join7(tmpDir, "db.sqlite");
    copyFileSync(file, copy);
    return attempt(copy);
  } catch {
    return null;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
function tableExists(db, name) {
  try {
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").all(name);
    return rows.length > 0;
  } catch {
    return false;
  }
}
function toIso(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1e3;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && /^\d+$/.test(value.trim())) {
      const ms = asNumber > 1e12 ? asNumber : asNumber * 1e3;
      return new Date(ms).toISOString();
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
  }
  return null;
}
function projectOf(root) {
  if (typeof root !== "string" || !root.trim()) return "unknown";
  return basename2(root.trim()) || "unknown";
}
function totalsFromTokens(raw) {
  if (!raw || typeof raw !== "object") return null;
  let tokens;
  try {
    tokens = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
  const cache2 = tokens.cache ?? {};
  const totals = {
    input: toNonNeg(tokens.input ?? tokens.input_tokens),
    cached: toNonNeg(cache2.read ?? tokens.cache_read_input_tokens),
    cacheWrite: toNonNeg(cache2.write ?? tokens.cache_creation_input_tokens),
    output: toNonNeg(tokens.output ?? tokens.output_tokens),
    reasoning: toNonNeg(tokens.reasoning ?? tokens.reasoning_output_tokens)
  };
  return totals.input + totals.cached + totals.cacheWrite + totals.output + totals.reasoning === 0 ? null : totals;
}
function parseFromUsageTable(db) {
  const rows = db.prepare(
    `SELECT
         u.id AS id,
         u.model_id AS model,
         u.started_at AS startedAt,
         u.input_tokens AS inputTokens,
         u.output_tokens AS outputTokens,
         u.reasoning_tokens AS reasoningTokens,
         u.cache_creation_input_tokens AS cacheWrite,
         u.cache_read_input_tokens AS cacheRead,
         u.computed_total_tokens AS total,
         json_extract(m.data, '$.path.root') AS rootPath
       FROM model_usage u
       LEFT JOIN message m ON m.id = u.assistant_message_id
       WHERE u.computed_total_tokens > 0`
  ).all();
  const out = [];
  for (const row of rows) {
    const hourStart = toHalfHourStart(toIso(row.startedAt));
    if (!hourStart) continue;
    const totals = {
      input: toNonNeg(row.inputTokens),
      cached: toNonNeg(row.cacheRead),
      cacheWrite: toNonNeg(row.cacheWrite),
      output: toNonNeg(row.outputTokens),
      reasoning: toNonNeg(row.reasoningTokens)
    };
    if (totals.input + totals.cached + totals.cacheWrite + totals.output + totals.reasoning === 0) continue;
    out.push({
      id: String(row.id ?? `${hourStart}-${out.length}`),
      model: typeof row.model === "string" && row.model ? row.model : "glm",
      project: projectOf(row.rootPath),
      hourStart,
      totals
    });
  }
  return out;
}
function parseFromMessageTable(db) {
  const rows = db.prepare(
    `SELECT
         id AS id,
         json_extract(data, '$.time.created') AS created,
         json_extract(data, '$.modelID') AS modelID,
         json_extract(data, '$.model') AS model,
         json_extract(data, '$.tokens') AS tokens,
         json_extract(data, '$.path.root') AS rootPath
       FROM message
       WHERE json_extract(data, '$.role') = 'assistant'`
  ).all();
  const out = [];
  for (const row of rows) {
    const hourStart = toHalfHourStart(toIso(row.created));
    if (!hourStart) continue;
    const totals = totalsFromTokens(row.tokens);
    if (!totals) continue;
    const model = typeof row.modelID === "string" && row.modelID ? row.modelID : typeof row.model === "string" && row.model ? row.model : "glm";
    out.push({
      id: String(row.id ?? `${hourStart}-${out.length}`),
      model,
      project: projectOf(row.rootPath),
      hourStart,
      totals
    });
  }
  return out;
}
function parseFile6(file) {
  const rows = withDb(file, (db) => {
    if (tableExists(db, "model_usage")) {
      const fromUsage = parseFromUsageTable(db);
      if (fromUsage.length > 0) return fromUsage;
    }
    return tableExists(db, "message") ? parseFromMessageTable(db) : [];
  });
  if (!rows) return [];
  const buckets = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const key = `${row.hourStart}|${row.model}|${row.project}`;
    const bucket = buckets.get(key) ?? {
      hour_start: row.hourStart,
      source: SOURCE5,
      model: row.model,
      project: row.project,
      collector: SOURCE5,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      cache_creation_input_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: 0,
      conversation_count: 0
    };
    bucket.input_tokens += row.totals.input;
    bucket.output_tokens += row.totals.output;
    bucket.cached_input_tokens += row.totals.cached;
    bucket.cache_creation_input_tokens += row.totals.cacheWrite;
    bucket.reasoning_output_tokens += row.totals.reasoning;
    bucket.total_tokens += row.totals.input + row.totals.cached + row.totals.cacheWrite + row.totals.output + row.totals.reasoning;
    bucket.conversation_count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

// packages/core/src/collect/index.ts
var SOURCES = [
  { name: SOURCE3, list: listFiles3, parse: parseFile4 },
  { name: SOURCE2, list: listFiles2, parse: parseFile3 },
  { name: SOURCE, list: listFiles, parse: parseFile2 },
  { name: SOURCE4, list: listFiles4, parse: parseFile5 },
  { name: SOURCE5, list: listFiles5, parse: parseFile6 }
];
function collectHome() {
  const override = process.env.TTU_HOME?.trim();
  return override ? override.replace(/^~/, homedir7()) : join8(homedir7(), ".ttu");
}
function cachePath(home, file) {
  const hash = createHash("sha1").update(file).digest("hex").slice(0, 16);
  return join8(home, "collect", `${hash}.json`);
}
function readCache(file) {
  try {
    return JSON.parse(readFileSync4(file, "utf8"));
  } catch {
    return null;
  }
}
function tokensOf(bucket) {
  return bucket.input_tokens + bucket.output_tokens + bucket.cached_input_tokens + bucket.cache_creation_input_tokens + bucket.reasoning_output_tokens;
}
function collectAll(options = {}) {
  const home = collectHome();
  const cacheDir = join8(home, "collect");
  mkdirSync(cacheDir, { recursive: true });
  const all = [];
  const bySource = {};
  let scanned = 0;
  let parsed = 0;
  let skipped = 0;
  let failed = 0;
  let firstError = null;
  for (const source of SOURCES) {
    let files = [];
    try {
      files = source.list();
    } catch {
      files = [];
    }
    const stat = { files: 0, buckets: 0, tokens: 0, failed: 0 };
    for (const file of files) {
      scanned += 1;
      let info;
      try {
        info = statSync3(file);
      } catch {
        continue;
      }
      const cacheFile = cachePath(home, file);
      const cached = readCache(cacheFile);
      let buckets;
      if (!options.force && cached && cached.inode === info.ino && cached.size === info.size && cached.mtimeMs === info.mtimeMs) {
        buckets = cached.buckets;
        skipped += 1;
      } else {
        try {
          buckets = source.parse(file);
        } catch (error) {
          failed += 1;
          stat.failed += 1;
          if (!firstError) firstError = error instanceof Error ? error.message : String(error);
          continue;
        }
        parsed += 1;
        writeFileSync(
          cacheFile,
          JSON.stringify({ path: file, inode: info.ino, size: info.size, mtimeMs: info.mtimeMs, buckets })
        );
      }
      stat.files += 1;
      stat.buckets += buckets.length;
      for (const bucket of buckets) {
        stat.tokens += tokensOf(bucket);
        all.push(bucket);
      }
    }
    bySource[source.name] = stat;
  }
  const queueFiles = writeQueue(home, mergeBuckets(all));
  pruneCache(cacheDir, scanned);
  return { scanned, parsed, skipped, failed, firstError, buckets: all, bySource, queueFiles, home };
}
function mergeBuckets(list) {
  const merged = /* @__PURE__ */ new Map();
  for (const bucket of list) {
    const key = bucketKey(bucket);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...bucket });
      continue;
    }
    existing.input_tokens += bucket.input_tokens;
    existing.output_tokens += bucket.output_tokens;
    existing.cached_input_tokens += bucket.cached_input_tokens;
    existing.cache_creation_input_tokens += bucket.cache_creation_input_tokens;
    existing.reasoning_output_tokens += bucket.reasoning_output_tokens;
    existing.total_tokens += bucket.total_tokens;
    existing.conversation_count += bucket.conversation_count;
  }
  return [...merged.values()];
}
function writeQueue(home, buckets) {
  const dir = join8(home, "queue");
  mkdirSync(dir, { recursive: true });
  const months = /* @__PURE__ */ new Map();
  for (const bucket of buckets) {
    const month = bucket.hour_start.slice(0, 7);
    const list = months.get(month) ?? [];
    list.push(bucket);
    months.set(month, list);
  }
  const written = [];
  for (const [month, list] of months) {
    list.sort((a, b) => a.hour_start.localeCompare(b.hour_start));
    const file = join8(dir, `${month}.jsonl`);
    writeFileSync(file, `${list.map((b) => JSON.stringify(b)).join("\n")}
`);
    written.push(file);
  }
  if (existsSync3(dir)) {
    for (const name of readdirSync3(dir)) {
      if (!name.endsWith(".jsonl")) continue;
      if (!months.has(name.slice(0, 7))) rmSync2(join8(dir, name), { force: true });
    }
  }
  return written;
}
function pruneCache(cacheDir, _scanned) {
  if (!existsSync3(cacheDir)) return;
  const now = Date.now();
  for (const name of readdirSync3(cacheDir)) {
    const full = join8(cacheDir, name);
    try {
      const cached = readCache(full);
      if (!cached) continue;
      if (!existsSync3(cached.path)) rmSync2(full, { force: true });
      else if (now - statSync3(full).mtimeMs > 180 * 24 * 3600 * 1e3) rmSync2(full, { force: true });
    } catch {
      rmSync2(full, { force: true });
    }
  }
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
  const file = join9(dataDir, "pricing-overlay.json");
  try {
    const mtimeMs = statSync4(file).mtimeMs;
    if (pricingCache && pricingCache.mtimeMs === mtimeMs) return pricingCache.data;
    const data = loadPricingFromFile(file);
    pricingCache = { mtimeMs, data };
    return data;
  } catch {
    return pricingCache?.data ?? BUILTIN_PRICING;
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
  const { buckets, lastModifiedAt } = loadBuckets();
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
          dataDirs: resolveDataDirs(),
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
  const target = normalize2(join9(WEB_DIST, decoded === "/" ? "/index.html" : decoded));
  if (!target.startsWith(normalize2(WEB_DIST))) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  const file = existsSync4(target) && statSync4(target).isFile() ? target : join9(WEB_DIST, "index.html");
  if (!existsSync4(file)) {
    res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
    res.end("\u524D\u7AEF\u672A\u6784\u5EFA\u3002\u5148\u8FD0\u884C: pnpm --filter @ttu/web build");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}
if (process.env.TTU_SYNC === "1") {
  const started = Date.now();
  const result = collectAll({ force: process.env.TTU_FORCE_SYNC === "1" });
  const parts = Object.entries(result.bySource).filter(([, v]) => v.files > 0).map(([name, v]) => `${name} ${v.files} \u4E2A\u6587\u4EF6/${v.buckets} \u4E2A\u6876`);
  console.log(
    `\u91C7\u96C6\u5B8C\u6210: \u626B\u63CF ${result.scanned} \u4E2A\u6587\u4EF6\uFF08\u89E3\u6790 ${result.parsed}\uFF0C\u547D\u4E2D\u7F13\u5B58 ${result.skipped}\uFF09\uFF0C${result.buckets.length} \u4E2A\u6876\uFF0C\u7528\u65F6 ${Date.now() - started}ms`
  );
  if (parts.length > 0) console.log(`  ${parts.join(" \xB7 ")}`);
  if (result.failed > 0) {
    console.warn(`  \u26A0 ${result.failed} \u4E2A\u6587\u4EF6\u89E3\u6790\u5931\u8D25\uFF1A${result.firstError ?? "\u672A\u77E5\u539F\u56E0"}`);
    console.warn("    \uFF08\u591A\u6570\u662F Node \u7248\u672C\u8FC7\u4F4E\uFF1Azstd \u9700\u8981 >= 22.15\uFF09");
  }
  console.log(`  \u8F93\u51FA: ${result.queueFiles.join(", ") || "\uFF08\u65E0\u6570\u636E\uFF09"}`);
  if (process.env.TTU_SYNC_ONLY === "1") process.exit(0);
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
  console.log(`\u6570\u636E\u76EE\u5F55: ${resolveDataDirs().join(" + ")}`);
});
