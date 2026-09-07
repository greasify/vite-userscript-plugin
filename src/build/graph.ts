import type { OutputBundle, OutputChunk } from './bundle.js'
import { isChunk } from './bundle.js'

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

export function inlineImportedChunks(chunk: OutputChunk, bundle: OutputBundle): string {
  return walkImportedChunks(chunk, bundle)
    .map(({ chunk: dep }) => dep.code.endsWith('\n') ? dep.code : `${dep.code}\n`)
    .join('')
}

function namespaceLiteral(chunk: OutputChunk): string {
  const exports = chunk.exports ?? []
  const fields = exports.map((name) => {
    if (name === 'default') {
      return 'default: undefined'
    }

    return /^[a-z_$][\w$]*$/i.test(name) ? name : `${JSON.stringify(name)}: undefined`
  })

  return `{ ${fields.join(', ')} }`
}

function replaceDynamicImportCalls(code: string, fileName: string, namespace: string): string {
  const replacement = `Promise.resolve(${namespace})`
  const baseName = fileName.split('/').pop() ?? fileName
  const candidates = [fileName, `./${fileName}`, baseName, `./${baseName}`]
  let next = code

  for (const name of new Set(candidates)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    next = next.replace(
      new RegExp(`\\bimport\\s*\\(\\s*(?:/\\*[\\s\\S]*?\\*/\\s*)?(['"])${escaped}\\1\\s*\\)`, 'g'),
      replacement,
    )
  }

  return next
}

export function rewriteInlinedDynamicImports(
  code: string,
  chunk: OutputChunk,
  bundle: OutputBundle,
): string {
  let next = code
  const seen = new Set<string>()

  const visit = (current: OutputChunk): void => {
    for (const fileName of current.dynamicImports ?? []) {
      if (seen.has(fileName)) {
        continue
      }

      seen.add(fileName)
      const dep = bundle[fileName]
      if (!dep || !isChunk(dep)) {
        continue
      }

      visit(dep)
      next = replaceDynamicImportCalls(next, fileName, namespaceLiteral(dep))
    }
  }

  visit(chunk)

  if (next.includes('__vitePreload')) {
    return `function __vitePreload(fn){return fn();}\n${next}`
  }

  return next
}
