import type { Plugin } from 'vite'

import type { UserscriptPluginConfig } from './types.js'

import { resolve } from 'node:path'
import openLink from 'open'
import { applyUserscriptBundle } from './build.js'
import { pluginName } from './constants.js'
import { shimModule, shouldShimModule } from './gm-shim.js'
import {
  collectAutoMetaUrlsWarnings,
  resolvePluginConfig,
} from './resolve.js'
import {
  createAfterLocalLogger,
  createDevUserscript,
  createReactBootstrapModule,
  DEV_SCRIPT_HEADERS,
  findDevScript,
  formatFaqHint,
  formatInstallLine,
  hasReactRefreshPlugin,
  matchReactBootstrap,
  matchReactPreamble,
  REACT_PREAMBLE_MODULE,
  resolveBootstrapEntry,
  toInstallUrl,
} from './serve.js'

export {
  generateHeader,
  Header,
  resolveHomePage,
  resolvePublicFileUrl,
} from './header.js'

export type {
  CssInject,
  HeaderConfig,
  HeaderGenerateContext,
  ResolvedScript,
  ServerConfig,
  UserscriptConfig,
  UserscriptPluginConfig,
} from './types.js'

function resolveServerOrigin(urls?: { local: string[], network: string[] } | null): string {
  const url = urls?.local[0] ?? urls?.network[0]
  return url ? url.replace(/\/$/, '') : 'http://localhost:5173'
}

export default function UserscriptPlugin(
  config: UserscriptPluginConfig,
): Plugin[] {
  const resolved = resolvePluginConfig(config)
  let reactPreamble = false

  return [
    {
      name: `${pluginName}:config`,
      config(userConfig) {
        const input = Object.fromEntries(
          resolved.scripts.map(script => [script.fileName, script.entry]),
        )

        return {
          appType: userConfig.appType ?? 'custom',
          optimizeDeps: {
            entries: resolved.scripts.map(script => script.entry),
          },
          server: {
            cors: userConfig.server?.cors ?? true,
          },
          build: {
            minify: userConfig.build?.minify ?? false,
            assetsInlineLimit: userConfig.build?.assetsInlineLimit ?? Number.MAX_SAFE_INTEGER,
            rolldownOptions: {
              input,
              output: {
                format: 'es',
                entryFileNames: '[name].js',
              },
            },
          },
        }
      },
      configResolved(viteConfig) {
        for (const script of resolved.scripts) {
          script.entry = resolve(viteConfig.root, script.entry)
        }
        reactPreamble = hasReactRefreshPlugin(viteConfig.plugins)

        for (const message of collectAutoMetaUrlsWarnings(resolved)) {
          viteConfig.logger.warn(message)
        }
      },
    },
    {
      name: `${pluginName}:serve`,
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? ''
          if (matchReactPreamble(url)) {
            for (const [key, value] of Object.entries(DEV_SCRIPT_HEADERS)) {
              res.setHeader(key, value)
            }
            res.end(REACT_PREAMBLE_MODULE)
            return
          }

          if (matchReactBootstrap(url)) {
            const entry = resolveBootstrapEntry(url)
            if (!entry) {
              res.statusCode = 400
              res.end()
              return
            }

            for (const [key, value] of Object.entries(DEV_SCRIPT_HEADERS)) {
              res.setHeader(key, value)
            }
            res.end(createReactBootstrapModule(entry))
            return
          }

          const script = findDevScript(url, resolved.scripts)
          if (!script) {
            next()
            return
          }

          const origin = resolveServerOrigin(server.resolvedUrls)
          const body = createDevUserscript({
            origin,
            root: server.config.root,
            script,
            reactPreamble,
          })

          for (const [key, value] of Object.entries(DEV_SCRIPT_HEADERS)) {
            res.setHeader(key, value)
          }
          res.end(body)
        })

        const printUrls = server.printUrls.bind(server)
        server.printUrls = () => {
          const urls = server.resolvedUrls
          const info = server.config.logger.info.bind(server.config.logger)
          let origins: string[] = []
          if (urls) {
            origins = urls.local.length ? urls.local : urls.network
          }

          function printInstall() {
            for (const origin of origins) {
              for (const script of resolved.scripts) {
                info(formatInstallLine(toInstallUrl(origin, script.fileName)))
              }
            }
            info(formatFaqHint())
          };

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

        server.httpServer?.once('listening', () => {
          const toOpen = resolved.scripts.filter(script => script.server.open)
          if (!toOpen.length) {
            return
          }

          queueMicrotask(() => {
            const origin = resolveServerOrigin(server.resolvedUrls)
            for (const script of toOpen) {
              void openLink(toInstallUrl(origin, script.fileName))
            }
          })
        })
      },
    },
    {
      name: `${pluginName}:gm-shim`,
      apply: 'serve',
      transform: {
        filter: {
          id: {
            exclude: [/node_modules/],
          },
        },
        handler(code, id) {
          if (!shouldShimModule(id)) {
            return null
          }

          return shimModule(code, id)
        },
      },
    },
    {
      name: `${pluginName}:build`,
      apply: 'build',
      enforce: 'post',
      generateBundle(_options, bundle) {
        applyUserscriptBundle(bundle, resolved, (fileName, source) => {
          this.emitFile({
            type: 'asset',
            fileName,
            source,
          })
        })
      },
    },
  ]
}
