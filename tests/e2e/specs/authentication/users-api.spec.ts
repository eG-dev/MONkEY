import { test, expect, bootstrapManager, credentials, createUser, csrfWrite, login } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

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

  const createdUser = await login(request, { username: suppliedPassword.username, password: generated });

  expect(createdUser.language).toBe('en');
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
