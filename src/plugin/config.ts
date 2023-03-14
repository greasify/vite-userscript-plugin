import type { PluginOption } from 'vite'
import type { UserscriptPluginConfig } from '../types.js'

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
            input: userConfig.entry
          }
        }
      }
    }
  }
}
