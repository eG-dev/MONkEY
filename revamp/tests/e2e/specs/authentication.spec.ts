import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import {
  test,
  expect,
  bootstrapManager,
  credentials,
  createUser,
  csrfWrite,
  login,
  operator,
  signIn,
  submitLogin,
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

test('manager browser login, language and theme preferences, and logout survive SSR', async ({ page, instance }) => {
  const manager = bootstrapManager(instance);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await signIn(page, manager);

  await expect(page.locator('#overview-title')).toHaveText('Übersicht');
  await expect(page.locator('#shell-user-toggle')).toHaveAccessibleName(`${manager.username}, Manager`);

  await page.locator('#shell-user-toggle').click();

  await expect(page.locator('#shell-user-menu')).toHaveRole('menu');
  await expect(page.locator('#shell-user-menu-profile')).toHaveRole('menuitem');
  await expect(page.locator('#shell-user-menu-profile')).toHaveAccessibleName('Profil');

  await page.locator('#shell-user-menu-profile').click();

  await expect(page.locator('#administration-title')).toHaveText('Verwaltung');
  await expect(page.locator('#profile-dark-mode')).toHaveRole('switch');
  await expect(page.locator('#profile-dark-mode')).toHaveAccessibleName('Dunkler Modus');
  await expect(page.locator('#profile-dark-mode')).toHaveAttribute('aria-checked', 'false');

  await page.locator('#profile-dark-mode').click();

  await expect(page.locator('html')).toHaveAttribute('tuiTheme', 'dark');
  await expect(page.locator('#profile-language')).toHaveAccessibleName('Sprache');

  await page.locator('#profile-language').selectOption('en');

  await expect(page.locator('#administration-title')).toHaveText('Administration');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('tuiTheme', 'dark');
  await expect(page.locator('#profile-dark-mode')).toHaveAccessibleName('Dark mode');
  await expect(page.locator('#profile-dark-mode')).toHaveAttribute('aria-checked', 'true');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.screenshot({ path: test.info().outputPath('authenticated.png'), fullPage: true });

  await page.locator('#shell-user-toggle').click();

  await expect(page.locator('#shell-user-menu-logout')).toHaveAccessibleName('Sign out');

  await page.locator('#shell-user-menu-logout').click();

  await expect(page.locator('#login-submit')).toHaveText('Sign in');

  expect(errors).toEqual([]);
});

test('manager browser creates a user and temporary password requires change', async ({ page, browser, instance }) => {
  const manager = bootstrapManager(instance);
  const permanent = credentials('member');

  await signIn(page, manager);

  await expect(page.locator('#overview-title')).toHaveText('Übersicht');

  await page.goto('/administration/users');

  await expect(page.locator('#administration-tab-users')).toHaveText('Benutzer');
  await expect(page.locator('#administration-tab-users')).toHaveAttribute('aria-current', 'page');

  await page.locator('#users-create').click();

  const createDialog = page.locator('#users-create-dialog');

  await expect(createDialog).toHaveAccessibleName('Benutzer anlegen');
  await expect(page.locator('#users-create-username')).toHaveAccessibleName('Benutzername');
  await expect(page.locator('#users-create-display-name')).toHaveAccessibleName('Anzeigename');

  await page.locator('#users-create-username').fill('member');
  await page.locator('#users-create-display-name').fill('Member display');
  await page.locator('#users-create-submit').click();

  const passwordDialog = page.locator('#users-password-dialog');
  const temporaryPassword = page.locator('#users-temporary-password');

  await expect(passwordDialog).toHaveAccessibleName('Vorläufiges Passwort');
  await expect(temporaryPassword).toHaveText(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);

  const created = (await temporaryPassword.textContent())!;

  await page.locator('#users-password-done').click();

  const memberRow = page.locator('[data-testid="user-row"][data-username="member"]');

  await expect(passwordDialog).not.toBeVisible();
  await expect(memberRow).toContainText('Passwortänderung erforderlich');
  await expect(memberRow.getByTestId('user-row-edit')).toHaveAccessibleName('member bearbeiten');

  await memberRow.getByTestId('user-row-edit').click();

  const editDialog = page.locator('#users-edit-dialog');

  await expect(editDialog).toHaveAccessibleName('member bearbeiten');
  await expect(page.locator('#users-edit-active')).toHaveAccessibleName('Aktiv');

  await page.locator('#users-edit-active').click();
  await page.locator('#users-edit-save').click();

  await expect(memberRow).toContainText('Deaktiviert');

  await memberRow.getByTestId('user-row-edit').click();
  await page.locator('#users-edit-active').click();
  await page.locator('#users-edit-save').click();

  await expect(memberRow).not.toContainText('Deaktiviert');
  await expect(memberRow.getByTestId('user-row-reset')).toHaveAccessibleName('Passwort für member zurücksetzen');

  await memberRow.getByTestId('user-row-reset').click();

  await expect(page.locator('#users-reset-dialog')).toHaveAccessibleName('Passwort für member zurücksetzen');
  await expect(page.locator('#users-reset-submit')).toHaveText('Passwort zurücksetzen');

  const resetResponse = page.waitForResponse((response) => /\/api\/users\/[\w-]+\/password$/.test(new URL(response.url()).pathname));
  await page.locator('#users-reset-submit').click();

  expect((await resetResponse).status()).toBe(200);
  await expect(temporaryPassword).not.toHaveText(created);

  const temporary = { username: 'member', password: (await temporaryPassword.textContent())! };

  await page.locator('#users-password-done').click();

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await submitLogin(memberPage, { username: 'member', password: created });

    await expect(memberPage.locator('#login-error')).toHaveRole('alert');
    await expect(memberPage.locator('#login-error')).toHaveText('Benutzername oder Passwort ist falsch.');

    await signIn(memberPage, temporary);

    await expect(memberPage.locator('#login-title')).toHaveText('Neues Passwort wählen');
    await expect(memberPage.locator('#login-current-password')).toHaveAccessibleName('Aktuelles Passwort');
    await expect(memberPage.locator('#login-new-password')).toHaveAccessibleName('Neues Passwort');
    await expect(memberPage.locator('#login-change-password-submit')).toBeEnabled();

    await memberPage.locator('#login-current-password').fill(temporary.password);
    await memberPage.locator('#login-new-password').fill(permanent.password);
    await memberPage.locator('#login-change-password-submit').click();

    await expect(memberPage.locator('#login-notice')).toHaveText('Passwort geändert. Bitte erneut anmelden.');

    await signIn(memberPage, { username: 'member', password: permanent.password });

    await expect(memberPage.locator('#overview-title')).toHaveText('Übersicht');

    await memberPage.goto('/administration/users');

    await expect(memberPage.locator('#users-managers-only')).toHaveText('Nur Manager können Benutzer verwalten.');
    await expect(memberPage.locator('#users-create')).toHaveCount(0);
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
      method: 'PUT',
      path: '/api/auth/language',
      data: { language: 'fr' },
      status: 400,
      code: 'invalid_language',
    },
    {
      method: 'PUT',
      path: '/api/auth/theme',
      data: { theme: 'blue' },
      status: 400,
      code: 'invalid_theme',
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
      data: {},
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
    username: 'default-role',
    displayName: 'Default role',
  });

  expect(defaultRole.status()).toBe(201);
  expect((await defaultRole.json()).user.role).toBe('Member');

  const suppliedPassword = credentials('supplied-password');
  const ignored = await csrfWrite(request, 'POST', '/api/users', { ...suppliedPassword, displayName: 'Supplied password' });
  const generated = (await ignored.json()).temporaryPassword;

  expect(ignored.status()).toBe(201);
  expect(generated).not.toBe(suppliedPassword.password);
  expect((await csrfWrite(request, 'POST', '/api/auth/login', suppliedPassword)).status()).toBe(401);
});

