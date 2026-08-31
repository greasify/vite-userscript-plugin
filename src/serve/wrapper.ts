import type { HeaderOptions } from '../header.js'
import type { HeaderConfig, ResolvedScript } from '../types.js'

import { posix, relative, resolve, sep } from 'node:path'
import { toProxyFileName } from '../build/proxy.js'
import {
  GM_NAMESPACE,
  REACT_BOOTSTRAP_PATH,
  VITE_CLIENT_FLAG,
} from '../constants.js'
import { gmIdentifiers } from '../grants/catalog.js'
import { withServeGrants } from '../grants/policy.js'
import { generateHeader } from '../header.js'

export function matchDevUserscript(url: string, fileName: string): boolean {
  const path = url.split('?')[0] ?? ''
  return path === `/${fileName}.dev.user.js`
}

export function matchProxyUserscript(url: string, fileName: string): boolean {
  const path = url.split('?')[0] ?? ''
  return path === `/${toProxyFileName(fileName)}`
}

export function matchFileUserscript(url: string, fileName: string): boolean {
  const path = url.split('?')[0] ?? ''
  return path === `/${fileName}.user.js`
}

export type InstallKind = 'dev' | 'user' | 'proxy'

function toInstallFileName(fileName: string, kind: InstallKind): string {
  const names = {
    dev: `${fileName}.dev.user.js`,
    proxy: toProxyFileName(fileName),
    user: `${fileName}.user.js`,
  }

  return names[kind]
}

export function toInstallPath(fileName: string, kind: InstallKind = 'dev'): string {
  return `/${toInstallFileName(fileName, kind)}`
}

export function toInstallUrl(origin: string, fileName: string, kind: InstallKind = 'dev'): string {
  return `${origin.replace(/\/$/, '')}${toInstallPath(fileName, kind)}`
}

export function toServeEntryPath(root: string, entry: string): string {
  const absolute = resolve(root, entry)
  const rel = relative(root, absolute).split(sep).join(posix.sep)
  return `/${rel}`
}

export function applyServeHeader(header: HeaderConfig, prefix: string | false): HeaderConfig {
  const named: HeaderConfig = {
    ...header,
    name: prefix === false ? header.name : `${prefix}${header.name}`,
  }

  return withServeGrants(named)
}

export function generateDevWrapper(options: {
  origin: string
  entryPath: string
  reactPreamble?: boolean
}): string {
  const clientUrl = `${options.origin}/@vite/client`
  const entryUrl = `${options.origin}${options.entryPath}`
  const bootstrapUrl = `${options.origin}${REACT_BOOTSTRAP_PATH}?entry=${encodeURIComponent(options.entryPath)}`
  const copies = gmIdentifiers
    .map(
      id => `if (typeof ${id} !== 'undefined') gm.${id} = ${id};`,
    )
    .join('\n  ')
  const injectTarget = options.reactPreamble ? bootstrapUrl : entryUrl
  const clientInject = options.reactPreamble
    ? ''
    : `
  if (!root.${VITE_CLIENT_FLAG}) {
    root.${VITE_CLIENT_FLAG} = true;
    inject(${JSON.stringify(clientUrl)});
  }`

  return `(function () {
  var root = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  var gm = root.${GM_NAMESPACE} || {};
  ${copies}
  root.${GM_NAMESPACE} = gm;

  function inject(src) {
    var script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    (document.head || document.documentElement).appendChild(script);
  }
${clientInject}
  inject(${JSON.stringify(injectTarget)});
})();
`
}

export function generateDevUserscript(options: {
  script: ResolvedScript
  origin: string
  root: string
  prefix: string | false
  headerOptions: HeaderOptions
  reactPreamble?: boolean
}): string {
  const headerConfig = applyServeHeader(options.script.header, options.prefix)
  const header = generateHeader(headerConfig, {
    ...options.headerOptions,
    fileName: options.script.fileName,
    mode: 'serve',
  })
  const wrapper = generateDevWrapper({
    origin: options.origin,
    entryPath: toServeEntryPath(options.root, options.script.entry),
    reactPreamble: options.reactPreamble,
  })

  return `${header}\n\n${wrapper}`
}

export function findDevScript(url: string, scripts: ResolvedScript[]): ResolvedScript | undefined {
  return scripts.find(script => !script.server.file && matchDevUserscript(url, script.fileName))
}

export function findProxyScript(url: string, scripts: ResolvedScript[]): ResolvedScript | undefined {
  return scripts.find(script => script.server.file && matchProxyUserscript(url, script.fileName))
}

export function findFileUserscript(url: string, scripts: ResolvedScript[]): ResolvedScript | undefined {
  return scripts.find(script => script.server.file && matchFileUserscript(url, script.fileName))
}

export function createDevUserscript(options: {
  origin: string
  root: string
  script: ResolvedScript
  reactPreamble?: boolean
}): string {
  return generateDevUserscript({
    script: options.script,
    origin: options.origin,
    root: options.root,
    prefix: options.script.server.prefix,
    headerOptions: {
      align: options.script.headerAlign,
      autoMetaUrls: options.script.autoMetaUrls,
      generate: options.script.generate,
    },
    reactPreamble: options.reactPreamble,
  })
}
