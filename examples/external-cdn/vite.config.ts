import { defineConfig } from 'vite'
import userscript from 'vite-userscript-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    userscript({
      entry: 'src/index.ts',
      header: {
        name: pkg.name,
        version: pkg.version,
        match: 'https://example.com/',
      },
      external: {
        jquery: {
          global: '$',
          url: 'https://cdn.jsdelivr.net/npm/jquery@4.0.0/dist/jquery.min.js',
        },
      },
    }),
  ],
})
