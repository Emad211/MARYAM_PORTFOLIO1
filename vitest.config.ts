import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/unit/**/*.spec.*'],
    exclude: ['tests/e2e/**'],
    setupFiles: './tests/unit/setup.ts'
  }
})
