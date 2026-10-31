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

  const panelStyles = await page.evaluate(() => {
    const titles = [
      'account-details-balance-label',
      'account-details-allowance-title',
      'account-details-history-title',
      'account-details-credit-runs-title',
    ];
    const allowance = document.querySelector('app-account-allowance .allowance')!.getBoundingClientRect();
    const title = document.getElementById('account-details-allowance-title')!.getBoundingClientRect();

    return {
      titles: titles.map((id) => {
        const style = getComputedStyle(document.getElementById(id)!);

        return { size: style.fontSize, weight: style.fontWeight, color: style.color };
      }),
      gap: allowance.top - title.bottom,
    };
  });

  expect(panelStyles.titles[1]).toEqual(panelStyles.titles[0]);
  expect(panelStyles.titles[2]).toEqual(panelStyles.titles[0]);
  expect(panelStyles.titles[3]).toEqual(panelStyles.titles[0]);
  expect(panelStyles.gap).toBeCloseTo(16, 1);

  await page.goto('/accounts');

  await expect(page.getByTestId('account-row-allowance')).toHaveText('No monthly allowance');
  const overview = await page.goto('/');

  expect(await overview!.text()).toContain(`monthly from ${month}`);
  await expect(page.getByTestId('card-allowance')).toHaveText(`+12.34 € monthly from ${month}`);
  await expect(page.getByTestId('card-allowance').locator('.amount-positive')).toHaveText('+12.34 €');
  await expect(page.getByTestId('card-allowance').locator('.amount-positive')).toHaveCSS('color', 'rgb(0, 115, 47)');
  await expect(page.getByTestId('card-allowance-execution')).toHaveCount(0);

  const balanceLayout = await page.getByTestId('account-card').evaluate((card) => {
    const label = card.querySelector<HTMLElement>('[data-testid="card-balance-label"]')!;
    const amount = card.querySelector<HTMLElement>('[data-testid="card-balance"]')!;
    const labelBox = label.getBoundingClientRect();
    const amountBox = amount.getBoundingClientRect();

    return {
      grouped: label.parentElement === amount.parentElement,
      inName: card.querySelector('.card-head')!.contains(label),
      alignment: getComputedStyle(label).textAlign,
      rightDifference: labelBox.right - amountBox.right,
      gap: amountBox.top - labelBox.bottom,
      expectedGap: parseFloat(getComputedStyle(label.parentElement!).rowGap),
    };
  });

  await expect(page.getByTestId('card-balance-label')).toHaveText('Balance');
  expect(balanceLayout.grouped).toBe(true);
  expect(balanceLayout.inName).toBe(false);
  expect(balanceLayout.alignment).toBe('end');
  expect(balanceLayout.rightDifference).toBeCloseTo(0, 1);
  expect(balanceLayout.gap).toBeCloseTo(balanceLayout.expectedGap, 1);

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

test('retired accounts pause scheduled allowance wording without changing saved settings', async ({ page, request, browser, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Retired allowance');
  const path = `/api/accounts/${account.id}`;

  expect((await csrfWrite(request, 'POST', `${path}/opening`, { amount: '0', idempotencyKey: randomUUID() })).status()).toBe(200);
  expect(
    (await csrfWrite(request, 'POST', `${path}/transactions`, { source: 'deposit', amount: '1', idempotencyKey: randomUUID() })).status(),
  ).toBe(200);
  expect((await csrfWrite(request, 'PUT', `${path}/allowance`, { enabled: true, amount: '12.34' })).status()).toBe(200);

  const configuration = await (await request.get(`${path}/allowance`)).json();
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${configuration.scheduled.effectiveMonth}-01T12:00:00Z`),
  );
  const reason = 'No automatic allowance credits are posted while this account is scheduled for deletion.';
  const reader = await createReader(request);

  await login(request, manager);

  expect((await csrfWrite(request, 'DELETE', path, {})).status()).toBe(202);

  await signIn(page, manager, `/accounts/${account.id}`);

  await expect(page.locator('#account-details-allowance-status')).toHaveText('Automatic monthly allowance paused');
  await expect(page.locator('#account-details-allowance-paused-reason')).toHaveText(reason);
  await expect(page.locator('#account-details-allowance-paused-reason')).toHaveRole('status');
  await expect(page.locator('#account-details-allowance-paused-reason')).toHaveClass(/message-info/);
  await expect(page.locator('#account-details-allowance-paused-reason .icon-info')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#account-details-allowance-scheduled')).toHaveText(`Saved allowance setting from ${month}.`);
  await expect(page.locator('#account-details-allowance-amount-display')).toHaveText('+12.34 € per month');
  await expect(page.locator('#account-details-allowance-edit')).toHaveCount(0);
  await expect(page.locator('#account-details-no-credits')).toHaveText('No credits yet');

  const notice = await page.locator('#account-details-allowance-paused-reason').evaluate((element) => {
    const title = element.previousElementSibling;

    if (!title) {
      throw new Error('Missing allowance title before retirement info box');
    }

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return {
      titleId: title.id,
      beforeConfiguration: element.nextElementSibling?.classList.contains('allowance'),
      gap: rect.top - title.getBoundingClientRect().bottom,
      expectedGap: parseFloat(style.getPropertyValue('--space-4')) * parseFloat(getComputedStyle(document.documentElement).fontSize),
      fits: element.scrollWidth <= element.clientWidth,
    };
  });

  expect(notice.titleId).toBe('account-details-allowance-title');
  expect(notice.beforeConfiguration).toBe(true);
  expect(notice.gap).toBeCloseTo(notice.expectedGap, 1);
  expect(notice.fits).toBe(true);

  await page.locator('app-account-allowance').screenshot({ path: test.info().outputPath('retired-allowance-info.png') });

  const divider = await page.locator('#account-details-allowance-execution').evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      width: style.borderTopWidth,
      style: style.borderTopStyle,
      color: style.borderTopColor,
      padding: parseFloat(style.paddingTop),
      expectedPadding: parseFloat(style.getPropertyValue('--space-5')) * parseFloat(getComputedStyle(document.documentElement).fontSize),
    };
  });

  expect(divider.width).toBe('1px');
  expect(divider.style).toBe('solid');
  expect(divider.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(divider.padding).toBeCloseTo(divider.expectedPadding, 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await signIn(memberPage, reader, `/accounts/${account.id}`);

    await expect(memberPage.locator('#account-details-error')).toContainText('This account does not exist.');
    await expect(memberPage.locator('#account-details-allowance-status')).toHaveCount(0);
    await expect(memberPage.locator('#account-details-allowance-edit')).toHaveCount(0);
  } finally {
    await context.close();
  }

  expect(await (await request.get(`${path}/allowance`)).json()).toEqual(configuration);
  expect((await csrfWrite(request, 'POST', `${path}/reactivate`, {})).status()).toBe(204);

  await page.reload();

  await expect(page.locator('#account-details-allowance-status')).toHaveText('Automatic monthly allowance scheduled');
  await expect(page.locator('#account-details-allowance-scheduled')).toHaveText(`Credits are posted automatically from ${month}.`);
  await expect(page.locator('#account-details-allowance-paused-reason')).toHaveCount(0);
  await expect(page.locator('#account-details-allowance-edit')).toBeEnabled();
  expect(await (await request.get(`${path}/allowance`)).json()).toEqual(configuration);
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
