import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup/Path2D.polyfill.ts']
  }
})
