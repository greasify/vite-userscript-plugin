import getPort from 'get-port'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openLink from 'open'
import colors from 'picocolors'
import sanitize from 'sanitize-filename'
import serveHandler from 'serve-handler'
import { PluginOption, ResolvedConfig, createLogger } from 'vite'
import { server } from 'websocket'
import type { connection } from 'websocket'
import { banner } from './banner.js'
import { grants, regexpScripts, regexpStyles } from './constants.js'
import css from './css.js'
import { defineGrants, removeDuplicates, transform } from './helpers.js'
import type { UserscriptPluginConfig } from './types.js'

export type { UserscriptPluginConfig }

export default function UserscriptPlugin(
  config: UserscriptPluginConfig
): PluginOption {
  let pluginConfig: ResolvedConfig
  let isBuildWatch: boolean
  let socketConnection: connection | null = null

  const logger = createLogger('info', {
    prefix: '[vite-userscript-plugin]',
    allowClearScreen: true
  })

  const httpServer = createServer((req, res) => {
    return serveHandler(req, res, {
      public: pluginConfig.build.outDir
    })
  })

  const WebSocketServer = server
  const ws = new WebSocketServer({ httpServer })
  ws.on('request', (request) => {
    socketConnection = request.accept(null, request.origin)
  })

  return {
    name: 'vite-userscript-plugin',
    apply: 'build',
    config() {
      return {
        build: {
          lib: {
            entry: config.entry,
            name: config.header.name,
            formats: ['iife'],
            fileName: () => `${config.header.name}.js`
          },
          rollupOptions: {
            output: {
              extend: true
            }
          }
        }
      }
    },
    async configResolved(cfg) {
      pluginConfig = cfg
      isBuildWatch = (cfg.build.watch ?? false) as boolean

      const { name, match, require, include, exclude, resource, connect } =
        config.header

      config.entry = resolve(cfg.root, config.entry)
      config.header.name = sanitize(name)
      config.header.match = removeDuplicates(match)
      config.header.require = removeDuplicates(require)
      config.header.include = removeDuplicates(include)
      config.header.exclude = removeDuplicates(exclude)
      config.header.resource = removeDuplicates(resource)
      config.header.connect = removeDuplicates(connect)
      config.autoGrants = config.autoGrants ?? true
      config.server = {
        port: await getPort(),
        open: true,
        ...config.server
      }
    },
    async transform(src: string, path: string) {
      let code = src

      if (regexpStyles.test(path)) {
        code = await css.add(src, path)
      }

      if (path.includes(config.entry)) {
        code = src + '__STYLE__'
      }

      return {
        code,
        map: null
      }
    },
    generateBundle(_, bundle) {
      for (const [_, file] of Object.entries(bundle)) {
        const modules = Object.keys(
          (file as unknown as { modules: string[] }).modules
        )

        const cssModules = modules.filter((module) => regexpStyles.test(module))

        if (cssModules.length > 0) {
          css.merge(cssModules)
        }
      }
    },
    async writeBundle(_, bundle) {
      const { open, port } = config.server!
      const proxyFilename = `${config.header.name}.proxy.user.js`

      for (const [fileName] of Object.entries(bundle)) {
        if (regexpScripts.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir
          const userFilename = `${config.header.name}.user.js`

          const outPath = resolve(rootDir, outDir, fileName)
          const proxyFilePath = resolve(rootDir, outDir, proxyFilename)
          const userFilePath = resolve(rootDir, outDir, userFilename)
          const hotReloadPath = resolve(
            dirname(fileURLToPath(import.meta.url)),
            `hot-reload-${config.header.name}.js`
          )

          try {
            let source = readFileSync(outPath, 'utf8')

            // prettier-ignore
            config.header.grant = removeDuplicates(
              isBuildWatch
                ? grants
                : config.autoGrants ?? true
                  ? defineGrants(source)
                  : [...(config.header.grant ?? []), 'GM_addStyle', 'GM_info']
            )
            // prettier-ignore-end

            if (isBuildWatch) {
              const hotReloadFile = readFileSync(
                resolve(
                  dirname(fileURLToPath(import.meta.url)),
                  'hot-reload.js'
                ),
                'utf8'
              )

              const hotReloadScript = await transform({
                file: hotReloadFile.replace('__WS__', `ws://localhost:${port}`),
                name: hotReloadPath,
                loader: 'js'
              })

              writeFileSync(hotReloadPath, hotReloadScript)
              writeFileSync(
                proxyFilePath,
                banner({
                  ...config.header,
                  require: [
                    ...config.header.require!,
                    'file://' + hotReloadPath,
                    'file://' + outPath
                  ]
                })
              )
            }

            source = source.replace('__STYLE__', `${css.inject()}`)
            source = await transform({
              file: source,
              name: fileName,
              loader: 'js'
            })

            writeFileSync(outPath, source)
            writeFileSync(userFilePath, `${banner(config.header)}\n\n${source}`)
          } catch (err) {
            console.log(err)
          }
        }
      }

      if (isBuildWatch && !httpServer.listening) {
        const link = `http://localhost:${port}`
        httpServer.listen(port, () => {
          logger.clearScreen('info')
          logger.info(colors.blue(`Running at: ${colors.gray(link)}`))
        })

        if (open) {
          await openLink(`${link}/${proxyFilename}`)
        }
      } else if (!isBuildWatch) {
        httpServer.close()
        process.exit(0)
      }
    },
    buildEnd() {
      if (isBuildWatch) {
        logger.clearScreen('info')

        if (socketConnection) {
          socketConnection.sendUTF(
            JSON.stringify({
              message: 'reload'
            })
          )
        }
      }
    }
  }
}
