import type {
  HeaderConfig,
  ResolvedPluginConfig,
  ResolvedScript,
  SourcemapTarget,
} from '../types.js'
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
import { rewriteExternalImports, withExternalRequires } from './external.js'
import {
  collectImportedChunkIds,
  inlineImportedChunks,
  rewriteInlinedDynamicImports,
} from './graph.js'
import {
  ensureIife,
  isAlreadyIife,
  requireStatementGuard,
  stripSourceMappingUrl,
} from './iife.js'
import {
  generateWatchProxy,
  toProxyFileName,
  toRequireFileName,
} from './proxy.js'
import { countRequirePrefixLines, listRequireUrls } from './require-offset.js'

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

function managerSourceMapOffset(target: SourcemapTarget): number {
  return target === 'tampermonkey' ? 2 : 0
}

function offsetUserscriptMap(options: {
  map: NonNullable<OutputChunk['map']>
  fileName: string
  cssPrelude: string
  inlined: string
  body: string
  headerPrefix?: string
  managerOffset?: number
  requirePrefixLines?: number
}) {
  const wrapOffset = isAlreadyIife(stripSourceMappingUrl(options.body)) ? 0 : 1
  const lineOffset = (options.managerOffset ?? 0)
    + (options.requirePrefixLines ?? 0)
    + countHeaderLines(options.headerPrefix ?? '')
    + countHeaderLines(options.cssPrelude)
    + wrapOffset
    + countHeaderLines(options.inlined)
  return stripVendorSourcesContent(offsetSourceMap(
    options.map,
    lineOffset,
    options.fileName,
  ))
}

function createHeadedUserscript(
  script: ResolvedScript,
  options: {
    body: string
    code: string
    cssPrelude: string
    inlined: string
    map?: OutputChunk['map']
    requirePrefixLines?: number
    wrapped: string
  },
): { code: string, headerConfig: HeaderConfig } {
  const headerConfig = resolveBuildHeader(
    withExternalRequires(script.header, script.external),
    options.wrapped,
  )
  const header = generateHeader(headerConfig, {
    align: script.headerAlign,
    autoMetaUrls: script.autoMetaUrls,
    fileName: script.fileName,
    generate: script.generate,
    mode: 'build',
  })
  const prefix = `${header}\n${requireStatementGuard}`
  const nextFileName = `${script.fileName}.user.js`
  let nextCode = `${prefix}${options.code}`

  if (options.map) {
    const map = offsetUserscriptMap({
      map: options.map,
      fileName: nextFileName,
      cssPrelude: options.cssPrelude,
      inlined: options.inlined,
      body: options.body,
      headerPrefix: prefix,
      managerOffset: managerSourceMapOffset(script.sourcemapTarget),
      requirePrefixLines: options.requirePrefixLines,
    })
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
  publicDir: string
  root: string
  warn: (message: string) => void
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
      for (const dep of collectImportedChunkIds(chunk, bundle)) {
        keptChunks.add(dep)
      }
    }
  }

  const keptCss = collectImportedCssFiles(keptChunks, bundle)
  const leftoverChunks: string[] = []
  const leftoverAssets: string[] = []

  for (const { fileName, chunk, script } of userscriptEntries) {
    const inlined = inlineImportedChunks(chunk, bundle)
    const { css, files: cssFiles } = collectCss(chunk, bundle)

    for (const cssFile of cssFiles) {
      if (!keptCss.has(cssFile)) {
        leftoverAssets.push(...withSourceMaps([cssFile]))
      }
    }

    const cssPrelude = css ? createCssInject(css) : ''
    const body = rewriteExternalImports(
      rewriteInlinedDynamicImports(`${inlined}${chunk.code}`, {
        chunk,
        bundle,
      }),
      script.external,
    )
    const wrapped = ensureIife(body)
    const code = `${cssPrelude}${wrapped}`
    const emitFileProxy = Boolean(
      context.emitProxy && context.outDir && script.server.file,
    )

    leftoverAssets.push(`${fileName}.map`)

    const requirePrefixLines = chunk.map
      ? countRequirePrefixLines(
          listRequireUrls(withExternalRequires(script.header, script.external).require),
          { publicDir: context.publicDir, root: context.root },
          context.warn,
        )
      : 0

    const headed = createHeadedUserscript(script, {
      body,
      code,
      cssPrelude,
      inlined,
      map: chunk.map,
      requirePrefixLines,
      wrapped,
    })

    if (emitFileProxy) {
      const requireName = toRequireFileName(script.fileName)
      let nextCode = `${requireStatementGuard}${code.endsWith('\n') ? code : `${code}\n`}`

      if (chunk.map) {
        chunk.map = offsetUserscriptMap({
          map: chunk.map,
          fileName: requireName,
          cssPrelude,
          inlined,
          body,
          headerPrefix: requireStatementGuard,
          managerOffset: managerSourceMapOffset(script.sourcemapTarget),
          requirePrefixLines,
        })
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
          align: script.headerAlign,
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
