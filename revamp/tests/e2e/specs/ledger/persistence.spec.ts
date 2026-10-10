import { request as apiRequest } from '@playwright/test';
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
} from '../../fixtures';
import { createAccount } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('real SQLite ledger migration, exact arithmetic, constraints and complete rollback hold @api', async () => {
  const probe = resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0');
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
