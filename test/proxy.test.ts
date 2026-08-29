import { expect, it } from 'vitest'
import {
  createWatchProxyHeader,
  generateWatchProxy,
  toFileRequireUrl,
  toProxyFileName,
  toRequireFileName,
} from '../src/build/proxy.js'
import { resolvePluginConfig } from '../src/resolve.js'

function resolveDemo(overrides: {
  grant?: 'none'
  require?: string | string[]
} = {}) {
  return resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'demo',
    header: {
      name: 'Demo',
      version: '1.0.0',
      match: 'https://example.com/*',
      ...overrides,
    },
  }).scripts[0]!
}

it('toFileRequireUrl is a file URL', () => {
  expect(toFileRequireUrl('/tmp/demo.js')).toMatch(/^file:\/\//)
  expect(toFileRequireUrl('/tmp/foo bar.js')).toContain('foo')
})

it('toProxyFileName and toRequireFileName follow v1 names', () => {
  expect(toProxyFileName('demo')).toBe('demo.proxy.user.js')
  expect(toRequireFileName('demo')).toBe('demo.js')
})

it('createWatchProxyHeader appends the file require', () => {
  const header = createWatchProxyHeader(resolveDemo(), '/proj/dist/demo.js')

  expect(header.require).toEqual([toFileRequireUrl('/proj/dist/demo.js')])
  expect(header.name).toBe('Demo')
  expect(header.grant).toContain('GM_addStyle')
  expect(header.grant).toContain('unsafeWindow')
})

it('createWatchProxyHeader keeps user requires', () => {
  const header = createWatchProxyHeader(
    resolveDemo({ require: ['https://cdn.example/lib.js', 'https://cdn.example/other.js'] }),
    '/proj/dist/demo.js',
  )

  expect(header.require).toEqual([
    'https://cdn.example/lib.js',
    'https://cdn.example/other.js',
    toFileRequireUrl('/proj/dist/demo.js'),
  ])
})

it('createWatchProxyHeader keeps a string require', () => {
  const header = createWatchProxyHeader(
    resolveDemo({ require: 'https://cdn.example/lib.js' }),
    '/proj/dist/demo.js',
  )

  expect(header.require).toEqual([
    'https://cdn.example/lib.js',
    toFileRequireUrl('/proj/dist/demo.js'),
  ])
})

it('createWatchProxyHeader keeps grant none', () => {
  const header = createWatchProxyHeader(
    resolveDemo({ grant: 'none' }),
    '/proj/dist/demo.js',
  )

  expect(header.grant).toBe('none')
})

it('generateWatchProxy is a metablock without a body', () => {
  const proxy = generateWatchProxy(resolveDemo(), '/proj/dist/demo.js')

  expect(proxy).toContain('==UserScript==')
  expect(proxy).toContain('@name')
  expect(proxy).toContain('Demo')
  expect(proxy).toContain('@require')
  expect(proxy).toContain('file://')
  expect(proxy).toContain('demo.js')
  expect(proxy).toContain('GM_addStyle')
  expect(proxy).not.toContain('server:Demo')
  expect(proxy).not.toContain('(function')
  expect(proxy).not.toContain('/@vite/client')
})

it('generateWatchProxy prints grant none', () => {
  const proxy = generateWatchProxy(
    resolveDemo({ grant: 'none' }),
    '/proj/dist/demo.js',
  )

  expect(proxy).toMatch(/@grant\s+none/)
  expect(proxy).not.toContain('GM_addStyle')
})
