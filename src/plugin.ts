import type { Plugin, UserConfig, ViteDevServer } from 'vite'
import type { ResolvedPluginConfig, UserscriptPluginConfig } from './types.js'

import { resolve } from 'node:path'
import { build } from 'vite'
import { applyUserscriptBundle } from './build/apply.js'
import { mergeRolldownExternal } from './build/external.js'
import {
  createClientSnapshot,
  renderVirtualModule,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID,
} from './client.js'
import { PLUGIN_NAME } from './constants.js'
import { resolvePluginBuildInput } from './html.js'
import {
  collectConfigWarnings,
  resolvePluginConfig,
} from './resolve.js'
import {
  findResolvedExternal,
  listExternalSpecifiers,
  matchExternalModuleId,
  renderExternalModule,
  toExternalModuleId,
} from './serve/external.js'
import { shimModule, shouldShimModule } from './serve/gm-shim.js'
import { formatRebuildLine } from './serve/logger.js'
import { configureDevServer } from './serve/middleware.js'
import { hasReactRefreshPlugin } from './serve/react.js'
import { createDebouncedSingleFlight } from './serve/watch-queue.js'
import { toInstallPath } from './serve/wrapper.js'

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
  let isWatch = false
  let mode = 'production'
  let outDir = ''
  let fileWatchStarted = false

  const shouldEmitProxy = (): boolean => {
    return isWatch || mode === 'development'
  }

  const startFileWatchBuild = async (server: ViteDevServer): Promise<void> => {
    if (command === 'build' || fileWatchStarted) {
      return
    }

    fileWatchStarted = true
    const outDirAbs = resolve(server.config.root, server.config.build.outDir)
    let firstBuild = true

    const run = async (): Promise<void> => {
      const isRebuild = !firstBuild
      const started = Date.now()
      await build({
        configFile: server.config.configFile ?? false,
        root: server.config.root,
        mode: server.config.mode,
        logLevel: 'silent',
        clearScreen: false,
        plugins: server.config.configFile ? undefined : [UserscriptPlugin(config)],
        build: {
          outDir: server.config.build.outDir,
          emptyOutDir: firstBuild,
          minify: server.config.build.minify,
          sourcemap: server.config.build.sourcemap,
          write: true,
          reportCompressedSize: false,
        },
      })
      firstBuild = false
      if (isRebuild) {
        server.config.logger.info(formatRebuildLine(Date.now() - started), {
          timestamp: true,
        })
      }
    }

    try {
      await run()
    } catch (error) {
      fileWatchStarted = false
      server.config.logger.error(
        `[${PLUGIN_NAME}] Failed to start file-mode watch build`,
      )
      server.config.logger.error(String(error))
      return
    }

    const scheduler = createDebouncedSingleFlight(
      run,
      80,
      (error) => {
        server.config.logger.error(String(error))
      },
    )

    const onChange = (file: string): void => {
      if (file.startsWith(outDirAbs)) {
        return
      }

      scheduler.schedule()
    }

    server.watcher.on('change', onChange)
    server.watcher.on('add', onChange)

    let cleaned = false
    const cleanup = (): void => {
      if (cleaned) {
        return
      }

      cleaned = true
      scheduler.cancel()
      server.watcher.off('change', onChange)
      server.watcher.off('add', onChange)
    }

    server.httpServer?.once('close', cleanup)
    const closeServer = server.close.bind(server)
    server.close = async () => {
      cleanup()
      return closeServer()
    }
  }

  return [
    {
      name: `${PLUGIN_NAME}:config`,
      config(userConfig, env) {
        const { input, hasHtml } = resolvePluginBuildInput(userConfig, resolved.scripts)
        const scriptNames = new Set(resolved.scripts.map(script => script.fileName))

        userConfig.build ??= {}
        userConfig.build.rolldownOptions ??= {}
        userConfig.build.rolldownOptions.input = input

        const userOutput = userConfig.build.rolldownOptions.output
        const userEntryFileNames = userOutput && !Array.isArray(userOutput)
          ? userOutput.entryFileNames
          : undefined

        const openScript = resolved.scripts.find(script => script.server.open)
        const openPath = openScript?.server.open
          ? toInstallPath(openScript.fileName, openScript.server.open)
          : undefined

        const specifiers = listExternalSpecifiers(resolved.scripts)
        const rolldownOptions: NonNullable<NonNullable<UserConfig['build']>['rolldownOptions']> = {
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
        }

        if (env.command === 'build' && specifiers.length) {
          rolldownOptions.external = mergeRolldownExternal(
            userConfig.build.rolldownOptions.external,
            specifiers,
          ) as typeof rolldownOptions.external
        }

        return {
          appType: userConfig.appType ?? (hasHtml ? 'spa' : 'custom'),
          optimizeDeps: {
            entries: Object.values(input),
            exclude: [VIRTUAL_MODULE_ID, ...specifiers],
          },
          server: {
            cors: userConfig.server?.cors ?? true,
            ...(openPath ? { open: openPath } : {}),
          },
          build: {
            minify: userConfig.build?.minify ?? false,
            assetsInlineLimit: userConfig.build?.assetsInlineLimit ?? Number.MAX_SAFE_INTEGER,
            rolldownOptions,
          },
        }
      },
      configResolved(viteConfig) {
        command = viteConfig.command
        resolved = absolutizeEntries(resolved, viteConfig.root)
        reactPreamble = hasReactRefreshPlugin(viteConfig.plugins)

        for (const message of collectConfigWarnings(resolved, config)) {
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

        if (command === 'serve' && findResolvedExternal(resolved.scripts, id)) {
          return toExternalModuleId(id)
        }
      },
      load: (id) => {
        if (id === RESOLVED_VIRTUAL_MODULE_ID) {
          return renderVirtualModule(createClientSnapshot(resolved.scripts, command))
        }

        const specifier = matchExternalModuleId(id)
        if (!specifier) {
          return
        }

        const external = findResolvedExternal(resolved.scripts, specifier)
        if (!external) {
          return
        }

        return renderExternalModule(external.global)
      },
    },
    {
      name: `${PLUGIN_NAME}:serve`,
      apply: 'serve',
      configureServer(server) {
        configureDevServer(server, resolved, reactPreamble)

        if (resolved.scripts.some(script => script.server.file)) {
          startFileWatchBuild(server)
        }
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
      configResolved(viteConfig) {
        isWatch = Boolean(viteConfig.build.watch)
        mode = viteConfig.mode
        outDir = resolve(viteConfig.root, viteConfig.build.outDir)
      },
      generateBundle(_options, bundle) {
        isWatch = this.meta.watchMode || isWatch
        applyUserscriptBundle(bundle, resolved, {
          emitFile: (fileName, source) => {
            this.emitFile({
              type: 'asset',
              fileName,
              source,
            })
          },
          emitProxy: shouldEmitProxy(),
          outDir,
        })
      },
    },
  ]
}

export default UserscriptPlugin
