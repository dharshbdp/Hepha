import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@hardware': resolve(__dirname, 'src/hardware'),
      '@simulator': resolve(__dirname, 'src/simulator'),
      '@ai': resolve(__dirname, 'src/ai'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts']
  }
})
