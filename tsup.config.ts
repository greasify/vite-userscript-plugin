import { defineConfig } from 'tsup'

export default defineConfig((option) => {
  return [
    {
      entry: ['src/index.ts'],
      format: ['cjs', 'esm'],
      external: ['vite'],
      dts: true,
      clean: true,
      minify: true,
      watch: option.watch
    },
    {
      entry: ['src/ws.ts'],
      format: ['esm'],
      clean: true,
      minify: true,
      watch: option.watch
    }
  ]
})
