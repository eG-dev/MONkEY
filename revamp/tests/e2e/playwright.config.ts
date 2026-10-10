import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  // A host-namespace browser on native Linux sees fixture veth churn (ERR_NETWORK_CHANGED); see revamp/README.md.
  workers: process.env['CI'] && !process.env['PW_TEST_CONNECT_WS_ENDPOINT'] ? 1 : 2,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { locale: 'de-DE', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      testMatch: ['shell.spec.ts', 'authentication.spec.ts', 'accounts.spec.ts', 'ledger.spec.ts', 'images.spec.ts'],
      grepInvert: /@api/,
      use: { ...devices['Pixel 8'], defaultBrowserType: 'chromium' },
    },
  ],
});
