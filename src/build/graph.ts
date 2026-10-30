import type { OutputBundle, OutputChunk } from './bundle.js'
import { isChunk } from './bundle.js'
import { stripExports, stripSourceMappingUrl } from './iife.js'

export function importedChunkIds(chunk: OutputChunk, includeDynamic = true): string[] {
  if (!includeDynamic) {
    return [...chunk.imports]
  }

  return [...chunk.imports, ...(chunk.dynamicImports ?? [])]
}

export function walkImportedChunks(
  chunk: OutputChunk,
  bundle: OutputBundle,
  options: { includeDynamic?: boolean } = {},
): { fileName: string, chunk: OutputChunk }[] {
  const includeDynamic = options.includeDynamic ?? true
  const result: { fileName: string, chunk: OutputChunk }[] = []
  const seen = new Set<string>()

  const visit = (current: OutputChunk): void => {
    for (const fileName of importedChunkIds(current, includeDynamic)) {
      if (seen.has(fileName)) {
        continue
      }

      const dep = bundle[fileName]
      if (!dep || !isChunk(dep) || dep.isEntry) {
        continue
      }

      seen.add(fileName)
      visit(dep)
      result.push({ fileName, chunk: dep })
    }
  }

  visit(chunk)
  return result
}

export function collectImportedChunkIds(
  chunk: OutputChunk,
  bundle: OutputBundle,
): Set<string> {
  return new Set(walkImportedChunks(chunk, bundle).map(item => item.fileName))
}

const NAMESPACE_PREFIX = '__vite_userscript_'
const IDENT = /^[A-Z_$][\w$]*$/i

interface Namespace {
  binding: string
  exported: string[]
}

export interface LinkedChunks {
  prelude: string
  code: string
}

interface ExportField {
  exported: string
  value: string
}

export function linkImportedChunks(chunk: OutputChunk, bundle: OutputBundle): LinkedChunks {
  const namespaces = new Map<string, Namespace>()
  const parts: string[] = []
  let index = 0

  for (const { fileName, chunk: dep } of walkImportedChunks(chunk, bundle)) {
    const binding = `${NAMESPACE_PREFIX}${index}`
    index += 1
    const linked = linkChunk(stripSourceMappingUrl(dep.code), binding, namespaces)
    rememberNamespace(namespaces, fileName, linked.namespace)
    parts.push(linked.code)
  }

  return {
    prelude: parts.join(''),
    code: rewriteModuleLinks(stripSourceMappingUrl(chunk.code), namespaces),
  }
}

export function inlineImportedChunks(chunk: OutputChunk, bundle: OutputBundle): string {
  return linkImportedChunks(chunk, bundle).prelude
}

export function rewriteInlinedDynamicImports(
  code: string,
  _options: {
    chunk: OutputChunk
    bundle: OutputBundle
  },
): string {
  if (!code.includes('__vitePreload')) {
    return code
  }

  return `function __vitePreload(fn){return fn();}\n${code}`
}

function linkChunk(
  code: string,
  binding: string,
  namespaces: Map<string, Namespace>,
): { code: string, namespace: Namespace } {
  const extracted = takeExports(rewriteModuleLinks(code, namespaces), namespaces)
  const namespace = {
    binding,
    exported: extracted.fields.map(field => field.exported),
  }
  const returned = extracted.fields.length
    ? `{ ${extracted.fields.map(field => `${identKey(field.exported)}: ${field.value}`).join(', ')} }`
    : '{}'

  return {
    namespace,
    code: `const ${binding} = (() => {\n${extracted.code.trim()}\nreturn ${returned};\n})();\n`,
  }
}

function rememberNamespace(
  namespaces: Map<string, Namespace>,
  fileName: string,
  namespace: Namespace,
): void {
  const base = fileName.split('/').pop() ?? fileName
  for (const key of [fileName, `./${fileName}`, base, `./${base}`]) {
    if (!namespaces.has(key)) {
      namespaces.set(key, namespace)
    }
  }
}

