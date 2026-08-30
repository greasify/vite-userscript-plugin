import type { Grants } from '../grants/types.js'
import type { HeaderConfig, ResolvedPluginConfig, ResolvedScript } from '../types.js'
import type { OutputBundle, OutputChunk } from './bundle.js'

import { resolve } from 'node:path'
import { resolveBuildHeader } from '../grants/policy.js'
import { generateHeader } from '../header.js'
import {
  countHeaderLines,
  offsetSourceMap,
  stripVendorSourcesContent,
  toInlineSourceMappingUrl,
} from '../sourcemap.js'
import { isChunk } from './bundle.js'
import { collectCss, createCssInject } from './css.js'
import {
  ensureIife,
  isAlreadyIife,
  stripSourceMappingUrl,
} from './iife.js'
import {
  generateWatchProxy,
  toProxyFileName,
  toRequireFileName,
} from './proxy.js'

function importedChunkIds(chunk: OutputChunk): string[] {
  return [...chunk.imports, ...(chunk.dynamicImports ?? [])]
}

function inlineImportedChunks(
  chunk: OutputChunk,
  bundle: OutputBundle,
  seen = new Set<string>(),
): string {
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

function collectImportedChunks(
  chunk: OutputChunk,
  bundle: OutputBundle,
): Set<string> {
  const files = new Set<string>()
  const walk = (current: OutputChunk) => {
    for (const imported of importedChunkIds(current)) {
      if (files.has(imported)) {
        continue
      }

      const dep = bundle[imported]
      if (!dep || !isChunk(dep) || dep.isEntry) {
        continue
      }

      files.add(imported)
      walk(dep)
    }
  }

  walk(chunk)
  return files
}

function collectImportedCssFiles(
  fileNames: Iterable<string>,
  bundle: OutputBundle,
): Set<string> {
  const files = new Set<string>()

  for (const fileName of fileNames) {
    const item = bundle[fileName]
    if (!item || !isChunk(item)) {
      continue
    }

    for (const cssFile of item.viteMetadata?.importedCss ?? []) {
      files.add(cssFile)
    }
  }

  return files
}

function withSourceMaps(fileNames: Iterable<string>): string[] {
  const files: string[] = []

  for (const fileName of fileNames) {
    files.push(fileName, `${fileName}.map`)
  }

  return files
}

export function findScriptForChunk(
  chunk: OutputChunk,
  fileName: string,
  scripts: ResolvedScript[],
): ResolvedScript | undefined {
  return scripts.find(
    script => chunk.name === script.fileName
      || fileName === `${script.fileName}.js`
      || fileName === `${script.fileName}.user.js`,
  )
}

function createHeadedUserscript(
  script: ResolvedScript,
  options: {
    body: string
    code: string
    cssPrelude: string
    extraGrants: readonly Grants[]
    inlined: string
    map?: OutputChunk['map']
    wrapped: string
  },
): { code: string, headerConfig: HeaderConfig } {
  const headerConfig = resolveBuildHeader(script.header, options.wrapped, options.extraGrants)
  const header = generateHeader(headerConfig, {
    align: script.align,
    autoMetaUrls: script.autoMetaUrls,
    fileName: script.fileName,
    generate: script.generate,
    mode: 'build',
  })
  const prefix = `${header}\n\n`
  const nextFileName = `${script.fileName}.user.js`
  let nextCode = `${prefix}${options.code}`

  if (options.map) {
    const wrapOffset = isAlreadyIife(stripSourceMappingUrl(options.body)) ? 0 : 1
    const lineOffset = countHeaderLines(prefix)
      + countHeaderLines(options.cssPrelude)
      + wrapOffset
      + countHeaderLines(options.inlined)
    const map = stripVendorSourcesContent(offsetSourceMap(
      options.map,
      lineOffset,
      nextFileName,
    ))
    nextCode = `${stripSourceMappingUrl(nextCode).replace(/\n+$/g, '\n')}//# sourceMappingURL=${toInlineSourceMappingUrl(map)}\n`
  }

  return {
    headerConfig,
    code: nextCode.endsWith('\n') ? nextCode : `${nextCode}\n`,
  }
}

function deleteBundleFiles(
  bundle: OutputBundle,
  fileNames: Iterable<string>,
): void {
  for (const fileName of fileNames) {
    delete bundle[fileName]
  }
}

export type ApplyUserscriptBundleContext = {
  emitFile: (fileName: string, source: string) => void
  emitProxy?: boolean
  outDir?: string
}

export function applyUserscriptBundle(
  bundle: OutputBundle,
  config: ResolvedPluginConfig,
  context: ApplyUserscriptBundleContext,
): void {
  const { emitFile } = context
  const userscriptEntries: {
    fileName: string
    chunk: OutputChunk
    script: ResolvedScript
  }[] = []
  const otherEntryFiles: string[] = []

  for (const [fileName, item] of Object.entries(bundle)) {
    if (!isChunk(item) || !item.isEntry) {
      continue
    }

    const script = findScriptForChunk(item, fileName, config.scripts)
    if (script) {
      userscriptEntries.push({ fileName, chunk: item, script })
    } else {
      otherEntryFiles.push(fileName)
    }
  }

  const keptChunks = new Set(otherEntryFiles)
  for (const fileName of otherEntryFiles) {
    const chunk = bundle[fileName]
    if (chunk && isChunk(chunk)) {
      for (const dep of collectImportedChunks(chunk, bundle)) {
        keptChunks.add(dep)
      }
    }
  }

  const keptCss = collectImportedCssFiles(keptChunks, bundle)
  const leftoverChunks: string[] = []
  const leftoverAssets: string[] = []

  for (const { fileName, chunk, script } of userscriptEntries) {
    const inlined = stripSourceMappingUrl(inlineImportedChunks(chunk, bundle))
    const { css, files: cssFiles } = collectCss(chunk, bundle)

    for (const cssFile of cssFiles) {
      if (!keptCss.has(cssFile)) {
        leftoverAssets.push(...withSourceMaps([cssFile]))
      }
    }

    const cssPrelude = css ? createCssInject(css, script.cssInject) : ''
    const body = `${inlined}${chunk.code}`
    const wrapped = ensureIife(body)
    const extraGrants = css && script.cssInject === 'auto' ? (['GM_addStyle'] as const) : []
    const code = `${cssPrelude}${wrapped}`
    const emitFileProxy = Boolean(
      context.emitProxy && context.outDir && script.server.file,
    )

    leftoverAssets.push(`${fileName}.map`)

    const headed = createHeadedUserscript(script, {
      body,
      code,
      cssPrelude,
      extraGrants,
      inlined,
      map: chunk.map,
      wrapped,
    })

    if (emitFileProxy) {
      const requireName = toRequireFileName(script.fileName)
      let nextCode = code.endsWith('\n') ? code : `${code}\n`

      if (chunk.map) {
        const wrapOffset = isAlreadyIife(stripSourceMappingUrl(body)) ? 0 : 1
        const lineOffset = countHeaderLines(cssPrelude)
          + wrapOffset
          + countHeaderLines(inlined)
        chunk.map = stripVendorSourcesContent(offsetSourceMap(
          chunk.map,
          lineOffset,
          requireName,
        ))
        nextCode = `${stripSourceMappingUrl(nextCode).replace(/\n+$/g, '\n')}//# sourceMappingURL=${toInlineSourceMappingUrl(chunk.map)}\n`
      }

      chunk.code = nextCode
      chunk.fileName = requireName
      emitFile(
        toProxyFileName(script.fileName),
        `${generateWatchProxy(script, resolve(context.outDir!, requireName))}\n`,
      )
      emitFile(`${script.fileName}.user.js`, headed.code)
      continue
    }

    chunk.code = headed.code
    chunk.fileName = `${script.fileName}.user.js`

    if (script.metaFile) {
      emitFile(
        `${script.fileName}.meta.js`,
        generateHeader(headed.headerConfig, {
          align: script.align,
          autoMetaUrls: script.autoMetaUrls,
          fileName: script.fileName,
          generate: script.generate,
          mode: 'meta',
        }),
      )
    }
  }

  for (const [fileName, item] of Object.entries(bundle)) {
    if (isChunk(item) && !item.isEntry && !keptChunks.has(fileName)) {
      leftoverChunks.push(fileName)
    }
  }

  leftoverAssets.push(...withSourceMaps(leftoverChunks))
  deleteBundleFiles(bundle, leftoverChunks)
  deleteBundleFiles(bundle, leftoverAssets)
}
