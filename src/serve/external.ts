import type { ResolvedExternal, ResolvedScript } from '../types.js'
import { PLUGIN_NAME } from '../constants.js'

export const EXTERNAL_MODULE_PREFIX = `\0${PLUGIN_NAME}:external:`

export function toExternalModuleId(specifier: string): string {
  return `${EXTERNAL_MODULE_PREFIX}${specifier}`
}

export function matchExternalModuleId(id: string): string | undefined {
  if (!id.startsWith(EXTERNAL_MODULE_PREFIX)) {
    return
  }

  return id.slice(EXTERNAL_MODULE_PREFIX.length)
}

export function findResolvedExternal(
  scripts: readonly ResolvedScript[],
  specifier: string,
): ResolvedExternal | undefined {
  for (const script of scripts) {
    const hit = script.external.find(item => item.specifier === specifier)
    if (hit) {
      return hit
    }
  }
}

export function listExternalSpecifiers(scripts: readonly ResolvedScript[]): string[] {
  return [...new Set(scripts.flatMap(script => script.external.map(item => item.specifier)))]
}

export function renderExternalModule(globalName: string): string {
  return `const api = globalThis[${JSON.stringify(globalName)}];\nexport default api;\n`
}
