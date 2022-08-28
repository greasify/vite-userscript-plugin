import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    Userscript({
      entry: 'src/index.ts',
      metadata: {
        name,
        version,
        match: [
          'https://example.com',
          'https://example.org',
          'https://example.edu'
        ]
      },
      server: {
        open: false
      }
    })
  ]
})
