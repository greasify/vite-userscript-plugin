const VLQ_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Tampermonkey keeps the generated line and then uses its last mapping.
 * A minified line therefore attributes every throw to whichever statement
 * happens to end that line. Breaking after statement semicolons, and after
 * commas that move to another original line, makes that last mapping belong
 * to the statement that actually ran.
 */
const MAX_LINE = 200

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

function decodeVlq(segment: string): number[] {
  const values: number[] = []
  let value = 0
  let shift = 0

  for (const char of segment) {
    let digit = VLQ_ALPHABET.indexOf(char)
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

function canStartRegex(line: string, index: number): boolean {
  for (let i = index - 1; i >= 0; i--) {
    const char = line[i] ?? ''
    if (char === ' ' || char === '\t') {
      continue
    }
    return '([{:;,=!?&|+-*%^~<>'.includes(char)
  }
  return true
}

interface ScanState {
  blockComment: boolean
  brace: number
  bracket: number
  escaped: boolean
  interpolationBraces: number[]
  paren: number
  quote: '\'' | '"' | '`' | null
}

function scanLine(line: string, state: ScanState): number[] {
  const breaks: number[] = []

  for (let i = 0; i < line.length; i++) {
    const char = line[i] ?? ''
    const next = line[i + 1]

    if (state.blockComment) {
      if (char === '*' && next === '/') {
        state.blockComment = false
        i++
      }
      continue
    }

    if (state.escaped) {
      state.escaped = false
      continue
    }

    if (state.quote === '`' && char === '$' && next === '{') {
      state.interpolationBraces.push(state.brace)
      state.brace++
      state.quote = null
      i++
      continue
    }

    if (state.quote) {
      if (char === '\\') {
        state.escaped = true
        continue
      }
      if (char === state.quote) {
        state.quote = null
      }
      continue
    }

    if (char === '/' && next === '/') {
      break
    }
    if (char === '/' && next === '*') {
      state.blockComment = true
      i++
      continue
    }
    if (char === '/' && canStartRegex(line, i)) {
      i++
      let inClass = false
      for (; i < line.length; i++) {
        const regexChar = line[i] ?? ''
        if (state.escaped) {
          state.escaped = false
          continue
        }
        if (regexChar === '\\') {
          state.escaped = true
          continue
        }
        if (regexChar === '[') {
          inClass = true
        } else if (regexChar === ']') {
          inClass = false
        } else if (regexChar === '/' && !inClass) {
          break
        }
      }
      state.escaped = false
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      state.quote = char
      continue
    }

    if (char === '(') {
      state.paren++
    } else if (char === ')') {
      state.paren = Math.max(0, state.paren - 1)
    } else if (char === '[') {
      state.bracket++
    } else if (char === ']') {
      state.bracket = Math.max(0, state.bracket - 1)
    } else if (char === '{') {
      state.brace++
    } else if (char === '}') {
      state.brace = Math.max(0, state.brace - 1)
      if (state.interpolationBraces.length && state.brace === state.interpolationBraces.at(-1)) {
        state.interpolationBraces.pop()
        state.quote = '`'
      }
    } else if (
      (char === ';' || char === ',')
      && state.paren === 0
      && state.bracket === 0
      && state.interpolationBraces.length === 0
      && i < line.length - 1
    ) {
      breaks.push(i)
    }
  }

  return breaks
}

/**
 * Keeps a break only when a later mapping on this line moves to another
 * original line. Column is ignored: Tampermonkey reports the last mapping
 * of the generated line, so two original lines cannot share one.
 */
function separatingBreaks(mapLine: string, candidates: number[]): number[] {
  if (!mapLine || !candidates.length) {
    return []
  }

  const points: { changed: boolean, col: number }[] = []
  let absolute = 0

  for (const raw of mapLine.split(',')) {
    const values = decodeVlq(raw)
    absolute += values[0] ?? 0
    points.push({
      changed: values.length >= 4 && ((values[1] ?? 0) !== 0 || (values[2] ?? 0) !== 0),
      col: absolute,
    })
  }

  const kept: number[] = []
  let candidate = 0
  let lastSplit = -1
  let pending = -1

  for (const point of points) {
    while (candidate < candidates.length && (candidates[candidate] ?? 0) < point.col) {
      const at = candidates[candidate] ?? 0
      if (at > lastSplit) {
        pending = at
      }
      candidate++
    }

    if (point.changed && pending > lastSplit) {
      kept.push(pending)
      lastSplit = pending
      pending = -1
    }
  }

  return kept
}

function splitCode(line: string, breaks: number[]): string[] {
  const parts: string[] = []
  let start = 0

  for (const at of breaks) {
    parts.push(line.slice(start, at + 1))
    start = at + 1
  }
  parts.push(line.slice(start))
  return parts
}

function splitMappings(mapLine: string, breaks: number[]): string[] {
  const parts: string[][] = Array.from({ length: breaks.length + 1 }, () => [])
  let absolute = 0
  let part = 0
  let lineStart = 0
  let previousAbsolute = 0

  for (const raw of mapLine ? mapLine.split(',') : []) {
    const values = decodeVlq(raw)
    absolute += values[0] ?? 0

    while (part < breaks.length && absolute > (breaks[part] ?? 0)) {
      part++
      lineStart = (breaks[part - 1] ?? 0) + 1
      previousAbsolute = lineStart
    }

    const columnOnLine = absolute - lineStart
    const previousOnLine = previousAbsolute - lineStart
    values[0] = columnOnLine - previousOnLine
    parts[part]?.push(values.map(value => encodeVlq(value)).join(''))
    previousAbsolute = absolute
  }

  return parts.map(segments => segments.join(','))
}

export function breakLongMappedLines(
  code: string,
  mappings: string,
  maxLine = MAX_LINE,
): { code: string, mappings: string } {
  const codeLines = code.split('\n')
  const mapLines = mappings.split(';')
  const nextCode: string[] = []
  const nextMap: string[] = []
  const state: ScanState = {
    blockComment: false,
    brace: 0,
    bracket: 0,
    escaped: false,
    interpolationBraces: [],
    paren: 0,
    quote: null,
  }

  for (const [index, line] of codeLines.entries()) {
    const mapLine = mapLines[index] ?? ''
    const breaks = scanLine(line, state)
    const separated = separatingBreaks(mapLine, breaks)
    const usedBreaks = line.length > maxLine ? breaks : separated

    if (!usedBreaks.length) {
      nextCode.push(line)
      nextMap.push(mapLine)
      continue
    }

    nextCode.push(...splitCode(line, usedBreaks))
    nextMap.push(...splitMappings(mapLine, usedBreaks))
  }

  if (mapLines.length > codeLines.length) {
    nextMap.push(...mapLines.slice(codeLines.length))
  }

  return {
    code: nextCode.join('\n'),
    mappings: nextMap.join(';'),
  }
}
