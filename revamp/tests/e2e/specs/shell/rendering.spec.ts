import { test, expect } from '../../fixtures';

test('selected German language initializes the first SSR render and hydration @desktop', async ({ page, instance }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.context().addCookies([{ name: 'monkey-language', value: 'de', url: instance.origin }]);

  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain('lang="de"');
  expect(html).toContain('Anmelden');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#login-title')).toHaveText('Anmelden');
  await expect(page.locator('#login-submit')).toBeEnabled();
  await expect(page.locator('#login-language-de')).toHaveAccessibleName('Deutsch');
  await expect(page.locator('#login-language-de')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('English SSR renders sign-in without exposing internal addresses or caching responses', async ({ request }) => {
  const english = await request.get('/');

  expect(english.status()).toBe(200);

  expect(await english.text()).toContain('lang="en"');
  expect(await english.text()).toContain('Sign in');

  expect(english.headers()['cache-control']).toBe('no-store');
  expect(await english.text()).not.toContain('http://127.0.0.1:5080');
});
