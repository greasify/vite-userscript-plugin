import { defineConfig } from 'vite'
import redom from 'vite-redom-jsx'
import { UserscriptPlugin } from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    redom(),
    UserscriptPlugin({
      entry: 'src/index.tsx',
      metadata: {
        name,
        version,
        match: 'https://example.com'
      }
    })
  ]
})
