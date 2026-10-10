import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('manager schedules allowance changes and members read them without ledger credits', async ({ page, request, browser, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Allowance workflow');

  await signIn(page, manager, `/accounts/${account.id}`);

  const edit = page.locator('#account-details-allowance-edit');

  await expect(edit).toBeDisabled();

  await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { amount: '0', idempotencyKey: randomUUID() });

  const reader = await createReader(request);

  await login(request, manager);

  const before = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();

  await page.reload();

  await expect(edit).toBeEnabled();
  await expect(page.locator('#account-details-allowance-current')).toHaveText('No monthly allowance');

  await edit.click();

  await expect(page.locator('#account-details-allowance-dialog')).toHaveAccessibleName('Set allowance');

  const enabled = page.locator('#account-details-allowance-enabled');
  const amount = page.locator('#account-details-allowance-amount');
  const save = page.locator('#account-details-allowance-save');

  await expect(enabled).toHaveAccessibleName('Monthly allowance');

  await enabled.click();

  await expect(enabled).toHaveAttribute('aria-checked', 'true');
  await expect(amount).toHaveAccessibleName('Amount per month (EUR)');

  await amount.fill('1.001');
  await save.click();

  await expect(page.locator('#account-details-allowance-error')).toHaveRole('alert');
  await expect(amount).toHaveValue('1.001');

  await amount.fill('12.34');
  await page.screenshot({ path: test.info().outputPath('allowance-dialog.png'), fullPage: true });

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await save.click();

  await expect(page.locator('#account-details-allowance-dialog')).not.toBeVisible();
  await expect(page.locator('#account-details-allowance-saved')).toContainText('No money was posted.');

  const state = await (await request.get(`/api/accounts/${account.id}/allowance`)).json();

  await expect(page.locator('#account-details-allowance-scheduled')).toHaveText(`From ${state.nextEffectiveMonth}: +12.34 € per month`);
  await expect(page.locator('#account-details-balance')).toHaveText('0.00 €');

  await page.reload();

  await expect(page.locator('#account-details-allowance-scheduled')).toContainText('+12.34 €');

  await edit.click();
  await amount.fill('15.00');
  await save.click();

  await expect(page.locator('#account-details-allowance-scheduled')).toContainText('+15.00 €');

  await edit.click();
  await enabled.click();

  await expect(amount).toBeDisabled();

  await save.click();

  await expect(page.locator('#account-details-allowance-scheduled')).toHaveText(`Disabled from ${state.nextEffectiveMonth}`);

  await edit.click();

  await expect(amount).toHaveValue('15.00');

  await page.locator('#account-details-allowance-cancel').click();

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await signIn(memberPage, reader, `/accounts/${account.id}`);

    await expect(memberPage.locator('#account-details-allowance-scheduled')).toHaveText(`Disabled from ${state.nextEffectiveMonth}`);
    await expect(memberPage.locator('#account-details-allowance-retained')).toHaveText('Retained amount: +15.00 €');
    await expect(memberPage.locator('#account-details-allowance-edit')).toHaveCount(0);

    await memberPage.screenshot({ path: test.info().outputPath('allowance-member.png'), fullPage: true });
  } finally {
    await context.close();
  }

  expect(await (await request.get(`/api/accounts/${account.id}/transactions`)).json()).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('allowance save failures and stale edits retain input until the manager retries or refreshes', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Allowance retry');

  await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { amount: '0', idempotencyKey: randomUUID() });

  const path = `/api/accounts/${account.id}/allowance`;

  await signIn(page, manager, `/accounts/${account.id}`);

  const edit = page.locator('#account-details-allowance-edit');
  const amount = page.locator('#account-details-allowance-amount');
  const save = page.locator('#account-details-allowance-save');

  await expect(edit).toBeEnabled();

  await edit.click();
  await page.locator('#account-details-allowance-enabled').click();
  await amount.fill('10.00');
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unavailable' }) });
    } else {
      await route.continue();
    }
  });
  await save.click();

  await expect(page.locator('#account-details-allowance-error')).toBeVisible();
  await expect(amount).toHaveValue('10.00');

  await page.unroute(`**${path}`);
  await save.click();

  await expect(page.locator('#account-details-allowance-scheduled')).toContainText('+10.00 €');

  const original = await (await request.get(path)).json();

  await edit.click();
  await amount.fill('15.00');

  expect(
    (await csrfWrite(request, 'PUT', path, { enabled: true, amount: '20.00', expectedRevisionId: original.latestRevisionId })).status(),
  ).toBe(200);

  await save.click();

  await expect(page.locator('#account-details-allowance-error')).toContainText('Another change was saved.');
  await expect(amount).toHaveValue('15.00');

  await page.locator('#account-details-allowance-cancel').click();
  await page.locator('#account-details-refresh').click();

  await expect(page.locator('#account-details-allowance-scheduled')).toContainText('+20.00 €');
  await expect(edit).toBeEnabled();

  await edit.click();

  await expect(amount).toHaveValue('20.00');
});
