import type { Plugin } from 'vite'
import type { ResolvedPluginConfig, UserscriptPluginConfig } from './types.js'

import { resolve } from 'node:path'
import { applyUserscriptBundle } from './build/apply.js'
import {
  createClientSnapshot,
  renderVirtualModule,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from './client.js'
import { PLUGIN_NAME } from './constants.js'
import { resolvePluginBuildInput } from './html.js'
import {
  collectAutoMetaUrlsWarnings,
  resolvePluginConfig,
} from './resolve.js'
import { shimModule, shouldShimModule } from './serve/gm-shim.js'
import { configureDevServer } from './serve/middleware.js'
import { hasReactRefreshPlugin } from './serve/react.js'

function absolutizeEntries(
  config: ResolvedPluginConfig,
  root: string,
): ResolvedPluginConfig {
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
  let command: 'serve' | 'build' = 'serve'

  return [
    {
      name: `${PLUGIN_NAME}:config`,
      config(userConfig) {
        const { input, hasHtml } = resolvePluginBuildInput(userConfig, resolved.scripts)
        const scriptNames = new Set(resolved.scripts.map(script => script.fileName))

        userConfig.build ??= {}
        userConfig.build.rolldownOptions ??= {}
        userConfig.build.rolldownOptions.input = input

        const userOutput = userConfig.build.rolldownOptions.output
        const userEntryFileNames = userOutput && !Array.isArray(userOutput)
          ? userOutput.entryFileNames
          : undefined

        return {
          appType: userConfig.appType ?? (hasHtml ? 'spa' : 'custom'),
          optimizeDeps: {
            entries: Object.values(input),
            exclude: [VIRTUAL_MODULE_ID],
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
                entryFileNames: (chunkInfo) => {
                  if (scriptNames.has(chunkInfo.name)) {
                    return '[name].js'
                  }

                  if (typeof userEntryFileNames === 'function') {
                    return userEntryFileNames(chunkInfo)
                  }

                  if (typeof userEntryFileNames === 'string') {
                    return userEntryFileNames
                  }

                  return 'assets/[name]-[hash].js'
                },
              },
            },
          },
        }
      },
      configResolved(viteConfig) {
        command = viteConfig.command
        resolved = absolutizeEntries(resolved, viteConfig.root)
        reactPreamble = hasReactRefreshPlugin(viteConfig.plugins)

        for (const message of collectAutoMetaUrlsWarnings(resolved)) {
          viteConfig.logger.warn(message)
        }
      },
    },
    {
      name: `${PLUGIN_NAME}:virtual`,
      resolveId: (id) => {
        if (id === VIRTUAL_MODULE_ID) {
          return RESOLVED_VIRTUAL_MODULE_ID
        }
      },
      load: (id) => {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          return renderVirtualModule(createClientSnapshot(resolved.scripts, command))
        }
      },
    },
    {
      name: `${PLUGIN_NAME}:serve`,
      apply: 'serve',
      configureServer(server) {
        configureDevServer(server, resolved, reactPreamble)
      },
    },
    {
      name: `${PLUGIN_NAME}:gm-shim`,
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
      name: `${PLUGIN_NAME}:build`,
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
