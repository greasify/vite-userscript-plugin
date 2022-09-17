import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    Userscript({
      entry: 'src/index.ts',
      header: {
        name,
        version,
        match: [
          '*://example.com',
          '*://example.org',
          '*://example.edu'
        ]
      }
    })
  ]
})
