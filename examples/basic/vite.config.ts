import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig((config) => {
  return {
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
        },
        server: {
          port: 3000
        }
      })
    ]
  }
})
