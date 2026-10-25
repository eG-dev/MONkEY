import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { test, expect, bootstrapManager, credentials, createUser, csrfWrite, login, image } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('sessions have eight-hour absolute expiry and expired tickets are rejected @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const session = (await request.storageState()).cookies.find((cookie) => cookie.name === '__Host-monkey-session');

  expect(session).toBeDefined();

  const probePath = resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0');

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
      memberContext.get('/', { headers: { 'Accept-Language': 'en' } }),
    ]);
    const managerHtml = await managerPage.text();
    const memberHtml = await memberPage.text();

    expect(managerHtml).toContain(managerProfile.id);
    expect(managerHtml).not.toContain(profile.id);
    expect(memberHtml).toContain(profile.id);
    expect(memberHtml).not.toContain(managerProfile.id);

    expect(managerHtml).toContain('lang="en"');
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
