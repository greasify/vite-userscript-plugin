import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { build } from 'vite'
import { afterEach, expect, it } from 'vitest'
import Userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))
const outDirs: string[] = []

afterEach(async () => {
  await Promise.all(outDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function buildUserscript(name: string, plugins: Parameters<typeof Userscript>[0]) {
  const root = join(fixtures, name)
  const outDir = await mkdtemp(join(tmpdir(), `userscript-${name}-`))
  outDirs.push(outDir)

  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [Userscript(plugins)],
    build: {
      outDir,
      emptyOutDir: true,
      write: true,
      minify: true,
    },
  })

  return outDir
}

function readAttrs(source: string) {
  const attrs: Record<string, string> = {}
  const document = {
    body: {
      setAttribute: (name: string, value: string) => {
        attrs[name] = value
      },
    },
    createElement: () => ({ style: {} }),
    head: { appendChild() {} },
    documentElement: { appendChild() {} },
  }

  runInNewContext(source, { document, console })
  return attrs
}

it('minified virtual module shared with an html page stays a classic script', async () => {
  const outDir = await buildUserscript('virtual-module', {
    entry: 'src/main.ts',
    fileName: 'spaces-plus',
    header: {
      name: 'Spaces+',
      version: '3.2.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = await readFile(join(outDir, 'spaces-plus.user.js'), 'utf8')

  expect(userscript).not.toMatch(/\b(?:import|export)\b/)
  expect(readAttrs(userscript)['data-name']).toBe('Spaces+')
})

it('minified helper shared with an html page keeps the renamed binding', async () => {
  const outDir = await buildUserscript('shared-page', {
    entry: 'src/main.ts',
    fileName: 'shared-page',
    header: {
      name: 'Shared page',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = await readFile(join(outDir, 'shared-page.user.js'), 'utf8')
  const files = (await readdir(outDir, { recursive: true })).map(String)
  const pageSources = await Promise.all(
    files
      .filter(file => file.endsWith('.js') && !file.endsWith('.user.js') && !file.endsWith('.meta.js'))
      .map(file => readFile(join(outDir, file), 'utf8')),
  )

  expect(userscript).not.toMatch(/\b(?:import|export)\b/)
  expect(readAttrs(userscript)['data-version']).toBe('v4.0.0')
  expect(pageSources.join('\n')).toContain('page')
})
