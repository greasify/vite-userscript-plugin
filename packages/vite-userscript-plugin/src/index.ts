import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PluginOption, ResolvedConfig } from 'vite'
import websocket from 'websocket'
import { banner } from './banner.js'
import { grants, regexpScripts, template } from './constants.js'
import css from './css.js'
import { defineGrants, removeDuplicates, transform } from './helpers.js'
import type { UserscriptPluginConfig } from './types.js'

function UserscriptPlugin(config: UserscriptPluginConfig): PluginOption {
  let pluginConfig: ResolvedConfig
  let isBuildWatch: boolean
  let socketConnection: websocket.connection | null = null

  const port = config.server?.port || 8000
  const server = createServer((_, res) => {
    // const index = resolve(
    //   dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.html'
    // )
    // res.writeHead(200, { 'Content-Type': 'html' })
    // res.end(readFileSync(index))
  })

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

      const { match, require, include, exclude, resource, connect } =
        config.metadata

      config.metadata.match = removeDuplicates(match)
      config.metadata.require = removeDuplicates(require)
      config.metadata.include = removeDuplicates(include)
      config.metadata.exclude = removeDuplicates(exclude)
      config.metadata.resource = removeDuplicates(resource)
      config.metadata.connect = removeDuplicates(connect)
    },
    async transform(code: string, path: string) {
      const style = await css.minify(code, path)
      return css.add(config.entry, style.replace('\n', ''), path)
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
      for (const [fileName] of Object.entries(bundle)) {
        if (regexpScripts.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir

          const outPath = resolve(rootDir, outDir, fileName)
          const hmrPath = resolve(rootDir, outDir, 'hmr.js')

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
              const hmrScript = await transform({
                file: `
                  ${readFileSync(
                  resolve(dirname(fileURLToPath(import.meta.url)), 'hmr.js'),
                  'utf8'
                )}
                `.replace('__PORT__', port.toString()),
                name: hmrPath,
                loader: 'js'
              })

              writeFileSync(hmrPath, hmrScript)
              writeFileSync(
                proxyFilePath,
                banner({
                  ...config.metadata,
                  require: [
                    ...config.metadata.require!,
                    'file://' + hmrPath,
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
