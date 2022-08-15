import type { PluginConfig } from './types.js'

export function banner(config: PluginConfig) {
  const bannerFragments = ['==UserScript==']

  const configKeys = Object.keys(config)
  const maxLenghtKey = configKeys.sort((a, b) => b.length - a.length)[0]!.length

  for (const [key, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        bannerFragments.push(`@${key}${addSpaces(key, maxLenghtKey)}${v}`)
      })
    } else {
      bannerFragments.push(`@${key}${addSpaces(key, maxLenghtKey)}${value}`)
    }
  }

  bannerFragments.push('==/UserScript==')
  return bannerFragments
    .map((fragment) => `// ${fragment}`)
    .join('\n')
}

function addSpaces(key: string, lg: number) {
  return ' '.repeat(lg - key.length + 1)
}
