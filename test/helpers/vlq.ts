const VLQ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export function decodeVlq(segment: string) {
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

export function originalPositionFor(mappings: string, generatedLine: number, generatedColumn: number) {
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
