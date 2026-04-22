import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    screenshot: 'off'
  },
  webServer: undefined
})
