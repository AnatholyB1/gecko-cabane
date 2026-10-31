import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Les imports dynamiques à froid (pages admin, shell) dépassent 5 s quand la suite tourne en parallèle.
    testTimeout: 30_000,
  },
})
