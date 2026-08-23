import type { Plugin } from 'vite'
import type { ResolvedPluginConfig, UserscriptPluginConfig } from './types.js'

import { resolve } from 'node:path'
import { applyUserscriptBundle } from './build/apply.js'
import { pluginName } from './constants.js'
import {
  collectAutoMetaUrlsWarnings,
  resolvePluginConfig,
} from './resolve.js'
import { shimModule, shouldShimModule } from './serve/gm-shim.js'
import { configureDevServer } from './serve/middleware.js'
import { hasReactRefreshPlugin } from './serve/react.js'

function absolutizeEntries(config: ResolvedPluginConfig, root: string): ResolvedPluginConfig {
  return {
    scripts: config.scripts.map(script => ({
      ...script,
      entry: resolve(root, script.entry),
    })),
  }
}

function UserscriptPlugin(config: UserscriptPluginConfig): Plugin[] {
  let resolved = resolvePluginConfig(config)
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
        resolved = absolutizeEntries(resolved, viteConfig.root)
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
        configureDevServer(server, resolved, reactPreamble)
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

export default UserscriptPlugin
