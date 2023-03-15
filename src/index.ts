import { configPlugin } from './plugin/config.js'
import { serverPlugin } from './plugin/server.js'
import { userscriptPlugin } from './plugin/userscript.js'
import type { UserscriptPluginConfig } from './types.js'
import type { PluginOption } from 'vite'

export type { UserscriptPluginConfig }

export default function UserscriptPlugin(
  config: UserscriptPluginConfig
): PluginOption {
  return [
    configPlugin(config),
    userscriptPlugin(config),
    serverPlugin(config)]
}
