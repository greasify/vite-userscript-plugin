import type { Grants } from '../src/types.js'

import { expect, it } from 'vitest'
import { ensureIife, stripImports } from '../src/build/iife.js'
import { defineGrants, removeDuplicates, resolveBuildHeader } from '../src/grants/index.js'

it('defineGrants snapshot', () => {
  const code = `(function(){"use strict";function e(){const t=document.createElement("button");return t.textContent="Button",t.addEventListener("click",()=>{GM_notification({text:"Hello"})}),t}document.querySelector("div").appendChild(e()),console.log(GM_info),GM_addStyle("button{border:none;background-color:tomato;padding:1rem;font-size:1rem;font-weight:600;border-radius:1rem}")})();`
  const grants = defineGrants(code)
  expect(grants).toMatchSnapshot()
})

it('removeDuplicates snapshot', () => {
  const grants: Grants[] = [
    'GM_addElement',
    'GM_addElement',
    'GM_addStyle',
    'GM_download',
    'GM_addStyle',
  ]

  expect(removeDuplicates(grants)).toMatchSnapshot()
})

it('removeDuplicates insert string to array', () => {
  const str = 'hello'
  expect(removeDuplicates(str)).toEqual([str])
})

it('defineGrants detects batch storage APIs', () => {
  const grants = defineGrants(
    'await GM.getValues(["foo"]); GM_setValues({ foo: 1 }); GM.deleteValues(["foo"])',
  )

  expect(grants).toEqual(
    expect.arrayContaining(['GM.getValues', 'GM_setValues', 'GM.deleteValues']),
  )
})

it('defineGrants detects cookie and audio objects', () => {
  const grants = defineGrants(
    'GM_cookie.list({}); GM_audio.getState(() => {})',
  )

  expect(grants).toEqual(
    expect.arrayContaining(['GM_cookie', 'GM_audio']),
  )
})

it('defineGrants does not match grant prefixes', () => {
  const grants = defineGrants('GM.login(); const myGM_addStyle = 1')

  expect(grants).not.toContain('GM.log')
  expect(grants).not.toContain('GM_addStyle')
})

it('defineGrants detects official GM.* aliases', () => {
  const grants = defineGrants(
    'GM.xmlHttpRequest({ url: "/" }); await GM.getResourceUrl("icon")',
  )

  expect(grants).toEqual(
    expect.arrayContaining(['GM.xmlHttpRequest', 'GM.getResourceUrl']),
  )
  expect(grants).not.toContain('GM_xmlHttpRequest')
  expect(grants).not.toContain('GM_getResourceUrl')
})

it('resolveBuildHeader keeps grant none', () => {
  const header = resolveBuildHeader(
    {
      name: 'a',
      version: '1.0.0',
      match: 'https://example.com',
      grant: 'none',
    },
    'GM_addStyle("x")',
    ['GM_addStyle'],
  )

  expect(header.grant).toBe('none')
})

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

it('resolveBuildHeader adds GM_addStyle when CSS is inlined', () => {
  const header = resolveBuildHeader(
    {
      name: 'a',
      version: '1.0.0',
      match: 'https://example.com',
      grant: ['GM_setValue'],
    },
    'console.log(1)',
    ['GM_addStyle'],
  )

  expect(header.grant).toContain('GM_addStyle')
  expect(header.grant).toContain('GM_setValue')
})

it('resolveBuildHeader skips extra CSS grant when none is requested', () => {
  const header = resolveBuildHeader(
    {
      name: 'a',
      version: '1.0.0',
      match: 'https://example.com',
    },
    'console.log(1)',
  )

  expect(header.grant).not.toContain('GM_addStyle')
})
