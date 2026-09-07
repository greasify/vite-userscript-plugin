import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/**/*.test.ts'],
          exclude: [
            '**/*.integration.test.ts',
            '**/node_modules/**',
            '**/dist/**',
            '**/examples/**',
          ],
          testTimeout: 10_000,
        },
      },
      {
        test: {
          name: 'integration',
          include: ['test/**/*.integration.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**'],
          testTimeout: 30_000,
        },
      },
    ],
  },
})
