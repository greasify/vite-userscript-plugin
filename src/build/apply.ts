import type { ResolvedPluginConfig, ResolvedScript } from '../types.js'
import type { OutputBundle, OutputChunk } from './bundle.js'

import { resolveBuildHeader } from '../grants/policy.js'
import { generateHeader } from '../header.js'
import {
  countHeaderLines,
  offsetSourceMap,
  stripVendorSourcesContent,
  toInlineSourceMappingUrl,
} from '../sourcemap.js'
import { isAsset, isChunk } from './bundle.js'
import { collectCss, createCssInject } from './css.js'
import { ensureIife, isAlreadyIife, stripSourceMappingUrl } from './iife.js'

function inlineImportedChunks(chunk: OutputChunk, bundle: OutputBundle, seen = new Set<string>()): string {
  let prelude = ''

  for (const imported of chunk.imports) {
    if (seen.has(imported)) {
      continue
    }

    const dep = bundle[imported]
    if (!dep || !isChunk(dep) || dep.isEntry) {
      continue
    }

    seen.add(imported)
    prelude += inlineImportedChunks(dep, bundle, seen)
    prelude += dep.code.endsWith('\n') ? dep.code : `${dep.code}\n`
  }

  return prelude
}

export function findScriptForChunk(chunk: OutputChunk, fileName: string, scripts: ResolvedScript[]): ResolvedScript | undefined {
  return scripts.find(
    script => chunk.name === script.fileName
      || fileName === `${script.fileName}.js`
      || fileName === `${script.fileName}.user.js`,
  )
}

function deleteBundleFiles(bundle: OutputBundle, fileNames: Iterable<string>): void {
  for (const fileName of fileNames) {
    delete bundle[fileName]
  }
}

function sweepNonUserscriptAssets(bundle: OutputBundle): void {
  for (const [fileName, item] of Object.entries(bundle)) {
    if (!isAsset(item)) {
      continue
    }

    if (fileName.endsWith('.css') || fileName.endsWith('.map')) {
      delete bundle[fileName]
    }
  }
}

export function applyUserscriptBundle(bundle: OutputBundle, config: ResolvedPluginConfig, emitMeta: (fileName: string, source: string) => void): void {
  const leftoverChunks: string[] = []
  const leftoverAssets: string[] = []

  for (const [fileName, item] of Object.entries(bundle)) {
    if (!isChunk(item) || !item.isEntry) {
      if (isChunk(item) && !item.isEntry) {
        leftoverChunks.push(fileName)
      }
      continue
    }

    const script = findScriptForChunk(item, fileName, config.scripts)
    if (!script) {
      continue
    }

    const inlined = stripSourceMappingUrl(inlineImportedChunks(item, bundle))
    const { css, files: cssFiles } = collectCss(item, bundle)
    leftoverAssets.push(...cssFiles)

    const cssPrelude = css ? createCssInject(css, script.cssInject) : ''
    const body = `${inlined}${item.code}`
    const wrapped = ensureIife(body)
    const extraGrants = css && script.cssInject === 'auto' ? (['GM_addStyle'] as const) : []
    const headerConfig = resolveBuildHeader(script.header, wrapped, extraGrants)
    const code = `${cssPrelude}${wrapped}`
    const header = generateHeader(headerConfig, {
      align: script.align,
      autoMetaUrls: script.autoMetaUrls,
      fileName: script.fileName,
      generate: script.generate,
      mode: 'build',
    })
    const prefix = `${header}\n\n`
    const nextFileName = `${script.fileName}.user.js`
    let nextCode = `${prefix}${code}`

    if (item.map) {
      const wrapOffset = isAlreadyIife(stripSourceMappingUrl(body)) ? 0 : 1
      const lineOffset = countHeaderLines(prefix)
        + countHeaderLines(cssPrelude)
        + wrapOffset
        + countHeaderLines(inlined)
      item.map = stripVendorSourcesContent(offsetSourceMap(
        item.map,
        lineOffset,
        nextFileName,
      ))
      nextCode = `${stripSourceMappingUrl(nextCode).replace(/\n+$/g, '\n')}//# sourceMappingURL=${toInlineSourceMappingUrl(item.map)}\n`
      leftoverAssets.push(`${fileName}.map`)
    }

    item.code = nextCode
    item.fileName = nextFileName

    if (script.metaFile) {
      emitMeta(
        `${script.fileName}.meta.js`,
        generateHeader(headerConfig, {
          align: script.align,
          autoMetaUrls: script.autoMetaUrls,
          fileName: script.fileName,
          generate: script.generate,
          mode: 'meta',
        }),
      )
    }
  }

  for (const fileName of leftoverChunks) {
    leftoverAssets.push(`${fileName}.map`)
  }

  deleteBundleFiles(bundle, leftoverChunks)
  deleteBundleFiles(bundle, leftoverAssets)
  sweepNonUserscriptAssets(bundle)
}
