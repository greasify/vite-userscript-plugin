import fs from 'node:fs'
import path from 'node:path'
import { banner } from './banner.js'
import type { PluginConfig } from './types.js'
import type { PluginOption, ResolvedConfig } from 'vite'

const includeRegexp: RegExp = new RegExp(/\.([mc]?js)$/i)

function UserscriptPlugin(
  config: PluginConfig
): PluginOption {
  let pluginConfig: ResolvedConfig

  return {
    name: 'vite-userscript-plugin',
    apply: 'build',
    configResolved(config) {
      pluginConfig = config
    },
    writeBundle(options, bundle) {
      for (const [fileName, { name }] of Object.entries(bundle)) {
        if (includeRegexp.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir
          const filePath = path.resolve(rootDir, outDir, fileName)
          const proxyFilePath = path.resolve(rootDir, outDir, `${name}.proxy.user.js`)

          try {
            const userFileName = path.resolve(rootDir, outDir, `${name}.user.js`)
            let file = fs.readFileSync(filePath, {
              encoding: 'utf8'
            })

            file = `${banner(config)}\n\n${file}`

            fs.writeFileSync(userFileName, file)
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
