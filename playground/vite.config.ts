import { defineConfig } from 'vite'

import { userscriptPlugin } from './plugin/plugin'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

const banner = `// ==UserScript==
// @name     demo
// @version  0.0.0
// @match    https://example.com/
// @grant    GM_addStyle
// @grant    GM_getResourceURL
// ==/UserScript==
`

export default defineConfig({
  plugins: [
    userscriptPlugin({ banner }),
    libInjectCss()
  ],
  build: {
    minify: false,
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      name: 'userscript',
      formats: ['iife']
    }
  }
})
