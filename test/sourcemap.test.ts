import { Buffer } from 'node:buffer'
import { expect, it } from 'vitest'

import {
  countBannerLines,
  identitySourceMap,
  offsetSourceMap,
  stripVendorSourcesContent,
  toInlineSourceMappingUrl,
} from '../src/sourcemap.js'

const VLQ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeVlq(segment: string) {
  const values: number[] = []
  let value = 0
  let shift = 0

  for (const char of segment) {
    let digit = VLQ.indexOf(char)
    const hasContinue = (digit & 32) !== 0
    digit &= 31
    value += digit << shift

    if (hasContinue) {
      shift += 5
      continue
    }

    values.push(value & 1 ? -(value >> 1) : value >> 1)
    value = 0
    shift = 0
  }

  return values
}

function originalPositionFor(mappings: string, generatedLine: number, generatedColumn: number) {
  let originalLine = 0
  let originalColumn = 0
  let match: { column: number, line: number } | null = null

  for (const [index, line] of mappings.split(';').entries()) {
    let generatedCol = 0

    for (const segment of line ? line.split(',') : []) {
      const decoded = decodeVlq(segment)
      generatedCol += decoded[0] ?? 0
      if (decoded[2] != null) {
        originalLine += decoded[2]
      }
      if (decoded[3] != null) {
        originalColumn += decoded[3]
      }
      if (index === generatedLine && generatedCol <= generatedColumn) {
        match = { line: originalLine, column: originalColumn }
      }
    }

    if (index === generatedLine) {
      return match
    }
  }
}

it('countBannerLines counts prepended banner lines', () => {
  const prefix = '// ==UserScript==\n// @name x\n// ==/UserScript==\n\n'

  expect(countBannerLines(prefix)).toBe(4)
  expect(countBannerLines('')).toBe(0)
})

it('offsetSourceMap accounts for banner plus CSS prelude', () => {
  const prelude = '// ==UserScript==\n// ==/UserScript==\n\n(function (css) {\n  GM_addStyle(css)\n})("body{}");\n'
  const map = offsetSourceMap({ mappings: 'AAAA' }, countBannerLines(prelude))

  expect(map.mappings).toBe(`${';'.repeat(countBannerLines(prelude))}AAAA`)
})

it('identitySourceMap plus offset keeps original throw line', () => {
  const code = 'console.log(2)\n\nthrow new Error("sourcemap")\n\nconsole.log(1)\n'
  const prelude = 'const { GM } = globalThis.__viteUserscriptGM__ ?? globalThis;\n'
  const map = offsetSourceMap(
    identitySourceMap(code, '/src/counter.ts'),
    countBannerLines(prelude),
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
