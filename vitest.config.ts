import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['lib/__tests__/**/*.test.ts'],
    exclude: ['lib/__tests__/integration/**', 'node_modules/**'],
  },
})
