import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import {
  test,
  expect,
  bootstrapManager,
  credentials,
  csrfWrite,
  login,
  operator,
  docker,
  containerOrigin,
  waitReady,
  image,
} from '../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('existing foundation database upgrades to Identity without data loss @api', async () => {
  const probePath = resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0');

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'none',
      '--user',
      '10001:10001',
      '--entrypoint',
      'dotnet',
      '--mount',
      `type=bind,source=${probePath},target=/checks,readonly`,
      image,
      '/checks/RuntimeChecks.dll',
      'identity-upgrade',
    ],
    { encoding: 'utf8', timeout: 30_000 },
  );

  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe('identity_upgrade_passed');
});

test('sessions have eight-hour absolute expiry and expired tickets are rejected @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const session = (await request.storageState()).cookies.find((cookie) => cookie.name === '__Host-monkey-session');

  expect(session).toBeDefined();

  const probePath = resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0');

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-i',
      '--network',
      'none',
      '--user',
      '10001:10001',
      '--entrypoint',
      'dotnet',
      '--volumes-from',
      `${instance.container}:ro`,
      '--mount',
      `type=bind,source=${probePath},target=/checks,readonly`,
      image,
      '/checks/RuntimeChecks.dll',
      'expired-session',
    ],
    { input: `${session!.value}\n`, encoding: 'utf8', timeout: 30_000 },
  );

  expect(result.status, result.stderr).toBe(0);

  const expired = await request.get('/api/auth/me', { headers: { Cookie: `__Host-monkey-session=${result.stdout.trim()}` } });

  expect(expired.status()).toBe(401);
});

