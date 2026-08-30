import { expect, it } from 'vitest'

import {
  FAQ_URL,
  GM_NAMESPACE,
  REACT_BOOTSTRAP_PATH,
  REACT_PREAMBLE_PATH,
  VITE_CLIENT_FLAG,
} from '../src/constants.js'
import { resolvePluginConfig } from '../src/resolve.js'
import {
  applyServeHeader,
  createAfterLocalLogger,
  createDevUserscript,
  createReactBootstrapModule,
  DEV_SCRIPT_HEADERS,
  findDevScript,
  findFileUserscript,
  findProxyScript,
  formatFaqHint,
  formatInstallLine,
  formatRebuildLine,
  generateDevWrapper,
  hasReactRefreshPlugin,
  isViteLocalUrlLine,
  matchDevUserscript,
  matchFileUserscript,
  matchProxyUserscript,
  matchReactBootstrap,
  matchReactPreamble,
  REACT_PREAMBLE_MODULE,
  resolveBootstrapEntry,
  stripAnsi,
  toInstallUrl,
  toServeEntryPath,
} from '../src/serve/index.js'

it('matchDevUserscript matches install path', () => {
  expect(matchDevUserscript('/foo.dev.user.js', 'foo')).toBe(true)
  expect(matchDevUserscript('/foo.dev.user.js?t=1', 'foo')).toBe(true)
  expect(matchDevUserscript('/foo.user.js', 'foo')).toBe(false)
})

it('matchProxyUserscript matches install path', () => {
  expect(matchProxyUserscript('/foo.proxy.user.js', 'foo')).toBe(true)
  expect(matchProxyUserscript('/foo.proxy.user.js?t=1', 'foo')).toBe(true)
  expect(matchProxyUserscript('/foo.dev.user.js', 'foo')).toBe(false)
})

it('matchFileUserscript matches install path', () => {
  expect(matchFileUserscript('/foo.user.js', 'foo')).toBe(true)
  expect(matchFileUserscript('/foo.user.js?t=1', 'foo')).toBe(true)
  expect(matchFileUserscript('/foo.proxy.user.js', 'foo')).toBe(false)
})

it('findDevScript skips file-mode scripts', () => {
  const hmr = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'demo',
    header: { name: 'Demo', version: '1.0.0', match: 'https://example.com/*' },
  }).scripts[0]!
  const file = resolvePluginConfig({
    entry: 'src/main.ts',
    fileName: 'demo',
    header: { name: 'Demo', version: '1.0.0', match: 'https://example.com/*' },
    server: { file: true },
  }).scripts[0]!

  expect(findDevScript('/demo.dev.user.js', [hmr])?.fileName).toBe('demo')
  expect(findDevScript('/demo.dev.user.js', [file])).toBeUndefined()
  expect(findProxyScript('/demo.proxy.user.js', [file])?.fileName).toBe('demo')
  expect(findProxyScript('/demo.proxy.user.js', [hmr])).toBeUndefined()
  expect(findFileUserscript('/demo.user.js', [file])?.fileName).toBe('demo')
  expect(findFileUserscript('/demo.user.js', [hmr])).toBeUndefined()
})

it('toServeEntryPath is a root-relative URL', () => {
  expect(toServeEntryPath('/proj', '/proj/src/main.ts')).toBe('/src/main.ts')
})

