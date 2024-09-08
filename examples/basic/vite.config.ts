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
          match: 'https://example.com/'
        },
        server: {
          port: 2000
        },
        esbuildTransformOptions: {
          minify: false
        }
      })
    ]
  }
})
