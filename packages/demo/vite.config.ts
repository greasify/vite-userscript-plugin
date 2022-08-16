import { resolve } from 'path'
import { defineConfig } from 'vite'
import userscriptPlugin from 'vite-userscript-plugin'

export default defineConfig({
  plugins: [
    userscriptPlugin({
      name: 'demo',
      description: 'Hello world',
      match: ['https://example.com', 'https://example.org']
    })
  ],
  build: {
    lib: {
      name: 'demo',
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'index.js',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
})
