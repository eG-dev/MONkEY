import { test, expect, docker } from '../fixtures';

test('SSR languages stay isolated and explicit preference wins', async ({ request }) => {
  const [german, english] = await Promise.all([request.get('/', { headers: { 'Accept-Language': 'de-DE' } }), request.get('/', { headers: { 'Accept-Language': 'en-GB' } })]);

  expect(german.status()).toBe(200);
  expect(english.status()).toBe(200);

  expect(await german.text()).toContain('lang="de"');
  expect(await german.text()).toContain('Gespeicherter Testwert');

  expect(await english.text()).toContain('lang="en"');
  expect(await english.text()).toContain('Persisted sample');

  expect(german.headers()['cache-control']).toBe('no-store');
  expect(await german.text()).not.toContain('http://127.0.0.1:5080');

  const preference = await request.get('/', { headers: { 'Accept-Language': 'en', Cookie: 'monkey-language=de' } });

  expect(await preference.text()).toContain('lang="de"');

  const unsupported = await request.get('/', { headers: { 'Accept-Language': 'fr', Cookie: 'monkey-language=../../private' } });

  expect(await unsupported.text()).toContain('lang="de"');
});

test('hydrated shell switches language, persists state, and uses local assets', async ({ page, instance }) => {
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

  await expect(page.getByRole('heading', { name: 'POCKET MONkEY' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Bereit');

  const sample = await page.getByTestId('sample-id').textContent();

  await page.getByRole('combobox', { name: 'Sprache' }).selectOption('en');

  await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Ready');

  await expect(page.getByTestId('sample-id')).toHaveText(sample!);

  await page.getByRole('button', { name: 'Reload', exact: true }).click();

  await expect(page.getByRole('status')).toHaveText('Ready');

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('type', 'image/png');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.png');

  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some((font) => font.family === 'lucide' && font.status === 'loaded');
    }),
  ).toBe(true);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  expect(errors).toEqual([]);
  expect(external).toEqual([]);

  await page.screenshot({ path: test.info().outputPath('shell.png'), fullPage: true });
});

test('API routes stay outside SSR fallback and local assets are downloadable', async ({ request }) => {
  const missing = await request.get('/api/not-found');
  const write = await request.post('/api/foundation');
  const file = await request.get('/api/foundation/file');
  const font = await request.get('/assets/lucide/lucide.woff2');
  const favicon = await request.get('/favicon.png');

  expect(missing.status()).toBe(404);
  expect(write.status()).toBe(404);

  expect(await file.text()).toBe('POCKET MONkEY foundation file\n');

  expect(font.status()).toBe(200);

  expect(favicon.status()).toBe(200);
  expect(favicon.headers()['content-type']).toContain('image/png');
  expect((await favicon.body()).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});

test('backend failure produces actionable UI and failed readiness', async ({ page, request, instance }) => {
  docker('exec', instance.container, 'supervisorctl', '-c', '/app/supervisord.conf', 'stop', 'backend');

  const readiness = await request.get('/health/ready');
  const failure = await request.get('/api/foundation');

  expect(readiness.status()).toBe(503);

  expect(failure.status()).toBe(502);
  expect((await failure.json()).code).toBe('backend_unavailable');

  await page.goto('/');

  await expect(page.getByRole('alert')).toHaveText('Verbindung fehlgeschlagen');
  await expect(page.getByRole('button', { name: 'Neu laden' })).toBeVisible();
});
