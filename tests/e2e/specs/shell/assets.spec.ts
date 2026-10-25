import { test, expect } from '../../fixtures';

test('hydrated English shell survives reload and uses local assets', async ({ page, instance }) => {
  const errors: string[] = [];
  const external: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== instance.origin) {
      external.push(route.request().url());
      return route.abort();
    }

    return route.continue();
  });

  await page.goto('/');

  await expect(page.getByRole('img', { name: 'POCKET MONkEY' })).toBeVisible();
  await expect(page.locator('#login-title')).toHaveText('Sign in');
  await expect(page.locator('#login-title')).toHaveRole('heading');
  await expect(page.getByTestId('sample-id')).toHaveCount(0);

  await expect(page.locator('#login-language-en')).toBeEnabled();
  await expect(page.locator('#login-language-en')).toHaveAccessibleName('English');
  await expect(page.locator('#login-language-en')).toHaveAttribute('aria-pressed', 'true');

  await page.reload();

  await expect(page.locator('#login-title')).toHaveText('Sign in');

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('type', 'image/png');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.png');

  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;

      const families = [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family.replaceAll('"', ''));

      return families.includes('Roboto');
    }),
  ).toBe(true);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  expect(errors).toEqual([]);
  expect(external).toEqual([]);

  await page.screenshot({ path: test.info().outputPath('shell.png'), fullPage: true });
});

test('API routes stay outside SSR fallback and local assets are downloadable @desktop', async ({ request }) => {
  const missing = await request.get('/api/not-found');
  const write = await request.post('/api/unsupported');
  const file = await request.get('/api/unsupported/file');
  const font = await request.get('/assets/lucide/lucide.woff2');
  const favicon = await request.get('/favicon.png');
  const roboto = await request.get('/fonts/roboto/Roboto-Regular.woff2');
  const logo = await request.get('/images/monkey.png');

  expect(missing.status()).toBe(404);
  expect(write.status()).toBe(404);

  expect(file.status()).toBe(404);
  expect((await request.get('/api/unsupported')).status()).toBe(404);

  expect(font.status()).toBe(200);

  expect(roboto.status()).toBe(200);
  expect((await roboto.body()).subarray(0, 4).toString('latin1')).toBe('wOF2');

  expect(logo.status()).toBe(200);
  expect(logo.headers()['content-type']).toContain('image/png');

  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/png');
  expect((await favicon.body()).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
