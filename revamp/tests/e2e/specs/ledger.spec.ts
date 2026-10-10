import { APIRequestContext, Page, request as apiRequest } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import {
  test,
  expect,
  bootstrapManager,
  credentials,
  createUser,
  csrfWrite,
  login,
  docker,
  containerOrigin,
  startContainer,
  waitReady,
  image,
} from '../fixtures';

test.use({ ignoreHTTPSErrors: true });

async function createAccount(request: APIRequestContext, name: string) {
  const response = await csrfWrite(request, 'POST', '/api/accounts', { name });

  expect(response.status()).toBe(201);

  return response.json();
}

async function createReader(request: APIRequestContext, language = 'de') {
  const { account: temporary } = await createUser(request, 'reader', 'Reader', 'Member');
  const permanent = credentials('reader');

  await csrfWrite(request, 'POST', '/api/auth/logout', {});
  await login(request, temporary);
  const changed = await csrfWrite(request, 'POST', '/api/auth/password', {
    currentPassword: temporary.password,
    newPassword: permanent.password,
  });

  expect(changed.status()).toBe(204);

  await login(request, permanent);
  expect((await csrfWrite(request, 'PUT', '/api/auth/language', { language })).status()).toBe(204);

  return permanent;
}

async function chooseLanguage(page: Page, language: string, returnTo: string) {
  await page.goto('/administration');
  await Promise.all([page.waitForEvent('load'), page.getByRole('combobox').selectOption(language)]);
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await page.goto(returnTo);
}

async function openTransactionForm(page: Page, record: string) {
  const actions = page.locator('.details-head .view-actions');
  const trigger = actions.getByRole('button', { name: record, exact: true });

  await expect(page.locator('.transaction-form')).toHaveCount(0);
  await expect(actions.getByRole('button')).toHaveCount(2);
  await expect(actions.getByRole('button').last()).toHaveText(record);
  await trigger.click();
  await expect(page.getByRole('dialog', { name: record, exact: true })).toBeVisible();
  await expect(page.locator('.transaction-form')).toHaveCount(1);
}

test('real SQLite ledger migration, exact arithmetic, constraints and complete rollback hold @api', async () => {
  const probe = resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0');
  const output = docker(
    'run',
    '--rm',
    '--network',
    'none',
    '--user',
    '10001:10001',
    '--entrypoint',
    'dotnet',
    '--mount',
    `type=bind,source=${probe},target=/tests,readonly`,
    image,
    '/tests/RuntimeChecks.dll',
    'ledger-persistence',
  );

  expect(output).toBe('ledger_persistence_passed');
});

test('opening APIs enforce Manager access, CSRF, exact amounts and explicit zero @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const payload = {
    amount: '0.00',
    idempotencyKey: randomUUID(),
    comment: 'Opening marker',
  };

  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(401);

  await login(request, manager);
  const account = await createAccount(request, 'Opening');
  const path = `/api/accounts/${account.id}/opening`;

  expect(account.balance).toBeNull();
  expect(account.openingEntry).toBeNull();
  expect((await request.post(path, { data: payload })).status()).toBe(400);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(404);

  for (const amount of ['', '-92233720368547758.09', '1.001', '1e2', ' 1.00', 'NaN', '92233720368547758.08', null]) {
    const invalid = await csrfWrite(request, 'POST', path, {
      ...payload,
      amount,
    });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: 'invalid_opening_amount' });
  }

  expect((await csrfWrite(request, 'POST', path, { ...payload, amount: 12.34 })).status()).toBe(400);
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        idempotencyKey: 'bad',
      })
    ).json(),
  ).toEqual({
    code: 'invalid_idempotency_key',
  });
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        comment: 'A'.repeat(501),
      })
    ).json(),
  ).toEqual({
    code: 'invalid_comment',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBeNull();

  const posted = await csrfWrite(request, 'POST', path, payload);
  const entry = await posted.json();

  expect(posted.status()).toBe(200);
  expect(entry).toMatchObject({
    accountId: account.id,
    amount: '0.00',
    currency: 'EUR',
    source: 'opening',
    comment: payload.comment,
  });
  expect(entry).not.toHaveProperty('idempotencyKey');
  expect(entry.occurredAtUtc).toMatch(/\+00:00$|Z$/);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.00');

  await createReader(request);

  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).openingEntry).toEqual(entry);
  expect(
    (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(403);
  expect((await request.put(path, { data: payload })).status()).toBe(404);
  expect((await request.delete(path)).status()).toBe(404);
});

