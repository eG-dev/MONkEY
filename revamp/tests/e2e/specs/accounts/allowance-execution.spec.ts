import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { test, expect, docker, image, bootstrapManager, csrfWrite, login, signIn, containerOrigin, waitReady } from '../../fixtures';
import { Instance } from '../../instance';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

function configureFixture(
  instance: Instance,
  accountId: string,
  mode: 'seed-interrupted' | 'seed-failure' | 'seed-active-failure' | 'remove-failure',
): void {
  const result = docker(
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
    'allowance-fixture',
    '/data/monkey.db',
    accountId,
    mode,
  );

  expect(result).toBe('allowance_fixture_ready');
}

async function restart(instance: Instance): Promise<void> {
  docker('start', instance.container);
  await waitReady(containerOrigin(instance.container));
}

test('hosted allowance worker resumes interrupted credits after a crash without duplicating history', async ({
  page,
  request,
  browser,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = await createAccount(request, 'Allowance restart');

  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '10.00',
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);

  const reader = await createReader(request);

  await login(request, manager);

  docker('kill', '--signal', 'KILL', instance.container);
  configureFixture(instance, account.id, 'seed-interrupted');
  await restart(instance);

  await expect.poll(async () => (await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('13.75');

  const state = await (await request.get(`/api/accounts/${account.id}/allowance`)).json();
  const before = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();

  expect(state.timezone).toBe('Europe/Berlin');
  expect(state.outstandingExecution).toBeNull();
  expect(before.entries.filter((entry: { source: string }) => entry.source === 'allowance')).toHaveLength(3);

  await signIn(page, manager, `/accounts/${account.id}`);

  await expect(page.locator('#account-details-balance')).toHaveText('+13.75 €');

  const timestamp = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: state.timezone,
  }).format(new Date(state.latestExecution.creditedAtUtc));

  await expect(page.locator('#account-details-last-credit')).toHaveText(`Last credit: ${timestamp}`);
  await expect(page.locator('#account-details-credit-outstanding')).toHaveCount(0);
  await expect(page.getByTestId('ledger-entry').filter({ hasText: 'Allowance' })).toHaveCount(3);
  await expect(page.getByTestId('ledger-entry').filter({ hasText: 'Allowance' }).first()).toContainText(
    `Monthly allowance for ${state.businessMonth}`,
  );
  await expect(page.getByTestId('ledger-entry').filter({ hasText: 'Allowance' }).first()).toContainText('Automatic');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.screenshot({
    path: test.info().outputPath('allowance-credited.png'),
    fullPage: true,
  });

  const creditDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: state.timezone,
  }).format(new Date(state.latestExecution.creditedAtUtc));

  for (const [theme, color] of [
    ['light', 'rgb(102, 102, 102)'],
    ['dark', 'rgb(166, 166, 166)'],
  ]) {
    expect((await csrfWrite(request, 'PUT', '/api/auth/theme', { theme })).status()).toBe(204);

    const response = await page.goto('/');

    expect(await response!.text()).toContain(`Last credit: ${creditDate}`);
    await expect(page.getByTestId('card-allowance')).toContainText('+1.25 € per month');
    await expect(page.getByTestId('card-allowance-execution')).toHaveText(`Last credit: ${creditDate}`);
    await expect(page.getByTestId('card-allowance-execution')).toHaveCSS('color', color);

    const layout = await page.getByTestId('card-allowance').evaluate((element) => ({
      amountBottom: element.querySelector('.amount-positive')!.getBoundingClientRect().bottom,
      executionTop: element.querySelector('.allowance-execution')!.getBoundingClientRect().top,
    }));

    expect(layout.executionTop).toBeGreaterThanOrEqual(layout.amountBottom);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`overview-credited-${theme}.png`), fullPage: true });
  }

  await page.goto('/accounts');

  await expect(page.locator('#accounts-table thead th')).toHaveText(['Account name', 'Balance', 'Monthly allowance', 'Status', 'Actions']);
  await expect(page.getByTestId('account-row-allowance')).toHaveText('+1.25 € per month');

  const context = await browser.newContext({
    ...test.info().project.use,
    baseURL: instance.origin,
    ignoreHTTPSErrors: true,
  });

  try {
    const memberPage = await context.newPage();

    await signIn(memberPage, reader, `/accounts/${account.id}`);

    await expect(memberPage.locator('#account-details-last-credit')).toHaveText(`Last credit: ${timestamp}`);
    await expect(memberPage.locator('#account-details-allowance-edit')).toHaveCount(0);
    await expect(memberPage.getByTestId('ledger-entry').filter({ hasText: 'Allowance' })).toHaveCount(3);
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await memberPage.goto('/');

    await expect(memberPage.getByTestId('card-allowance-execution')).toHaveText(`Last credit: ${creditDate}`);
    await expect(memberPage.getByTestId('card-allowance-execution')).toHaveCSS('color', 'rgb(102, 102, 102)');
  } finally {
    await context.close();
  }

  docker('kill', '--signal', 'KILL', instance.container);
  await restart(instance);

  await expect.poll(async () => (await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('13.75');
  expect(await (await request.get(`/api/accounts/${account.id}/transactions`)).json()).toEqual(before);
});

