import type { BannerConfig } from './types.js'

export function banner(config: BannerConfig): string {
  const metadata: string[] = []
  const configKeys = Object.keys(config)
  const maxKeyLength = Math.max(...configKeys.map((key) => key.length)) + 1

  const addSpaces = (str: string): string => {
    return ' '.repeat(maxKeyLength - str.length)
  }

  const addMetadata = (
    key: string,
    value: string | boolean | undefined
  ): void => {
    metadata.push(`// @${key}${addSpaces(key)}${value}`)
  }

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      value.forEach((value) => addMetadata(key, value))
    } else {
      if (value === undefined) continue
      addMetadata(key, value.toString())
    }
  }

  return [
    '// ==UserScript==',
    ...metadata,
    '// ==/UserScript=='
  ].join('\n')
}
