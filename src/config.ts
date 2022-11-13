import type { UserConfig } from 'vite'
import type { HeaderConfig } from './types.js'

interface ViteConfig {
  entry: string
  header: HeaderConfig
}

export function userConfig({ entry, header }: ViteConfig): UserConfig {
  return {
    build: {
      lib: {
        entry,
        name: header.name,
        formats: ['iife'],
        fileName: () => `${header.name}.js`
      },
      rollupOptions: {
        output: {
          extend: true
        }
      }
    }
  }
}
