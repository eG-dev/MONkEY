import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, docker, containerOrigin, waitReady } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('manual transactions enforce roles, positive inputs, initialization and CSRF @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const payload = {
    amount: '0.02',
    source: 'withdrawal',
    idempotencyKey: randomUUID(),
    comment: 'Overdraft',
  };

  expect((await request.get('/api/accounts/missing/transactions')).status()).toBe(401);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/transactions', payload)).status()).toBe(401);

  await login(request, manager);

  const account = await createAccount(request, 'Signed transactions');
  const path = `/api/accounts/${account.id}/transactions`;

  expect(await (await request.get(path)).json()).toEqual({
    timezone: 'Europe/Berlin',
    entries: [],
    nextCursor: null,
    retentionMonths: 24,
    retentionCutoffUtc: expect.any(String),
  });
  expect(await (await csrfWrite(request, 'POST', path, payload)).json()).toEqual({ code: 'not_initialized' });
  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '-0.01',
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);
  expect((await request.post(path, { data: payload })).status()).toBe(400);
  expect((await csrfWrite(request, 'POST', '/api/accounts/missing/transactions', payload)).status()).toBe(404);

  for (const amount of ['0', '0.00', '-0.01', '1.001', '1e2', 'NaN', ' 1.00', '92233720368547758.08', null]) {
    const invalid = await csrfWrite(request, 'POST', path, {
      ...payload,
      amount,
    });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({
      code: 'invalid_transaction_amount',
    });
  }

  for (const change of [{ amount: 1 }, { source: 1 }, { source: 'unknown' }]) {
    expect((await csrfWrite(request, 'POST', path, { ...payload, ...change })).status()).toBe(400);
  }

  for (const [change, code] of [
    [{ source: 'opening' }, 'invalid_transaction_source'],
    [{ comment: 'A'.repeat(501) }, 'invalid_comment'],
    [{ idempotencyKey: 'bad' }, 'invalid_idempotency_key'],
  ] as const) {
    expect(await (await csrfWrite(request, 'POST', path, { ...payload, ...change })).json()).toEqual({ code });
  }

  const posted = await csrfWrite(request, 'POST', path, payload);

  expect(posted.status()).toBe(200);
  expect(await posted.json()).toMatchObject({
    amount: '-0.02',
    source: 'withdrawal',
    comment: 'Overdraft',
  });
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.03');

  for (const pageSize of [0, 101]) {
    expect(await (await request.get(`${path}?pageSize=${pageSize}`)).json()).toEqual({ code: 'invalid_page_size' });
  }

  expect(await (await request.get(`${path}?cursor=bad`)).json()).toEqual({
    code: 'invalid_history_cursor',
  });

  await createReader(request);

  expect((await request.get(path)).status()).toBe(200);
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

