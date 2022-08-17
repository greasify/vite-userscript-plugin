import { resolve } from 'path'
import { defineConfig } from 'vite'
import userscriptPlugin from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    userscriptPlugin({
      entry: resolve(__dirname, 'src/index.ts'),
      banner: {
        name,
        version,
        description: 'Demo UserScript',
        match: [
          'https://example.com',
          'https://example.org',
          'https://example.edu'
        ]
      }
    })
  ]
})