test('manager browser login, language preference and logout survive SSR', async ({ page, instance }) => {
  const manager = bootstrapManager(instance);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(manager.username);
  await page.getByLabel('Passwort', { exact: true }).fill(manager.password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

  await expect(page.getByRole('heading', { name: manager.username, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Benutzer', exact: true })).toBeVisible();

  await page.getByRole('combobox', { name: 'Sprache', exact: true }).selectOption('en');

  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.screenshot({ path: test.info().outputPath('authenticated.png'), fullPage: true });

  await page.getByRole('button', { name: 'Sign out', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});

test('manager browser creates a user and temporary password requires change', async ({ page, browser, instance }) => {
  const manager = bootstrapManager(instance);
  const member = credentials('member');
  const permanent = credentials('member');

  await page.goto('/');
  await page.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(manager.username);
  await page.getByLabel('Passwort', { exact: true }).fill(manager.password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Benutzer', exact: true })).toBeVisible();

  await page.locator('summary').filter({ hasText: 'Benutzer anlegen' }).click();
  await page.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(member.username);
  await page.getByRole('textbox', { name: 'Anzeigename', exact: true }).fill('Member display');
  await page.getByLabel('Vorläufiges Passwort', { exact: true }).fill(member.password);
  await page.getByRole('button', { name: 'Benutzer anlegen', exact: true }).click();

  await expect(page.getByText('Member display', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'member bearbeiten', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Aktiv', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByText('Deaktiviert', { exact: true })).toBeVisible();

  await page.getByRole('checkbox', { name: 'Aktiv', exact: true }).check();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();

  await expect(page.getByText('Deaktiviert', { exact: true })).toHaveCount(0);

  const resetForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Passwort zurücksetzen', exact: true }) });

  await resetForm.getByLabel('Vorläufiges Passwort', { exact: true }).fill(member.password);
  const resetResponse = page.waitForResponse((response) => /\/api\/users\/[\w-]+\/password$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: 'Passwort zurücksetzen', exact: true }).click();

  expect((await resetResponse).status()).toBe(204);
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await memberPage.goto('/');
    await memberPage.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(member.username);
    await memberPage.getByLabel('Passwort', { exact: true }).fill(member.password);
    await memberPage.getByRole('button', { name: 'Anmelden', exact: true }).click();

    await expect(memberPage.getByRole('heading', { name: 'Member display', exact: true })).toBeVisible();

    await memberPage.getByLabel('Aktuelles Passwort', { exact: true }).fill(member.password);
    await memberPage.getByLabel('Neues Passwort', { exact: true }).fill(permanent.password);
    await memberPage.getByRole('button', { name: 'Passwort ändern', exact: true }).click();

    await expect(memberPage.getByText('Passwort geändert. Bitte erneut anmelden.', { exact: true })).toBeVisible();

    await memberPage.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(member.username);
    await memberPage.getByLabel('Passwort', { exact: true }).fill(permanent.password);
    await memberPage.getByRole('button', { name: 'Anmelden', exact: true }).click();

    await expect(memberPage.getByRole('heading', { name: 'Member display', exact: true })).toBeVisible();

    await expect(memberPage.getByRole('heading', { name: 'Benutzer', exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('bootstrap is one-time and CSRF and forged identity are rejected @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  const repeatedBootstrap = operator(instance, 'bootstrap-manager', credentials('another'));

  expect(repeatedBootstrap.status).toBe(1);
  expect(repeatedBootstrap.stdout).toContain('already_initialized');

  expect((await request.get('/api/setup')).status()).toBe(404);

  expect((await request.get('/api/auth/me')).status()).toBe(401);
  expect((await request.get('/api/users', { headers: { 'X-User-Role': 'Manager', 'X-User-Id': 'manager' } })).status()).toBe(401);

  expect((await request.post('/api/auth/login', { data: manager })).status()).toBe(400);

  const forgedLogin = await request.post('/api/auth/login', {
    data: manager,
    headers: { 'X-Monkey-CSRF': 'forged', Origin: 'https://attacker.invalid' },
  });

  expect(forgedLogin.status()).toBe(400);

  const profile = await login(request, manager);

  expect(profile.role).toBe('Manager');
  expect(profile.mustChangePassword).toBe(false);

  expect((await request.post('/api/auth/logout')).status()).toBe(400);

  const cookies = (await request.storageState()).cookies;
  const session = cookies.find((cookie) => cookie.name === '__Host-monkey-session');

  expect(session?.httpOnly).toBe(true);
  expect(session?.secure).toBe(true);
  expect(session?.sameSite).toBe('Lax');
  expect(session?.path).toBe('/');
  expect(session?.expires).toBe(-1);

  const logout = await csrfWrite(request, 'POST', '/api/auth/logout', {});

  expect(logout.status()).toBe(204);

  expect((await request.get('/api/auth/me')).status()).toBe(401);
});

test('user-administration errors keep stable API codes and statuses @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  const profile = await login(request, manager);

  for (const role of ['Unknown', 'manager', 'member', '0', '1', 'Manager,Member', null]) {
    await test.step(`unsupported role ${JSON.stringify(role)} keeps invalid_user`, async () => {
      const created = await csrfWrite(request, 'POST', '/api/users', {
        ...credentials('invalid-role'),
        displayName: 'Invalid role',
        role,
      });

      expect(created.status()).toBe(400);
      expect(await created.json()).toEqual({ code: 'invalid_user' });

      const updated = await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
        displayName: manager.username,
        role,
        isActive: true,
      });

      expect(updated.status()).toBe(400);
      expect(await updated.json()).toEqual({ code: 'invalid_user' });
    });
  }

  for (const role of [0, 1]) {
    await test.step(`numeric role ${role} is rejected during JSON binding`, async () => {
      const created = await csrfWrite(request, 'POST', '/api/users', {
        ...credentials('numeric-role'),
        displayName: 'Numeric role',
        role,
      });

      expect(created.status()).toBe(400);

      const updated = await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
        displayName: manager.username,
        role,
        isActive: true,
      });

      expect(updated.status()).toBe(400);
    });
  }

  const cases = [
    {
      method: 'POST',
      path: '/api/auth/password',
      data: { currentPassword: manager.password, newPassword: 'short' },
      status: 400,
      code: 'invalid_password',
    },
    {
      method: 'POST',
      path: `/api/users/${profile.id}/password`,
      data: { password: 'short' },
      status: 400,
      code: 'invalid_password',
    },
    {
      method: 'PUT',
      path: '/api/auth/language',
      data: { language: 'fr' },
      status: 400,
      code: 'invalid_language',
    },
    {
      method: 'PUT',
      path: '/api/users/missing',
      data: { displayName: 'Missing', role: 'Member', isActive: true },
      status: 404,
      code: 'not_found',
    },
    {
      method: 'POST',
      path: '/api/users/missing/password',
      data: { password: credentials('missing').password },
      status: 404,
      code: 'not_found',
    },
    {
      method: 'PUT',
      path: `/api/users/${profile.id}`,
      data: { displayName: manager.username, role: 'Member', isActive: true },
      status: 409,
      code: 'last_manager',
    },
  ] as const;

  for (const testCase of cases) {
    await test.step(`${testCase.method} ${testCase.path}: ${testCase.code}`, async () => {
      const response = await csrfWrite(request, testCase.method, testCase.path, testCase.data);

      expect(response.status()).toBe(testCase.status);
      expect(await response.json()).toEqual({ code: testCase.code });
    });
  }

  const defaultRole = await csrfWrite(request, 'POST', '/api/users', {
    ...credentials('default-role'),
    displayName: 'Default role',
  });

  expect(defaultRole.status()).toBe(201);
  expect((await defaultRole.json()).role).toBe('Member');
});

test('member permissions and concurrent SSR identity stay isolated @api', async ({ request, playwright, instance }) => {
  const manager = bootstrapManager(instance);

  const managerProfile = await login(request, manager);

  const member = credentials('member');

  const created = await csrfWrite(request, 'POST', '/api/users', { ...member, displayName: 'Member display', role: 'Member' });

  expect(created.status()).toBe(201);

  const memberContext = await playwright.request.newContext({ baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const profile = await login(memberContext, member);

    expect(profile.mustChangePassword).toBe(true);
    expect((await memberContext.get('/api/users')).status()).toBe(403);

    const permanent = credentials('member');

    const passwordChange = await csrfWrite(memberContext, 'POST', '/api/auth/password', {
      currentPassword: member.password,
      newPassword: permanent.password,
    });

    expect(passwordChange.status()).toBe(204);

    await login(memberContext, permanent);

    const forbiddenCreate = await csrfWrite(memberContext, 'POST', '/api/users', {
      ...credentials('forged'),
      displayName: 'Forged',
      role: 'Manager',
    });

    expect(forbiddenCreate.status()).toBe(403);

    const languagePreference = await csrfWrite(memberContext, 'PUT', '/api/auth/language', { language: 'en' });

    expect(languagePreference.status()).toBe(204);

    const [managerPage, memberPage] = await Promise.all([
      request.get('/', { headers: { 'Accept-Language': 'en' } }),
      memberContext.get('/', { headers: { 'Accept-Language': 'de' } }),
    ]);
    const managerHtml = await managerPage.text();
    const memberHtml = await memberPage.text();

    expect(managerHtml).toContain(managerProfile.id);
    expect(managerHtml).not.toContain(profile.id);
    expect(memberHtml).toContain(profile.id);
    expect(memberHtml).not.toContain(managerProfile.id);

    expect(managerHtml).toContain('lang="de"');
    expect(memberHtml).toContain('lang="en"');

    expect(memberHtml).not.toContain(member.password);
    expect(memberHtml).not.toContain('__Host-monkey-session');

    expect(memberPage.headers()['cache-control']).toBe('no-store');
  } finally {
    await memberContext.dispose();
  }
});

test('disablement role changes and password reset revoke sessions @api', async ({ request, playwright, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const account = credentials('second');

  const created = await csrfWrite(request, 'POST', '/api/users', { ...account, displayName: 'Second manager', role: 'Manager' });
  const profile = await created.json();

  const other = await playwright.request.newContext({ baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    await login(other, account);

    const permanent = credentials('second');

    const passwordChange = await csrfWrite(other, 'POST', '/api/auth/password', {
      currentPassword: account.password,
      newPassword: permanent.password,
    });

    expect(passwordChange.status()).toBe(204);

    await login(other, permanent);

    expect((await other.get('/api/users')).status()).toBe(200);

    const demotion = await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
      displayName: 'Second manager',
      role: 'Member',
      isActive: true,
    });

    expect(demotion.status()).toBe(204);
    expect((await other.get('/api/auth/me')).status()).toBe(401);

    await login(other, permanent);

    expect((await other.get('/api/users')).status()).toBe(403);

    const disablement = await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
      displayName: 'Second manager',
      role: 'Member',
      isActive: false,
    });

    expect(disablement.status()).toBe(204);
    expect((await other.get('/api/auth/me')).status()).toBe(401);

    expect((await csrfWrite(other, 'POST', '/api/auth/login', permanent)).status()).toBe(401);

    const reactivation = await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
      displayName: 'Second manager',
      role: 'Member',
      isActive: true,
    });

    expect(reactivation.status()).toBe(204);

    await login(other, permanent);

    const reset = credentials('second');

    const passwordReset = await csrfWrite(request, 'POST', `/api/users/${profile.id}/password`, { password: reset.password });

    expect(passwordReset.status()).toBe(204);
    expect((await other.get('/api/auth/me')).status()).toBe(401);

    expect((await login(other, reset)).mustChangePassword).toBe(true);
  } finally {
    await other.dispose();
  }
});

test('concurrent demotions preserve the last active manager @api', async ({ request, playwright, instance }) => {
  const manager = bootstrapManager(instance);

  const first = await login(request, manager);

  const account = credentials('second');

  const created = await csrfWrite(request, 'POST', '/api/users', { ...account, displayName: 'Second manager', role: 'Manager' });
  const second = await created.json();

  const other = await playwright.request.newContext({ baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    await login(other, account);

    const permanent = credentials('second');

    await csrfWrite(other, 'POST', '/api/auth/password', { currentPassword: account.password, newPassword: permanent.password });
    await login(other, permanent);

    const results = await Promise.all([
      csrfWrite(request, 'PUT', `/api/users/${first.id}`, { displayName: 'First', role: 'Member', isActive: true }),
      csrfWrite(other, 'PUT', `/api/users/${second.id}`, { displayName: 'Second', role: 'Member', isActive: true }),
    ]);

    expect(results.map((response) => response.status()).sort()).toEqual([204, 409]);

    const rejected = results.find((response) => response.status() === 409)!;

    expect((await rejected.json()).code).toBe('last_manager');
  } finally {
    await other.dispose();
  }
});

test('lockout recovery and restart session behavior are deliberate @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  for (let attempt = 0; attempt < 5; attempt++) {
    const failedLogin = await csrfWrite(request, 'POST', '/api/auth/login', { ...manager, password: 'Incorrect-Aa1-password' });

    expect(failedLogin.status()).toBe(401);
  }

  expect((await csrfWrite(request, 'POST', '/api/auth/login', manager)).status()).toBe(401);

  const recovered = credentials(manager.username);
  const recovery = operator(instance, 'recover-manager', recovered);

  expect(recovery.status).toBe(0);
  expect(recovery.stdout).toContain('Data directory: /data');
  expect(recovery.stdout).toContain('operator_success');
  expect(recovery.stdout + recovery.stderr).not.toContain('Microsoft.EntityFrameworkCore');
  expect((await login(request, recovered)).mustChangePassword).toBe(true);

  const permanent = credentials(manager.username);

  await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: recovered.password, newPassword: permanent.password });
  const profile = await login(request, permanent);

  docker('stop', '--timeout', '25', instance.container);
  docker('start', instance.container);
  const origin = containerOrigin(instance.container);
  await waitReady(origin);

  const session = await request.get('/api/auth/me');

  expect(session.status()).toBe(200);
  expect((await session.json()).id).toBe(profile.id);
});
