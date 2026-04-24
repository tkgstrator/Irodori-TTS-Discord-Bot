import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5175',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    screenshot: 'off',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'bunx vite --host 127.0.0.1 --port 5175',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
})
