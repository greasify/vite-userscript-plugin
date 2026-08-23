import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { expect, it } from 'vitest'
import Userscript from '../src/index.js'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))
const VLQ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function decodeVlq(segment: string) {
  const values: number[] = []
  let value = 0
  let shift = 0

  for (const char of segment) {
    let digit = VLQ.indexOf(char)
    const hasContinue = (digit & 32) !== 0
    digit &= 31
    value += digit << shift

    if (hasContinue) {
      shift += 5
      continue
    }

    values.push(value & 1 ? -(value >> 1) : value >> 1)
    value = 0
    shift = 0
  }

  return values
}

function originalPositionFor(mappings: string, generatedLine: number, generatedColumn: number) {
  let originalLine = 0
  let originalColumn = 0
  let match: { column: number, line: number } | null = null

  for (const [index, line] of mappings.split(';').entries()) {
    let generatedCol = 0

    for (const segment of line ? line.split(',') : []) {
      const decoded = decodeVlq(segment)
      generatedCol += decoded[0] ?? 0
      if (decoded[2] != null) {
        originalLine += decoded[2]
      }
      if (decoded[3] != null) {
        originalColumn += decoded[3]
      }
      if (index === generatedLine && generatedCol <= generatedColumn) {
        match = { line: originalLine, column: originalColumn }
      }
    }

    if (index === generatedLine) {
      return match
    }
  }
}

function decodeInlineSourceMap(code: string) {
  const match = code.match(/sourceMappingURL=data:application\/json[^,]*;base64,(\S+)/)
  if (!match?.[1]) {
    return null
  }

  return JSON.parse(Buffer.from(match[1], 'base64').toString('utf8')) as {
    mappings: string
    sources?: string[]
    sourcesContent?: (string | null)[]
  }
}

it('serve sourcemap keeps throw on its original line after GM-shim', async () => {
  const sourcePath = join(fixtures, 'overlay/src/main.ts')
  const source = await readFile(sourcePath, 'utf8')
  const originalThrowLine = source.split('\n').findIndex(line => line.includes('throw new Error'))
  const originalThrowColumn = source.split('\n')[originalThrowLine]?.indexOf('throw') ?? 0

  expect(originalThrowLine).toBeGreaterThan(0)
  expect(source.split('\n')[originalThrowLine]).toContain('throw')

  const server = await createServer({
    root: join(fixtures, 'overlay'),
    configFile: false,
    logLevel: 'silent',
    plugins: [
      Userscript({
        entry: 'src/main.ts',
        fileName: 'overlay',
        header: {
          name: 'Overlay',
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

    const generated = await (await fetch(new URL('/src/main.ts', origin))).text()
    const generatedThrowLine = generated.split('\n').findIndex(line => line.includes('throw new Error'))
    const generatedThrowColumn = generated.split('\n')[generatedThrowLine]?.indexOf('throw') ?? 0
    const map = decodeInlineSourceMap(generated)

    expect(generatedThrowLine).toBeGreaterThan(0)
    expect(map?.mappings).toBeTruthy()

    const original = originalPositionFor(
      map!.mappings,
      generatedThrowLine,
      generatedThrowColumn,
    )

    expect(original).toEqual({
      line: originalThrowLine,
      column: originalThrowColumn,
    })
    expect(source.split('\n')[original?.line ?? -1]).not.toContain('createCounter')
  } finally {
    await server.close()
  }
})
