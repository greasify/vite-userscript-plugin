import { defineConfig } from 'tsup'

export default defineConfig((option) => ({
  entry: ['src/index.ts', 'src/hot-reload.ts'],
  format: ['cjs', 'esm'],
  external: ['vite'],
  dts: true,
  clean: true,
  minify: true,
  watch: option.watch
}))
