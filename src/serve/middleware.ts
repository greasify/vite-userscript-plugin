import type { ViteDevServer } from 'vite'
import type { ResolvedPluginConfig } from '../types.js'

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateWatchProxy, toRequireFileName } from '../build/proxy.js'
import {
  createAfterLocalLogger,
  formatFaqHint,
  formatInstallLine,
} from './logger.js'
import {
  createReactBootstrapModule,
  matchReactBootstrap,
  matchReactPreamble,
  REACT_PREAMBLE_MODULE,
  resolveBootstrapEntry,
} from './react.js'
import {
  createDevUserscript,
  findDevScript,
  findFileUserscript,
  findProxyScript,
  toInstallUrl,
} from './wrapper.js'

export const DEV_SCRIPT_HEADERS = {
  'Content-Type': 'text/javascript; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

export function resolveServerOrigin(urls?: { local: string[], network: string[] } | null): string {
  const url = urls?.local[0] ?? urls?.network[0]
  return url ? url.replace(/\/$/, '') : 'http://localhost:5173'
}

function writeScript(res: { setHeader: (key: string, value: string) => void, end: (body?: string) => void }, body: string) {
  for (const [key, value] of Object.entries(DEV_SCRIPT_HEADERS)) {
    res.setHeader(key, value)
  }
  res.end(body)
}

export function configureDevServer(server: ViteDevServer, resolved: ResolvedPluginConfig, reactPreamble: boolean): void {
  server.middlewares.use((req, res, next) => {
    const url = req.url ?? ''
    if (matchReactPreamble(url)) {
      writeScript(res, REACT_PREAMBLE_MODULE)
      return
    }

    if (matchReactBootstrap(url)) {
      const entry = resolveBootstrapEntry(url)
      if (!entry) {
        res.statusCode = 400
        res.end()
        return
      }

      writeScript(res, createReactBootstrapModule(entry))
      return
    }

    const fileScript = findFileUserscript(url, resolved.scripts)
    if (fileScript) {
      const userJsPath = resolve(
        server.config.root,
        server.config.build.outDir,
        `${fileScript.fileName}.user.js`,
      )
      try {
        writeScript(res, readFileSync(userJsPath, 'utf8'))
      } catch {
        res.statusCode = 404
        res.end()
      }
      return
    }

    const proxyScript = findProxyScript(url, resolved.scripts)
    if (proxyScript) {
      const jsAbsPath = resolve(
        server.config.root,
        server.config.build.outDir,
        toRequireFileName(proxyScript.fileName),
      )
      writeScript(res, `${generateWatchProxy(proxyScript, jsAbsPath)}\n`)
      return
    }

    const script = findDevScript(url, resolved.scripts)
    if (!script) {
      next()
      return
    }

    const origin = resolveServerOrigin(server.resolvedUrls)
    writeScript(res, createDevUserscript({
      origin,
      root: server.config.root,
      script,
      reactPreamble,
    }))
  })

  const printUrls = server.printUrls.bind(server)
  server.printUrls = () => {
    const urls = server.resolvedUrls
    const info = server.config.logger.info.bind(server.config.logger)
    let origins: string[] = []
    if (urls) {
      origins = urls.local.length ? urls.local : urls.network
    }

    const printInstall = () => {
      for (const origin of origins) {
        for (const script of resolved.scripts) {
          if (script.server.file) {
            info(formatInstallLine(toInstallUrl(origin, script.fileName, 'user')))
            info(formatInstallLine(toInstallUrl(origin, script.fileName, 'proxy'), 'Proxy'))
            continue
          }

          info(formatInstallLine(toInstallUrl(origin, script.fileName)))
        }
      }
      info(formatFaqHint())
    }

    const logger = createAfterLocalLogger(
      info,
      urls?.local.length ?? 0,
      printInstall,
    )
    const previousInfo = server.config.logger.info
    server.config.logger.info = logger.info

    try {
      printUrls()
    } finally {
      server.config.logger.info = previousInfo
      logger.flush()
    }
  }
}
