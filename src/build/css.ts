import type { OutputBundle, OutputChunk } from './bundle.js'
import { isAsset, isChunk } from './bundle.js'

const defaultCssInjector = `(function (css) {
  var style = document.createElement('style')
  style.textContent = css
  ;(document.head || document.documentElement).appendChild(style)
})`

function collectImportedCss(chunk: OutputChunk, bundle: OutputBundle, seen = new Set<string>()): string[] {
  const files = [...(chunk.viteMetadata?.importedCss ?? [])]

  for (const imported of chunk.imports) {
    if (seen.has(imported)) {
      continue
    }

    const dep = bundle[imported]
    if (!dep || !isChunk(dep) || dep.isEntry) {
      continue
    }

    seen.add(imported)
    files.push(...collectImportedCss(dep, bundle, seen))
  }

  return files
}

export function collectCss(chunk: OutputChunk, bundle: OutputBundle): { css: string, files: string[] } {
  const files = [...new Set(collectImportedCss(chunk, bundle))]
  if (!files.length) {
    return { css: '', files }
  }

  const css = files
    .map((file) => {
      const asset = bundle[file]
      return asset && isAsset(asset) ? String(asset.source) : ''
    })
    .filter(Boolean)
    .join('\n')

  return { css, files }
}

export function createCssInject(css: string): string {
  return `${defaultCssInjector}(${JSON.stringify(css)});\n`
}
