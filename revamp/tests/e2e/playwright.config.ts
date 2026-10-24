import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // A host-namespace browser on native Linux sees fixture veth churn (ERR_NETWORK_CHANGED); see revamp/README.md.
  workers: process.env['CI'] && !process.env['PW_TEST_CONNECT_WS_ENDPOINT'] ? 1 : 2,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { locale: 'en-US', extraHTTPHeaders: { 'Accept-Language': 'en-US' }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      testMatch: [
        '**/shell/**/*.spec.ts',
        '**/authentication/workflows.spec.ts',
        '**/authentication/profile-password.spec.ts',
        '**/authentication/about.spec.ts',
        '**/accounts/**/*.spec.ts',
        '**/ledger/**/*.spec.ts',
      ],
      grepInvert: /@api|@desktop/,
      use: { ...devices['Pixel 8'], defaultBrowserType: 'chromium' },
    },
  ],
});
