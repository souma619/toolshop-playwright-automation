import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1, // one retry for the shared demo site; the trace is captured on that retry
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    // The app marks elements with data-test (not Playwright's default data-testid)
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
