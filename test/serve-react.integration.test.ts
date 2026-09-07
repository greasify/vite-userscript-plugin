import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import {
  REACT_BOOTSTRAP_PATH,
  REACT_PREAMBLE_PATH,
} from '../src/constants.js'
import userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

it('serve injects the react bootstrap when react-refresh is present', async () => {
  const server = await createServer({
    root: join(fixtures, 'vanilla'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      { name: 'vite:react-refresh' },
      userscript({
        entry: 'src/main.ts',
        fileName: 'react',
        header: {
          name: 'React',
          version: '1.0.0',
          match: 'https://example.com/*',
        },
      }),
    ],
  })

  try {
    await server.listen()
    const origin = server.resolvedUrls?.local[0]
    expect(origin).toBeTruthy()

    const install = await (await fetch(new URL('/react.dev.user.js', origin))).text()
    const preamble = await (await fetch(new URL(REACT_PREAMBLE_PATH, origin))).text()
    const bootstrap = await (await fetch(
      new URL(`${REACT_BOOTSTRAP_PATH}?entry=${encodeURIComponent('/src/main.ts')}`, origin),
    )).text()

    expect(install).toContain(REACT_BOOTSTRAP_PATH)
    expect(install).toContain('entry=%2Fsrc%2Fmain.ts')
    expect(preamble).toContain('__vite_plugin_react_preamble_installed__')
    expect(bootstrap).toContain(REACT_PREAMBLE_PATH)
    expect(bootstrap).toContain('/src/main.ts')
  } finally {
    await server.close()
  }
})
