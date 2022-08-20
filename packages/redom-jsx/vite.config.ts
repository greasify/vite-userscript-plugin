import { resolve } from 'path'
import { defineConfig } from 'vite'
import { UserscriptPlugin } from 'vite-userscript-plugin'
import { name, version } from './package.json'

export default defineConfig({
  esbuild: {
    jsxInject: `import { h, Fragment } from 'vite-redom-jsx'`,
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  },
  plugins: [
    UserscriptPlugin({
      entry: resolve(__dirname, 'src/index.ts'),
      metadata: {
        name,
        version,
        match: 'https://example.com'
      },
      server: {
        port: 8081
      }
    })
  ]
})
