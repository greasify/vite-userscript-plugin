import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import getPort from 'get-port'
import openLink from 'open'
import colors from 'picocolors'
import serveHandler from 'serve-handler'
import { createLogger, PluginOption, ResolvedConfig } from 'vite'
import { server } from 'websocket'
import { Banner } from './banner.js'
import {
  grants,
  pluginDir,
  pluginName,
  regexpScripts,
  regexpStyles,
  styleTemplate
} from './constants.js'
import css from './css.js'
import { defineGrants, removeDuplicates, transform } from './helpers.js'
import type { UserscriptPluginConfig } from './types.js'
import type { connection } from 'websocket'

export type { UserscriptPluginConfig }

export default function UserscriptPlugin(
  config: UserscriptPluginConfig
): PluginOption {
  try {
    let pluginConfig: ResolvedConfig
    let isBuildWatch: boolean
    let socketConnection: connection | null = null

    const fileName = config.fileName ?? config.header.name

    const logger = createLogger('info', {
      prefix: `[${pluginName}]`,
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
      name: pluginName,
      apply: 'build',
      config() {
        return {
          build: {
            target: 'esnext',
            minify: false,
            lib: {
              name: fileName,
              entry: config.entry,
              formats: ['iife'],
              fileName: () => `${fileName}.js`
            },
            rollupOptions: {
              output: {
                extend: true
              }
            }
          }
        }
      },
      async configResolved(userConfig) {
        pluginConfig = userConfig
        isBuildWatch = (userConfig.build.watch ?? false) as boolean
        config.entry = resolve(userConfig.root, config.entry)

        Array.from([
          'match',
          'require',
          'include',
          'exclude',
          'resource',
          'connect'
        ]).forEach((key) => {
          const value = config.header[key]
          config.header[key] = removeDuplicates(value)
        })

        config.server = {
          port: await getPort(),
          open: false,
          ...config.server
        }
      },
      async transform(src: string, path: string) {
        let code = src

        if (regexpStyles.test(path)) {
          code = await css.add(path, code, !isBuildWatch)
        }

        if (path.includes(config.entry)) {
          code = src + styleTemplate
        }

        return {
          code,
          map: null
        }
      },
      generateBundle(_, bundle) {
        for (const outputChunk of Object.values(bundle)) {
          if (outputChunk.type === 'asset') {
            continue
          }

          // prettier-ignore
          const styleModules = Object
            .keys(outputChunk.modules)
            .filter((module) => regexpStyles.test(module))

          if (styleModules.length) {
            css.merge(styleModules)
          }
        }
      },
      async writeBundle(output, bundle) {
        const { open, port } = config.server!
        const sanitizedFilename = output.sanitizeFileName(fileName)
        const userFilename = `${sanitizedFilename}.user.js`
        const proxyFilename = `${sanitizedFilename}.proxy.user.js`
        const metaFilename = `${sanitizedFilename}.meta.js`

        for (const [fileName] of Object.entries(bundle)) {
          if (regexpScripts.test(fileName)) {
            const rootDir = pluginConfig.root
            const outDir = pluginConfig.build.outDir

            const outPath = resolve(rootDir, outDir, fileName)
            const userFilePath = resolve(rootDir, outDir, userFilename)
            const proxyFilePath = resolve(rootDir, outDir, proxyFilename)
            const metaFilePath = resolve(rootDir, outDir, metaFilename)
            const wsPath = resolve(pluginDir, `ws-${sanitizedFilename}.js`)

            try {
              let source = readFileSync(outPath, 'utf8')
              source = source.replace(styleTemplate, `${css.inject()}`)
              source = await transform(
                {
                  minify: !isBuildWatch,
                  file: source,
                  name: fileName,
                  loader: 'js'
                },
                config.esbuildTransformOptions
              )

              config.header.grant = removeDuplicates(
                isBuildWatch
                  ? grants
                  : [...defineGrants(source), ...(config.header.grant ?? [])]
              )

              if (isBuildWatch) {
                const wsFile = readFileSync(resolve(pluginDir, 'ws.js'), 'utf8')

                const wsScript = await transform(
                  {
                    minify: !isBuildWatch,
                    file: wsFile.replace('__WS__', `ws://localhost:${port}`),
                    name: wsPath,
                    loader: 'js'
                  },
                  config.esbuildTransformOptions
                )

                writeFileSync(wsPath, wsScript)
                writeFileSync(
                  proxyFilePath,
                  new Banner({
                    ...config.header,
                    require: [
                      ...(config.header.require ?? []),
                      'file://' + wsPath,
                      'file://' + outPath
                    ]
                  }).generate()
                )
              }

              const banner = new Banner(config.header).generate()
              writeFileSync(outPath, source)
              writeFileSync(metaFilePath, banner)
              writeFileSync(userFilePath, `${banner}\n\n${source}`)
            } catch (err) {
              console.log(err)
            }
          }
        }

        if (isBuildWatch && !httpServer.listening) {
          const link = `http://localhost:${port}`
          httpServer.listen(port, () => {
            logger.clearScreen('info')
            logger.info(
              colors.bold(
                `${colors.cyan('>>> [vite-userscript-plugin]')} ${colors.gray(
                  link
                )}`
              )
            )
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
  } catch (err) {
    console.error(err)
    return {
      name: pluginName
    }
  }
}
