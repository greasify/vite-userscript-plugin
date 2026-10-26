import { expect, it } from 'vitest'

import { breakLongMappedLines } from '../src/build/break-lines.js'
import { identitySourceMap } from '../src/sourcemap.js'
import { originalPositionFor } from './helpers/vlq.js'

it('splits a long line after a statement semicolon and keeps the mapping', () => {
  const code = 'left;right'
  const broken = breakLongMappedLines(code, identitySourceMap(code, 'a.ts').mappings, 4)

  expect(broken.code).toBe('left;\nright')
  expect(originalPositionFor(broken.mappings, 1, 0)).toEqual({ line: 0, column: 5 })
})

it('closes a template from the previous line before splitting', () => {
  const code = 'const html = `\n<span>\n`;after();tail'
  const broken = breakLongMappedLines(code, identitySourceMap(code, 'a.ts').mappings, 1)

  expect(broken.code).toBe('const html = `\n<span>\n`;\nafter();\ntail')
})

it('splits a short line where a comma enters another original line', () => {
  const code = 'a(),b()'
  // column 4 is `b`, original line 1; the comma before it is the break
  const broken = breakLongMappedLines(code, 'AAAA,IACA')

  expect(broken.code).toBe('a(),\nb()')
  expect(originalPositionFor(broken.mappings, 1, 0)).toEqual({ line: 1, column: 0 })
})

it('keeps a comma that stays on the same original line', () => {
  const code = 'a(),b()'
  const broken = breakLongMappedLines(code, 'AAAA,GAAA')

  expect(broken.code).toBe('a(),b()')
})

it('does not split semicolons inside strings, for-heads, or regexes', () => {
  const code = 'const text = "a;b";for (let i = 0; i < 1; i++) keep();next(/;/);tail'
  const broken = breakLongMappedLines(code, identitySourceMap(code, 'a.ts').mappings, 1)

  expect(broken.code).toBe('const text = "a;b";\nfor (let i = 0; i < 1; i++) keep();\nnext(/;/);\ntail')
})
