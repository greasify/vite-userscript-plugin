import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

it('serve wraps ?worker as a data-URI module web worker', async () => {
  const server = await createServer({
    root: join(fixtures, 'web-worker'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      userscript({
        entry: 'src/main.ts',
        fileName: 'worker-app',
        header: {
          name: 'Worker App',
          version: '1.0.0',
          match: 'https://example.com/*',
        },
      }),
    ],
  })

  try {
    await server.listen()

    const worker = await server.transformRequest('/src/echo.ts?worker')
    expect(worker?.code).toContain('data:text/javascript')
    expect(worker?.code).toMatch(/import\.meta\[['"]url['"]\]/)
    expect(worker?.code).toContain('?worker_file&type=module')
    expect(worker?.code).toContain('function WorkerWrapper')

    const inline = await server.transformRequest('/src/echo.ts?worker&inline')
    expect(inline?.code).toContain('data:text/javascript')
    expect(inline?.code).toMatch(/import\.meta\[['"]url['"]\]/)
    expect(inline?.code).toContain('?worker_file&type=module')

    const url = await server.transformRequest('/src/echo.ts?worker&url')
    expect(url?.code).toBeTruthy()
    expect(url?.code).not.toContain('data:text/javascript')
    expect(url?.code).not.toMatch(/import\.meta\[['"]url['"]\]/)
    expect(url?.code).toContain('worker_file')
  } finally {
    await server.close()
  }
})
