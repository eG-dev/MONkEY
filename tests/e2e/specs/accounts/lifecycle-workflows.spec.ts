import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('manager can confirm immediate deletion and retry a failed request', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Immediate deletion');
  const path = `/api/accounts/${account.id}`;

  expect((await csrfWrite(request, 'POST', `${path}/opening`, { amount: '0', idempotencyKey: randomUUID() })).status()).toBe(200);

  await signIn(page, manager, `/accounts/${account.id}`);

  const remove = page.locator('#account-details-delete');
  const confirm = page.locator('#account-details-lifecycle-confirm');

  await expect(remove).toHaveAccessibleName('Delete account');
  await expect(remove).toHaveAttribute('title', 'Delete account');

  await page.screenshot({ path: test.info().outputPath('manager-delete-action.png'), fullPage: true });
  await remove.click();

  await expect(page.locator('#account-details-lifecycle-dialog')).toHaveAccessibleName('Delete account');
  await expect(page.locator('#account-details-lifecycle-form')).toContainText('Accounts without deposits, withdrawals, or credited allowances');
  await expect(confirm).toHaveCSS('background-color', 'rgb(198, 40, 40)');
  await expect(confirm).toHaveCSS('color', 'rgb(255, 255, 255)');

  await page.screenshot({ path: test.info().outputPath('delete-confirmation.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.setAttribute('tuiTheme', 'dark'));

  await expect(confirm).toHaveCSS('background-color', 'rgb(198, 40, 40)');
  await expect(confirm).toHaveCSS('color', 'rgb(255, 255, 255)');

  await page.screenshot({ path: test.info().outputPath('delete-confirmation-dark.png'), fullPage: true });
  await page.evaluate(() => document.documentElement.setAttribute('tuiTheme', 'light'));
  await page.locator('#account-details-lifecycle-cancel').click();

  await expect(remove).toBeFocused();
  expect((await request.get(path)).status()).toBe(200);

  await remove.click();
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'unavailable' }) });
    } else {
      await route.continue();
    }
  });
  await confirm.click();

  await expect(page.locator('#account-details-lifecycle-error')).toHaveRole('alert');
  await expect(confirm).toBeEnabled();
  expect((await request.get(path)).status()).toBe(200);

  await page.unroute(`**${path}`);
  await confirm.click();

  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByTestId('account-row')).toHaveCount(0);
  await expect(page.getByTestId('archived-account-row')).toHaveCount(0);
  expect((await request.get(path)).status()).toBe(404);
});

test('manager retires and reactivates an account while Member access is removed', async ({ page, request, browser, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Retained history');
  const path = `/api/accounts/${account.id}`;

  expect((await csrfWrite(request, 'POST', `${path}/opening`, { amount: '10', idempotencyKey: randomUUID() })).status()).toBe(200);
  expect(
    (await csrfWrite(request, 'POST', `${path}/transactions`, { source: 'deposit', amount: '1', idempotencyKey: randomUUID() })).status(),
  ).toBe(200);
  expect((await csrfWrite(request, 'PUT', `${path}/allowance`, { enabled: true, amount: '5' })).status()).toBe(200);

  const configuration = await (await request.get(`${path}/allowance`)).json();
  const reader = await createReader(request);

  await login(request, manager);
  await signIn(page, manager, `/accounts/${account.id}`);
  await page.locator('#account-details-delete').click();
  await page.locator('#account-details-lifecycle-confirm').click();

  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByTestId('account-row')).toHaveCount(0);
  await expect(page.getByTestId('archived-account-row')).toHaveCount(1);

  await page.getByTestId('archived-account-link').click();

  await expect(page.locator('#account-details-retired')).toHaveRole('status');
  await expect(page.locator('#account-details-retired')).toContainText('Scheduled for deletion on');
  await expect(page.locator('#account-details-reactivate')).toHaveAccessibleName('Reactivate');
  await expect(page.locator('#account-details-delete')).toHaveCount(0);
  await expect(page.locator('#account-details-rename')).toHaveCount(0);
  await expect(page.locator('#account-details-image-edit')).toHaveCount(0);
  await expect(page.locator('#account-details-record-transaction')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-edit')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-status')).toHaveText('Automatic monthly allowance paused');
  await expect(page.locator('#account-details-balance')).toHaveText('+11 €');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.screenshot({ path: test.info().outputPath('retired-account.png'), fullPage: true });

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await signIn(memberPage, reader, `/accounts/${account.id}`);

    await expect(memberPage.locator('#account-details-error')).toContainText('This account does not exist.');
    await expect(memberPage.locator('#account-details-delete')).toHaveCount(0);
    await expect(memberPage.locator('#account-details-reactivate')).toHaveCount(0);
    await expect(memberPage.locator('#account-details-balance')).toHaveCount(0);
    await expect(memberPage.getByTestId('ledger-entry')).toHaveCount(0);

    await memberPage.goto('/accounts');

    await expect(memberPage.locator('#accounts-managers-only')).toBeVisible();
    await expect(memberPage.getByTestId('archived-account-row')).toHaveCount(0);
  } finally {
    await context.close();
  }

  await page.locator('#account-details-reactivate').click();

  await expect(page.locator('#account-details-lifecycle-dialog')).toHaveAccessibleName('Reactivate');
  await expect(page.locator('#account-details-missed-credit')).toHaveCount(0);

  await page.locator('#account-details-lifecycle-confirm').click();

  await expect(page.locator('#account-details-retired')).toHaveCount(0);
  await expect(page.locator('#account-details-delete')).toBeEnabled();
  await expect(page.locator('#account-details-record-transaction')).toBeEnabled();
  await expect(page.locator('#account-details-allowance-status')).toHaveText('Automatic monthly allowance scheduled');
  expect(await (await request.get(`${path}/allowance`)).json()).toEqual(configuration);

  await page.goto('/accounts');

  await expect(page.getByTestId('account-row')).toHaveCount(1);
  await expect(page.getByTestId('archived-account-row')).toHaveCount(0);
});