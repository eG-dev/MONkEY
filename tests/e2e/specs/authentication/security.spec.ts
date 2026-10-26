import { createServer } from 'node:http';
import { request as httpsRequest } from 'node:https';

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
} from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('HTTPS fixture rejects request targets that could override its upstream @api', async ({ instance }) => {
  let unexpectedRequests = 0;
  const canary = createServer((_request, response) => {
    unexpectedRequests++;
    response.writeHead(200);
    response.end('Unexpected proxy destination');
  });

  await new Promise<void>((resolve) => canary.listen(0, '127.0.0.1', resolve));

  try {
    const address = canary.address();

    if (!address || typeof address === 'string') {
      throw new Error('Canary did not receive a loopback port.');
    }

    const send = (path: string) =>
      new Promise<number | undefined>((resolve, reject) => {
        const request = httpsRequest(instance.origin, { path, rejectUnauthorized: false, timeout: 5000 }, (response) => {
          response.resume();
          response.once('end', () => resolve(response.statusCode));
        });

        request.once('error', reject);
        request.once('timeout', () => request.destroy(new Error('Test proxy request timed out.')));
        request.end();
      });
    const authority = `127.0.0.1:${address.port}`;

    expect(await send('/api/auth/me?probe=%2F%2Fexample.invalid%2F')).toBe(401);

    for (const path of [`http://${authority}/probe`, `//${authority}/probe`, `/\\${authority}/probe`]) {
      expect(await send(path)).toBe(400);
    }

    expect(unexpectedRequests).toBe(0);
    expect(await send('/api/auth/me')).toBe(401);
  } finally {
    canary.closeAllConnections();
    await new Promise<void>((resolve, reject) => canary.close((error) => (error ? reject(error) : resolve())));
  }
});

test('bootstrap is one-time and CSRF and forged identity are rejected @api', async ({ request, instance }) => {
  const unconfirmed = credentials();

  for (const confirmation of ['Different-Aa1-password', '']) {
    const rejected = operator(instance, 'bootstrap-manager', unconfirmed, confirmation);

    expect(rejected.status).toBe(1);
    expect(rejected.stdout).toContain('Confirm password:');
    expect(rejected.stdout).toContain('password_confirmation_mismatch');
    expect(rejected.stdout + rejected.stderr).not.toContain(unconfirmed.password);
  }

  const manager = bootstrapManager(instance);

  const repeatedBootstrap = operator(instance, 'bootstrap-manager', credentials('another'));

  expect(repeatedBootstrap.status).toBe(1);
  expect(repeatedBootstrap.stdout).toContain('already_initialized');

  const unconfirmedRecovery = credentials(manager.username);
  const rejectedRecovery = operator(instance, 'recover-manager', unconfirmedRecovery, 'Different-Aa1-password');

  expect(rejectedRecovery.status).toBe(1);
  expect(rejectedRecovery.stdout).toContain('password_confirmation_mismatch');
  expect(rejectedRecovery.stdout + rejectedRecovery.stderr).not.toContain(unconfirmedRecovery.password);

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