test('concurrent openings and retries are idempotent with conflicting-payload errors @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);
  const account = await createAccount(request, 'Concurrent');
  const other = await createAccount(request, 'Other');
  const payload = {
    amount: '42.17',
    comment: 'Same request',
    idempotencyKey: randomUUID(),
  };
  const headers = {
    'X-Monkey-CSRF': (await (await request.get('/api/auth/csrf')).json()).token,
  };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () =>
      request.post(`/api/accounts/${account.id}/opening`, {
        data: payload,
        headers,
      }),
    ),
  );
  const entries = await Promise.all(responses.map((response) => response.json()));

  expect(responses.map((response) => response.status())).toEqual([200, 200, 200]);
  expect(new Set(entries.map((entry) => entry.id)).size).toBe(1);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('42.17');

  for (const change of [{ amount: '42.18' }, { comment: 'Changed' }]) {
    const conflict = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { ...payload, ...change });

    expect(conflict.status()).toBe(409);
    expect(await conflict.json()).toEqual({ code: 'idempotency_conflict' });
  }

  const reused = await csrfWrite(request, 'POST', `/api/accounts/${other.id}/opening`, payload);
  const second = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { ...payload, idempotencyKey: randomUUID() });

  expect(reused.status()).toBe(409);
  expect(await reused.json()).toEqual({ code: 'idempotency_conflict' });
  expect(second.status()).toBe(409);
  expect(await second.json()).toEqual({ code: 'already_initialized' });

  const race = await Promise.all(
    [0, 1].map(() =>
      request.post(`/api/accounts/${other.id}/opening`, {
        data: { amount: '0.10', idempotencyKey: randomUUID() },
        headers,
      }),
    ),
  );

  expect(race.map((response) => response.status()).sort()).toEqual([200, 409]);
  expect((await (await request.get(`/api/accounts/${other.id}`)).json()).balance).toBe('0.10');
});

test('maximum exact balances, historical actor names and private SSR survive restart @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const profile = await login(request, manager);
  const account = await createAccount(request, 'Exact private ledger');
  const payload = {
    amount: '92233720368547758.07',
    idempotencyKey: randomUUID(),
    comment: 'Private opening comment',
  };
  const posted = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);
  const entry = await posted.json();

  expect(posted.status()).toBe(200);
  expect(entry.amount).toBe(payload.amount);
  expect(entry.actorId).toBe(profile.id);
  expect(entry.actorDisplayName).toBe(profile.displayName);

  expect(
    (
      await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
        displayName: 'Renamed Manager',
        role: 'Manager',
        isActive: true,
      })
    ).status(),
  ).toBe(204);
  await login(request, manager);
  const replay = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);

  expect(await replay.json()).toEqual(entry);

  const { account: secondManager } = await createUser(request, 'othermanager', 'Other Manager', 'Manager');
  await login(request, secondManager);
  const permanent = credentials(secondManager.username);
  expect(
    (
      await csrfWrite(request, 'POST', '/api/auth/password', {
        currentPassword: secondManager.password,
        newPassword: permanent.password,
      })
    ).status(),
  ).toBe(204);
  await login(request, permanent);
  const actorConflict = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);

  expect(actorConflict.status()).toBe(409);
  expect(await actorConflict.json()).toEqual({ code: 'idempotency_conflict' });

  await login(request, manager);
  const anonymous = await apiRequest.newContext({
    baseURL: instance.origin,
    ignoreHTTPSErrors: true,
  });

  try {
    const [privatePage, publicPage] = await Promise.all([request.get(`/accounts/${account.id}`), anonymous.get(`/accounts/${account.id}`)]);

    expect(privatePage.headers()['cache-control']).toBe('no-store');
    expect(await privatePage.text()).toContain(payload.amount);
    expect(await privatePage.text()).toContain(payload.comment);
    expect(await publicPage.text()).not.toContain(payload.amount);
    expect(await publicPage.text()).not.toContain(payload.comment);
  } finally {
    await anonymous.dispose();
  }

  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));
  const persisted = await (await request.get(`/api/accounts/${account.id}`)).json();

  expect(persisted.balance).toBe(payload.amount);
  expect(persisted.openingEntry).toEqual(entry);

  docker('rm', '--force', instance.container);
  await waitReady(startContainer(instance.container, instance.volume, 'USD'));
  const relabeled = await (await request.get(`/api/accounts/${account.id}`)).json();

  expect(relabeled.balance).toBe(payload.amount);
  expect(relabeled.currency).toBe('USD');
  expect(relabeled.openingEntry).toEqual({ ...entry, currency: 'USD' });
  const replayed = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);
  expect(replayed.status()).toBe(200);
  expect(await replayed.json()).toEqual({ ...entry, currency: 'USD' });
});

