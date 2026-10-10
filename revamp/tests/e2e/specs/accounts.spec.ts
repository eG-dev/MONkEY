import { APIRequestContext, request as apiRequest } from '@playwright/test';
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
  waitReady,
  image,
} from '../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('real SQLite account constraints and audit rollback hold @api', async () => {
  const probePath = resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0');

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
    `type=bind,source=${probePath},target=/tests,readonly`,
    image,
    '/tests/RuntimeChecks.dll',
    'account-persistence',
  );

  expect(output).toBe('account_persistence_passed');
});

async function createMember(request: APIRequestContext) {
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

  return permanent;
}

test('shared-account APIs enforce roles, CSRF, names and missing-account errors @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  expect((await request.get('/api/accounts')).status()).toBe(401);
  expect((await request.get('/api/accounts/missing', { headers: { 'X-User-Role': 'Manager', 'X-User-Id': 'forged' } })).status()).toBe(401);
  expect((await csrfWrite(request, 'POST', '/api/accounts', { name: 'Anonymous' })).status()).toBe(401);

  await login(request, manager);

  expect((await request.post('/api/accounts', { data: { name: 'No CSRF' } })).status()).toBe(400);
  expect((await request.put('/api/accounts/missing', { data: { name: 'No CSRF' } })).status()).toBe(400);

  for (const name of ['', '   ', null, 'A'.repeat(41)]) {
    const invalid = await csrfWrite(request, 'POST', '/api/accounts', { name });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: 'invalid_account_name' });
  }

  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: '  Ida  ' });
  const account = await created.json();

  expect(created.status()).toBe(201);
  expect(created.headers()['location']).toBe(`/api/accounts/${account.id}`);
  expect(account).toEqual({ id: expect.any(String), name: 'Ida', currency: 'EUR', balance: null, openingEntry: null });

  const duplicate = await csrfWrite(request, 'POST', '/api/accounts', { name: ' iDA ' });

  expect(duplicate.status()).toBe(409);
  expect(await duplicate.json()).toEqual({ code: 'account_name_taken' });

  const accented = await csrfWrite(request, 'POST', '/api/accounts', { name: '\u00c4nne' });
  const accentedDuplicate = await csrfWrite(request, 'POST', '/api/accounts', { name: '\u00e4NNE' });

  expect(accented.status()).toBe(201);
  expect(accentedDuplicate.status()).toBe(409);
  expect(await accentedDuplicate.json()).toEqual({ code: 'account_name_taken' });

  const maximum = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Z'.repeat(40) });

  expect(maximum.status()).toBe(201);

  const missing = await request.get('/api/accounts/missing');
  const missingUpdate = await csrfWrite(request, 'PUT', '/api/accounts/missing', { name: 'Missing' });

  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ code: 'not_found' });
  expect(missingUpdate.status()).toBe(404);
  expect(await missingUpdate.json()).toEqual({ code: 'not_found' });

  await createMember(request);

  expect((await request.get('/api/accounts')).status()).toBe(200);
  expect(await (await request.get(`/api/accounts/${account.id}`)).json()).toEqual(account);
  expect((await csrfWrite(request, 'POST', '/api/accounts', { name: 'Member write' })).status()).toBe(403);
  expect((await csrfWrite(request, 'PUT', `/api/accounts/${account.id}`, { name: 'Member rename' })).status()).toBe(403);
  expect((await request.delete(`/api/accounts/${account.id}`)).status()).toBe(404);
});

test('case-insensitive uniqueness survives concurrent creates and failed renames without a nine-account cap @api', async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const csrf = await request.get('/api/auth/csrf');
  const headers = { 'X-Monkey-CSRF': (await csrf.json()).token };
  const simultaneous = await Promise.all([
    request.post('/api/accounts', { data: { name: 'Shared' }, headers }),
    request.post('/api/accounts', { data: { name: 'sHARED' }, headers }),
  ]);

  expect(simultaneous.map((response) => response.status()).sort()).toEqual([201, 409]);

  for (let index = 0; index < 10; index++) {
    const created = await csrfWrite(request, 'POST', '/api/accounts', { name: `Account ${index}` });

    expect(created.status()).toBe(201);
  }

  const list = await (await request.get('/api/accounts')).json();

  expect(list).toHaveLength(11);

  const original = list.find((account: { name: string }) => account.name === 'Account 0');
  const conflict = await csrfWrite(request, 'PUT', `/api/accounts/${original.id}`, { name: 'SHARED' });

  expect(conflict.status()).toBe(409);
  expect(await conflict.json()).toEqual({ code: 'account_name_taken' });
  expect(await (await request.get(`/api/accounts/${original.id}`)).json()).toEqual(original);

  const invalid = await csrfWrite(request, 'PUT', `/api/accounts/${original.id}`, { name: ' ' });

  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ code: 'invalid_account_name' });
  expect(await (await request.get(`/api/accounts/${original.id}`)).json()).toEqual(original);
});

