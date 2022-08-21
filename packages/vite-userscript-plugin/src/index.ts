import getPort from 'get-port'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sanitize from 'sanitize-filename'
import { PluginOption, ResolvedConfig } from 'vite'
import { server } from 'websocket'
import type { connection } from 'websocket'
import { banner } from './banner.js'
import { grants, regexpScripts, regexpStyles, template } from './constants.js'
import css from './css.js'
import { defineGrants, removeDuplicates, transform } from './helpers.js'
import type { UserscriptPluginConfig } from './types.js'

function UserscriptPlugin(config: UserscriptPluginConfig): PluginOption {
  let pluginConfig: ResolvedConfig
  let isBuildWatch: boolean
  let port: number | null = null
  let socketConnection: connection | null = null

  const httpServer = createServer()
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
            name: config.metadata.name,
            formats: ['iife'],
            fileName: () => `${config.metadata.name}.js`
          },
          rollupOptions: {
            output: {
              exports: 'none',
              extend: true
            }
          }
        }
      }
    },
    configResolved(cfg) {
      pluginConfig = cfg
      isBuildWatch = (cfg.build.watch ?? false) as boolean

      const { name, match, require, include, exclude, resource, connect } =
        config.metadata

      config.metadata.name = sanitize(name)
      config.metadata.match = removeDuplicates(match)
      config.metadata.require = removeDuplicates(require)
      config.metadata.include = removeDuplicates(include)
      config.metadata.exclude = removeDuplicates(exclude)
      config.metadata.resource = removeDuplicates(resource)
      config.metadata.connect = removeDuplicates(connect)
    },
    async transform(code: string, path: string) {
      if (regexpStyles.test(path)) {
        return {
          code: await css.add(code, path)
        }
      }

      if (path.includes(config.entry)) {
        return {
          code: code + template
        }
      }

      return null
    },
    generateBundle(_, bundle) {
      for (const [_, file] of Object.entries(bundle)) {
        const styleModules = Object.keys(
          (file as unknown as { modules: string[] }).modules
        )
        css.merge(styleModules)
      }
    },
    async writeBundle(_, bundle) {
      if (!port && isBuildWatch) {
        port = await getPort()
        httpServer.listen(port)
      }

      for (const [fileName] of Object.entries(bundle)) {
        if (regexpScripts.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir || 'dist'

          const outPath = resolve(rootDir, outDir, fileName)
          const hotReloadPath = resolve(
            dirname(fileURLToPath(import.meta.url)),
            `hot-reload-${config.metadata.name}.js`
          )

          const proxyFilePath = resolve(
            rootDir,
            outDir,
            `${config.metadata.name}.proxy.user.js`
          )

          const userFilePath = resolve(
            rootDir,
            outDir,
            `${config.metadata.name}.user.js`
          )

          try {
            let source = readFileSync(outPath, 'utf8')

            // prettier-ignore
            config.metadata.grant = removeDuplicates(
              isBuildWatch
                ? grants
                : config.autoGrants ?? true
                  ? defineGrants(source)
                  : [...(config.metadata.grant ?? []), 'GM_addStyle', 'GM_info']
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
                file: hotReloadFile.replace('__PORT__', port!.toString()),
                name: hotReloadPath,
                loader: 'js'
              })

              writeFileSync(hotReloadPath, hotReloadScript)
              writeFileSync(
                proxyFilePath,
                banner({
                  ...config.metadata,
                  require: [
                    ...config.metadata.require!,
                    'file://' + hotReloadPath,
                    'file://' + outPath
                  ]
                })
              )
            }

            source = source.replace(template, `${css.inject()}`)
            source = await transform({
              file: source,
              name: fileName,
              loader: 'js'
            })

            writeFileSync(outPath, source)
            writeFileSync(
              userFilePath,
              `${banner(config.metadata)}\n\n${source}`
            )
          } catch (err) {
            console.log(err)
          }
        }
      }

      if (!isBuildWatch) {
        httpServer.close()
        process.exit(0)
      }
    },
    buildEnd() {
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

export { UserscriptPlugin }
export default UserscriptPlugin
export type { UserscriptPluginConfig }
