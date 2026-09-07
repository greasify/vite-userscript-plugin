import type { HeaderConfig, ResolvedExternal, UserscriptExternal } from '../types.js'
import { toIdentifier } from '../names.js'

export function resolveExternals(external?: UserscriptExternal): ResolvedExternal[] {
  if (!external) {
    return []
  }

  return Object.entries(external).map(([specifier, value]) => {
    if (typeof value === 'string') {
      return {
        specifier,
        url: value,
        global: toIdentifier(specifier),
      }
    }

    return {
      specifier,
      url: value.url,
      global: value.global,
    }
  })
}

function toRequireList(value: HeaderConfig['require']): string[] {
  if (value == null) {
    return []
  }

  return Array.isArray(value) ? value.map(String) : [String(value)]
}

export function mergeRequireUrls(header: HeaderConfig, urls: string[]): HeaderConfig {
  if (!urls.length) {
    return header
  }

  const merged = [...toRequireList(header.require)]

  for (const url of urls) {
    if (!merged.includes(url)) {
      merged.push(url)
    }
  }

  return {
    ...header,
    require: merged,
  }
}

export function withExternalRequires(
  header: HeaderConfig,
  externals: readonly ResolvedExternal[],
): HeaderConfig {
  return mergeRequireUrls(header, externals.map(item => item.url))
}

function normalizeNamedImports(inner: string): string {
  return inner
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      if (!trimmed) {
        return trimmed
      }

      const asMatch = trimmed.match(/^([a-z_$][\w$]*)\s+as\s+([a-z_$][\w$]*)$/i)
      if (asMatch) {
        return `${asMatch[1]}: ${asMatch[2]}`
      }

      return trimmed
    })
    .filter(Boolean)
    .join(', ')
}

const IDENT = '([a-z_$][\\w$]*)'
const IDENT_FLAGS = 'i'

export function rewriteImportClause(clause: string, globalName: string): string {
  const trimmed = clause.trim()
  const star = trimmed.match(new RegExp(`^\\*\\s+as\\s+${IDENT}$`, IDENT_FLAGS))
  if (star?.[1]) {
    return star[1] === globalName ? '' : `const ${star[1]} = ${globalName};`
  }

  const defaultStar = trimmed.match(new RegExp(`^${IDENT}\\s*,\\s*\\*\\s+as\\s+${IDENT}$`, IDENT_FLAGS))
  if (defaultStar?.[1] && defaultStar[2]) {
    const lines = [
      defaultStar[1] === globalName ? '' : `const ${defaultStar[1]} = ${globalName};`,
      defaultStar[2] === globalName ? '' : `const ${defaultStar[2]} = ${globalName};`,
    ].filter(Boolean)
    return lines.join(' ')
  }

  const defaultNamed = trimmed.match(new RegExp(`^${IDENT}\\s*,\\s*\\{([^}]+)\\}$`, IDENT_FLAGS))
  if (defaultNamed?.[1] && defaultNamed[2] != null) {
    const named = `const { ${normalizeNamedImports(defaultNamed[2])} } = ${globalName};`
    if (defaultNamed[1] === globalName) {
      return named
    }

    return `const ${defaultNamed[1]} = ${globalName}; ${named}`
  }

  const named = trimmed.match(/^\{([^}]+)\}$/)
  if (named?.[1] != null) {
    return `const { ${normalizeNamedImports(named[1])} } = ${globalName};`
  }

  if (/^[a-z_$][\w$]*$/i.test(trimmed)) {
    return trimmed === globalName ? '' : `const ${trimmed} = ${globalName};`
  }

  return `const ${trimmed} = ${globalName};`
}

export function rewriteExternalImports(code: string, externals: readonly ResolvedExternal[]): string {
  let next = code

  for (const { specifier, global: globalName } of externals) {
    const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const quoted = `["']${escaped}["']`

    next = next.replace(
      new RegExp(`(^|\\n)import\\s*${quoted}\\s*;?`, 'g'),
      '$1',
    )
    next = next.replace(
      new RegExp(`(^|\\n)import\\s+type\\s+[\\s\\S]*?\\s+from\\s*${quoted}\\s*;?`, 'g'),
      '$1',
    )
    next = next.replace(
      new RegExp(`(^|\\n)import\\s+([\\s\\S]*?)\\s+from\\s*${quoted}\\s*;?`, 'g'),
      (_match, lead: string, clause: string) => {
        const rewritten = rewriteImportClause(clause, globalName)
        return rewritten ? `${lead}${rewritten}` : lead
      },
    )
  }

  return next
}

export function mergeRolldownExternal(user: unknown, specifiers: string[]): unknown {
  if (!specifiers.length) {
    return user
  }

  if (typeof user === 'function') {
    const specSet = new Set(specifiers)
    return (id: string, importer: string | undefined, isResolved: boolean) => {
      if (specSet.has(id)) {
        return true
      }

      return (user as (id: string, importer: string | undefined, isResolved: boolean) => unknown)(
        id,
        importer,
        isResolved,
      )
    }
  }

  let list: unknown[] = []
  if (Array.isArray(user)) {
    list = [...user]
  } else if (user != null) {
    list = [user]
  }

  return [...list, ...specifiers]
}