function findNamespace(specifier: string, namespaces: Map<string, Namespace>): Namespace | undefined {
  const cleaned = specifier.replace(/^\.\//, '')
  const base = cleaned.split('/').pop() ?? cleaned
  return namespaces.get(specifier)
    ?? namespaces.get(cleaned)
    ?? namespaces.get(`./${cleaned}`)
    ?? namespaces.get(base)
    ?? namespaces.get(`./${base}`)
}

function identKey(name: string): string {
  return IDENT.test(name) ? name : JSON.stringify(name)
}

function memberAccess(binding: string, name: string): string {
  return IDENT.test(name) ? `${binding}.${name}` : `${binding}[${JSON.stringify(name)}]`
}

function rewriteModuleLinks(code: string, namespaces: Map<string, Namespace>): string {
  return rewriteStaticImports(rewriteDynamicImports(code, namespaces), namespaces)
}

const DYNAMIC_IMPORT = /\bimport\s*\(\s*(?:\/\*[\s\S]*?\*\/\s*)?(['"])([^'"]+)\1\s*\)/
const SIDE_EFFECT_IMPORT = /(^|[;\n])([ \t]*)import\s*(['"])([^'"]+)\3\s*;?/
const STATIC_IMPORT = /(^|[;\n])([ \t]*)import(?![\w$])(?!\s*[.(])(?:\s+type)?([\s\S]*?)\s*from\s*(['"])([^'"]+)\4\s*;?/
const EXPORT_STAR = /\bexport\s*\*\s*from\s*(['"])([^'"]+)\1\s*;?/
const EXPORT_LIST = /\bexport\s*\{([^}]*)\}\s*(?:from\s*(['"])([^'"]+)\2)?\s*;?/

function replacePattern(
  code: string,
  pattern: RegExp,
  replacer: (match: string, groups: RegExpExecArray) => string,
): string {
  return code.replace(new RegExp(pattern.source, 'g'), (match) => {
    const groups = pattern.exec(match)
    return groups ? replacer(match, groups) : match
  })
}

function rewriteDynamicImports(code: string, namespaces: Map<string, Namespace>): string {
  return replacePattern(code, DYNAMIC_IMPORT, (match, groups) => {
    const specifier = groups[2]
    if (!specifier) {
      return match
    }

    const namespace = findNamespace(specifier, namespaces)
    if (!namespace) {
      return match
    }

    return `Promise.resolve(${namespace.binding})`
  })
}

function rewriteStaticImports(code: string, namespaces: Map<string, Namespace>): string {
  const withoutSideEffects = replacePattern(code, SIDE_EFFECT_IMPORT, (match, groups) => {
    const specifier = groups[4]
    if (!specifier || !findNamespace(specifier, namespaces)) {
      return match
    }

    return `${groups[1] ?? ''}${groups[2] ?? ''}`
  })

  return replacePattern(withoutSideEffects, STATIC_IMPORT, (match, groups) => {
    const specifier = groups[5]
    if (!specifier) {
      return match
    }

    const namespace = findNamespace(specifier, namespaces)
    if (!namespace) {
      return match
    }

    return `${groups[1] ?? ''}${groups[2] ?? ''}${rewriteLinkedImport(groups[3] ?? '', namespace.binding)}`
  })
}

function rewriteLinkedImport(clause: string, binding: string): string {
  const trimmed = clause.trim()
  if (!trimmed || trimmed.startsWith('type ')) {
    return ''
  }

  const star = trimmed.match(/^\*\s*as\s*([\w$]+)$/)
  if (star?.[1]) {
    return `const ${star[1]} = ${binding};`
  }

  const defStar = trimmed.match(/^([\w$]+)\s*,\s*\*\s*as\s*([\w$]+)$/)
  if (defStar?.[1] && defStar?.[2]) {
    return `const ${defStar[1]} = ${binding}.default; const ${defStar[2]} = ${binding};`
  }

  const defNamed = trimmed.match(/^([\w$]+)\s*,\s*\{([^}]*)\}$/)
  if (defNamed?.[1] && defNamed[2] != null) {
    const named = namedDestructure(defNamed[2], binding)
    return [`const ${defNamed[1]} = ${binding}.default;`, named].filter(Boolean).join(' ')
  }

  const named = trimmed.match(/^\{([^}]*)\}$/)
  if (named?.[1] != null) {
    return namedDestructure(named[1], binding)
  }

  if (/^[\w$]+$/.test(trimmed)) {
    return `const ${trimmed} = ${binding}.default;`
  }

  return ''
}

function namedDestructure(inner: string, binding: string): string {
  const fields = inner.split(',').flatMap((part) => {
    const trimmed = part.trim()
    if (!trimmed) {
      return []
    }

    const alias = trimmed.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
    if (alias?.[1] && alias?.[2]) {
      return [`${alias[1]}: ${alias[2]}`]
    }

    if (/^[\w$]+$/.test(trimmed)) {
      return [trimmed]
    }

    return []
  })

  if (!fields.length) {
    return ''
  }

  return `const { ${fields.join(', ')} } = ${binding};`
}

function takeExports(code: string, namespaces: Map<string, Namespace>): { code: string, fields: ExportField[] } {
  const fields = new Map<string, string>()
  const setField = (exported: string, value: string): void => {
    fields.set(exported, value)
  }

  let next = replacePattern(code, EXPORT_STAR, (match, groups) => {
    const specifier = groups[2]
    const namespace = specifier ? findNamespace(specifier, namespaces) : undefined
    if (!namespace) {
      return match
    }

    for (const name of namespace.exported) {
      if (name !== 'default' && !fields.has(name)) {
        fields.set(name, memberAccess(namespace.binding, name))
      }
    }

    return ''
  })

  next = replacePattern(next, EXPORT_LIST, (_match, groups) => {
    const specifier = groups[3]
    const namespace = specifier ? findNamespace(specifier, namespaces) : undefined
    for (const spec of parseExportList(groups[1] ?? '')) {
      if (!specifier) {
        setField(spec.exported, spec.local)
        continue
      }

      setField(
        spec.exported,
        namespace ? memberAccess(namespace.binding, spec.local) : 'undefined',
      )
    }

    return ''
  })

  next = next.replace(
    /\bexport\s+default\s+((?:async\s+)?function)\s+([\w$]+)/g,
    (_match, kind: string, name: string) => {
      setField('default', name)
      return `${kind} ${name}`
    },
  )
  next = next.replace(
    /\bexport\s+default\s+class\s+([\w$]+)/g,
    (_match, name: string) => {
      setField('default', name)
      return `class ${name}`
    },
  )
  next = next.replace(
    /\bexport\s+default\s+(?!function\b|class\b|async\b)([\w$]+)\s*;?/g,
    (_match, name: string) => {
      setField('default', name)
      return ''
    },
  )
  next = next.replace(
    /\bexport\s+(const|let|var|function|class|async\s+function)\s+([\w$]+)/g,
    (_match, kind: string, name: string) => {
      setField(name, name)
      return `${kind} ${name}`
    },
  )

  return {
    code: stripExports(next),
    fields: [...fields].map(([exported, value]) => ({ exported, value })),
  }
}

function parseExportList(inner: string): { local: string, exported: string }[] {
  return inner.split(',').flatMap((part) => {
    const trimmed = part.trim()
    if (!trimmed) {
      return []
    }

    const alias = trimmed.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
    if (alias?.[1] && alias?.[2]) {
      return [{ local: alias[1], exported: alias[2] }]
    }

    if (/^[\w$]+$/.test(trimmed)) {
      return [{ local: trimmed, exported: trimmed }]
    }

    return []
  })
}
