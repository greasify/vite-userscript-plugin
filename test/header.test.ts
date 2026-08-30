import type { HeaderConfig } from '../src/types.js'

import { expect, it } from 'vitest'
import { grants } from '../src/grants/catalog.js'
import {
  generateHeader,
  Header,
  resolvePublicFileUrl,
} from '../src/header.js'

const defaultHeader: HeaderConfig = {
  'name': 'vitest',
  'version': '1.0.0',
  'author': 'John Doe',
  'description': 'vitest',
  'namespace': 'vitest',
  'connect': 'vitest.dev',
  'license': 'MIT',
  'noframes': true,
  'icon': 'https://vitest.dev/favicon.ico',
  'icon64': 'https://vitest.dev/favicon.ico',
  'exclude': ['https://vitest.dev/guide/*', 'https://vitest.dev/api/*'],
  'include': 'https://vitest.dev',
  'homepage': 'https://github.com/vitest-dev/vitest',
  'downloadURL': 'https://vitest.dev',
  'supportURL': 'https://vitest.dev',
  'updateURL': 'https://vitest.dev',
  'resource': [['vitest', 'https://vitest.dev']],
  'require': 'https://example.com/index.js',
  'grant': [...grants],
  'match': 'https://vitest.dev',
  'run-at': 'document-start',
}

it('header default snapshot', () => {
  const header = new Header(defaultHeader).generate()
  expect(header).toMatchSnapshot()
})

it('header does not mutate input header', () => {
  const header: HeaderConfig = {
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://example.com/project',
  }
  const clone = structuredClone(header)

  generateHeader(header, { autoMetaUrls: true, fileName: 'vitest' })

  expect(header).toEqual(clone)
})

it('header skips false and undefined fields', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    noframes: false,
    unwrap: undefined,
  })

  expect(header).not.toContain('@noframes')
  expect(header).not.toContain('@unwrap')
})

it('header prints grant none as a single field', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    grant: 'none',
  })

  expect(header).toContain('@grant')
  expect(header).toContain('none')
  expect(header).not.toContain('GM_addStyle')
})

it('header autoMetaUrls keeps explicit update and download URLs', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
      homepage: 'https://github.com/vitest-dev/vitest',
      updateURL: 'https://vitest.dev',
      downloadURL: 'https://vitest.dev',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )

  expect(header).toContain('@updateURL')
  expect(header).toContain('https://vitest.dev')
  expect(header).not.toContain('vitest.meta.js')
})

it('header autoMetaUrls without homepage does not add update or download URLs', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )

  expect(header).not.toContain('@updateURL')
  expect(header).not.toContain('@downloadURL')
})

it('header autoMetaUrls joins homepage without trailing slash', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
      homepage: 'https://greasify.github.io/jsx',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )

  expect(header).toContain(
    'https://greasify.github.io/jsx/vitest.meta.js',
  )
  expect(header).toContain(
    'https://greasify.github.io/jsx/vitest.user.js',
  )
})

it('header generate hook receives userscript text', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
    },
    {
      mode: 'meta',
      generate: ({ userscript, mode }) => `${userscript}\n// mode:${mode}`,
    },
  )

  expect(header).toContain('==UserScript==')
  expect(header).toContain('// mode:meta')
})

it('header sanitizes newlines in header values', () => {
  const header = generateHeader({
    name: 'x\n// @grant unsafeWindow',
    version: '1.0.0',
    match: 'https://example.com',
  })

  expect(header).toContain('// @name')
  expect(header.split('\n').filter(line => line.startsWith('// @name'))).toHaveLength(1)
  expect(header).not.toMatch(/^\/\/ @grant unsafeWindow$/m)
})

it('header skips object header values', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    extra: { nested: true },
  })

  expect(header).not.toContain('[object Object]')
  expect(header).not.toContain('@extra')
})

it('header autoMetaUrls uses website and source aliases', () => {
  const fromWebsite = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
      website: 'https://example.com/project',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )
  const fromSource = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
      source: 'https://example.com/src/',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )

  expect(fromWebsite).toContain('https://example.com/project/vitest.meta.js')
  expect(fromSource).toContain('https://example.com/src/vitest.user.js')
})

it('header autoMetaUrls ignores an invalid homepage', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
      homepage: 'not a url',
    },
    { autoMetaUrls: true, fileName: 'vitest' },
  )

  expect(header).not.toContain('@updateURL')
  expect(header).not.toContain('@downloadURL')
})

