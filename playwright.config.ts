import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  use: {
    headless: true,
    baseURL: 'http://localhost:9002'
  },
  // Start the dev server automatically when running Playwright tests.
  // Must live inside defineConfig — a bare `export const webServer` is ignored
  // by Playwright, which left the suite with no server to hit.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:9002',
    timeout: 120_000,
    reuseExistingServer: true,
  },
});

