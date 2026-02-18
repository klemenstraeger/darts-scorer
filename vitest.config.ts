import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['shared/**/*.ts', 'server/utils/**/*.ts'],
      exclude: ['shared/training/modes/index.ts', '**/*.d.ts'],
    },
  },
})
