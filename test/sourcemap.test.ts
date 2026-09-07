import { Buffer } from 'node:buffer'
import { expect, it } from 'vitest'

import {
  countHeaderLines,
  identitySourceMap,
  offsetSourceMap,
  stripVendorSourcesContent,
  toInlineSourceMappingUrl,
} from '../src/sourcemap.js'
import { originalPositionFor } from './helpers/vlq.js'

it('countHeaderLines counts prepended header lines', () => {
  const prefix = '// ==UserScript==\n// @name x\n// ==/UserScript==\n\n'

  expect(countHeaderLines(prefix)).toBe(4)
  expect(countHeaderLines('')).toBe(0)
})

it('offsetSourceMap accounts for header and CSS prelude', () => {
  const prelude = '// ==UserScript==\n// ==/UserScript==\n\n(function (css) {\n  GM_addStyle(css)\n})("body{}");\n'
  const map = offsetSourceMap({ mappings: 'AAAA' }, countHeaderLines(prelude))

  expect(map.mappings).toBe(`${';'.repeat(countHeaderLines(prelude))}AAAA`)
})

it('identitySourceMap plus offset keeps original throw line', () => {
  const code = 'console.log(2)\n\nthrow new Error("sourcemap")\n\nconsole.log(1)\n'
  const prelude = 'const { GM } = globalThis.__viteUserscriptGM__ ?? globalThis;\n'
  const map = offsetSourceMap(
    identitySourceMap(code, '/src/counter.ts'),
    countHeaderLines(prelude),
  )
  const throwLine = code.split('\n').findIndex(line => line.includes('throw'))
  const throwColumn = code.split('\n')[throwLine]?.indexOf('throw') ?? 0

  expect(originalPositionFor(map.mappings, 0, 0)).toBeNull()
  expect(originalPositionFor(map.mappings, 1, 0)).toEqual({ line: 0, column: 0 })
  expect(originalPositionFor(map.mappings, throwLine + 1, throwColumn)).toEqual({
    line: throwLine,
    column: throwColumn,
  })
  expect(code.split('\n')[throwLine]).toContain('throw')
})

it('offsetSourceMap prepends empty generated lines', () => {
  const map = offsetSourceMap(
    {
      version: 3,
      file: 'app.js',
      mappings: 'AAAA',
      sources: ['app.ts'],
      names: [],
    },
    4,
    'app.user.js',
  )

  expect(map.file).toBe('app.user.js')
  expect(map.mappings).toBe(';;;;AAAA')
})

it('stripVendorSourcesContent keeps app sources and drops vendor text', () => {
  const map = stripVendorSourcesContent({
    version: 3,
    mappings: 'AAAA',
    sources: [
      '../src/main.ts',
      '../node_modules/vue/dist/vue.runtime.esm-bundler.js',
      '\0plugin-vue:export-helper',
      'virtual:userscript',
    ],
    sourcesContent: [
      'createApp(App)',
      'export function createApp() {}',
      'export default {}',
      'virtual module',
    ],
  })

  expect(map.sourcesContent).toEqual([
    'createApp(App)',
    null,
    null,
    null,
  ])
})

it('toInlineSourceMappingUrl encodes the map as a data URL', () => {
  const map = {
    version: 3,
    file: 'app.user.js',
    mappings: ';;;;AAAA',
    sources: ['app.ts'],
    names: [],
  }
  const url = toInlineSourceMappingUrl(map)

  expect(url.startsWith('data:application/json;charset=utf-8;base64,')).toBe(true)
  expect(JSON.parse(Buffer.from(url.split(',')[1] ?? '', 'base64').toString('utf8'))).toEqual(map)
})