it('applyServeHeader prefixes the name and fills grants', () => {
  const header = applyServeHeader(
    {
      name: 'Demo',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
    'server:',
  )

  expect(header.name).toBe('server:Demo')
  expect(header.grant).toContain('GM_addStyle')
})

it('applyServeHeader keeps grant none', () => {
  const header = applyServeHeader(
    {
      name: 'Demo',
      version: '1.0.0',
      match: 'https://example.com/*',
      grant: 'none',
    },
    'server:',
  )

  expect(header.grant).toBe('none')
})

it('generateDevWrapper injects vite client once and the entry', () => {
  const wrapper = generateDevWrapper({
    origin: 'http://localhost:5173',
    entryPath: '/src/main.ts',
  })

  expect(wrapper).toContain(GM_NAMESPACE)
  expect(wrapper).toContain('gm.GM = GM')
  expect(wrapper).toContain(VITE_CLIENT_FLAG)
  expect(wrapper).toContain('http://localhost:5173/@vite/client')
  expect(wrapper).toContain('http://localhost:5173/src/main.ts')
  expect(wrapper).not.toContain(REACT_BOOTSTRAP_PATH)
})

it('generateDevWrapper boots React through the preamble module', () => {
  const wrapper = generateDevWrapper({
    origin: 'http://localhost:5173',
    entryPath: '/src/index.tsx',
    reactPreamble: true,
  })

  expect(wrapper).toContain(`${REACT_BOOTSTRAP_PATH}?entry=${encodeURIComponent('/src/index.tsx')}`)
  expect(wrapper).not.toContain('http://localhost:5173/@vite/client')
  expect(createReactBootstrapModule('/src/index.tsx')).toContain(REACT_PREAMBLE_PATH)
  expect(createReactBootstrapModule('/src/index.tsx')).toContain('/src/index.tsx')
  expect(REACT_PREAMBLE_MODULE).toContain('/@react-refresh')
  expect(REACT_PREAMBLE_MODULE).toContain('__vite_plugin_react_preamble_installed__')
})

it('react preamble helpers match plugin-react and reject unsafe entries', () => {
  expect(hasReactRefreshPlugin([{ name: 'vite:react-refresh' }])).toBe(true)
  expect(hasReactRefreshPlugin([{ name: 'vite:react-virtual-preamble' }])).toBe(true)
  expect(hasReactRefreshPlugin([{ name: 'vite:vue' }])).toBe(false)
  expect(matchReactPreamble(`${REACT_PREAMBLE_PATH}?t=1`)).toBe(true)
  expect(matchReactBootstrap(`${REACT_BOOTSTRAP_PATH}?entry=/src/index.tsx`)).toBe(true)
  expect(resolveBootstrapEntry(`${REACT_BOOTSTRAP_PATH}?entry=/src/index.tsx`)).toBe('/src/index.tsx')
  expect(resolveBootstrapEntry(`${REACT_BOOTSTRAP_PATH}?entry=https://evil.test`)).toBeUndefined()
  expect(resolveBootstrapEntry(`${REACT_BOOTSTRAP_PATH}?entry=//evil.test`)).toBeUndefined()
})

it('createDevUserscript writes a header and wrapper', () => {
  const config = resolvePluginConfig({
    entry: 'src/main.ts',
    header: {
      name: 'Demo',
      version: '1.0.0',
      match: 'https://example.com/*',
    },
  })

  const userscript = createDevUserscript({
    origin: 'http://localhost:5173',
    root: '/proj',
    script: {
      ...config.scripts[0]!,
      entry: '/proj/src/main.ts',
    },
  })

  expect(userscript).toContain('==UserScript==')
  expect(userscript).toContain('@name')
  expect(userscript).toContain('server:Demo')
  expect(userscript).toContain('/@vite/client')
})

it('dev userscript response headers disable caching', () => {
  expect(DEV_SCRIPT_HEADERS['Content-Type']).toContain('text/javascript')
  expect(DEV_SCRIPT_HEADERS['Cache-Control']).toBe('no-store')
})

it('toInstallUrl joins origin without a trailing slash', () => {
  expect(toInstallUrl('http://localhost:5173/', 'demo')).toBe(
    'http://localhost:5173/demo.dev.user.js',
  )
  expect(toInstallUrl('http://localhost:5173', 'demo')).toBe(
    'http://localhost:5173/demo.dev.user.js',
  )
  expect(toInstallUrl('http://localhost:5173/', 'demo', 'proxy')).toBe(
    'http://localhost:5173/demo.proxy.user.js',
  )
  expect(toInstallUrl('http://localhost:5173/', 'demo', 'user')).toBe(
    'http://localhost:5173/demo.user.js',
  )
})

it('formatInstallLine prints an OpenAPI-style install line', () => {
  const line = formatInstallLine('http://localhost:5173/demo.dev.user.js')
  const plain = stripAnsi(line)

  expect(plain).toContain('Userscript')
  expect(plain).toContain('http://localhost:5173/demo.dev.user.js')
  expect(plain).toMatch(/^\s+➜\s+Userscript\s*:/)
})

it('formatInstallLine labels a proxy install line', () => {
  const plain = stripAnsi(formatInstallLine('http://localhost:5173/demo.proxy.user.js', 'Proxy'))

  expect(plain).toContain('Proxy')
  expect(plain).toContain('http://localhost:5173/demo.proxy.user.js')
  expect(plain).toMatch(/^\s+➜\s+Proxy\s*:/)
})

it('formatRebuildLine prints elapsed time', () => {
  const plain = stripAnsi(formatRebuildLine(12))

  expect(plain).toContain('Userscript rebuilt')
  expect(plain).toContain('(12ms)')
})

it('formatFaqHint prints a FAQ block with the README URL', () => {
  const plain = stripAnsi(formatFaqHint())

  expect(plain).toContain('FAQ')
  expect(plain).toContain('#faq')
  expect(plain).toContain(FAQ_URL)
})

it('isViteLocalUrlLine matches Vite Local lines with ANSI', () => {
  expect(isViteLocalUrlLine('  ➜  Local:   http://localhost:5173/')).toBe(true)
  expect(
    isViteLocalUrlLine('\u001B[32m➜\u001B[39m  \u001B[1mLocal\u001B[22m:   http://localhost:5173/'),
  ).toBe(true)
  expect(isViteLocalUrlLine('  ➜  Network: use --host to expose')).toBe(false)
})

it('createAfterLocalLogger inserts after the last Local line', () => {
  const lines: string[] = []
  const logger = createAfterLocalLogger(
    (msg) => {
      lines.push(String(msg))
    },
    1,
    () => {
      lines.push('INSTALL')
    },
  )

  logger.info('  ➜  Local:   http://localhost:5173/')
  logger.info('  ➜  Network: use --host to expose')
  logger.flush()

  expect(lines).toEqual([
    '  ➜  Local:   http://localhost:5173/',
    'INSTALL',
    '  ➜  Network: use --host to expose',
  ])
})
