import type { PluginOption } from 'vite'
import type { UserscriptPluginOptions } from './types.js'

function UserscriptPlugin(
  options?: Partial<UserscriptPluginOptions>
): PluginOption {

  return {
    name: 'vite-userscript-plugin',
    writeBundle(options, bundle) {
      for (const file of Object.entries(bundle)) {
        console.log(file)
      }
    }
  }
}

export { UserscriptPlugin }
export default UserscriptPlugin
export type { UserscriptPluginOptions }
