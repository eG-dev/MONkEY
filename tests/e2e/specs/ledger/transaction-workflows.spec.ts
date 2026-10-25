import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { test, expect, bootstrapManager, csrfWrite, login, signIn, docker, image, waitReady, containerOrigin } from '../../fixtures';
import { createAccount, createReader, openTransactionForm } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test.describe('transaction workflow', () => {
  const currency = 'EUR';
  const symbol = '€';

  test.use({ currency });

  test('signed transactions, retry and history pagination', async ({ page, request, browser, instance }) => {
    const manager = bootstrapManager(instance);
    const managerProfile = await login(request, manager);
    const recordedBy = 'Ledger Manager Display';

    expect(
      (
        await csrfWrite(request, 'PUT', `/api/users/${managerProfile.id}`, {
          displayName: recordedBy,
          role: 'Manager',
          isActive: true,
        })
      ).status(),
    ).toBe(204);

    await login(request, manager);

    const account = await createAccount(request, 'Manual ledger');
    const minimum = await createAccount(request, 'Minimum ledger');

    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${minimum.id}/opening`, {
          amount: '-92233720368547758.08',
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(200);

    const reader = await createReader(request);

    await login(request, manager);

    const labels = {
      username: 'Username',
      password: 'Password',
      login: 'Sign in',
      opening: 'Post opening balance',
      openingAmount: `Opening amount (${currency})`,
      record: 'Record transaction',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      amount: `Amount (${currency})`,
      postDeposit: 'Record deposit',
      postWithdrawal: 'Record withdrawal',
      comment: 'Comment (optional)',
      next: 'Next page',
      previous: 'Previous page',
      saved: 'Deposit recorded',
      decimal: '.',
      minimum: `-92,233,720,368,547,758.08 ${symbol}`,
    };
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    await signIn(page, manager, `/accounts/${account.id}`);

    const balance = page.locator('#account-details-balance');
    const amount = page.locator('#account-details-transaction-amount');
    const submit = page.locator('#account-details-transaction-submit');
    const deposit = page.locator('#account-details-transaction-deposit');
    const withdrawal = page.locator('#account-details-transaction-withdrawal');
    const error = page.locator('#account-details-transaction-error');
    const entries = page.getByTestId('ledger-entry');

    await expect(page.locator('#account-details-opening-amount')).toHaveAccessibleName(labels.openingAmount);

    await page.locator('#account-details-opening-amount').fill(`-0${labels.decimal}01`);
    await page.locator('#account-details-opening-submit').click();
    await page.locator('#account-details-opening-confirm-submit').click();

    await expect(balance).toHaveText(`-0${labels.decimal}01 ${symbol}`);
    await expect(balance).toHaveClass(/amount-negative/);

    await openTransactionForm(page, labels.record);
    await page.screenshot({
      path: test.info().outputPath('transaction-dialog.png'),
      fullPage: true,
    });

    await expect(withdrawal).toHaveAccessibleName(labels.withdrawal);

    await withdrawal.check();

    await expect(page.locator('#account-details-transaction-form')).toHaveAttribute('data-mode', 'withdrawal');
    await expect(amount).toHaveAccessibleName(labels.amount);
    await expect(submit).toHaveText(labels.postWithdrawal);

    for (const value of ['0', '-1', `1${labels.decimal}001`]) {
      await amount.fill(value);
      await submit.click();

      await expect(error).toHaveRole('alert');
    }

    const comment = '<img src=x onerror="window.monkeyXss=true">';

    await amount.fill(`0${labels.decimal}02`);

    await expect(page.locator('#account-details-transaction-comment')).toHaveAccessibleName(labels.comment);

    await page.locator('#account-details-transaction-comment').fill(comment);
    await submit.click();

    await expect(balance).toHaveText(`-0${labels.decimal}03 ${symbol}`);
    await expect(page.locator('#account-details-transaction-dialog')).not.toBeVisible();
    await expect(entries.first()).toContainText(comment);
    await expect(entries.first()).toContainText(`-0${labels.decimal}02 ${symbol}`);
    await expect(page.getByRole('columnheader', { name: 'Recorded by', exact: true })).toHaveCount(
      test.info().project.name === 'mobile' ? 0 : 1,
    );
    await expect(entries.first()).toContainText(recordedBy);
    await expect(entries.first().locator('.by')).toHaveText(recordedBy);
    expect(await page.evaluate(() => 'monkeyXss' in window)).toBe(false);

    const keys: string[] = [];

    await page.route(`**/api/accounts/${account.id}/transactions`, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      keys.push(route.request().postDataJSON().idempotencyKey);

      const response = await route.fetch();

      if (keys.length === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({ response });
      }
    });

    await openTransactionForm(page, labels.record);

    await expect(deposit).toHaveAccessibleName(labels.deposit);

    await deposit.check();

    await expect(submit).toHaveText(labels.postDeposit);

    await amount.fill(`0${labels.decimal}01`);
    await submit.click();

    await expect(error).toHaveRole('alert');

    await submit.click();

    await expect(page.locator('#account-details-saved')).toContainText(labels.saved);
    await expect(balance).toHaveText(`-0${labels.decimal}02 ${symbol}`);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
    await expect(entries).toHaveCount(3);

    await page.unroute(`**/api/accounts/${account.id}/transactions`);

    for (let index = 0; index < 22; index++) {
      expect(
        (
          await csrfWrite(request, 'POST', `/api/accounts/${account.id}/transactions`, {
            amount: '0.01',
            source: 'deposit',
            idempotencyKey: randomUUID(),
            comment: `Page marker ${index}`,
          })
        ).status(),
      ).toBe(200);
    }

    await page.reload();

    await expect(entries).toHaveCount(20);
    await expect(entries.first()).toContainText('Page marker 21');
    await expect(page.locator('#account-details-history-next')).toHaveText(labels.next);

    await page.locator('#account-details-history-next').click();

    await expect(entries).toHaveCount(5);
    await expect(entries.filter({ hasText: comment })).toHaveCount(1);
    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${account.id}/transactions`, {
          amount: '0.01',
          source: 'deposit',
          idempotencyKey: randomUUID(),
          comment: 'New while browsing',
        })
      ).status(),
    ).toBe(200);
    await expect(page.locator('#account-details-history-previous')).toHaveText(labels.previous);

    await page.locator('#account-details-history-previous').click();

    await expect(entries).toHaveCount(20);
    await expect(entries.first()).toContainText('Page marker 21');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.screenshot({
      path: test.info().outputPath('transaction-history.png'),
      fullPage: true,
    });

    await page.goto(`/accounts/${minimum.id}`);

    await expect(balance).toHaveText(labels.minimum);
    await expect(entries.first()).toContainText(labels.minimum);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.screenshot({
      path: test.info().outputPath('minimum-balance.png'),
      fullPage: true,
    });

    const context = await browser.newContext({
      ...test.info().project.use,
      baseURL: instance.origin,
      ignoreHTTPSErrors: true,
    });

    try {
      const memberPage = await context.newPage();

      memberPage.on('pageerror', (error) => errors.push(error.message));
      await signIn(memberPage, reader, `/accounts/${account.id}`);

      await expect(memberPage.getByTestId('ledger-entry')).toHaveCount(20);
      await expect(memberPage.getByRole('radio')).toHaveCount(0);
      await expect(memberPage.locator('#account-details-record-transaction')).toHaveCount(0);

      await memberPage.locator('#account-details-history-next').click();

      await expect(memberPage.getByTestId('ledger-entry')).toHaveCount(6);
    } finally {
      await context.close();
    }

    expect(errors).toEqual([]);
  });
});

