import { access, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))
const outDirs: string[] = []

async function waitForFile(path: string, timeout = 15_000): Promise<void> {
  const start = Date.now()

  while (Date.now() - start < timeout) {
    try {
      await access(path)
      return
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  throw new Error(`Timed out waiting for ${path}`)
}

it('serve + server.file writes a proxy to outDir and does not serve HMR', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'userscript-file-serve-'))
  outDirs.push(outDir)

  const server = await createServer({
    root: join(fixtures, 'vanilla'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      userscript({
        entry: 'src/main.ts',
        fileName: 'vanilla',
        header: {
          name: 'Vanilla',
          version: '1.0.0',
          match: 'https://example.com/*',
        },
        server: { file: true },
      }),
    ],
    build: {
      outDir,
      emptyOutDir: true,
      write: true,
    },
  })

  try {
    await server.listen()
    const origin = server.resolvedUrls?.local[0]
    expect(origin).toBeTruthy()

    await waitForFile(join(outDir, 'vanilla.user.js'))

    const proxy = await readFile(join(outDir, 'vanilla.proxy.user.js'), 'utf8')
    const iife = await readFile(join(outDir, 'vanilla.js'), 'utf8')
    const userscript = await readFile(join(outDir, 'vanilla.user.js'), 'utf8')
    const install = await fetch(new URL('/vanilla.user.js', origin))
    const proxyInstall = await fetch(new URL('/vanilla.proxy.user.js', origin))
    const hmr = await fetch(new URL('/vanilla.dev.user.js', origin))
    const virtual = await server.transformRequest('virtual:vite-userscript-plugin')

    const files = (await readdir(outDir)).map(String)

    expect(proxy).toContain('==UserScript==')
    expect(proxy).toContain('file://')
    expect(proxy).toContain('vanilla.js')
    expect(iife).toContain('userscript-fixture')
    expect(iife).not.toContain('==UserScript==')
    expect(userscript).toContain('==UserScript==')
    expect(userscript).toContain('userscript-fixture')
    expect(userscript).not.toContain('file://')
    expect(files).toContain('vanilla.js')
    expect(files).toContain('vanilla.proxy.user.js')
    expect(files).toContain('vanilla.user.js')
    expect(files).not.toContain('vanilla.meta.js')
    expect(install.status).toBe(200)
    expect(install.headers.get('content-type')).toContain('text/javascript')
    expect(install.headers.get('cache-control')).toBe('no-store')
    const installBody = await install.text()
    expect(installBody).toContain('==UserScript==')
    expect(installBody).toContain('userscript-fixture')
    expect(installBody).not.toContain('file://')
    expect(proxyInstall.status).toBe(200)
    expect(await proxyInstall.text()).toContain('file://')
    expect(hmr.status).toBe(404)
    expect(virtual?.code).toContain('"file":"vanilla.user.js"')
    expect(virtual?.code).not.toContain('.dev.user.js')
  } finally {
    await server.close()
    await Promise.all(outDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
  }
}, 20_000)