test('theme preference persists in the session and SSR document @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  expect((await login(request, manager)).theme).toBe('system');
  expect(await (await request.get('/')).text()).toContain('data-theme-preference="system"');

  const dark = await csrfWrite(request, 'PUT', '/api/auth/theme', { theme: 'dark' });

  expect(dark.status()).toBe(204);
  expect((await (await request.get('/api/auth/me')).json()).theme).toBe('dark');

  const html = await (await request.get('/')).text();

  expect(html).toContain('data-theme-preference="dark"');
  expect(html).toMatch(/<html[^>]*tuiTheme="dark"/i);

  expect((await csrfWrite(request, 'PUT', '/api/auth/theme', { theme: null })).status()).toBe(400);

  const concurrent = await Promise.all([
    ...Array.from({ length: 5 }, () => csrfWrite(request, 'PUT', '/api/auth/theme', { theme: 'light' })),
    ...Array.from({ length: 5 }, () => csrfWrite(request, 'PUT', '/api/auth/language', { language: 'en' })),
  ]);

  expect(concurrent.map((response) => response.status())).toEqual(Array(10).fill(204));

  const profile = await (await request.get('/api/auth/me')).json();

  expect(profile.theme).toBe('light');
  expect(profile.language).toBe('en');
});

test('member permissions and concurrent SSR identity stay isolated @api', async ({ request, playwright, instance }) => {
  const manager = bootstrapManager(instance);

  const managerProfile = await login(request, manager);

  const { account: member } = await createUser(request, 'member', 'Member display', 'Member');

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

  const { profile, account } = await createUser(request, 'second', 'Second manager', 'Manager');

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

    const passwordReset = await csrfWrite(request, 'POST', `/api/users/${profile.id}/password`, {});
    const reset = { username: account.username, password: (await passwordReset.json()).temporaryPassword };

    expect(passwordReset.status()).toBe(200);
    expect(reset.password).toMatch(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);
    expect((await other.get('/api/auth/me')).status()).toBe(401);

    expect((await login(other, reset)).mustChangePassword).toBe(true);
  } finally {
    await other.dispose();
  }
});

test('concurrent demotions preserve the last active manager @api', async ({ request, playwright, instance }) => {
  const manager = bootstrapManager(instance);

  const first = await login(request, manager);

  const { profile: second, account } = await createUser(request, 'second', 'Second manager', 'Manager');

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
