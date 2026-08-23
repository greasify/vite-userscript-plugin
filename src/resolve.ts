import type {
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
  UserscriptConfig,
  UserscriptPluginConfig,
} from './types.js'
import { pluginName } from './constants.js'
import { resolveHomePage } from './header.js'
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
        `[${pluginName}] ${label} is missing required header.${field}`,
      )
    }
  }
}

function toResolvedScript(config: UserscriptConfig): ResolvedScript {
  if (!config.entry) {
    throw new Error(`[${pluginName}] Provide an "entry" for each userscript`)
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
    },
    cssInject: config.cssInject ?? 'auto',
    align: config.align ?? 1,
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
        `[${pluginName}] autoMetaUrls is enabled but metaFile is false for "${script.fileName}" — @updateURL points at a .meta.js that will not be emitted`,
      )
    }

    if (!resolveHomePage(script.header)) {
      warnings.push(
        `[${pluginName}] autoMetaUrls is enabled but "${script.fileName}" has no homepage, homepageURL, website, or source`,
      )
    }
  }

  return warnings
}

export function resolvePluginConfig(config: UserscriptPluginConfig): ResolvedPluginConfig {
  const items = Array.isArray(config) ? config : [config]

  if (!items.length) {
    throw new Error(`[${pluginName}] Provide a userscript config or a non-empty array`)
  }

  const scripts = items.map(item => toResolvedScript(item))

  const names = new Set<string>()
  for (const script of scripts) {
    if (names.has(script.fileName)) {
      throw new Error(
        `[${pluginName}] Duplicate fileName "${script.fileName}"`,
      )
    }
    names.add(script.fileName)
  }

  return {
    scripts,
  }
}
