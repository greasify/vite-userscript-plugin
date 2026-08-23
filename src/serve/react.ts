import {
  REACT_BOOTSTRAP_PATH,
  REACT_PREAMBLE_PATH,
  REACT_REFRESH_PLUGIN_NAMES,
} from '../constants.js'

export function hasReactRefreshPlugin(plugins: readonly { name: string }[]): boolean {
  return plugins.some(plugin => REACT_REFRESH_PLUGIN_NAMES.has(plugin.name))
}

export function matchReactPreamble(url: string): boolean {
  const path = url.split('?')[0] ?? ''
  return path === REACT_PREAMBLE_PATH
}

export function matchReactBootstrap(url: string): boolean {
  const path = url.split('?')[0] ?? ''
  return path === REACT_BOOTSTRAP_PATH
}

export function resolveBootstrapEntry(url: string): string | undefined {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : ''
  const entry = new URLSearchParams(query).get('entry')
  if (!entry?.startsWith('/') || entry.startsWith('//')) {
    return
  }

  return entry
}

export const REACT_PREAMBLE_MODULE = `import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
`

export function createReactBootstrapModule(entryPath: string): string {
  return `import "/@vite/client";
import ${JSON.stringify(REACT_PREAMBLE_PATH)};
import ${JSON.stringify(entryPath)};
`
}
