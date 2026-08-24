import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import userscript from 'vite-userscript-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    userscript({
      entry: 'src/index.tsx',
      header: {
        name: pkg.name,
        version: pkg.version,
        match: 'https://example.com/',
      },
    }),
  ],
})