test('concurrent transactions, source-aware retries and snapshot history survive restart @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);
  const profile = await login(request, manager);
  const account = await createAccount(request, 'Concurrent transactions');
  const other = await createAccount(request, 'Other history');
  const path = `/api/accounts/${account.id}/transactions`;
  const openingKey = randomUUID();

  expect(
    (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '0.00',
        idempotencyKey: openingKey,
      })
    ).status(),
  ).toBe(200);

  const headers = {
    'X-Monkey-CSRF': (await (await request.get('/api/auth/csrf')).json()).token,
  };
  const writes = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      request.post(path, {
        headers,
        data: {
          amount: index % 2 ? '0.20' : '0.10',
          source: index % 2 ? 'withdrawal' : 'deposit',
          comment: `Concurrent ${index}`,
          idempotencyKey: randomUUID(),
        },
      }),
    ),
  );

  expect(writes.map((response) => response.status())).toEqual(Array(10).fill(200));
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.50');

  const payload = {
    amount: '0.10',
    source: 'deposit',
    comment: 'Retry',
    idempotencyKey: randomUUID(),
  };
  const retries = await Promise.all(Array.from({ length: 3 }, () => request.post(path, { headers, data: payload })));
  const replayed = await Promise.all(retries.map((response) => response.json()));

  expect(retries.map((response) => response.status())).toEqual([200, 200, 200]);
  expect(new Set(replayed.map((entry) => entry.id)).size).toBe(1);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.40');

  for (const change of [{ source: 'withdrawal' }, { amount: '0.11' }, { comment: 'Changed' }]) {
    expect(await (await csrfWrite(request, 'POST', path, { ...payload, ...change })).json()).toEqual({ code: 'idempotency_conflict' });
  }

  expect(await (await csrfWrite(request, 'POST', `/api/accounts/${other.id}/transactions`, payload)).json()).toEqual({
    code: 'idempotency_conflict',
  });
  expect(
    await (
      await csrfWrite(request, 'POST', path, {
        ...payload,
        amount: '0.01',
        idempotencyKey: openingKey,
      })
    ).json(),
  ).toEqual({ code: 'idempotency_conflict' });
  expect(
    await (
      await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: '0.10',
        comment: 'Retry',
        idempotencyKey: payload.idempotencyKey,
      })
    ).json(),
  ).toEqual({ code: 'idempotency_conflict' });

  const first = await (await request.get(`${path}?pageSize=3`)).json();
  const newEntry = await (
    await csrfWrite(request, 'POST', path, {
      amount: '0.25',
      source: 'deposit',
      idempotencyKey: randomUUID(),
      comment: 'New after snapshot',
    })
  ).json();
  const original = [...first.entries];
  let cursor = first.nextCursor;

  expect((await request.get(`/api/accounts/${other.id}/transactions?cursor=${encodeURIComponent(cursor)}`)).status()).toBe(400);

  while (cursor) {
    const page = await (await request.get(`${path}?pageSize=3&cursor=${encodeURIComponent(cursor)}`)).json();

    original.push(...page.entries);
    cursor = page.nextCursor;
  }

  expect(original).toHaveLength(12);
  expect(new Set(original.map((entry) => entry.id)).size).toBe(12);
  expect(original.some((entry) => entry.id === newEntry.id)).toBe(false);
  expect(original.at(-1).source).toBe('opening');
  expect(original.every((entry) => entry.actorId === profile.id && entry.actorDisplayName === profile.displayName)).toBe(true);
  expect(original.every((entry) => !('idempotencyKey' in entry))).toBe(true);
  expect((await (await request.get(path)).json()).entries[0].id).toBe(newEntry.id);

  expect(
    (
      await csrfWrite(request, 'PUT', `/api/users/${profile.id}`, {
        displayName: 'Renamed transaction manager',
        role: 'Manager',
        isActive: true,
      })
    ).status(),
  ).toBe(204);

  await login(request, manager);

  const before = await (await request.get(path)).json();

  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));

  expect(await (await request.get(path)).json()).toEqual(before);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe('-0.15');
  expect(await (await csrfWrite(request, 'POST', path, payload)).json()).toEqual(replayed[0]);
});

test('signed opening extremes reject overflowing transactions without changing history @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  for (const boundary of [
    { name: 'Upper', opening: '92233720368547758.07', source: 'deposit' },
    { name: 'Lower', opening: '-92233720368547758.08', source: 'withdrawal' },
  ]) {
    const account = await createAccount(request, boundary.name);

    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
          amount: boundary.opening,
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(200);

    const path = `/api/accounts/${account.id}/transactions`;
    const before = await (await request.get(path)).json();
    const overflow = await csrfWrite(request, 'POST', path, {
      amount: '0.01',
      source: boundary.source,
      idempotencyKey: randomUUID(),
    });

    expect(overflow.status()).toBe(409);
    expect(await overflow.json()).toEqual({ code: 'balance_overflow' });
    expect(await (await request.get(path)).json()).toEqual(before);
    expect((await (await request.get(`/api/accounts/${account.id}`)).json()).balance).toBe(boundary.opening);
  }
});
