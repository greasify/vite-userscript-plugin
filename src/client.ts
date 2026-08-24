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
  const suffix = command === 'serve' ? '.dev.user.js' : '.user.js'

  return scripts.map(script => ({
    name: script.header.name,
    version: script.header.version,
    file: `${script.fileName}${suffix}`,
  }))
}

export function renderVirtualModule(scripts: ClientScript[]): string {
  return `export const scripts = ${JSON.stringify(scripts)}\n`
}
