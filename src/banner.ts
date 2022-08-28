import type { HeaderConfig } from './types.js'

export function banner(config: HeaderConfig): string {
  const header: string[] = []
  const configKeys = Object.keys(config)
  const maxKeyLength = Math.max(...configKeys.map((key) => key.length)) + 1

  const addSpaces = (str: string): string => {
    return ' '.repeat(maxKeyLength - str.length)
  }

  const addMetadata = (key: string, value: string | number | boolean): void => {
    const isBoolean = typeof value === 'boolean'
    if (isBoolean && !value) return
    value = !isBoolean ? addSpaces(key) + value.toString() : ''
    header.push(`// @${key}${value}`)
  }

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      value.forEach((value) => addMetadata(key, value))
    } else {
      if (value === undefined) continue
      addMetadata(key, value)
    }
  }

  return [
    '// ==UserScript==',
    ...header,
    '// ==/UserScript=='
  ].join('\n')
}
