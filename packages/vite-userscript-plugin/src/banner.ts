import type { PluginConfig } from './types.js'

export function banner(config: PluginConfig) {
  const metadata: string[] = []
  const configKeys = Object.keys(config)
  const maxKeyLength = Math.max(...configKeys.map((key) => key.length)) + 1

  const pushFragment = (key: string, value: string | boolean | undefined) => {
    metadata.push(`// @${key}${addSpaces(key, maxKeyLength)}${value}`)
  }

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      value.forEach((value) => pushFragment(key, value))
    } else {
      pushFragment(key, value)
    }
  }

  return [
    '// ==UserScript==',
    ...metadata,
    '// ==/UserScript=='
  ].join('\n')
}

function addSpaces(key: string, lg: number) {
  return ' '.repeat(lg - key.length)
}
