import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

it('serve transforms index.html and still serves the install script', async () => {
  const server = await createServer({
    root: join(fixtures, 'html'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      userscript({
        entry: 'src/main.ts',
        fileName: 'html-app',
        header: {
          name: 'HTML App',
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

    const html = await (await fetch(new URL('/', origin))).text()
    const install = await (await fetch(new URL('/html-app.dev.user.js', origin))).text()

    expect(html).toContain('/@vite/client')
    expect(html).toContain('/src/page.ts')
    expect(html).not.toContain('/src/main.ts')
    expect(install).toContain('==UserScript==')
    expect(install).toContain('@name')
    expect(install).toContain('/src/main.ts')

    const virtual = await server.transformRequest('virtual:vite-userscript-plugin')
    expect(virtual?.code).toContain('"name":"HTML App"')
    expect(virtual?.code).toContain('"file":"html-app.dev.user.js"')
    expect(virtual?.code).not.toContain('"fileName"')
  } finally {
    await server.close()
  }
})

it('virtual module uses a custom fileName from the plugin config', async () => {
  const server = await createServer({
    root: join(fixtures, 'html'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      userscript({
        entry: 'src/main.ts',
        fileName: 'custom-landing',
        header: {
          name: 'Not The File Name',
          version: '2.0.0',
          match: 'https://example.com/*',
        },
      }),
    ],
  })

  try {
    await server.listen()
    const virtual = await server.transformRequest('virtual:vite-userscript-plugin')

    expect(virtual?.code).toContain('"name":"Not The File Name"')
    expect(virtual?.code).toContain('"version":"2.0.0"')
    expect(virtual?.code).toContain('"file":"custom-landing.dev.user.js"')
    expect(virtual?.code).not.toContain('"fileName"')
    expect(virtual?.code).not.toContain('Not-The-File-Name')
  } finally {
    await server.close()
  }
})
