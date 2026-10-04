import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { locale: 'de-DE', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', testMatch: 'shell.spec.ts', use: { ...devices['Pixel 8'], defaultBrowserType: 'chromium' } },
  ],
});
