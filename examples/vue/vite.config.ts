import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import userscript from 'vite-userscript-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  build: {
    minify: true,
    sourcemap: true,
  },
  plugins: [
    vue(),
    userscript({
      entry: 'src/main.ts',
      header: {
        name: pkg.name,
        version: pkg.version,
        match: 'https://example.com/',
      },
    }),
  ],
})