it('resolvePublicFileUrl joins homepage with and without a trailing slash', () => {
  const withoutSlash = {
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin',
  }
  const withSlash = {
    ...withoutSlash,
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
  }

  expect(resolvePublicFileUrl(withoutSlash, 'vitest.user.js.map')).toBe(
    'https://greasify.github.io/vite-userscript-plugin/vitest.user.js.map',
  )
  expect(resolvePublicFileUrl(withSlash, 'vitest.user.js.map')).toBe(
    'https://greasify.github.io/vite-userscript-plugin/vitest.user.js.map',
  )
})

it('resolvePublicFileUrl returns undefined without a valid homepage', () => {
  expect(resolvePublicFileUrl({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
  }, 'vitest.user.js.map')).toBeUndefined()
  expect(resolvePublicFileUrl({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'not a url',
  }, 'vitest.user.js.map')).toBeUndefined()
})

it('header joins a relative icon with homepage', () => {
  const withoutSlash = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin',
    icon: 'greasify.svg',
  })
  const withSlash = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    icon: 'greasify.svg',
  })

  expect(withoutSlash).toContain(
    'https://greasify.github.io/vite-userscript-plugin/greasify.svg',
  )
  expect(withSlash).toContain(
    'https://greasify.github.io/vite-userscript-plugin/greasify.svg',
  )
})

it('header keeps absolute icon URLs', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    icon: 'https://cdn.example.com/icon.png',
    icon64: 'http://cdn.example.com/icon64.png',
    iconURL: 'data:image/svg+xml,<svg></svg>',
  })

  expect(header).toContain('https://cdn.example.com/icon.png')
  expect(header).toContain('http://cdn.example.com/icon64.png')
  expect(header).toContain('data:image/svg+xml,<svg></svg>')
  expect(header).not.toContain('greasify.github.io/vite-userscript-plugin/https')
})

it('header resolves mixed require and resource paths', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    require: ['lib.js', 'https://cdn.example.com/vendor.js'],
    resource: [['logo', 'greasify.svg'], ['remote', 'https://cdn.example.com/logo.png']],
  })

  expect(header).toContain(
    'https://greasify.github.io/vite-userscript-plugin/lib.js',
  )
  expect(header).toContain('https://cdn.example.com/vendor.js')
  expect(header).toContain(
    'https://greasify.github.io/vite-userscript-plugin/greasify.svg',
  )
  expect(header).toContain('https://cdn.example.com/logo.png')
})

it('header keeps relative URLs without a usable homepage', () => {
  const missing = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    icon: 'greasify.svg',
  })
  const invalid = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'not a url',
    icon: 'greasify.svg',
  })

  expect(missing).toMatch(/@icon\s+greasify\.svg/)
  expect(missing).not.toMatch(/@icon\s+https?:/)
  expect(invalid).toMatch(/@icon\s+greasify\.svg/)
  expect(invalid).not.toMatch(/@icon\s+https?:/)
})

it('header resolves a relative updateURL without autoMetaUrls', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    updateURL: 'custom.meta.js',
  })

  expect(header).toContain(
    'https://greasify.github.io/vite-userscript-plugin/custom.meta.js',
  )
  expect(header).not.toContain('vitest.meta.js')
})

it('header keeps protocol-relative and root-absolute icon paths', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    icon: '//cdn.example.com/icon.png',
    icon64: '/greasify.svg',
  })

  expect(header).toContain('//cdn.example.com/icon.png')
  expect(header).toContain('/greasify.svg')
  expect(header).not.toContain(
    'https://greasify.github.io/vite-userscript-plugin/greasify.svg',
  )
})

it('header relative icon does not mutate the input header', () => {
  const header: HeaderConfig = {
    name: 'vitest',
    version: '1.0.0',
    match: 'https://example.com',
    homepage: 'https://example.com/project',
    icon: 'greasify.svg',
  }
  const clone = structuredClone(header)

  generateHeader(header)

  expect(header).toEqual(clone)
})

it('header does not resolve match or homepage aliases', () => {
  const header = generateHeader({
    name: 'vitest',
    version: '1.0.0',
    match: 'example.com/*',
    homepage: 'https://greasify.github.io/vite-userscript-plugin/',
    include: 'local-page.html',
  })

  expect(header).toContain('example.com/*')
  expect(header).not.toContain(
    'https://greasify.github.io/vite-userscript-plugin/example.com/*',
  )
  expect(header).toContain('local-page.html')
  expect(header).not.toContain(
    'https://greasify.github.io/vite-userscript-plugin/local-page.html',
  )
})

it('header align false uses a single space', () => {
  const header = generateHeader(
    {
      name: 'vitest',
      version: '1.0.0',
      match: 'https://example.com',
    },
    { align: false },
  )

  expect(header).toContain('// @name vitest')
})
