import type { UserscriptPluginConfig } from '../types.js'
import type { PluginOption } from 'vite'

export function configPlugin(userConfig: UserscriptPluginConfig): PluginOption {
  return {
    name: 'vite-userscript-plugin:config',
    config() {
      return {
        build: {
          lib: {
            entry: userConfig.entry,
            name: userConfig.header.name,
            formats: ['iife'],
            fileName: () => `${userConfig.header.name}.js`
          },
          rollupOptions: {
            output: {
              extend: true
            }
          }
        }
      }
    }
  }
}