test('manual transactions enforce roles, positive inputs, initialization and CSRF @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const payload = {
    amount: '0.02',
    source: 'withdrawal',
    idempotencyKey: randomUUID(),
    comment: 'Overdraft',
  };

  expect((await request.get('/api/accounts/missing/transactions')).status()).toBe(401);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/transactions', payload)).status()).toBe(401);

  await login(request, manager);
  const account = await createAccount(request, 'Signed transactions');
  const path = `/api/accounts/${account.id}/transactions`;

  expect(await (await request.get(path)).json()).toEqual({
    entries: [],
    nextCursor: null,
  });
  expect(await (await csrfWrite(request, 'POST', path, payload)).json()).toEqual({ code: 'not_initialized' });
  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '-0.01',
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);
  expect((await request.post(path, { data: payload })).status()).toBe(400);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/transactions', payload)).status()).toBe(404);

  for (const amount of ['0', '0.00', '-0.01', '1.001', '1e2', 'NaN', ' 1.00', '92233720368547758.08', null]) {
    const invalid = await csrfWrite(request, 'POST', path, {
      ...payload,
      amount,
    });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({
      code: 'invalid_transaction_amount',
    });
  }

  for (const change of [{ amount: 1 }, { source: 1 }, { source: 'unknown' }]) {
    expect((await csrfWrite(request, 'POST', path, { ...payload, ...change })).status()).toBe(400);
  }

  for (const [change, code] of [
    [{ source: 'opening' }, 'invalid_transaction_source'],
    [{ comment: 'A'.repeat(501) }, 'invalid_comment'],
    [{ idempotencyKey: 'bad' }, 'invalid_idempotency_key'],
  ] as const) {
    expect(await (await csrfWrite(request, 'POST', path, { ...payload, ...change })).json()).toEqual({ code });
  }

  const posted = await csrfWrite(request, 'POST', path, payload);
  expect(posted.status()).toBe(200);
  expect(await posted.json()).toMatchObject({
    amount: '-0.02',
    source: 'withdrawal',
    comment: 'Overdraft',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.03');

  for (const pageSize of [0, 101]) {
    expect(await (await request.get(`${path}?pageSize=${pageSize}`)).json()).toEqual({ code: 'invalid_page_size' });
  }

  expect(await (await request.get(`${path}?cursor=bad`)).json()).toEqual({
    code: 'invalid_history_cursor',
  });
  await createReader(request);
  expect((await request.get(path)).status()).toBe(200);
  expect(
    (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(403);
  expect((await request.put(path, { data: payload })).status()).toBe(404);
  expect((await request.delete(path)).status()).toBe(404);
});

test('concurrent transactions, source-aware retries and snapshot history survive restart @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const profile = await login(request, manager);
  const account = await createAccount(request, 'Concurrent transactions');
  const other = await createAccount(request, 'Other history');
  const path = `/api/accounts/${account.id}/transactions`;
  const openingKey = randomUUID();
  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '0.00',
        idempotencyKey: openingKey,
      })
    ).status(),
  ).toBe(200);
  const headers = {
    'X-Monkey-CSRF': (await (await request.get('/api/auth/csrf')).json()).token,
  };
  const writes = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      request.post(path, {
        headers,
        data: {
          amount: index % 2 ? '0.20' : '0.10',
          source: index % 2 ? 'withdrawal' : 'deposit',
          comment: `Concurrent ${index}`,
          idempotencyKey: randomUUID(),
        },
      }),
    ),
  );

  expect(writes.map((response) => response.status())).toEqual(Array(10).fill(200));
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.50');
  const payload = {
    amount: '0.10',
    source: 'deposit',
    comment: 'Retry',
    idempotencyKey: randomUUID(),
  };
  const retries = await Promise.all(Array.from({ length: 3 }, () => request.post(path, { headers, data: payload })));
  const replayed = await Promise.all(retries.map((response) => response.json()));

  expect(retries.map((response) => response.status())).toEqual([200, 200, 200]);
  expect(new Set(replayed.map((entry) => entry.id)).size).toBe(1);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.40');

  for (const change of [{ source: 'withdrawal' }, { amount: '0.11' }, { comment: 'Changed' }]) {
    expect(await (await csrfWrite(request, 'POST', path, { ...payload, ...change })).json()).toEqual({ code: 'idempotency_conflict' });
  }

  expect(await (await csrfWrite(request, 'POST', `/api/accounts/${other.id}/transactions`, payload)).json()).toEqual({
    code: 'idempotency_conflict',
  });
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        amount: '0.01',
        idempotencyKey: openingKey,
      })
    ).json(),
  ).toEqual({ code: 'idempotency_conflict' });
  expect(
    await (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '0.10',
        comment: 'Retry',
        idempotencyKey: payload.idempotencyKey,
      })
    ).json(),
  ).toEqual({ code: 'idempotency_conflict' });

  const first = await (await request.get(`${path}?pageSize=3`)).json();
  const newEntry = await (
    await csrfWrite(request, 'POST', path, {
      amount: '0.25',
      source: 'deposit',
      idempotencyKey: randomUUID(),
      comment: 'New after snapshot',
    })
  ).json();
  const original = [...first.entries];
  let cursor = first.nextCursor;

  expect((await request.get(`/api/accounts/${other.id}/transactions?cursor=${encodeURIComponent(cursor)}`)).status()).toBe(400);

  while (cursor) {
    const page = await (await request.get(`${path}?pageSize=3&cursor=${encodeURIComponent(cursor)}`)).json();
    original.push(...page.entries);
    cursor = page.nextCursor;
  }

  expect(original).toHaveLength(12);
  expect(new Set(original.map((entry) => entry.id)).size).toBe(12);
  expect(original.some((entry) => entry.id === newEntry.id)).toBe(false);
  expect(original.at(-1).source).toBe('opening');
  expect(original.every((entry) => entry.actorId === profile.id && entry.actorDisplayName === profile.displayName)).toBe(true);
  expect(original.every((entry) => !('idempotencyKey' in entry))).toBe(true);
  expect((await (await request.get(path)).json()).entries[0].id).toBe(newEntry.id);

  expect(
    (
      await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
        displayName: 'Renamed transaction manager',
        role: 'Manager',
        isActive: true,
      })
    ).status(),
  ).toBe(204);
  await login(request, manager);
  const before = await (await request.get(path)).json();
  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));

  expect(await (await request.get(path)).json()).toEqual(before);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.15');
  expect(await (await csrfWrite(request, 'POST', path, payload)).json()).toEqual(replayed[0]);
});

