import { createServer } from 'node:http'
import getPort from 'get-port'
import openLink from 'open'
import colors from 'picocolors'
import serveHandler from 'serve-handler'
import { createLogger } from 'vite'
import { server } from 'websocket'
import type { ServerConfig, UserscriptPluginConfig } from '../types.js'
import type { PluginOption, ResolvedConfig } from 'vite'
import type { connection } from 'websocket'

export function serverPlugin(userConfig: UserscriptPluginConfig): PluginOption {
  let isBuildWatch: boolean
  let serverConfig: ServerConfig
  let resolvedConfig: ResolvedConfig
  let socketConnection: connection | null = null

  const logger = createLogger('info', {
    prefix: `[vite-userscript-plugin]`,
    allowClearScreen: true
  })

  const httpServer = createServer((req, res) => {
    return serveHandler(req, res, {
      public: resolvedConfig.build.outDir
    })
  })

  const WebSocketServer = server
  const ws = new WebSocketServer({ httpServer })
  ws.on('request', (request) => {
    socketConnection = request.accept(null, request.origin)
  })

  return {
    name: 'vite-userscript-plugin:server',
    async configResolved(config) {
      isBuildWatch = Boolean(config.build.watch)
      resolvedConfig = config
      serverConfig = {
        port: await getPort(),
        open: false,
        ...userConfig.server
      }
    },
    async writeBundle() {
      if (isBuildWatch && !httpServer.listening) {
        const linkToProxyScript = `http://localhost:${serverConfig.port}/${userConfig.header.name}.proxy.user.js`
        httpServer.listen(serverConfig.port, () => {
          logger.clearScreen('info')
          logger.info(
            colors.blue(`Running at: ${colors.gray(linkToProxyScript)}`)
          )
        })

        if (serverConfig.open) {
          await openLink(linkToProxyScript)
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
