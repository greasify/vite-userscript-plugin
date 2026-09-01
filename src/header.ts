import type {
  HeaderConfig,
  HeaderGenerateContext,
  HeaderMode,
} from './types.js'
import { sanitizeFileName } from './names.js'

export interface HeaderOptions {
  align?: number | false
  autoMetaUrls?: boolean
  fileName?: string
  generate?: (ctx: HeaderGenerateContext) => string
  mode?: HeaderMode
}

const ABSOLUTE_URL_RE = /^[a-z][a-z0-9+.-]*:/i

const HOMEPAGE_RELATIVE_FIELDS = [
  'icon',
  'iconURL',
  'defaulticon',
  'icon64',
  'icon64URL',
  'require',
  'supportURL',
  'updateURL',
  'downloadURL',
] as const

function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

export function resolveHomePage(header: HeaderConfig): string | undefined {
  const homePage = header.homepage ?? header.homepageURL ?? header.website ?? header.source
  if (typeof homePage !== 'string') {
    return
  }

  const trimmed = homePage.trim()
  return trimmed === '' ? undefined : trimmed
}

export function isResolvableHeaderPath(value: string, field?: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (
    (field === 'updateURL' || field === 'downloadURL')
    && trimmed.toLowerCase() === 'none'
  ) {
    return false
  }

  if (ABSOLUTE_URL_RE.test(trimmed) || trimmed.startsWith('//') || trimmed.startsWith('/')) {
    return false
  }

  return true
}

function containsResolvableHeaderPath(value: unknown, field?: string): boolean {
  if (typeof value === 'string') {
    return isResolvableHeaderPath(value, field)
  }

  if (!Array.isArray(value)) {
    return false
  }

  return value.some(item => typeof item === 'string' && isResolvableHeaderPath(item, field))
}

function containsResolvableResourcePath(resource: unknown): boolean {
  if (!Array.isArray(resource)) {
    return false
  }

  return resource.some((item) => {
    return Array.isArray(item)
      && typeof item[1] === 'string'
      && isResolvableHeaderPath(item[1])
  })
}

export function listHomepageRelativeFields(header: HeaderConfig): string[] {
  const fields: string[] = []

  for (const key of HOMEPAGE_RELATIVE_FIELDS) {
    if (containsResolvableHeaderPath(header[key], key)) {
      fields.push(key)
    }
  }

  if (containsResolvableResourcePath(header.resource)) {
    fields.push('resource')
  }

  return fields
}

export function resolvePublicFileUrl(header: HeaderConfig, fileName: string): string | undefined {
  const homePage = resolveHomePage(header)
  if (!homePage) {
    return
  }

  try {
    return new URL(fileName, ensureTrailingSlash(homePage)).href
  } catch { }
}

function resolveHeaderUrlValue(header: HeaderConfig, value: unknown, field?: string): unknown {
  if (typeof value === 'string') {
    if (!isResolvableHeaderPath(value, field)) {
      return value
    }

    return resolvePublicFileUrl(header, value.trim()) ?? value
  }

  if (Array.isArray(value)) {
    return value.map(item => (
      typeof item === 'string'
        ? resolveHeaderUrlValue(header, item, field)
        : item
    ))
  }

  return value
}

function resolveResourceUrls(header: HeaderConfig, resource: unknown): HeaderConfig['resource'] {
  if (!Array.isArray(resource)) {
    return resource as HeaderConfig['resource']
  }

  return resource.map((item) => {
    if (!Array.isArray(item) || typeof item[1] !== 'string') {
      return item
    }

    const [key, url] = item
    if (!isResolvableHeaderPath(url)) {
      return item
    }

    const resolved = resolvePublicFileUrl(header, url.trim())
    return resolved ? [key, resolved] : item
  })
}

function applyHomepageRelativeUrls(header: HeaderConfig): HeaderConfig {
  if (!resolveHomePage(header)) {
    return header
  }

  const next: HeaderConfig = { ...header }

  for (const key of HOMEPAGE_RELATIVE_FIELDS) {
    if (next[key] != null) {
      Object.assign(next, {
        [key]: resolveHeaderUrlValue(next, next[key], key),
      })
    }
  }

  if (next.resource != null) {
    next.resource = resolveResourceUrls(next, next.resource)
  }

  return next
}

function applyAutoMetaUrls(header: HeaderConfig, fileName: string): HeaderConfig {
  const updateURL = header.updateURL ?? resolvePublicFileUrl(header, `${fileName}.meta.js`)
  const downloadURL = header.downloadURL ?? resolvePublicFileUrl(header, `${fileName}.user.js`)

  if (!updateURL && !downloadURL) {
    return header
  }

  return {
    ...header,
    ...(updateURL ? { updateURL } : {}),
    ...(downloadURL ? { downloadURL } : {}),
  }
}

function sanitizeMetaText(text: string): string {
  return text.replace(/[\r\n\u2028\u2029]+/g, ' ')
}

function formatValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return sanitizeMetaText(value.join(' '))
  }

  if (value === true) {
    return ''
  }

  if (typeof value === 'object') {
    return
  }

  return sanitizeMetaText(String(value))
}

export function generateHeader(config: HeaderConfig, options: HeaderOptions = {}): string {
  const fileName = options.fileName ?? sanitizeFileName(config.name)
  const withRelativeUrls = applyHomepageRelativeUrls({ ...config })
  const header = options.autoMetaUrls
    ? applyAutoMetaUrls(withRelativeUrls, fileName)
    : withRelativeUrls

  const keys = Object.keys(header).filter((key) => {
    const value = header[key]
    return value !== undefined && value !== null && value !== false
  })

  const align = options.align
  const maxKeyLength
    = align === false
      ? 0
      : Math.max(...keys.map(key => key.length), 0) + (align ?? 1)

  const pad = (key: string): string => {
    if (align === false) {
      return ' '
    }

    return ' '.repeat(Math.max(1, maxKeyLength - key.length))
  }

  const lines: string[] = []

  const addMetadata = (key: string, value: unknown): void => {
    const formatted = formatValue(value)
    if (formatted === undefined) {
      return
    }

    const safeKey = key.replace(/[\r\n\u2028\u2029]+/g, '')
    if (!safeKey) {
      return
    }

    lines.push(`// @${safeKey}${pad(key)}${formatted}`)
  }

  for (const key of keys) {
    const value = header[key]
    if (Array.isArray(value)) {
      value.forEach(item => addMetadata(key, item))
    } else {
      addMetadata(key, value)
    }
  }

  const userscript = [
    '// ==UserScript==',
    ...lines,
    '// ==/UserScript==',
  ].join('\n')

  if (!options.generate) {
    return userscript
  }

  return options.generate({
    userscript,
    mode: options.mode ?? 'build',
  })
}

export class Header {
  constructor(
    private readonly config: HeaderConfig,
    private readonly options: HeaderOptions = {},
  ) {}

  generate() {
    return generateHeader(this.config, this.options)
  }
}
