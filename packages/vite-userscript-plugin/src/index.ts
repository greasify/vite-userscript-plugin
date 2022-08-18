import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PluginOption, ResolvedConfig, transformWithEsbuild } from 'vite'
import { banner } from './banner.js'
import { regexpScripts, template } from './constants.js'
import css from './css.js'
import { removeDuplicates } from './helpers.js'
import type { PluginConfig } from './types.js'

function UserscriptPlugin(config: PluginConfig): PluginOption {
  let pluginConfig: ResolvedConfig

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
      const { match, require, include, exclude, resource, grant } =
        config.metadata
      config.metadata.match = removeDuplicates(match)
      config.metadata.require = removeDuplicates(require)
      config.metadata.include = removeDuplicates(include)
      config.metadata.exclude = removeDuplicates(exclude)
      config.metadata.resource = removeDuplicates(resource)
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

          const userFileName = resolve(
            rootDir,
            outDir,
            `${config.metadata.name}.user.js`
          )

          try {
            let file = readFileSync(filePath, {
              encoding: 'utf8'
            })

            file = file.replace(
              template,
              `
                ${css.inject()}
                const { script } = GM_info
                console.group(script.name + ' / ' + script.version)
                console.log(GM_info)
                console.groupEnd()
              `
            )

            const { code } = await transformWithEsbuild(file, fileName, {
              loader: 'js',
              minify: true
            })

            // source
            writeFileSync(filePath, code)

            // production
            writeFileSync(userFileName, `${banner(config.metadata)}\n\n${code}`)

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
    }
  }
}

export { UserscriptPlugin }
export default UserscriptPlugin
export type { PluginConfig }
