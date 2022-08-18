import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PluginOption, ResolvedConfig, transformWithEsbuild } from 'vite'
import websocket from 'websocket'
import { banner } from './banner.js'
import { regexpScripts, template } from './constants.js'
import css from './css.js'
import { removeDuplicates } from './helpers.js'
import type { PluginConfig } from './types.js'

function UserscriptPlugin(config: PluginConfig): PluginOption {
  let pluginConfig: ResolvedConfig
  let socketConnection: websocket.connection | null = null

  const port = config.server?.port || 8000
  const server = createServer()
  server.listen(port)

  const WebSocketServer = websocket.server
  const ws = new WebSocketServer({ httpServer: server })
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
              extend: true
            }
          }
        }
      }
    },
    configResolved(cfg) {
      const { match, require, include, exclude, resource, connect, grant } =
        config.metadata
      config.metadata.match = removeDuplicates(match)
      config.metadata.require = removeDuplicates(require)
      config.metadata.include = removeDuplicates(include)
      config.metadata.exclude = removeDuplicates(exclude)
      config.metadata.resource = removeDuplicates(resource)
      config.metadata.connect = removeDuplicates(connect)
      config.metadata.grant = removeDuplicates([
        ...(grant ?? []),
        'GM_addStyle',
        'GM_info'
      ])
      pluginConfig = cfg
    },
    async transform(code: string, path: string) {
      const transformed = await css.minify(code, path)
      return css.add(config.entry, transformed.code.replace('\n', ''), path)
    },
    async writeBundle(options, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        if (regexpScripts.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir
          const filePath = resolve(rootDir, outDir, fileName)

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
            let file = readFileSync(filePath, {
              encoding: 'utf8'
            })

            const hmrScript = readFileSync(
              resolve(dirname(fileURLToPath(import.meta.url)), 'hmr.js'),
              'utf-8'
            )

            file = file.replace(
              template,
              `
                ${css.inject()}
                const port = ${port}
                ${hmrScript}
              `
            )

            const { code } = await transformWithEsbuild(file, fileName, {
              loader: 'js',
              minify: true
            })

            // source
            writeFileSync(filePath, code)

            // production
            writeFileSync(userFilePath, `${banner(config.metadata)}\n\n${code}`)

            // development
            writeFileSync(
              proxyFilePath,
              banner({
                ...config.metadata,
                require: [...config.metadata.require!, 'file://' + filePath]
              })
            )
          } catch (err) {
            console.log(err)
          }
        }
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
export type { PluginConfig }
