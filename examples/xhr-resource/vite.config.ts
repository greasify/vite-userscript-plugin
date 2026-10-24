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
        homepage: 'https://greasify.github.io/vite-userscript-plugin/',
        match: 'https://example.com/',
        connect: 'jsonplaceholder.typicode.com',
        resource: [
          ['hint', 'hint.json'],
        ],
      },
    }),
  ],
})
