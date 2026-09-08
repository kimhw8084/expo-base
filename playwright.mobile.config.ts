import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const matrix = JSON.parse(fs.readFileSync(new URL('./mobile.certification.json', import.meta.url), 'utf8')) as {
  profiles: Array<{
    id: string;
    device: string;
    browser: 'chromium' | 'webkit';
    viewport: { width: number; height: number };
    deviceScaleFactor: number;
  }>;
};

export default defineConfig({
  testDir: './tests/e2e/mobile',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.002,
    },
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never', outputFolder: 'test-results/mobile-report' }]] : [['list']],
  outputDir: 'test-results/mobile',
  use: {
    baseURL: process.env.PRECISION_CALM_BASE_URL ?? 'http://127.0.0.1:8081',
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: matrix.profiles.map((profile) => ({
    name: profile.id,
    use: {
      ...devices[profile.device],
      browserName: profile.browser,
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
      locale: 'en-US',
      timezoneId: 'UTC',
      colorScheme: 'light',
      reducedMotion: 'no-preference',
    },
  })),
});
