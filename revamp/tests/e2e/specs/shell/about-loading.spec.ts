import { test, expect } from '../../fixtures';

test('About loads its local license chunk only on demand and handles a failed download', async ({ page }) => {
  const scripts = new Set<string>();

  page.on('request', (request) => {
    if (request.resourceType() === 'script') {
      scripts.add(request.url());
    }
  });
  await page.goto('/');
  await expect(page.locator('#login-about')).toBeEnabled();
  await expect(page.locator('app-about-dialog')).toHaveCount(0);

  const initialScripts = new Set(scripts);
  const aboutScript = page.waitForResponse(async (response) => {
    if (response.request().resourceType() !== 'script' || initialScripts.has(response.url())) {
      return false;
    }

    return (await response.text()).includes('about-license-text');
  });

  await page.locator('#login-about').click();
  await expect(page.locator('#about-dialog')).toBeVisible();

  const chunk = (await aboutScript).url();

  expect(new URL(chunk).origin).toBe(new URL(page.url()).origin);
  expect(initialScripts.has(chunk)).toBe(false);
  await page.locator('#about-dialog-close').click();

  await expect(page.locator('#login-about')).toBeFocused();

  const scriptsAfterOpen = new Set(scripts);

  await page.locator('#login-about').click();
  await expect(page.locator('#about-dialog')).toBeVisible();
  expect([...scripts]).toEqual([...scriptsAfterOpen]);
  await page.locator('#about-dialog-close').click();

  let releaseDownload: () => void = () => {
    throw new Error('About download gate was not initialized.');
  };
  const downloadGate = new Promise<void>((resolve) => {
    releaseDownload = resolve;
  });

  await page.route(chunk, async (route) => {
    await downloadGate;
    await route.continue();
  });
  await page.reload();
  await expect(page.locator('#login-about')).toBeEnabled();
  await page.locator('#login-about').click();

  try {
    await expect(page.locator('#about-loading')).toHaveRole('status');
    await expect(page.locator('#about-loading')).toHaveText('Loading About...');
    await expect(page.locator('#about-dialog')).toHaveCount(0);
  } finally {
    releaseDownload();
  }

  await expect(page.locator('#about-dialog')).toBeVisible();
  await page.locator('#about-dialog-close').click();

  await expect(page.locator('#login-about')).toBeFocused();
  await page.unroute(chunk);
  await page.route(chunk, (route) => route.abort('failed'));
  await page.reload();
  await expect(page.locator('#login-about')).toBeEnabled();
  await page.locator('#login-username').fill('Unfinished form');
  await page.locator('#login-about').click();

  await expect(page.locator('#about-load-error')).toHaveRole('alert');
  await expect(page.locator('#about-load-error')).toContainText('About could not be loaded.');
  await expect(page.locator('#about-load-error-reload')).toHaveAccessibleName('Reload page');
  await page.locator('#about-load-error-dialog-close').click();

  await expect(page.locator('#login-about')).toBeFocused();
  await expect(page.locator('#login-username')).toHaveValue('Unfinished form');
  await page.locator('#login-about').click();

  await expect(page.locator('#about-load-error')).toBeVisible();
  await page.unroute(chunk);

  const reloaded = page.waitForEvent('load');

  await page.locator('#about-load-error-reload').click();
  await reloaded;
  await expect(page.locator('#login-about')).toBeEnabled();
  await page.locator('#login-about').click();

  await expect(page.locator('#about-dialog')).toHaveAccessibleName('About');
  await page.locator('#about-tab-license').click();

  await expect(page.locator('#about-license-text')).toContainText('GNU AFFERO GENERAL PUBLIC LICENSE');
});
