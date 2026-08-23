import type {
  BannerGenerateContext,
  BannerMode,
  HeaderConfig,
} from './types.js'
import { sanitizeFileName } from './names.js'

export interface BannerOptions {
  align?: number | false
  autoMetaUrls?: boolean
  fileName?: string
  generate?: (ctx: BannerGenerateContext) => string
  mode?: BannerMode
}

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

export function resolvePublicFileUrl(
  header: HeaderConfig,
  fileName: string,
): string | undefined {
  const homePage = resolveHomePage(header)
  if (!homePage) return

  try {
    return new URL(fileName, ensureTrailingSlash(homePage)).href
  } catch { }
}

function applyAutoMetaUrls(
  header: HeaderConfig,
  fileName: string,
): HeaderConfig {
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

export function generateBanner(config: HeaderConfig, options: BannerOptions = {}): string {
  const fileName = options.fileName ?? sanitizeFileName(config.name)
  const header = options.autoMetaUrls
    ? applyAutoMetaUrls({ ...config }, fileName)
    : { ...config }

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

export class Banner {
  constructor(
    private readonly config: HeaderConfig,
    private readonly options: BannerOptions = {},
  ) {}

  generate() {
    return generateBanner(this.config, this.options)
  }
}
