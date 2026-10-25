import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

import { test, expect, bootstrapManager, csrfWrite, login, docker, image, containerOrigin, waitReady } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('allowance configuration enforces exact values, initialization, CSRF and roles without crediting @api', async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  expect((await request.get('/api/accounts/missing/allowance')).status()).toBe(401);

  await login(request, manager);

  const account = await createAccount(request, 'Allowance API');
  const path = `/api/accounts/${account.id}/allowance`;
  const initial = await (await request.get(path)).json();

  expect(initial.current).toBeNull();
  expect(initial.scheduled).toBeNull();
  expect((await request.put(path, { data: { enabled: true, amount: '12.34' } })).status()).toBe(400);
  expect((await csrfWrite(request, 'PUT', path, { enabled: true, amount: '12.34' })).status()).toBe(409);

  await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { amount: '0', idempotencyKey: randomUUID() });

  const before = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();

  for (const amount of ['0', '-1', '1.001', '92233720368547758.08', '1,23', null]) {
    const rejected = await csrfWrite(request, 'PUT', path, { enabled: true, amount });

    expect(rejected.status()).toBe(400);
    expect(await rejected.json()).toEqual({ code: 'invalid_allowance_amount' });
  }

  const saved = await csrfWrite(request, 'PUT', path, { enabled: true, amount: '92233720368547758.07' });

  expect(saved.status()).toBe(200);

  const state = await saved.json();

  expect(state.current).toBeNull();
  expect(state.scheduled).toMatchObject({ enabled: true, amount: '92233720368547758.07', effectiveMonth: state.nextEffectiveMonth });
  expect((await csrfWrite(request, 'PUT', '/api/accounts/missing/allowance', { enabled: false })).status()).toBe(404);

  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));

  expect(await (await request.get(path)).json()).toEqual(state);
  expect(await (await request.get(`/api/accounts/${account.id}/transactions`)).json()).toEqual(before);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.00');

  await createReader(request);

  expect((await request.get(path)).status()).toBe(200);
  expect((await csrfWrite(request, 'PUT', path, { enabled: false, expectedRevisionId: state.latestRevisionId })).status()).toBe(403);
});

test('allowance concurrent edits conflict and retries retain one scheduled configuration @api', async ({ request, instance }) => {
  await login(request, bootstrapManager(instance));

  const account = await createAccount(request, 'Concurrent allowance');

  await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, { amount: '0', idempotencyKey: randomUUID() });

  const path = `/api/accounts/${account.id}/allowance`;
  const csrf = await request.get('/api/auth/csrf');
  const headers = { 'X-Monkey-CSRF': (await csrf.json()).token };
  const results = await Promise.all([
    request.put(path, { data: { enabled: true, amount: '10' }, headers }),
    request.put(path, { data: { enabled: true, amount: '20' }, headers }),
  ]);

  expect(results.map((response) => response.status()).sort()).toEqual([200, 409]);

  const state = await (await request.get(path)).json();

  const replay = await csrfWrite(request, 'PUT', path, { enabled: true, amount: state.scheduled.amount });

  expect(replay.status()).toBe(200);
  expect(await replay.json()).toEqual(state);

  const disabled = await csrfWrite(request, 'PUT', path, { enabled: false, expectedRevisionId: state.latestRevisionId });

  expect(disabled.status()).toBe(200);

  const updated = await disabled.json();

  expect(updated.scheduled).toMatchObject({ enabled: false, amount: state.scheduled.amount });
  expect(
    (await csrfWrite(request, 'PUT', path, { enabled: true, amount: '30', expectedRevisionId: state.latestRevisionId })).status(),
  ).toBe(409);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.00');
});

test('allowance revision boundaries, constraints and audit rollback hold in real SQLite @api', async () => {
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
    'allowance-persistence',
  );

  expect(result).toBe('allowance_persistence_passed');
});
