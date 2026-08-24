import type { UserConfig } from 'vite'
import type { ResolvedScript } from './types.js'

import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { PLUGIN_NAME } from './constants.js'

export type InputMap = Record<string, string>

export function isHtmlPath(file: string): boolean {
  return /\.html?$/i.test(file.split('?')[0] ?? file)
}

export function entryNameFromPath(file: string): string {
  const name = basename(file.split('?')[0] ?? file).replace(/\.html?$/i, '')
  return name || 'index'
}

export function readUserBuildInput(userConfig: UserConfig): unknown {
  return userConfig.build?.rolldownOptions?.input ?? userConfig.build?.rollupOptions?.input
}

export function normalizeInput(input: unknown): InputMap {
  if (input == null) {
    return {}
  }

  if (typeof input === 'string') {
    return { [entryNameFromPath(input)]: input }
  }

  if (Array.isArray(input)) {
    const result: InputMap = {}
    for (const item of input) {
      if (typeof item === 'string') {
        result[entryNameFromPath(item)] = item
      }
    }
    return result
  }

  if (typeof input === 'object') {
    const result: InputMap = {}
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        result[key] = value
      }
    }
    return result
  }

  return {}
}

export function collectHtmlEntries(root: string, userInput: InputMap): InputMap {
  const html: InputMap = {}

  for (const [key, value] of Object.entries(userInput)) {
    if (isHtmlPath(value)) {
      html[key] = value
    }
  }

  const hasIndexHtml = Object.values(html).some(value => basename(value.split('?')[0] ?? value) === 'index.html')
  if (!hasIndexHtml && existsSync(resolve(root, 'index.html'))) {
    html.index = 'index.html'
  }

  return html
}

export function mergePluginInput(
  scripts: ResolvedScript[],
  userInput: InputMap,
  htmlEntries: InputMap,
): InputMap {
  const input: InputMap = { ...userInput, ...htmlEntries }

  for (const script of scripts) {
    const existing = input[script.fileName]
    if (existing != null && existing !== script.entry) {
      throw new Error(
        `[${PLUGIN_NAME}] HTML entry "${script.fileName}" collides with userscript fileName "${script.fileName}". Rename the userscript fileName.`,
      )
    }

    input[script.fileName] = script.entry
  }

  return input
}

export function resolvePluginBuildInput(
  userConfig: UserConfig,
  scripts: ResolvedScript[],
): { input: InputMap, hasHtml: boolean, root: string } {
  const root = resolve(userConfig.root ?? process.cwd())
  const userInput = normalizeInput(readUserBuildInput(userConfig))
  const htmlEntries = collectHtmlEntries(root, userInput)
  const input = mergePluginInput(scripts, userInput, htmlEntries)

  return {
    input,
    hasHtml: Object.keys(htmlEntries).length > 0,
    root,
  }
}
