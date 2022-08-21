import { resolve } from 'path'
import { defineConfig } from 'vite'
import { redom } from 'vite-plugin-redom'
import { UserscriptPlugin } from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    redom(),
    UserscriptPlugin({
      entry: resolve(__dirname, 'src/index.ts'),
      metadata: {
        name,
        version,
        match: 'https://example.com'
      }
    })
  ]
})
