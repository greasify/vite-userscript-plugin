import { expect, it } from 'vitest'
import {
  mergeRequireUrls,
  resolveExternals,
  rewriteExternalImports,
  rewriteImportClause,
} from '../src/build/external.js'

it('resolveExternals maps string URLs to identifier globals', () => {
  expect(resolveExternals({
    'jquery': 'https://cdn.example/jquery.js',
    'fake-vue': {
      global: 'Vue',
      url: 'https://cdn.example/vue.js',
    },
  })).toEqual([
    {
      specifier: 'jquery',
      global: 'jquery',
      url: 'https://cdn.example/jquery.js',
    },
    {
      specifier: 'fake-vue',
      global: 'Vue',
      url: 'https://cdn.example/vue.js',
    },
  ])
})

it('mergeRequireUrls appends unique CDN urls', () => {
  expect(mergeRequireUrls(
    {
      name: 'a',
      version: '1',
      match: '*',
      require: 'https://cdn.example/lib.js',
    },
    ['https://cdn.example/lib.js', 'https://cdn.example/vue.js'],
  ).require).toEqual([
    'https://cdn.example/lib.js',
    'https://cdn.example/vue.js',
  ])
})

it('rewriteImportClause maps default and named imports onto the global', () => {
  expect(rewriteImportClause('$', '$')).toBe('')
  expect(rewriteImportClause('jq', '$')).toBe('const jq = $;')
  expect(rewriteImportClause('{ createApp }', 'Vue')).toBe('const { createApp } = Vue;')
  expect(rewriteImportClause('{ createApp as app }', 'Vue')).toBe('const { createApp: app } = Vue;')
  expect(rewriteImportClause('* as Vue', 'Vue')).toBe('')
})

it('rewriteExternalImports rewrites ESM imports of required packages', () => {
  const code = rewriteExternalImports(
    `import $ from "fake-jquery";\nimport { createApp } from "fake-vue";\ncreateApp($);\n`,
    [
      { specifier: 'fake-jquery', global: '$', url: 'https://cdn.example/jquery.js' },
      { specifier: 'fake-vue', global: 'Vue', url: 'https://cdn.example/vue.js' },
    ],
  )

  expect(code).not.toContain('fake-jquery')
  expect(code).not.toContain('fake-vue')
  expect(code).toContain('const { createApp } = Vue;')
  expect(code).toContain('createApp($);')
})
