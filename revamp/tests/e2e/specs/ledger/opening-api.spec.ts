import { randomUUID } from 'node:crypto';
import { test, expect, bootstrapManager, csrfWrite, login } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('opening APIs enforce Manager access, CSRF, exact amounts and explicit zero @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const payload = {
    amount: '0.00',
    idempotencyKey: randomUUID(),
    comment: 'Opening marker',
  };

  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(401);

  await login(request, manager);
  const account = await createAccount(request, 'Opening');
  const path = `/api/accounts/${account.id}/opening`;

  expect(account.balance).toBeNull();
  expect(account.openingEntry).toBeNull();
  expect((await request.post(path, { data: payload })).status()).toBe(400);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/opening', payload)).status()).toBe(404);

  for (const amount of ['', '-92233720368547758.09', '1.001', '1e2', ' 1.00', 'NaN', '92233720368547758.08', null]) {
    const invalid = await csrfWrite(request, 'POST', path, {
      ...payload,
      amount,
    });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: 'invalid_opening_amount' });
  }

  expect((await csrfWrite(request, 'POST', path, { ...payload, amount: 12.34 })).status()).toBe(400);
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        idempotencyKey: 'bad',
      })
    ).json(),
  ).toEqual({
    code: 'invalid_idempotency_key',
  });
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        comment: 'A'.repeat(501),
      })
    ).json(),
  ).toEqual({
    code: 'invalid_comment',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBeNull();

  const posted = await csrfWrite(request, 'POST', path, payload);
  const entry = await posted.json();

  expect(posted.status()).toBe(200);
  expect(entry).toMatchObject({
    accountId: account.id,
    amount: '0.00',
    currency: 'EUR',
    source: 'opening',
    comment: payload.comment,
  });
  expect(entry).not.toHaveProperty('idempotencyKey');
  expect(entry.occurredAtUtc).toMatch(/\+00:00$|Z$/);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('0.00');

  await createReader(request);

  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).openingEntry).toEqual(entry);
  expect(
    (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(403);
  expect((await request.put(path, { data: payload })).status()).toBe(404);
  expect((await request.delete(path)).status()).toBe(404);
});

test('concurrent openings and retries are idempotent with conflicting-payload errors @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);
  const account = await createAccount(request, 'Concurrent');
  const other = await createAccount(request, 'Other');
  const payload = {
    amount: '42.17',
    comment: 'Same request',
    idempotencyKey: randomUUID(),
  };
  const headers = {
    'X-Monkey-CSRF': (await (await request.get('/api/auth/csrf')).json()).token,
  };
  const responses = await Promise.all(
    Array.from({ length: 3 }, () =>
      request.post(`/api/accounts/${account.id}/opening`, {
        data: payload,
        headers,
      }),
    ),
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
