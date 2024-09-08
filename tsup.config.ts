import { defineConfig } from 'tsup'

export default defineConfig((option) => {
  return [
    {
      entry: ['src/index.ts'],
      format: 'esm',
      external: ['vite'],
      target: 'node20',
      dts: true,
      clean: true,
      watch: option.watch
    },
    {
      entry: ['src/ws.ts'],
      format: 'esm',
      target: 'esnext',
      platform: 'browser',
      clean: true,
      watch: option.watch
    }
  ]
})
