import { GM_NAMESPACE, gmIdentifiers } from './constants.js'
import {
  countHeaderLines,
  identitySourceMap,
  offsetSourceMap,
} from './sourcemap.js'

export function shouldShimModule(id: string): boolean {
  const cleanId = id.split('\0').pop() ?? id

  if (cleanId.includes('node_modules')) {
    return false
  }

  if (/\.(?:css|scss|sass|less|styl|stylus|pcss)(?:$|\?)/i.test(cleanId)) {
    return false
  }

  if (/[?&](?:vue|svelte)&type=style/.test(cleanId)) {
    return false
  }

  if (/[?&](?:raw|url)(?:&|$)/.test(cleanId)) {
    return false
  }

  if (/\.(?:m|c)?[jt]sx?(?:$|\?)/.test(cleanId)) {
    return true
  }

  if (/[?&]vue&type=script/.test(cleanId) || cleanId.endsWith('.vue')) {
    return true
  }

  if (/[?&]svelte&type=script/.test(cleanId) || cleanId.endsWith('.svelte')) {
    return true
  }

  return false
}

export function createGmShimPrelude(): string {
  return `const { ${gmIdentifiers.join(', ')} } = globalThis.${GM_NAMESPACE} ?? globalThis;\n`
}

export function shimModule(code: string, id: string) {
  const prelude = createGmShimPrelude()

  return {
    code: `${prelude}${code}`,
    map: offsetSourceMap(identitySourceMap(code, id), countHeaderLines(prelude)),
  }
}
