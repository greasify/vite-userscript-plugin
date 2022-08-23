import { defineConfig } from 'vite'
import { UserscriptPlugin } from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  plugins: [
    UserscriptPlugin({
      entry: 'src/index.ts',
      metadata: {
        name,
        version,
        match: [
          'https://example.com',
          'https://example.org',
          'https://example.edu'
        ]
      }
    })
  ]
})