test('history restarts once after startup retention invalidates cached pages', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Retention history');
  const reader = await createReader(request);

  await login(request, manager);

  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '-0.01',
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);

  const path = `/api/accounts/${account.id}/transactions`;
  const expired = {
    amount: '0.01',
    source: 'deposit',
    idempotencyKey: randomUUID(),
    comment: 'Expired detail',
  };

  for (let index = 0; index < 25; index++) {
    expect(
      (
        await csrfWrite(
          request,
          'POST',
          path,
          index === 0
            ? expired
            : {
                ...expired,
                idempotencyKey: randomUUID(),
              },
        )
      ).status(),
    ).toBe(200);
  }

  const before = await (await request.get(`${path}?pageSize=20`)).json();

  await signIn(page, manager, `/accounts/${account.id}`);
  await expect(page.getByTestId('ledger-entry')).toHaveCount(20);
  await page.locator('#account-details-history-next').click();
  await expect(page.getByTestId('ledger-entry')).toHaveCount(6);
  await page.locator('#account-details-history-previous').click();
  await expect(page.getByTestId('ledger-entry')).toHaveCount(20);

  docker('stop', instance.container);

  expect(
    docker(
      'run',
      '--rm',
      '--network',
      'none',
      '--user',
      '10001:10001',
      '--entrypoint',
      'dotnet',
      '--mount',
      `type=bind,source=${resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0')},target=/checks,readonly`,
      '--mount',
      `type=volume,source=${instance.volume},target=/data`,
      image,
      '/checks/RuntimeChecks.dll',
      'retention-fixture',
      '/data/monkey.db',
      account.id,
    ),
  ).toBe('retention_fixture_ready');

  docker('start', instance.container);
  await waitReady(containerOrigin(instance.container));
  await expect.poll(async () => (await (await request.get(path)).json()).entries.length).toBe(1);

  const conflicts = await request.get(`${path}?cursor=${encodeURIComponent(before.nextCursor)}`);

  expect(conflicts.status()).toBe(409);
  expect(await conflicts.json()).toEqual({ code: 'history_retention_changed' });
  expect(await (await csrfWrite(request, 'POST', path, expired)).json()).toEqual({ code: 'transaction_history_expired' });
  const expiredOpening = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, expired);

  expect(expiredOpening.status()).toBe(409);
  expect(await expiredOpening.json()).toEqual({
    code: 'transaction_history_expired',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.24');

  const statuses: number[] = [];

  page.on('response', (response) => {
    if (response.request().method() === 'GET' && new URL(response.url()).pathname === path) {
      statuses.push(response.status());
    }
  });

  await page.locator('#account-details-history-next').click();
  await expect(page.getByTestId('ledger-entry')).toHaveCount(1);
  await expect(page.getByTestId('ledger-entry')).toContainText('Opening');
  await expect(page.locator('#account-details-history-next')).toBeDisabled();
  await expect(page.locator('#account-details-history-previous')).toBeDisabled();
  expect(statuses).toEqual([409, 200]);

  const retained = await (await request.get(path)).json();

  await login(request, reader);

  expect(await (await request.get(path)).json()).toEqual(retained);
  expect(
    (
      await csrfWrite(request, 'POST', path, {
        ...expired,
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(403);
});
