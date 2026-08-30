import type { UserscriptPluginConfig } from '../src/types.js'
import { Buffer } from 'node:buffer'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import vue from '@vitejs/plugin-vue'
import { build } from 'vite'

import { afterEach, expect, it } from 'vitest'
import Userscript from '../src/index.js'
import { countHeaderLines } from '../src/sourcemap.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))
const outDirs: string[] = []

afterEach(async () => {
  await Promise.all(outDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function buildFixture(name: string, plugin: UserscriptPluginConfig, options: {
  plugins?: import('vite').PluginOption[]
  minify?: boolean | 'oxc' | 'terser'
  sourcemap?: boolean
} = {}) {
  const root = join(fixtures, name)
  const outDir = await mkdtemp(join(tmpdir(), `userscript-${name}-`))
  outDirs.push(outDir)

  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [...(options.plugins ?? []), Userscript(plugin)],
    build: {
      outDir,
      emptyOutDir: true,
      write: true,
      sourcemap: options.sourcemap,
      minify: options.minify,
    },
  })

  return outDir
}

function readOut(outDir: string, fileName: string) {
  return readFile(join(outDir, fileName), 'utf8')
}

async function listOut(outDir: string) {
  return (await readdir(outDir, { recursive: true })).map(String)
}

function leftoverScripts(files: string[]) {
  return files.filter((file) => {
    return file.endsWith('.js')
      && !file.endsWith('.user.js')
      && !file.endsWith('.meta.js')
  })
}

it('vanilla CSS is inlined into an unminified userscript', async () => {
  const outDir = await buildFixture('vanilla', {
    entry: 'src/main.ts',
    fileName: 'vanilla',
    header: {
      name: 'Vanilla',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = await readOut(outDir, 'vanilla.user.js')
  const meta = await readOut(outDir, 'vanilla.meta.js')

  expect(userscript).toContain('==UserScript==')
  expect(userscript).toContain('@name')
  expect(userscript).toContain('userscript-fixture')
  expect(userscript).toMatch(/GM_addStyle|__vite_style__/)
  expect(userscript).toContain('data-userscript')
  expect(meta).toContain('==UserScript==')
  expect(meta).not.toContain('userscript-fixture')
  expect((await listOut(outDir)).filter(file => file.endsWith('.css'))).toEqual([])
})

it('explicit minify still keeps the metablock', async () => {
  const outDir = await buildFixture(
    'vanilla',
    {
      entry: 'src/main.ts',
      fileName: 'vanilla',
      header: {
        name: 'Vanilla',
        version: '1.0.0',
        match: 'https://example.com/*',
      },
    },
    { minify: true },
  )

  const userscript = await readOut(outDir, 'vanilla.user.js')
  expect(userscript.startsWith('// ==UserScript==')).toBe(true)
  expect(userscript).toContain('userscript-fixture')
  expect(userscript).not.toContain('export const hello')
})

function parseInlineSourceMap(userscript: string) {
  const match = userscript.match(/\/\/[#@]\s*sourceMappingURL=data:application\/json;charset=utf-8;base64,(\S+)/)
  expect(match?.[1]).toBeTruthy()
  return JSON.parse(Buffer.from(match![1]!, 'base64').toString('utf8')) as {
    file?: string
    mappings: string
    sources: string[]
    sourcesContent?: (string | null)[]
  }
}

it('sourcemap is inlined into the userscript', async () => {
  const outDir = await buildFixture(
    'vanilla',
    {
      entry: 'src/main.ts',
      fileName: 'vanilla',
      header: {
        name: 'Vanilla',
        version: '1.0.0',
        match: 'https://example.com/*',
      },
    },
    { sourcemap: true },
  )

  const userscript = await readOut(outDir, 'vanilla.user.js')
  const map = parseInlineSourceMap(userscript)

  expect(userscript).toContain('//# sourceMappingURL=data:application/json')
  expect(map.file).toBe('vanilla.user.js')
  expect(map.sources.some(source => source.includes('main'))).toBe(true)
  const iifeAt = userscript.search(/^\((?:async )?function/m)
  expect(iifeAt).toBeGreaterThan(-1)
  expect(map.mappings.startsWith(';'.repeat(countHeaderLines(userscript.slice(0, iifeAt))))).toBe(true)
  expect((userscript.match(/sourceMappingURL=/g) ?? []).length).toBe(1)
  expect(userscript.lastIndexOf('sourceMappingURL=')).toBeGreaterThan(userscript.lastIndexOf('})();'))
  expect((await listOut(outDir)).filter(file => file.endsWith('.map'))).toEqual([])
})

it('top-level await wraps in an async IIFE', async () => {
  const name = 'top-level-await'
  const outDir = await buildFixture(name, {
    entry: 'src/main.ts',
    fileName: name,
    header: {
      name,
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = await readOut(outDir, `${name}.user.js`)
  expect(userscript).toContain('(async function')
  expect(userscript).toContain('await')
  expect(userscript).toContain('ok')
  expect(userscript).not.toMatch(/\bimport\s/)
})

it('multiple entries emit two userscripts', async () => {
  const outDir = await buildFixture('multiple-entries', [
    {
      entry: 'src/foo.ts',
      fileName: 'foo',
      header: {
        name: 'Foo',
        version: '1.0.0',
        match: 'https://foo.example/*',
      },
    },
    {
      entry: 'src/bar.ts',
      fileName: 'bar',
      header: {
        name: 'Bar',
        version: '1.0.0',
        match: 'https://bar.example/*',
      },
    },
  ])

  const foo = await readOut(outDir, 'foo.user.js')
  const bar = await readOut(outDir, 'bar.user.js')

  expect(foo).toMatch(/@name\s+Foo/)
  expect(foo).toContain('https://foo.example/*')
  expect(foo).toContain('shared-helper')
  expect(foo).toContain('shared-css-fixture')
  expect(foo).toContain('teal')
  expect(foo).not.toMatch(/\bimport\s/)
  expect(bar).toMatch(/@name\s+Bar/)
  expect(bar).toContain('https://bar.example/*')
  expect(bar).toContain('shared-helper')
  expect(bar).toContain('shared-css-fixture')
  expect(bar).not.toMatch(/\bimport\s/)
  expect(await readOut(outDir, 'foo.meta.js')).toMatch(/@name\s+Foo/)
  expect(await readOut(outDir, 'bar.meta.js')).toMatch(/@name\s+Bar/)
  expect((await listOut(outDir)).filter(file => file.endsWith('.css'))).toEqual([])
  expect(leftoverScripts(await listOut(outDir))).toEqual([])
})

it('multiple entries keep a single sourceMappingURL after the IIFE', async () => {
  const outDir = await buildFixture(
    'multiple-entries',
    [
      {
        entry: 'src/foo.ts',
        fileName: 'foo',
        header: {
          name: 'Foo',
          version: '1.0.0',
          match: 'https://foo.example/*',
        },
      },
      {
        entry: 'src/bar.ts',
        fileName: 'bar',
        header: {
          name: 'Bar',
          version: '1.0.0',
          match: 'https://bar.example/*',
        },
      },
    ],
    { sourcemap: true },
  )

  const userscript = await readOut(outDir, 'foo.user.js')
  expect((userscript.match(/sourceMappingURL=/g) ?? []).length).toBe(1)
  expect(userscript.lastIndexOf('sourceMappingURL=')).toBeGreaterThan(userscript.lastIndexOf('})();'))
  expect((await listOut(outDir)).filter(file => file.endsWith('.map'))).toEqual([])
})

it('grant none is preserved and CSS grant is not added', async () => {
  const outDir = await buildFixture('grant-none', {
    entry: 'src/main.ts',
    fileName: 'none',
    header: {
      name: 'None',
      version: '1.0.0',
      match: 'https://example.com/*',
      grant: 'none',
    },
  })

  const userscript = await readOut(outDir, 'none.user.js')
  expect(userscript).toMatch(/@grant\s+none/)
  expect(userscript).not.toContain('GM_addStyle')
})

it('grant none with CSS keeps the none grant and still inlines styles', async () => {
  const outDir = await buildFixture('vanilla', {
    entry: 'src/main.ts',
    fileName: 'none-css',
    header: {
      name: 'None CSS',
      version: '1.0.0',
      match: 'https://example.com/*',
      grant: 'none',
    },
  })

  const userscript = await readOut(outDir, 'none-css.user.js')
  expect(userscript).toMatch(/@grant\s+none/)
  expect(userscript).not.toMatch(/@grant\s+GM_addStyle/)
  expect(userscript).toContain('userscript-fixture')
})

it('imported images are inlined as data URLs', async () => {
  const outDir = await buildFixture('asset', {
    entry: 'src/main.ts',
    fileName: 'asset',
    header: {
      name: 'Asset',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = await readOut(outDir, 'asset.user.js')
  expect(userscript).toContain('data:image/png')
  expect(userscript).not.toMatch(/\/assets\/.+\.png/)
})

it('vue sourcemap keeps app sourcesContent and drops node_modules', async () => {
  const outDir = await buildFixture(
    'vue',
    {
      entry: 'src/main.ts',
      fileName: 'vue',
      header: {
        name: 'Vue',
        version: '1.0.0',
        match: 'https://example.com/*',
      },
    },
    { plugins: [vue()], sourcemap: true },
  )

  const map = parseInlineSourceMap(await readOut(outDir, 'vue.user.js'))
  const contents = map.sourcesContent ?? []

  expect(map.sources.some(source => source.includes('node_modules'))).toBe(true)
  expect(contents).toHaveLength(map.sources.length)

  for (const [index, source] of map.sources.entries()) {
    if (source.includes('node_modules') || source.includes('\0') || source.startsWith('virtual:')) {
      expect(contents[index]).toBeNull()
    }
  }

  const appSources = map.sources.flatMap((source, index) => (
    source.includes('main') || source.includes('.vue')
      ? [{ source, content: contents[index] }]
      : []
  ))

  expect(appSources.length).toBeGreaterThan(0)
  expect(appSources.every(({ content }) => typeof content === 'string' && content.length > 0)).toBe(true)
})

it('vue SFC styles are inlined', async () => {
  const outDir = await buildFixture(
    'vue',
    {
      entry: 'src/main.ts',
      fileName: 'vue',
      header: {
        name: 'Vue',
        version: '1.0.0',
        match: 'https://example.com/*',
      },
    },
    { plugins: [vue()] },
  )

  const userscript = await readOut(outDir, 'vue.user.js')
  expect(userscript).toContain('vue-fixture')
  expect(userscript).toContain('rebeccapurple')
})

it('html app is emitted next to the userscript', async () => {
  const outDir = await buildFixture('html', {
    entry: 'src/main.ts',
    fileName: 'html-app',
    header: {
      name: 'HTML App',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const files = await listOut(outDir)
  const userscript = await readOut(outDir, 'html-app.user.js')
  const html = await readOut(outDir, 'index.html')
  const pageOutputs = await Promise.all(
    leftoverScripts(files)
      .concat(files.filter(file => file.endsWith('.css')))
      .map(file => readOut(outDir, file)),
  )

  expect(html).toMatch(/<script type="module"/)
  expect(pageOutputs.some(content => content.includes('html-page-fixture'))).toBe(true)
  expect(pageOutputs.some(content => content.includes('navy'))).toBe(true)
  expect(userscript).toContain('html-userscript-fixture')
  expect(userscript).toContain('tomato')
  expect(userscript).not.toContain('html-page-fixture')
  expect(userscript).not.toContain('navy')
  expect(await readOut(outDir, 'html-app.meta.js')).toMatch(/@name\s+HTML App/)
  expect(files).not.toContain('html-app.js')
  expect(leftoverScripts(files).length).toBeGreaterThan(0)
})

it('svelte SFC styles are inlined', async () => {
  const outDir = await buildFixture(
    'svelte',
    {
      entry: 'src/main.ts',
      fileName: 'svelte',
      header: {
        name: 'Svelte',
        version: '1.0.0',
        match: 'https://example.com/*',
      },
    },
    { plugins: [svelte()] },
  )

  const userscript = await readOut(outDir, 'svelte.user.js')
  expect(userscript).toContain('svelte-fixture')
  expect(userscript).toContain('darkorange')
})

it('one-shot build with server.file does not emit a proxy', async () => {
  const outDir = await buildFixture('vanilla', {
    entry: 'src/main.ts',
    fileName: 'vanilla',
    header: {
      name: 'Vanilla',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
    server: { file: true },
  })

  const files = await listOut(outDir)

  expect(files).toContain('vanilla.user.js')
  expect(files).not.toContain('vanilla.proxy.user.js')
  expect(files).not.toContain('vanilla.js')
})

it('development build with server.file emits a proxy, IIFE, and headed userscript', async () => {
  const root = join(fixtures, 'vanilla')
  const outDir = await mkdtemp(join(tmpdir(), 'userscript-vanilla-file-'))
  outDirs.push(outDir)

  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    mode: 'development',
    plugins: [
      Userscript({
        entry: 'src/main.ts',
        fileName: 'vanilla',
        header: {
          name: 'Vanilla',
          version: '1.0.0',
          match: 'https://example.com/*',
          require: 'https://cdn.example/lib.js',
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

  const proxy = await readOut(outDir, 'vanilla.proxy.user.js')
  const iife = await readOut(outDir, 'vanilla.js')
  const userscript = await readOut(outDir, 'vanilla.user.js')
  const files = await listOut(outDir)

  expect(proxy).toContain('==UserScript==')
  expect(proxy).toContain('@require')
  expect(proxy).toContain('file://')
  expect(proxy).toContain('vanilla.js')
  expect(proxy).toContain('https://cdn.example/lib.js')
  expect(proxy).toContain('GM_addStyle')
  expect(proxy).not.toContain('userscript-fixture')
  expect(iife).not.toContain('==UserScript==')
  expect(iife).toContain('userscript-fixture')
  expect(userscript).toContain('==UserScript==')
  expect(userscript).toContain('userscript-fixture')
  expect(userscript).not.toContain('file://')
  expect(files).toContain('vanilla.user.js')
  expect(files).not.toContain('vanilla.meta.js')
})
