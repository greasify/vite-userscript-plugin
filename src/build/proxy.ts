import type { HeaderConfig, ResolvedScript } from '../types.js'

import { pathToFileURL } from 'node:url'
import { withServeGrants } from '../grants/policy.js'
import { generateHeader } from '../header.js'

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
): HeaderConfig {
  const header = withServeGrants({ ...script.header })

  return {
    ...header,
    require: [...toRequireList(header.require), toFileRequireUrl(jsAbsPath)],
  }
}

export function generateWatchProxy(
  script: ResolvedScript,
  jsAbsPath: string,
): string {
  return generateHeader(createWatchProxyHeader(script, jsAbsPath), {
    align: script.headerAlign,
    autoMetaUrls: false,
    fileName: script.fileName,
    generate: script.generate,
    mode: 'serve',
  })
}

export function toProxyFileName(fileName: string): string {
  return `${fileName}.proxy.user.js`
}

export function toRequireFileName(fileName: string): string {
  return `${fileName}.js`
}
