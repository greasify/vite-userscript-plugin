import { resolve } from 'path'
import { defineConfig } from 'vite'
import userscriptPlugin from 'vite-userscript-plugin'

export default defineConfig({
  plugins: [
    userscriptPlugin({
      entry: resolve(__dirname, 'src/index.ts'),
      banner: {
        name: 'demo',
        description: 'Hello world',
        match: ['https://example.com', 'https://example.org']
      }
    })
  ]
})
