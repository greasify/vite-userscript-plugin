import type { Grants } from '../src/types.js'

import { expect, it } from 'vitest'
import { defineGrants, removeDuplicates, resolveBuildHeader } from '../src/grants/index.js'

it('defineGrants detects GM_* calls in minified code', () => {
  const grants = defineGrants(
    `(function(){"use strict";function e(){GM_notification({text:"Hello"})}console.log(GM_info),GM_addStyle("button{}")})();`,
  )

  expect(grants).toEqual(['GM_addStyle', 'GM_notification', 'GM_info'])
})

it('removeDuplicates keeps first-seen order', () => {
  const grants: Grants[] = [
    'GM_addElement',
    'GM_addElement',
    'GM_addStyle',
    'GM_download',
    'GM_addStyle',
  ]

  expect(removeDuplicates(grants)).toEqual([
    'GM_addElement',
    'GM_addStyle',
    'GM_download',
  ])
})

it('removeDuplicates wraps a single value', () => {
  expect(removeDuplicates('hello')).toEqual(['hello'])
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

it('defineGrants does not treat DOM window.close as a grant', () => {
  const grants = defineGrants(
    'window.close(); window.focus(); window.onurlchange = null; unsafeWindow.foo = 1',
  )

  expect(grants).not.toContain('window.close')
  expect(grants).not.toContain('window.focus')
  expect(grants).not.toContain('window.onurlchange')
  expect(grants).toContain('unsafeWindow')
})

it('resolveBuildHeader keeps an explicit window.close grant', () => {
  const header = resolveBuildHeader(
    {
      name: 'a',
      version: '1.0.0',
      match: 'https://example.com',
      grant: ['window.close'],
    },
    'window.close()',
  )

  expect(header.grant).toContain('window.close')
  expect(defineGrants('window.close()')).not.toContain('window.close')
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
  )

  expect(header.grant).toBe('none')
})

it('resolveBuildHeader merges declared grants with scanned grants', () => {
  const header = resolveBuildHeader(
    {
      name: 'a',
      version: '1.0.0',
      match: 'https://example.com',
      grant: ['GM_setValue'],
    },
    'GM_getValue("k")',
  )

  expect(header.grant).toContain('GM_setValue')
  expect(header.grant).toContain('GM_getValue')
})

it('resolveBuildHeader does not inject GM_addStyle without a scan hit', () => {
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
