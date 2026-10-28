import type { ResolvedScript } from './types.js'

import { resolveHomePage } from './header.js'

export const VIRTUAL_MODULE_ID = 'virtual:vite-userscript-plugin'
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

export function resolveVirtualModuleId(importer?: string): string {
  if (!importer) {
    return RESOLVED_VIRTUAL_MODULE_ID
  }

  return `${RESOLVED_VIRTUAL_MODULE_ID}?importer=${encodeURIComponent(importer)}`
}

export function isResolvedVirtualModuleId(id: string): boolean {
  return id === RESOLVED_VIRTUAL_MODULE_ID || id.startsWith(`${RESOLVED_VIRTUAL_MODULE_ID}?`)
}

export interface ClientScript {
  name: string
  version: string
  file: string
  homepage?: string
}

export function createClientSnapshot(
  scripts: ResolvedScript[],
  command: 'serve' | 'build',
): ClientScript[] {
  return scripts.map((script) => {
    let suffix = '.dev.user.js'
    if (command === 'build') {
      suffix = '.user.js'
    } else if (script.server.file) {
      suffix = '.user.js'
    }

    const homepage = resolveHomePage(script.header)

    return {
      name: script.header.name,
      version: script.header.version,
      file: `${script.fileName}${suffix}`,
      ...(homepage ? { homepage } : {}),
    }
  })
}

export function renderVirtualModule(scripts: ClientScript[]): string {
  return `export const scripts = ${JSON.stringify(scripts)}\n`
}