for (const activeAllowance of [false, true]) {
  test(`manager sees atomic failure details while member sees status and retry recovers (${activeAllowance ? 'active' : 'disabled'} allowance)`, async ({
    page,
    request,
    browser,
    instance,
  }) => {
    test.setTimeout(120_000);

    const manager = bootstrapManager(instance);

    await login(request, manager);

    const account = await createAccount(request, 'Allowance failure');

    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
          amount: '10.00',
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(200);

    const reader = await createReader(request);

    await login(request, manager);

    docker('kill', '--signal', 'KILL', instance.container);
    configureFixture(instance, account.id, activeAllowance ? 'seed-active-failure' : 'seed-failure');
    await restart(instance);

    await expect
      .poll(async () => (await (await request.get(`/api/accounts/${account.id}/allowance`)).json()).outstandingExecution?.status)
      .toBe('failed');

    const state = await (await request.get(`/api/accounts/${account.id}/allowance`)).json();
    const history = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();

    expect(state.outstandingExecution.errorCode).toBe('execution_failed');
    expect(state.outstandingExecution.attempts).toBeGreaterThanOrEqual(2);
    expect(history.entries).toHaveLength(2);
    expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('11.25');

    await signIn(page, manager, `/accounts/${account.id}`);

    await expect(page.locator('#account-details-credit-outstanding')).toHaveRole('status');
    await expect(page.locator('#account-details-credit-outstanding')).toContainText(
      `Credit for ${state.outstandingExecution.businessMonth} failed.`,
    );
    await expect(page.locator('#account-details-credit-attempt')).toContainText('Last attempt:');
    await expect(page.locator('#account-details-credit-failure-reason')).toHaveText(
      'The credit could not be saved. Automatic retry pending.',
    );
    await expect(page.locator('#account-details-last-credit')).not.toContainText('(for');
    const historicalTimestamp = new Intl.DateTimeFormat('en-US', {
      timeZone: state.timezone,
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(state.latestExecution.creditedAtUtc));

    await expect(page.getByTestId('ledger-entry').first().locator('time')).toHaveText(historicalTimestamp);
    await expect(page.locator('#account-details-balance')).toHaveText('+11.25 €');

    const layout = await page.evaluate(() => {
      const credit = document.getElementById('account-details-last-credit')!;
      const icon = credit.querySelector('.icon')!.getBoundingClientRect();
      const text = credit.querySelector('span:not(.icon)')!.getBoundingClientRect();
      const error = document.getElementById('account-details-credit-outstanding')!.getBoundingClientRect();

      return {
        center: Math.abs(icon.y + icon.height / 2 - text.y - text.height / 2),
        gap: error.top - credit.getBoundingClientRect().bottom,
      };
    });

    expect(layout.center).toBeLessThanOrEqual(1);
    expect(layout.gap).toBeGreaterThanOrEqual(12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.screenshot({
      path: test.info().outputPath('allowance-failed.png'),
      fullPage: true,
    });

    if (activeAllowance) {
      for (const [theme, color] of [
        ['light', 'rgb(196, 53, 43)'],
        ['dark', 'rgb(255, 107, 96)'],
      ]) {
        expect((await csrfWrite(request, 'PUT', '/api/auth/theme', { theme })).status()).toBe(204);

        const response = await page.goto('/');

        expect(await response!.text()).toContain(`Credit for ${state.outstandingExecution.businessMonth} failed.`);
        await expect(page.getByTestId('card-allowance-execution')).toContainText(
          `Credit for ${state.outstandingExecution.businessMonth} failed.`,
        );
        await expect(page.getByTestId('card-allowance-execution')).toHaveCSS('color', color);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: test.info().outputPath(`overview-failed-${theme}.png`), fullPage: true });
      }
    } else {
      await page.goto('/');

      await expect(page.getByTestId('card-allowance')).toHaveText('No monthly allowance');
      await expect(page.getByTestId('card-allowance-execution')).toHaveCount(0);
    }

    await page.goto(`/accounts/${account.id}`);

    const context = await browser.newContext({
      ...test.info().project.use,
      baseURL: instance.origin,
      ignoreHTTPSErrors: true,
    });

    try {
      const memberPage = await context.newPage();

      await signIn(memberPage, reader, `/accounts/${account.id}`);

      const memberState = await (await memberPage.request.get(`/api/accounts/${account.id}/allowance`)).json();

      expect(memberState.outstandingExecution.status).toBe('failed');
      expect(memberState.outstandingExecution.attempts).toBeNull();
      expect(memberState.outstandingExecution.lastAttemptAtUtc).toBeNull();
      expect(memberState.outstandingExecution.errorCode).toBeNull();

      await expect(memberPage.locator('#account-details-credit-outstanding')).toContainText(
        `Credit for ${state.outstandingExecution.businessMonth} failed.`,
      );
      await expect(memberPage.locator('#account-details-credit-attempt')).toHaveCount(0);
      await expect(memberPage.locator('#account-details-credit-failure-reason')).toHaveCount(0);
      await expect(memberPage.locator('#account-details-allowance-edit')).toHaveCount(0);
      await expect(memberPage.locator('#account-details-balance')).toHaveText('+11.25 €');
      expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const memberOverview = await memberPage.goto('/');

      if (activeAllowance) {
        const failureText = `Credit for ${state.outstandingExecution.businessMonth} failed. Automatic retry pending.`;

        expect(await memberOverview!.text()).toContain(failureText);
        await expect(memberPage.getByTestId('card-allowance-execution')).toHaveText(failureText);
        await expect(memberPage.getByTestId('card-allowance-execution')).toHaveCSS('color', 'rgb(196, 53, 43)');
        await expect(memberPage.locator('#account-details-credit-attempt')).toHaveCount(0);
        await expect(memberPage.locator('#account-details-credit-failure-reason')).toHaveCount(0);
      } else {
        await expect(memberPage.getByTestId('card-allowance-execution')).toHaveCount(0);
      }
    } finally {
      await context.close();
    }

    configureFixture(instance, account.id, 'remove-failure');

    await expect
      .poll(async () => (await (await request.get(`/api/accounts/${account.id}`)).json()).balance, {
        timeout: 75_000,
        intervals: [250, 500, 1000],
      })
      .toBe(activeAllowance ? '13.75' : '12.50');
    await page.reload();

    await expect(page.locator('#account-details-credit-outstanding')).toHaveCount(0);
    if (activeAllowance) {
      await expect(page.locator('#account-details-last-credit')).not.toContainText('(for');
    } else {
      await expect(page.locator('#account-details-last-credit')).toContainText(`(for ${state.outstandingExecution.businessMonth})`);
    }

    await expect(page.getByTestId('ledger-entry').filter({ hasText: 'Allowance' })).toHaveCount(activeAllowance ? 3 : 2);

    const recovered = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();
    const originalCredit = history.entries.find((entry: { source: string }) => entry.source === 'allowance');

    expect(recovered.entries).toContainEqual(originalCredit);
  });
}

test('allowance execution catches up historical months and survives retry, concurrency, crashes and timezone changes @api', async () => {
  const result = docker(
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
    image,
    '/checks/RuntimeChecks.dll',
    'allowance-execution',
  );

  expect(result).toBe('allowance_execution_passed');
});
