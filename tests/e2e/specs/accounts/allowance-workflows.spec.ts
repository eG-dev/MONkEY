import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('allowance summary failures show an error instead of a disabled allowance and can be retried', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Allowance summary retry');
  const path = `**/api/accounts/${account.id}/allowance`;

  await signIn(page, manager, `/accounts/${account.id}`);
  await expect(page.locator('#account-details-allowance-disabled')).toHaveText('Automatic allowance disabled.');
  await page.route(path, (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unavailable' }) }),
  );
  await page.locator('#account-details-back').click();

  await expect(page.locator('#overview-error')).toHaveRole('alert');
  await expect(page.getByTestId('account-card')).toHaveCount(0);
  await page.unroute(path);
  await page.locator('#overview-retry').click();

  await expect(page.locator('#overview-error')).toHaveCount(0);
  await expect(page.getByTestId('card-allowance')).toHaveText('No monthly allowance');
});

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
  await expect(page.locator('#account-details-allowance-disabled')).toHaveText('Automatic allowance disabled.');

  await edit.click();

  await expect(page.locator('#account-details-allowance-dialog')).toHaveAccessibleName('Set allowance');

  const enabled = page.locator('#account-details-allowance-enabled');
  const amount = page.locator('#account-details-allowance-amount');
  const save = page.locator('#account-details-allowance-save');

  await expect(enabled).toHaveAccessibleName('Monthly allowance');
  await expect(amount).not.toBeVisible();
  await expect(page.locator('#account-details-allowance-effective')).not.toBeVisible();
  await expect(save).toBeEnabled();

  await enabled.focus();
  await page.keyboard.press('Tab');

  await expect(page.locator('#account-details-allowance-cancel')).toBeFocused();

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
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${state.nextEffectiveMonth}-01T12:00:00Z`),
  );

  await expect(page.locator('#account-details-allowance-status')).toHaveText('Automatic monthly allowance scheduled');
  await expect(page.locator('#account-details-allowance-amount-display')).toHaveText('+12.34 € per month');
  await expect(page.locator('#account-details-allowance-amount-display')).toHaveCSS('color', 'rgb(0, 115, 47)');
  await expect(page.locator('#account-details-allowance-scheduled')).toHaveText(`Credits are posted automatically from ${month}.`);
  await expect(page.locator('#account-details-allowance-current')).toHaveText('No allowance this month yet.');
  await expect(page.locator('#account-details-balance')).toHaveText('0 €');

  await page.goto('/accounts');

  await expect(page.getByTestId('account-row-allowance')).toHaveText('No monthly allowance');
  await page.goto('/');

  await expect(page.getByTestId('card-allowance')).toHaveText('No monthly allowance');
  await expect(page.getByTestId('card-allowance-execution')).toHaveCount(0);
  await page.goto(`/accounts/${account.id}`);
  await page.reload();

  await expect(page.locator('#account-details-allowance-amount-display')).toContainText('+12.34 €');

  await edit.click();
  await amount.fill('15.00');
  await save.click();

  await expect(page.locator('#account-details-allowance-amount-display')).toContainText('+15 €');

  await edit.click();
  await enabled.click();

  await expect(amount).toBeDisabled();
  await expect(amount).not.toBeVisible();
  await expect(page.locator('#account-details-allowance-effective')).not.toBeVisible();

  await enabled.click();

  await expect(amount).toBeVisible();
  await expect(amount).toHaveValue('15.00');
  await enabled.click();

  await save.click();

  await expect(page.locator('#account-details-allowance-disabled')).toHaveText('Automatic allowance disabled.');
  await expect(page.locator('#account-details-allowance-amount-display')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-current')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-scheduled')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-retained')).toHaveCount(0);

  await edit.click();

  await expect(amount).toHaveValue('15.00');

  await page.locator('#account-details-allowance-cancel').click();

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await signIn(memberPage, reader, `/accounts/${account.id}`);

    await expect(memberPage.locator('#account-details-allowance-disabled')).toHaveText('Automatic allowance disabled.');
    await expect(memberPage.locator('#account-details-allowance-retained')).toHaveCount(0);
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

  await expect(page.locator('#account-details-allowance-amount-display')).toContainText('+10 €');

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

  await expect(page.locator('#account-details-allowance-amount-display')).toContainText('+20 €');
  await expect(edit).toBeEnabled();

  await edit.click();

  await expect(amount).toHaveValue('20.00');
});
