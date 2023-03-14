import { defineConfig } from 'tsup'

export default defineConfig((option) => {
  return [
    {
      entry: ['src/index.ts'],
      format: ['cjs', 'esm'],
      external: ['vite'],
      target: 'node14',
      dts: true,
      clean: true,
      minify: true,
      watch: option.watch
    },
    {
      entry: ['src/ws.ts'],
      format: ['esm'],
      target: 'esnext',
      platform: 'browser',
      clean: true,
      minify: true,
      watch: option.watch
    }
  ]
})
