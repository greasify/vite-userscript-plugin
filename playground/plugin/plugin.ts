import virtual from 'vite-plugin-virtual'
import type { Plugin } from 'vite'

interface PluginOptions {
  banner: string
}

export function userscriptPlugin(options: PluginOptions): Plugin[] {
  const virtualModulesPlugin = virtual({
    'virtual:gm-style': `export function GM_style(name) {
  const url = GM_getResourceURL('style')
  const el = document.createElement('style')
  el.id = name
  el.textContent = atob(url.slice(21))

  function mount() {
    document.head.append(el)
  }

  function unmount() {
    document.head.removeChild(el)
  }

  return {
    mount,
    unmount
  }
}`
  })

  return [
    virtualModulesPlugin,
    bannerPlugin(options)]
}

function bannerPlugin(options: PluginOptions): Plugin {
  return {
    name: 'vite:banner-plugin',
    config() {
      return {
        build: {
          rollupOptions: {
            output: {
              banner: options.banner
            }
          }
        }
      }
    }
  }
}
