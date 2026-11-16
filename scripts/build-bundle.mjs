#!/usr/bin/env node
/**
 * 发布前打包：把 TS 服务端 + 依赖打成单文件，并把前端产物一起放进 bundle/。
 *
 * 为什么要打包而不是让 npm 现场构建：
 *   `npx github:` 装的是「仓库根包」，npm 不认 pnpm 的 workspace:*，
 *   现场的 vite 构建会直接失败。打成纯 JS 后，安装零依赖、零构建。
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BUNDLE = join(ROOT, 'bundle')
const WEB_DIST = join(ROOT, 'apps/web/dist')

if (!existsSync(WEB_DIST)) {
  console.error('✗ apps/web/dist 不存在，先运行: pnpm --filter @ttu/web build')
  process.exit(1)
}

rmSync(BUNDLE, { recursive: true, force: true })
mkdirSync(BUNDLE, { recursive: true })

await build({
  entryPoints: [join(ROOT, 'apps/server/src/index.ts')],
  outfile: join(BUNDLE, 'server.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  alias: {
    '@ttu/core': join(ROOT, 'packages/core/src/index.ts'),
  },
  banner: {
    js: '// 由 scripts/build-bundle.mjs 生成，勿手改。源码见 apps/server 与 packages/core。',
  },
  logLevel: 'warning',
})

cpSync(WEB_DIST, join(BUNDLE, 'web'), { recursive: true })

console.log(`✓ bundle/server.mjs + bundle/web 已生成（${ROOT}）`)
