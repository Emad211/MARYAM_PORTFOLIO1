import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  use: {
    headless: true,
    baseURL: 'http://localhost:9002'
  }
});

// Start the dev server automatically when running Playwright tests
export const webServer = {
  command: 'npm run dev',
  url: 'http://localhost:9002',
  timeout: 120_000,
  reuseExistingServer: true,
};
