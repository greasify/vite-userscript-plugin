import { defineConfig } from 'vite'
import Userscript from 'vite-userscript-plugin'

export default defineConfig({
  plugins: [
    Userscript([
      {
        entry: 'src/foo.ts',
        fileName: 'foo',
        header: {
          name: 'Foo',
          version: '1.0.0',
          match: 'https://example.com/',
        },
      },
      {
        entry: 'src/bar.ts',
        fileName: 'bar',
        header: {
          name: 'Bar',
          version: '1.0.0',
          match: 'https://example.org/',
        },
      },
    ]),
  ],
})
