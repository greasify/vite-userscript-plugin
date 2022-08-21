import { defineConfig } from 'tsup'

export default defineConfig((option) => ({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  external: ['vite'],
  dts: true,
  clean: true,
  minify: false,
  watch: option.watch
}))
