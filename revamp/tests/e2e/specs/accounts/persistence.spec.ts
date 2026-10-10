import { request as apiRequest } from '@playwright/test';
import { resolve } from 'node:path';

import { test, expect, bootstrapManager, csrfWrite, login, docker, containerOrigin, waitReady, image } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('real SQLite account constraints and audit rollback hold @api', async () => {
  const probePath = resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0');

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

  const anonymous = await apiRequest.newContext({
    baseURL: instance.origin,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
  });

  try {
    const responses = await Promise.all([
      request.get(`/accounts/${account.id}`),
      anonymous.get(`/accounts/${account.id}`),
      request.get('/accounts'),
      anonymous.get('/accounts'),
    ]);

    expect(await responses[0].text()).toContain('Private account marker');
    expect(responses[1].status()).toBe(200);
    expect(await responses[1].text()).toContain('Sign in');
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
