import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, expect, it } from 'vitest'
import {
  collectHtmlEntries,
  mergePluginInput,
  normalizeInput,
  resolvePluginBuildInput,
} from '../src/html.js'
import { resolvePluginConfig } from '../src/resolve.js'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

const scripts = resolvePluginConfig({
  entry: 'src/main.ts',
  fileName: 'demo',
  header: {
    name: 'Demo',
    version: '1.0.0',
    match: 'https://example.com/*',
  },
}).scripts

it('normalizeInput accepts string, array, and object input', () => {
  expect(normalizeInput('index.html')).toEqual({ index: 'index.html' })
  expect(normalizeInput(['about.html', 'nested/page.html'])).toEqual({
    about: 'about.html',
    page: 'nested/page.html',
  })
  expect(normalizeInput({ main: 'index.html', extra: 'src/extra.ts' })).toEqual({
    main: 'index.html',
    extra: 'src/extra.ts',
  })
})

it('collectHtmlEntries picks HTML from user input and root index.html', async () => {
  const root = join(tmpdir(), `userscript-html-input-${Date.now()}`)
  roots.push(root)
  await mkdir(root)
  await writeFile(join(root, 'index.html'), '<!doctype html><title>x</title>')

  expect(collectHtmlEntries(root, { about: 'about.html', extra: 'src/extra.ts' })).toEqual({
    about: 'about.html',
    index: 'index.html',
  })
})

it('collectHtmlEntries does not duplicate index.html from user input', async () => {
  const root = join(tmpdir(), `userscript-html-index-${Date.now()}`)
  roots.push(root)
  await mkdir(root)
  await writeFile(join(root, 'index.html'), '<!doctype html><title>x</title>')

  expect(collectHtmlEntries(root, { home: 'index.html' })).toEqual({
    home: 'index.html',
  })
})

it('mergePluginInput keeps HTML and adds userscript entries', () => {
  expect(mergePluginInput(scripts, { extra: 'src/extra.ts' }, { index: 'index.html' })).toEqual({
    extra: 'src/extra.ts',
    index: 'index.html',
    demo: 'src/main.ts',
  })
})

it('mergePluginInput throws when an HTML key collides with fileName', () => {
  expect(() => mergePluginInput(scripts, {}, { demo: 'index.html' })).toThrow(/collides with userscript fileName/)
})

it('resolvePluginBuildInput sets hasHtml when index.html exists', async () => {
  const root = join(tmpdir(), `userscript-html-resolve-${Date.now()}`)
  roots.push(root)
  await mkdir(root)
  await writeFile(join(root, 'index.html'), '<!doctype html><title>x</title>')

  const resolved = resolvePluginBuildInput({ root }, scripts)
  expect(resolved.hasHtml).toBe(true)
  expect(resolved.input).toEqual({
    index: 'index.html',
    demo: 'src/main.ts',
  })
})

it('resolvePluginBuildInput stays userscript-only without HTML', async () => {
  const root = join(tmpdir(), `userscript-html-none-${Date.now()}`)
  roots.push(root)
  await mkdir(root)

  const resolved = resolvePluginBuildInput({ root }, scripts)
  expect(resolved.hasHtml).toBe(false)
  expect(resolved.input).toEqual({
    demo: 'src/main.ts',
  })
})
