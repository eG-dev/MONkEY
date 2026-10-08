import { APIRequestContext, request as apiRequest } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import {
  test,
  expect,
  bootstrapManager,
  credentials,
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
  const temporary = credentials('reader');
  const permanent = credentials('reader');
  const response = await csrfWrite(request, 'POST', '/api/users', { ...temporary, displayName: 'Reader', role: 'Member' });

  expect(response.status()).toBe(201);

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
  const payload = { amount: '0.00', idempotencyKey: randomUUID(), comment: 'Opening marker' };

  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(401);

  await login(request, manager);
  const account = await createAccount(request, 'Opening');
  const path = `/api/accounts/${account.id}/opening`;

  expect(account.balance).toBeNull();
  expect(account.openingEntry).toBeNull();
  expect((await request.post(path, { data: payload })).status()).toBe(400);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(404);

  for (const amount of ['', '-0.01', '1.001', '1e2', ' 1.00', 'NaN', '92233720368547758.08', null]) {
    const invalid = await csrfWrite(request, 'POST', path, { ...payload, amount });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: 'invalid_opening_amount' });
  }

  expect((await csrfWrite(request, 'POST', path, { ...payload, amount: 12.34 })).status()).toBe(400);
  expect(await (await csrfWrite(request, 'POST', path, { ...payload, idempotencyKey: 'bad' })).json()).toEqual({
    code: 'invalid_idempotency_key',
  });
  expect(await (await csrfWrite(request, 'POST', path, { ...payload, comment: 'A'.repeat(501) })).json()).toEqual({
    code: 'invalid_comment',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBeNull();

  const posted = await csrfWrite(request, 'POST', path, payload);
  const entry = await posted.json();

  expect(posted.status()).toBe(200);
  expect(entry).toMatchObject({ accountId: account.id, amount: '0.00', currency: 'EUR', source: 'opening', comment: payload.comment });
  expect(entry).not.toHaveProperty('idempotencyKey');
  expect(entry.occurredAtUtc).toMatch(/\+00:00$|Z$/);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.00');

  await createReader(request);

  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).openingEntry).toEqual(entry);
  expect((await csrfWrite(request, 'POST', path, { ...payload, idempotencyKey: randomUUID() })).status()).toBe(403);
  expect((await request.put(path, { data: payload })).status()).toBe(404);
  expect((await request.delete(path)).status()).toBe(404);
});

test('concurrent openings and retries are idempotent with conflicting-payload errors @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);
  const account = await createAccount(request, 'Concurrent');
  const other = await createAccount(request, 'Other');
  const payload = { amount: '42.17', comment: 'Same request', idempotencyKey: randomUUID() };
  const headers = { 'X-Monkey-CSRF': (await (await request.get('/api/auth/csrf')).json()).token };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () => request.post(`/api/accounts/${account.id}/opening`, { data: payload, headers })),
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
  const payload = { amount: '92233720368547758.07', idempotencyKey: randomUUID(), comment: 'Private opening comment' };
  const posted = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);
  const entry = await posted.json();

  expect(posted.status()).toBe(200);
  expect(entry.amount).toBe(payload.amount);
  expect(entry.actorId).toBe(profile.id);
  expect(entry.actorDisplayName).toBe(profile.displayName);

  expect(
    (
      await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, { displayName: 'Renamed Manager', role: 'Manager', isActive: true })
    ).status(),
  ).toBe(204);
  await login(request, manager);
  const replay = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);

  expect(await replay.json()).toEqual(entry);

  const secondManager = credentials('othermanager');
  expect(
    (await csrfWrite(request, 'POST', '/api/users', { ...secondManager, displayName: 'Other Manager', role: 'Manager' })).status(),
  ).toBe(201);
  await login(request, secondManager);
  const permanent = credentials(secondManager.username);
  expect(
    (
      await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: secondManager.password, newPassword: permanent.password })
    ).status(),
  ).toBe(204);
  await login(request, permanent);
  const actorConflict = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, payload);

  expect(actorConflict.status()).toBe(409);
  expect(await actorConflict.json()).toEqual({ code: 'idempotency_conflict' });

  await login(request, manager);
  const anonymous = await apiRequest.newContext({ baseURL: instance.origin, ignoreHTTPSErrors: true });

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
              money: `12,34 ${symbol}`,
              input: '12,34',
              maximum: `92.233.720.368.547.758,07 ${symbol}`,
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
              money: `12.34 ${symbol}`,
              input: '12.34',
              maximum: `92,233,720,368,547,758.07 ${symbol}`,
            };
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.context().addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
      await page.goto(`/accounts/${account.id}`);
      await page.getByRole('textbox', { name: labels.username, exact: true }).fill(manager.username);
      await page.getByLabel(labels.password, { exact: true }).fill(manager.password);
      await page.getByRole('button', { name: labels.login, exact: true }).click();

      await expect(page.getByTestId('account-balance')).toHaveText(labels.empty);

      await page.getByRole('button', { name: labels.post, exact: true }).click();
      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(`${labels.input}1`);
      await page.getByRole('button', { name: labels.post, exact: true }).click();

      await expect(page.getByRole('alert')).toBeVisible();

      const comment = '<script>private opening comment</script>';
      await page.getByRole('textbox', { name: labels.comment, exact: true }).fill(comment);
      await page.getByRole('textbox', { name: labels.amount, exact: true }).fill(labels.input);
      await page.getByRole('textbox', { name: labels.amount, exact: true }).press('Enter');

      await expect(page.getByRole('status').filter({ hasText: labels.saved })).toBeVisible();
      await expect(page.getByTestId('account-balance')).toHaveText(labels.money);
      await expect(page.getByRole('button', { name: labels.post, exact: true })).toHaveCount(0);
      await expect(page.getByText(comment, { exact: true })).toBeVisible();

      await page.reload();

      await expect(page.getByTestId('account-balance')).toHaveText(labels.money);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath('opening-entry.png'), fullPage: true });

      const otherLanguage = language === 'de' ? 'en' : 'de';
      await Promise.all([page.waitForEvent('load'), page.getByRole('combobox').selectOption(otherLanguage)]);

      await expect(page.locator('html')).toHaveAttribute('lang', otherLanguage);
      await expect(page.getByTestId('account-balance')).toHaveText(`${otherLanguage === 'de' ? '12,34' : '12.34'} ${symbol}`);
      await expect(page.getByText(comment, { exact: true })).toBeVisible();
      const persisted = await (await request.get(`/api/accounts/${account.id}`)).json();
      expect(persisted.balance).toBe('12.34');
      expect(persisted.currency).toBe(currency);
      expect(persisted.openingEntry.currency).toBe(currency);

      await Promise.all([page.waitForEvent('load'), page.getByRole('combobox').selectOption(language)]);
      await page.goto(`/accounts/${maximum.id}`);

      await expect(page.getByTestId('account-balance')).toHaveText(labels.maximum);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath('maximum-balance.png'), fullPage: true });

      const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

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
  });
}
