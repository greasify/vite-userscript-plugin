import type { HeaderConfig, ResolvedScript } from '../types.js'

import { pathToFileURL } from 'node:url'
import { withServeGrants } from '../grants/policy.js'
import { generateHeader, prefixHeaderName } from '../header.js'
import { withExternalRequires } from './external.js'

export function toFileRequireUrl(absPath: string): string {
  return pathToFileURL(absPath).href
}

function toRequireList(value: HeaderConfig['require']): string[] {
  if (value == null) {
    return []
  }

  return Array.isArray(value) ? value.map(String) : [String(value)]
}

export function createWatchProxyHeader(
  script: ResolvedScript,
  jsAbsPath: string,
  namePrefix: string | false = script.server.prefix,
): HeaderConfig {
  const header = withServeGrants(withExternalRequires(
    prefixHeaderName(script.header, namePrefix),
    script.external,
  ))

  return {
    ...header,
    require: [...toRequireList(header.require), toFileRequireUrl(jsAbsPath)],
  }
}

export function generateWatchProxy(
  script: ResolvedScript,
  jsAbsPath: string,
  options: {
    namePrefix?: string | false
    serveOrigin?: string
  } = {},
): string {
  const namePrefix = options.namePrefix === undefined
    ? script.server.prefix
    : options.namePrefix

  return generateHeader(createWatchProxyHeader(script, jsAbsPath, namePrefix), {
    align: script.headerAlign,
    autoMetaUrls: false,
    fileName: script.fileName,
    generate: script.generate,
    mode: 'serve',
    serveOrigin: options.serveOrigin,
  })
}

export function toProxyFileName(fileName: string): string {
  return `${fileName}.proxy.user.js`
}

export function toRequireFileName(fileName: string): string {
  return `${fileName}.js`
}
