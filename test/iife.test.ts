import { expect, it } from 'vitest'
import {
  ensureIife,
  isAlreadyIife,
  stripDynamicImports,
  stripImports,
} from '../src/build/iife.js'

it('ensureIife wraps ESM exports', () => {
  const wrapped = ensureIife('const name = "foo";\nexport { name };\n')

  expect(wrapped.startsWith('(function () {')).toBe(true)
  expect(wrapped).toContain('const name = "foo"')
  expect(wrapped).not.toContain('export { name }')
})

it('ensureIife wraps side-effect ESM', () => {
  const wrapped = ensureIife('document.body.dataset.x = "1";\n')

  expect(wrapped.startsWith('(function () {')).toBe(true)
  expect(wrapped).toContain('document.body.dataset.x')
})

it('stripImports removes leftover static imports after inlining', () => {
  const stripped = stripImports(
    'import { helper } from "./shared-abc.js";\nimport "./side-effect.js";\nhelper();\n',
  )

  expect(stripped).not.toMatch(/\bimport\s/)
  expect(stripped).toContain('helper();')
})

it('ensureIife strips leftover imports before wrapping', () => {
  const wrapped = ensureIife(
    'import { name } from "./shared.js";\nconst value = name;\nexport { value };\n',
  )

  expect(wrapped.startsWith('(function () {')).toBe(true)
  expect(wrapped).not.toMatch(/\bimport\s/)
  expect(wrapped).not.toContain('export { value }')
  expect(wrapped).toContain('const value = name')
})

it('ensureIife uses an async IIFE when await is present', () => {
  const wrapped = ensureIife('const value = await Promise.resolve("ok");\n')

  expect(wrapped.startsWith('(async function () {')).toBe(true)
  expect(wrapped).toContain('await Promise.resolve')
  expect(ensureIife(wrapped)).toBe(wrapped)
})

it('ensureIife strips sourceMappingURL before wrapping', () => {
  const wrapped = ensureIife('const value = 1;\n//# sourceMappingURL=chunk.js.map\n')

  expect(wrapped).toContain('const value = 1')
  expect(wrapped).not.toContain('sourceMappingURL')
})

it('isAlreadyIife ignores an inner function expression', () => {
  const code = 'const x = 1;\n(function () { console.log(x) })();\n'

  expect(isAlreadyIife(code)).toBe(false)
  expect(ensureIife(code).startsWith('(function () {')).toBe(true)
  expect(ensureIife(code)).toContain('const x = 1')
})

it('stripDynamicImports rewrites leftover import() calls', () => {
  expect(stripDynamicImports('const m = import("./lazy.js")')).toBe(
    'const m = Promise.resolve({})',
  )
})
