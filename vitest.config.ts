import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test unit untuk logika murni (utils, data template, util server). Tidak memuat runtime Nuxt.
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
