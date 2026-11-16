#!/usr/bin/env node
/**
 * ttu —— 一条命令拉起本机 Token 用量看板。
 *
 *   npx -y github:devtalkbox/teamwork-token-usage#v0.3.0
 *
 * 这个入口刻意写得极薄：真正的服务端在发布前已被 esbuild 打成 `bundle/server.mjs`，
 * 前端静态文件在 `bundle/web/`。所以安装时不需要任何依赖、也不需要构建。
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BUNDLE = join(ROOT, 'bundle')

const raw = process.argv.slice(2)
const command = raw[0] && !raw[0].startsWith('-') ? raw[0] : 'serve'
const args = raw[0] === command && !raw[0].startsWith('-') ? raw.slice(1) : raw

function flag(name, fallback) {
  const index = args.indexOf(`--${name}`)
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1]
  const inline = args.find((a) => a.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  return fallback
}

if (args.includes('--help') || args.includes('-h') || command === 'help') {
  console.log(`ttu —— 本机 Token 用量看板

用法:
  ttu [serve] [--port 8460] [--host 127.0.0.1] [--open] [--no-sync]
      采集一次后启动看板

  ttu sync [--force]
      只采集，不启动服务

选项:
  --port     监听端口，默认 8460
  --host     监听地址，默认 127.0.0.1
  --open     启动后自动打开浏览器
  --no-sync  启动时不采集，只读已有数据
  --force    忽略文件指纹，强制重扫

数据来源（自动扫描，无需 jusage）:
  ~/.dsh/sessions         DeepSeek Harness
  ~/.codex/sessions       Codex
  ~/.claude/projects      Claude Code
  产出写到 ~/.ttu/queue/*.jsonl
`)
  process.exit(0)
}

if (!existsSync(join(BUNDLE, 'server.mjs'))) {
  console.error('✗ 打包产物缺失：bundle/server.mjs\n  仓库维护者请先运行 pnpm bundle')
  process.exit(1)
}

const port = Number(flag('port', process.env.PORT ?? 8460))
process.env.PORT = String(port)
process.env.HOST = flag('host', process.env.HOST ?? '127.0.0.1')
process.env.TTU_WEB_DIST = join(BUNDLE, 'web')

if (command === 'sync') {
  process.env.TTU_SYNC = '1'
  process.env.TTU_SYNC_ONLY = '1'
  if (args.includes('--force')) process.env.TTU_FORCE_SYNC = '1'
} else if (command === 'serve' && !args.includes('--no-sync')) {
  process.env.TTU_SYNC = '1'
}

if (args.includes('--open')) {
  setTimeout(() => {
    const url = `http://${process.env.HOST}:${port}/dashboard`
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
    spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref()
  }, 600)
}

await import(join(BUNDLE, 'server.mjs'))
