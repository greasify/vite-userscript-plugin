import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PluginOption, ResolvedConfig, transformWithEsbuild } from 'vite'
import { banner } from './banner.js'
import { regexpScripts, template } from './constants.js'
import css from './css.js'
import grant from './grant.js'
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
            name: config.banner.name,
            formats: ['iife'],
            fileName: () => `${config.banner.name}.js`
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
      config.banner.grant = grant.merge(config.banner.grant)
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
            `${config.banner.name}.proxy.user.js`
          )

          const userFileName = resolve(
            rootDir,
            outDir,
            `${config.banner.name}.user.js`
          )

          try {
            let file = readFileSync(filePath, {
              encoding: 'utf8'
            })

            file = file.replace(template, css.inject() + grant.GM_info())

            const { code } = await transformWithEsbuild(file, fileName, {
              loader: 'js',
              minify: true
            })

            // source
            writeFileSync(filePath, code)

            // production
            writeFileSync(userFileName, `${banner(config.banner)}\n\n${code}`)

            // development
            writeFileSync(
              proxyFilePath,
              banner({
                ...config.banner,
                require: 'file://' + filePath
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
