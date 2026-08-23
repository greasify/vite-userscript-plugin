import { Buffer } from 'node:buffer'

export interface OffsetSourceMap {
  file?: string
  mappings: string
  names?: string[]
  sources?: string[]
  sourcesContent?: (string | null)[]
  version: number
  [key: string]: unknown
}

export function countHeaderLines(prefix: string): number {
  if (!prefix) {
    return 0
  }

  return prefix.endsWith('\n')
    ? prefix.slice(0, -1).split('\n').length
    : prefix.split('\n').length
}

const VLQ_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function encodeVlq(value: number): string {
  let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1
  let encoded = ''

  do {
    let digit = vlq & 31
    vlq >>>= 5
    if (vlq > 0) {
      digit |= 32
    }
    encoded += VLQ_ALPHABET[digit]
  } while (vlq > 0)

  return encoded
}

function isTokenBoundary(line: string, index: number): boolean {
  if (index === 0) {
    return true
  }

  return /\w/.test(line[index] ?? '') !== /\w/.test(line[index - 1] ?? '')
}

export function identitySourceMap(code: string, file?: string): OffsetSourceMap {
  const lineCount = countHeaderLines(code)
  const sourceLines = code.split('\n')
  let previousOriginalLine = 0
  let previousOriginalColumn = 0

  const mappings = Array.from({ length: lineCount }, (_, originalLine) => {
    const line = sourceLines[originalLine] ?? ''
    let previousGeneratedColumn = 0
    const segments: string[] = []

    const emit = (column: number) => {
      segments.push(
        encodeVlq(column - previousGeneratedColumn)
        + encodeVlq(0)
        + encodeVlq(originalLine - previousOriginalLine)
        + encodeVlq(column - previousOriginalColumn),
      )
      previousGeneratedColumn = column
      previousOriginalLine = originalLine
      previousOriginalColumn = column
    }

    emit(0)
    for (let column = 1; column < line.length; column++) {
      if (isTokenBoundary(line, column)) {
        emit(column)
      }
    }

    return segments.join(',')
  }).join(';')

  return {
    version: 3,
    file,
    mappings,
    names: [],
    sources: file ? [file] : [],
  }
}

export function offsetSourceMap<T extends { mappings: string, file?: string }>(
  map: T,
  lineOffset: number,
  fileName?: string,
): T {
  if (lineOffset <= 0) {
    return fileName ? { ...map, file: fileName } : map
  }

  return {
    ...map,
    file: fileName ?? map.file,
    mappings: `${';'.repeat(lineOffset)}${map.mappings}`,
  }
}

export function isAppSource(source: string): boolean {
  return !source.includes('node_modules')
    && !source.includes('\0')
    && !source.startsWith('virtual:')
}

export function stripVendorSourcesContent<T extends {
  mappings: string
  sources?: (string | null)[]
  sourcesContent?: (string | null)[]
}>(map: T): T {
  const sources = map.sources ?? []

  return {
    ...map,
    sourcesContent: sources.map((source, index) => (
      isAppSource(source ?? '') ? map.sourcesContent?.[index] ?? null : null
    )),
  }
}

export function toInlineSourceMappingUrl(map: unknown): string {
  const encoded = Buffer.from(JSON.stringify(map)).toString('base64')
  return `data:application/json;charset=utf-8;base64,${encoded}`
}
