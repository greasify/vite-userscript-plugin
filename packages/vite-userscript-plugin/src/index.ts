import fs from 'node:fs'
import path from 'node:path'
import type { LibraryOptions, PluginOption, ResolvedConfig } from 'vite'
import { banner } from './banner.js'
import css from './css.js'
import { mergeGrants } from './grant.js'
import type { PluginConfig } from './types.js'

const includeJs = new RegExp(/\.([mc]?js)$/i)

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
      config.banner.grant = mergeGrants(config.banner.grant)
      pluginConfig = cfg
    },
    async transform(style: string, file: string) {
      const { entry } = pluginConfig.build.lib as LibraryOptions
      const { code } = await css.minify(style, file)
      return css.add(entry, code.replace('\n', ''), file)
    },
    writeBundle(options, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        if (includeJs.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir
          const filePath = path.resolve(rootDir, outDir, fileName)

          const proxyFilePath = path.resolve(
            rootDir,
            outDir,
            `${config.banner.name}.proxy.user.js`
          )

          const userFileName = path.resolve(
            rootDir,
            outDir,
            `${config.banner.name}.user.js`
          )

          try {
            let file = fs.readFileSync(filePath, {
              encoding: 'utf8'
            })

            if (file.includes(css.template)) {
              file = file.replace(css.template, css.inject())
            }

            // source
            fs.writeFileSync(filePath, file)

            // production
            fs.writeFileSync(
              userFileName,
              `${banner(config.banner)}\n\n${file}`
            )

            // development
            fs.writeFileSync(
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
