import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Banner } from '../banner.js'
import {
  grants,
  regexpScripts,
  regexpStyles,
  styleTemplate
} from '../constants.js'
import { CSS } from '../css.js'
import { defineGrants, removeDuplicates, transform } from '../helpers.js'
import type { UserscriptPluginConfig } from '../types.js'
import { PluginOption, ResolvedConfig } from 'vite'

export function userscriptPlugin(
  userConfig: UserscriptPluginConfig
): PluginOption {
  let isBuildWatch: boolean
  let pluginConfig: ResolvedConfig
  const styles = new CSS()
  const workdir = dirname(fileURLToPath(import.meta.url))

  return {
    name: 'vite-userscript-plugin',
    apply: 'build',
    async configResolved(config) {
      pluginConfig = config
      isBuildWatch = Boolean(config.build.watch)
      userConfig.entry = resolve(config.root, userConfig.entry)

      Array.from([
        'match',
        'require',
        'include',
        'exclude',
        'resource',
        'connect'
      ]).forEach((key) => {
        const value = userConfig.header[key]
        userConfig.header[key] = removeDuplicates(value)
      })
    },
    async transform(src: string, path: string) {
      let code = src

      if (regexpStyles.test(path)) {
        code = await styles.add(src, path)
      }

      if (path.includes(userConfig.entry)) {
        code = src + styleTemplate
      }

      return {
        code,
        map: null
      }
    },
    generateBundle(_, bundle) {
      for (const outputChunk of Object.values(bundle)) {
        if (outputChunk.type === 'asset') {
          continue
        }

        const styleModules = Object.keys(outputChunk.modules).filter((module) =>
          regexpStyles.test(module)
        )

        if (styleModules.length) {
          styles.merge(styleModules)
        }
      }
    },
    async writeBundle(_, bundle) {
      const userFilename = `${userConfig.header.name}.user.js`
      const proxyFilename = `${userConfig.header.name}.proxy.user.js`
      const metaFilename = `${userConfig.header.name}.meta.js`

      for (const [fileName] of Object.entries(bundle)) {
        if (regexpScripts.test(fileName)) {
          const rootDir = pluginConfig.root
          const outDir = pluginConfig.build.outDir

          const outPath = resolve(rootDir, outDir, fileName)
          const userFilePath = resolve(rootDir, outDir, userFilename)
          const proxyFilePath = resolve(rootDir, outDir, proxyFilename)
          const metaFilePath = resolve(rootDir, outDir, metaFilename)
          const wsPath = resolve(workdir, `ws-${userConfig.header.name}.js`)

          try {
            let source = readFileSync(outPath, 'utf8')
            source = source.replace(styleTemplate, `${styles.inject()}`)
            source = await transform({
              file: source,
              name: fileName,
              loader: 'js'
            })

            userConfig.header.grant = removeDuplicates(
              isBuildWatch
                ? grants
                : [...defineGrants(source), ...(userConfig.header.grant ?? [])]
            )

            if (isBuildWatch) {
              const wsFile = readFileSync(resolve(workdir, 'ws.js'), 'utf8')
              const wsScript = await transform({
                file: wsFile.replace(
                  '__WS__',
                  `ws://localhost:${userConfig.server!.port}`
                ),
                name: wsPath,
                loader: 'js'
              })

              writeFileSync(wsPath, wsScript)
              writeFileSync(
                proxyFilePath,
                new Banner({
                  ...userConfig.header,
                  require: [
                    ...userConfig.header.require!,
                    'file://' + wsPath,
                    'file://' + outPath
                  ]
                }).generate()
              )
            }

            const banner = new Banner(userConfig.header).generate()
            writeFileSync(outPath, source)
            writeFileSync(metaFilePath, banner)
            writeFileSync(userFilePath, `${banner}\n\n${source}`)
          } catch (err) {
            console.log(err)
          }
        }
      }
    }
  }
}