test('accounts persist across restart and private SSR does not leak into anonymous responses @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Private account marker' });
  const account = await created.json();
  const headers = (await request.storageState()).cookies
    .filter((cookie) => cookie.name === '__Host-monkey-session')
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  const authenticated = await request.get(`/accounts/${account.id}`);

  expect(await authenticated.text()).toContain('Private account marker');
  expect(authenticated.headers()['cache-control']).toBe('no-store');
  expect(await authenticated.text()).not.toContain(headers);

  const anonymous = await apiRequest.newContext({ baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const responses = await Promise.all([
      request.get(`/accounts/${account.id}`),
      anonymous.get(`/accounts/${account.id}`),
      request.get('/accounts'),
      anonymous.get('/accounts'),
    ]);

    expect(await responses[0].text()).toContain('Private account marker');
    expect(responses[1].status()).toBe(200);
    expect(await responses[1].text()).toContain('Anmelden');
    expect(await responses[1].text()).not.toContain('Private account marker');
    expect(await responses[2].text()).toContain('Private account marker');
    expect(responses[3].status()).toBe(200);
    expect(await responses[3].text()).not.toContain('Private account marker');

    expect((await anonymous.get('/api/accounts')).status()).toBe(401);
  } finally {
    await anonymous.dispose();
  }

  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));

  expect(await (await request.get(`/api/accounts/${account.id}`)).json()).toEqual(account);
  expect(await (await request.get('/api/accounts')).json()).toEqual([account]);
});

