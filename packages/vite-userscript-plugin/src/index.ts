import fs from 'node:fs'
import path from 'node:path'
import type { LibraryOptions, PluginOption, ResolvedConfig } from 'vite'
import { banner } from './banner.js'
import css from './css.js'
import type { Grants, PluginConfig } from './types.js'

const includeJs = new RegExp(/\.([mc]?js)$/i)

function UserscriptPlugin(config: PluginConfig): PluginOption {
  let pluginConfig: ResolvedConfig

  const initialGrants: Grants[] = ['GM_addStyle']
  if (Array.isArray(config.grant)) {
    config.grant.push(...initialGrants)
  } else {
    config.grant = initialGrants
  }

  return {
    name: 'vite-userscript-plugin',
    apply: 'build',
    configResolved(config) {
      pluginConfig = config
    },
    async transform(style: string, file: string) {
      const { entry } = pluginConfig.build.lib as LibraryOptions
      const { code } = await css.minify(style, file)
      return css.add(entry, code.replace('\n', ''), file)
    },
    writeBundle(options, bundle) {
      for (const [fileName, { name }] of Object.entries(bundle)) {
        if (includeJs.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir
          const filePath = path.resolve(rootDir, outDir, fileName)
          const proxyFilePath = path.resolve(
            rootDir,
            outDir,
            `${name}.proxy.user.js`
          )
          const userFileName = path.resolve(rootDir, outDir, `${name}.user.js`)

          try {
            let file = fs.readFileSync(filePath, {
              encoding: 'utf8'
            })

            if (file.includes(css.template)) {
              file = file.replace(css.template, css.inject())
            }

            fs.writeFileSync(filePath, file)
            fs.writeFileSync(userFileName, `${banner(config)}\n\n${file}`)
            fs.writeFileSync(
              proxyFilePath,
              banner({
                ...config,
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
