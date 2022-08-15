import type { PluginOption } from 'vite'
import type { UserscriptPluginOptions } from './types.js'

export default function userscriptPlugin(
  options: UserscriptPluginOptions
): PluginOption {

  return {
    name: 'vite-userscript-plugin',
    writeBundle() {

    }
  }
}
