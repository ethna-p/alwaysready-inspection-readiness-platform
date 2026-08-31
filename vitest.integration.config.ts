import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['lib/__tests__/integration/**/*.test.ts'],
    // Integration tests hit a real DB — allow longer timeouts
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Each file manages its own DB connection — files can run concurrently
    // but tests within a file run sequentially (vitest default)
  },
})