for (const language of ['de', 'en'] as const) {
  test(`manager account creation/editing and member read-only workflow in ${language}`, async ({ page, request, browser, instance }) => {
    const manager = bootstrapManager(instance);
    const labels =
      language === 'de'
        ? {
            username: 'Benutzername',
            password: 'Passwort',
            login: 'Anmelden',
            title: 'Konten',
            empty: 'Noch keine Konten',
            missing: 'Dieses Konto existiert nicht.',
            refresh: 'Erneut versuchen',
            create: 'Konto anlegen',
            name: 'Kontoname',
            edit: 'Konto bearbeiten',
            editNamed: (name: string) => `${name} bearbeiten`,
            open: (name: string) => `${name} öffnen`,
            save: 'Speichern',
            saved: (name: string) => `${name} gespeichert`,
            managersOnly: 'Nur Manager können Konten verwalten.',
            noOpening: 'Dieses Konto hat noch keinen Eröffnungsbetrag. Ein Manager muss ihn zuerst buchen.',
            duplicate: 'Ein Konto mit diesem Namen existiert bereits.',
          }
        : {
            username: 'Username',
            password: 'Password',
            login: 'Sign in',
            title: 'Accounts',
            empty: 'No accounts yet',
            missing: 'This account does not exist.',
            refresh: 'Try again',
            create: 'Create account',
            name: 'Account name',
            edit: 'Edit account',
            editNamed: (name: string) => `Edit ${name}`,
            open: (name: string) => `Open ${name}`,
            save: 'Save',
            saved: (name: string) => `${name} saved`,
            managersOnly: 'Only managers can manage accounts.',
            noOpening: 'This account has no opening balance yet. A manager must post it first.',
            duplicate: 'An account with this name already exists.',
          };
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await login(request, manager);
    await csrfWrite(request, 'PUT', '/api/auth/language', { language });
    const member = await createMember(request);
    await csrfWrite(request, 'PUT', '/api/auth/language', { language });

    await page.context().addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
    await page.goto('/accounts');
    await page.getByRole('textbox', { name: labels.username, exact: true }).fill(manager.username);
    await page.getByLabel(labels.password, { exact: true }).fill(manager.password);
    await page.getByRole('button', { name: labels.login, exact: true }).click();

    await expect(page.getByRole('heading', { name: labels.title, exact: true })).toBeVisible();
    await expect(page.getByText(labels.empty, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: labels.create, exact: true }).click();

    const createDialog = page.getByRole('dialog', { name: labels.create });

    await expect(createDialog.getByRole('textbox', { name: labels.name, exact: true })).toHaveAttribute('maxlength', '40');
    await createDialog.getByRole('textbox', { name: labels.name, exact: true }).fill('  Ida  ');
    await createDialog.getByRole('button', { name: labels.create, exact: true }).click();

    await expect(page).toHaveURL(/\/accounts\/[\w-]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ida');

    await page.getByRole('button', { name: labels.editNamed('Ida'), exact: true }).click();

    const editDialog = page.getByRole('dialog', { name: labels.editNamed('Ida'), exact: true });

    await editDialog.getByRole('textbox', { name: labels.name, exact: true }).fill('N'.repeat(40));
    await editDialog.getByRole('button', { name: labels.save, exact: true }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('N'.repeat(40));

    await page.reload();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('N'.repeat(40));

    await page.goto('/accounts');

    await expect(page.getByTestId('account-row')).toHaveCount(1);
    await expect(page.getByTestId('account-row').getByRole('link', { name: 'N'.repeat(40), exact: true })).toBeVisible();

    await page.reload();

    await expect(page.getByTestId('account-row').getByRole('link', { name: 'N'.repeat(40), exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('accounts.png'), fullPage: true });

    await page.getByRole('button', { name: labels.create, exact: true }).click();
    await createDialog.getByRole('textbox', { name: labels.name, exact: true }).fill('n'.repeat(40));
    await createDialog.getByRole('button', { name: labels.create, exact: true }).click();

    await expect(createDialog.getByRole('alert')).toHaveText(labels.duplicate);

    const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

    try {
      const memberPage = await context.newPage();
      memberPage.on('pageerror', (error) => errors.push(error.message));
      await context.addCookies([{ name: 'monkey-language', value: language, url: instance.origin }]);
      await memberPage.goto('/accounts');
      await memberPage.getByRole('textbox', { name: labels.username, exact: true }).fill(member.username);
      await memberPage.getByLabel(labels.password, { exact: true }).fill(member.password);
      await memberPage.getByRole('button', { name: labels.login, exact: true }).click();

      await expect(memberPage.getByText(labels.managersOnly, { exact: true })).toBeVisible();
      await expect(memberPage.getByRole('button', { name: labels.create, exact: true })).toHaveCount(0);

      await memberPage.goto('/');

      const card = memberPage.getByRole('link', { name: labels.open('N'.repeat(40)), exact: true });

      await expect(card).toHaveCount(1);

      await card.focus();
      await card.press('Enter');

      await expect(memberPage.getByRole('heading', { level: 1 })).toHaveText('N'.repeat(40));
      await expect(memberPage.getByText(labels.noOpening, { exact: true })).toBeVisible();
      await expect(memberPage.getByRole('textbox')).toHaveCount(0);
      expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await memberPage.screenshot({ path: test.info().outputPath('member-account.png'), fullPage: true });

      await memberPage.goto('/accounts/missing');

      await expect(memberPage.getByRole('alert')).toContainText(labels.missing);

      await login(request, manager);
      const users = await (await request.get('/api/users')).json();
      const reader = users.find((entry: { user: { username: string } }) => entry.user.username === member.username);
      const disabled = await csrfWrite(request, 'PUT', `/api/users/${reader.user.id}`, {
        displayName: 'Reader',
        role: 'Member',
        isActive: false,
      });

      expect(disabled.status()).toBe(204);

      await memberPage.getByRole('button', { name: labels.refresh, exact: true }).click();

      await expect(memberPage.getByRole('button', { name: labels.login, exact: true })).toBeVisible();
      await expect(memberPage.locator('main')).not.toContainText('N'.repeat(40));
    } finally {
      await context.close();
    }

    expect(errors).toEqual([]);
  });
}
