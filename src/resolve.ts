import type {
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
  UserscriptConfig,
  UserscriptPluginConfig,
} from './types.js'
import { PLUGIN_NAME } from './constants.js'
import { listHomepageRelativeFields, resolveHomePage } from './header.js'
import { sanitizeFileName, toIdentifier } from './names.js'

function isEmptyHeaderField(value: unknown): boolean {
  if (value == null || value === '') {
    return true
  }

  return Array.isArray(value) && value.length === 0
}

function assertHeader(header: Partial<HeaderConfig>, label: string): void {
  for (const field of ['name', 'version', 'match'] as const) {
    if (isEmptyHeaderField(header[field])) {
      throw new Error(
        `[${PLUGIN_NAME}] ${label} is missing required header.${field}`,
      )
    }
  }
}

function toResolvedScript(config: UserscriptConfig): ResolvedScript {
  if (!config.entry) {
    throw new Error(`[${PLUGIN_NAME}] Provide an "entry" for each userscript`)
  }

  assertHeader(config.header ?? {}, config.entry)

  const fileName = sanitizeFileName(config.fileName ?? config.header.name)

  return {
    entry: config.entry,
    fileName,
    iifeName: toIdentifier(fileName),
    header: config.header,
    server: {
      open: config.server?.open ?? false,
      prefix: config.server?.prefix ?? 'server:',
      file: config.server?.file ?? false,
    },
    headerAlign: config.headerAlign ?? 1,
    generate: config.generate,
    autoMetaUrls: config.autoMetaUrls ?? false,
    metaFile: config.metaFile ?? true,
  }
}

export function collectAutoMetaUrlsWarnings(config: ResolvedPluginConfig): string[] {
  const warnings: string[] = []

  for (const script of config.scripts) {
    if (!script.autoMetaUrls) {
      continue
    }

    if (!script.metaFile) {
      warnings.push(
        `[${PLUGIN_NAME}] autoMetaUrls is enabled but metaFile is false for "${script.fileName}" — @updateURL points at a .meta.js that will not be emitted`,
      )
    }

    if (!resolveHomePage(script.header)) {
      warnings.push(
        `[${PLUGIN_NAME}] autoMetaUrls is enabled but "${script.fileName}" has no homepage, homepageURL, website, or source`,
      )
    }
  }

  return warnings
}

export function collectHomepageRelativeUrlWarnings(config: ResolvedPluginConfig): string[] {
  const warnings: string[] = []

  for (const script of config.scripts) {
    if (resolveHomePage(script.header)) {
      continue
    }

    const fields = listHomepageRelativeFields(script.header)
    if (!fields.length) {
      continue
    }

    warnings.push(
      `[${PLUGIN_NAME}] "${script.fileName}" has relative header URLs (${fields.join(', ')}) but no homepage, homepageURL, website, or source`,
    )
  }

  return warnings
}

export function collectConfigWarnings(config: ResolvedPluginConfig): string[] {
  return [
    ...collectAutoMetaUrlsWarnings(config),
    ...collectHomepageRelativeUrlWarnings(config),
  ]
}

export function resolvePluginConfig(config: UserscriptPluginConfig): ResolvedPluginConfig {
  const items = Array.isArray(config) ? config : [config]

  if (!items.length) {
    throw new Error(`[${PLUGIN_NAME}] Provide a userscript config or a non-empty array`)
  }

  const scripts = items.map(item => toResolvedScript(item))

  const names = new Set<string>()
  for (const script of scripts) {
    if (names.has(script.fileName)) {
      throw new Error(
        `[${PLUGIN_NAME}] Duplicate fileName "${script.fileName}"`,
      )
    }
    names.add(script.fileName)
  }

  return {
    scripts,
  }
}
