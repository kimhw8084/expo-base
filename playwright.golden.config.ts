import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/golden',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.002 } },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PRECISION_CALM_BASE_URL ?? 'http://127.0.0.1:8081',
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  projects: [{ name: 'golden-chromium', use: { browserName: 'chromium' } }],
});
