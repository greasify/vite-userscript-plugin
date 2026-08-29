import type { ResolvedScript } from './types.js'

export const VIRTUAL_MODULE_ID = 'virtual:vite-userscript-plugin'
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

export interface ClientScript {
  name: string
  version: string
  file: string
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
      suffix = '.proxy.user.js'
    }

    return {
      name: script.header.name,
      version: script.header.version,
      file: `${script.fileName}${suffix}`,
    }
  })
}

export function renderVirtualModule(scripts: ClientScript[]): string {
  return `export const scripts = ${JSON.stringify(scripts)}\n`
}
