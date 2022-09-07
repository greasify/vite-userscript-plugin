import { defineConfig } from 'vite'
import Redom from 'vite-redom-jsx'
import Userscript from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    Redom(),
    Userscript({
      entry: 'src/index.tsx',
      header: {
        name,
        version,
        match: 'https://example.com'
      }
    })
  ]
})