test('signed opening extremes reject overflowing transactions without changing history @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);

  for (const boundary of [
    { name: 'Upper', opening: '92233720368547758.07', source: 'deposit' },
    { name: 'Lower', opening: '-92233720368547758.08', source: 'withdrawal' },
  ]) {
    const account = await createAccount(request, boundary.name);
    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
          amount: boundary.opening,
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(200);
    const path = `/api/accounts/${account.id}/transactions`;
    const before = await (await request.get(path)).json();
    const overflow = await csrfWrite(request, 'POST', path, {
      amount: '0.01',
      source: boundary.source,
      idempotencyKey: randomUUID(),
    });

    expect(overflow.status()).toBe(409);
    expect(await overflow.json()).toEqual({ code: 'balance_overflow' });
    expect(await (await request.get(path)).json()).toEqual(before);
    expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe(boundary.opening);
  }
});

for (const language of ['de', 'en'] as const) {
  test.describe(`currency display ${language}`, () => {
    const currency = language === 'de' ? 'EUR' : 'USD';
    const symbol = currency === 'EUR' ? '€' : '$';
    test.use({ currency });
    test(`localized opening entry, exact display and Member read-only workflow in ${language}`, async ({
      page,
      request,
      browser,
      instance,
    }) => {
      const manager = bootstrapManager(instance);
      await login(request, manager);
      expect((await csrfWrite(request, 'PUT', '/api/auth/language', { language })).status()).toBe(204);
      const account = await createAccount(request, 'Pocket ledger');
      const maximum = await createAccount(request, 'Maximum ledger');
      expect(account.currency).toBe(currency);
      expect(maximum.currency).toBe(currency);
      expect(
        (
          await csrfWrite(request, 'POST', `/api/accounts/${maximum.id}/opening`, {
            amount: '92233720368547758.07',
            idempotencyKey: randomUUID(),
          })
        ).status(),
      ).toBe(200);
      const reader = await createReader(request, language);
      const labels =
        language === 'de'
          ? {
              username: 'Benutzername',
              password: 'Passwort',
              login: 'Anmelden',
              post: 'Eröffnungsbetrag buchen',
              amount: `Eröffnungsbetrag (${currency})`,
              comment: 'Kommentar (optional)',
              empty: 'Nicht initialisiert',
              saved: 'Eröffnungsbetrag gebucht',
              money: `+12,34 ${symbol}`,
              input: '12,34',
              maximum: `+92.233.720.368.547.758,07 ${symbol}`,
            }
          : {
              username: 'Username',
              password: 'Password',
              login: 'Sign in',
              post: 'Post opening balance',
              amount: `Opening amount (${currency})`,
              comment: 'Comment (optional)',
              empty: 'Not initialized',
              saved: 'Opening balance posted',
              money: `+12.34 ${symbol}`,
              input: '12.34',
              maximum: `+92,233,720,368,547,758.07 ${symbol}`,
            };
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.context().addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
      await page.goto(`/accounts/${account.id}`);
      await page.getByRole('textbox', { name: labels.username, exact: true }).fill(manager.username);
      await page.getByLabel(labels.password, { exact: true }).fill(manager.password);
      await page.getByRole('button', { name: labels.login, exact: true }).click();

      await expect(page.getByTestId('account-balance')).toHaveText(labels.empty);

      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(`${labels.input}1`);
      await page.getByRole('button', { name: labels.post, exact: true }).click();

      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(0);

      const comment = '<script>private opening comment</script>';
      await page.getByRole('textbox', { name: labels.comment, exact: true }).fill(comment);
      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(labels.input);
      await page.getByRole('textbox', { name: labels.amount, exact: true }).press('Enter');

      const confirmation = page.getByRole('dialog');

      await expect(confirmation).toContainText(labels.money);
      await confirmation.getByRole('button', { name: labels.post, exact: true }).click();

      await expect(page.getByRole('status').filter({ hasText: labels.saved })).toBeVisible();
      await expect(page.getByTestId('account-balance')).toHaveText(labels.money);
      await expect(page.getByTestId('account-balance')).toHaveClass(/amount-positive/);
      await expect(page.getByRole('button', { name: labels.post, exact: true })).toHaveCount(0);
      await expect(page.getByText(comment, { exact: true }).first()).toBeVisible();

      await page.reload();

      await expect(page.getByTestId('account-balance')).toHaveText(labels.money);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: test.info().outputPath('opening-entry.png'),
        fullPage: true,
      });

      const otherLanguage = language === 'de' ? 'en' : 'de';
      await chooseLanguage(page, otherLanguage, `/accounts/${account.id}`);

      await expect(page.locator('html')).toHaveAttribute('lang', otherLanguage);
      await expect(page.getByTestId('account-balance')).toHaveText(`+${otherLanguage === 'de' ? '12,34' : '12.34'} ${symbol}`);
      await expect(page.getByText(comment, { exact: true }).first()).toBeVisible();
      const persisted = await (await request.get(`/api/accounts/${account.id}`)).json();
      expect(persisted.balance).toBe('12.34');
      expect(persisted.currency).toBe(currency);
      expect(persisted.openingEntry.currency).toBe(currency);

      await chooseLanguage(page, language, `/accounts/${maximum.id}`);

      await expect(page.getByTestId('account-balance')).toHaveText(labels.maximum);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: test.info().outputPath('maximum-balance.png'),
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
        await context.addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
        await memberPage.goto(`/accounts/${account.id}`);
        await memberPage.getByRole('textbox', { name: labels.username, exact: true }).fill(reader.username);
        await memberPage.getByLabel(labels.password, { exact: true }).fill(reader.password);
        await memberPage.getByRole('button', { name: labels.login, exact: true }).click();

        await expect(memberPage.getByTestId('account-balance')).toHaveText(labels.money);
        await expect(memberPage.getByRole('button', { name: labels.post, exact: true })).toHaveCount(0);
      } finally {
        await context.close();
      }

      expect(errors).toEqual([]);
    });

    test(`localized signed transactions, retry and history pagination in ${language}`, async ({ page, request, browser, instance }) => {
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
      expect((await csrfWrite(request, 'PUT', '/api/auth/language', { language })).status()).toBe(204);
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
      const reader = await createReader(request, language);
      await login(request, manager);
      const labels =
        language === 'de'
          ? {
              username: 'Benutzername',
              password: 'Passwort',
              login: 'Anmelden',
              opening: 'Eröffnungsbetrag buchen',
              openingAmount: `Eröffnungsbetrag (${currency})`,
              record: 'Buchung erfassen',
              deposit: 'Einzahlung',
              withdrawal: 'Abhebung',
              amount: `Betrag (${currency})`,
              postDeposit: 'Einzahlung buchen',
              postWithdrawal: 'Abhebung buchen',
              comment: 'Kommentar (optional)',
              next: 'Nächste Seite',
              previous: 'Vorherige Seite',
              saved: 'Einzahlung gebucht',
              decimal: ',',
              minimum: `-92.233.720.368.547.758,08 ${symbol}`,
            }
          : {
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
      await page.context().addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
      await page.goto(`/accounts/${account.id}`);
      await page.getByRole('textbox', { name: labels.username, exact: true }).fill(manager.username);
      await page.getByLabel(labels.password, { exact: true }).fill(manager.password);
      await page.getByRole('button', { name: labels.login, exact: true }).click();
      await page.getByRole('textbox', { name: labels.openingAmount, exact: true }).fill(`-0${labels.decimal}01`);
      await page.getByRole('button', { name: labels.opening, exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: labels.opening, exact: true }).click();

      await expect(page.getByTestId('account-balance')).toHaveText(`-0${labels.decimal}01 ${symbol}`);
      await expect(page.getByTestId('account-balance')).toHaveClass(/amount-negative/);
      await openTransactionForm(page, labels.record);
      await page.screenshot({ path: test.info().outputPath('transaction-dialog.png'), fullPage: true });
      await page.getByRole('radio', { name: labels.withdrawal, exact: true }).check();

      await expect(page.locator('form[data-mode="withdrawal"]')).toBeVisible();

      for (const amount of ['0', '-1', `1${labels.decimal}001`]) {
        await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(amount);
        await page.getByRole('button', { name: labels.postWithdrawal, exact: true }).click();
        await expect(page.getByRole('alert')).toBeVisible();
      }

      const comment = '<img src=x onerror="window.monkeyXss=true">';
      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(`0${labels.decimal}02`);
      await page.getByRole('textbox', { name: labels.comment, exact: true }).fill(comment);
      await page.getByRole('button', { name: labels.postWithdrawal, exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText(`-0${labels.decimal}03 ${symbol}`);
      await expect(page.getByRole('dialog', { name: labels.record, exact: true })).toHaveCount(0);
      await expect(page.getByTestId('ledger-entry').first()).toContainText(comment);
      await expect(page.getByTestId('ledger-entry').first()).toContainText(`-0${labels.decimal}02 ${symbol}`);
      await expect(page.getByRole('columnheader', { name: language === 'de' ? 'Erfasst von' : 'Recorded by', exact: true }))
        .toHaveCount(test.info().project.name === 'mobile' ? 0 : 1);
      await expect(page.getByTestId('ledger-entry').first()).toContainText(recordedBy);
      await expect(page.getByTestId('ledger-entry').first().locator('.by')).toHaveText(recordedBy);
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
      await page.getByRole('radio', { name: labels.deposit, exact: true }).check();
      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(`0${labels.decimal}01`);
      await page.getByRole('button', { name: labels.postDeposit, exact: true }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await page.getByRole('button', { name: labels.postDeposit, exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: labels.saved })).toBeVisible();
      await expect(page.getByTestId('account-balance')).toHaveText(`-0${labels.decimal}02 ${symbol}`);
      expect(keys).toHaveLength(2);
      expect(new Set(keys).size).toBe(1);
      await expect(page.getByTestId('ledger-entry')).toHaveCount(3);
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
      await expect(page.getByTestId('ledger-entry')).toHaveCount(20);
      await expect(page.getByTestId('ledger-entry').first()).toContainText('Page marker 21');
      await page.getByRole('button', { name: labels.next, exact: true }).click();
      await expect(page.getByTestId('ledger-entry')).toHaveCount(5);
      await expect(page.getByText(comment, { exact: true })).toBeVisible();
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
      await page.getByRole('button', { name: labels.previous, exact: true }).click();
      await expect(page.getByTestId('ledger-entry')).toHaveCount(20);
      await expect(page.getByTestId('ledger-entry').first()).toContainText('Page marker 21');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({
        path: test.info().outputPath('transaction-history.png'),
        fullPage: true,
      });

      const beforeLanguage = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();
      const otherLanguage = language === 'de' ? 'en' : 'de';
      await chooseLanguage(page, otherLanguage, `/accounts/${account.id}`);
      await expect(page.getByTestId('ledger-entry')).toHaveCount(20);
      expect(await (await request.get(`/api/accounts/${account.id}/transactions`)).json()).toEqual(beforeLanguage);
      await chooseLanguage(page, language, `/accounts/${minimum.id}`);
      await expect(page.getByTestId('account-balance')).toHaveText(labels.minimum);
      await expect(page.getByTestId('ledger-entry').first()).toContainText(labels.minimum);
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
        await context.addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
        await memberPage.goto(`/accounts/${account.id}`);
        await memberPage.getByRole('textbox', { name: labels.username, exact: true }).fill(reader.username);
        await memberPage.getByLabel(labels.password, { exact: true }).fill(reader.password);
        await memberPage.getByRole('button', { name: labels.login, exact: true }).click();
        await expect(memberPage.getByTestId('ledger-entry')).toHaveCount(20);
        await expect(memberPage.getByRole('radio')).toHaveCount(0);
        await expect(memberPage.getByRole('button', { name: labels.record, exact: true })).toHaveCount(0);
        await memberPage.getByRole('button', { name: labels.next, exact: true }).click();
        await expect(memberPage.getByTestId('ledger-entry')).toHaveCount(6);
      } finally {
        await context.close();
      }

      expect(errors).toEqual([]);
    });
  });
}
