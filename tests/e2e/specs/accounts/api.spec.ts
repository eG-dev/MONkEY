import { test, expect, bootstrapManager, csrfWrite, login } from '../../fixtures';
import { createMember } from '../../helpers/accounts';

test.use({ ignoreHTTPSErrors: true });

test('shared-account APIs enforce roles, CSRF, names and missing-account errors @api', async ({ request, instance }) => {
  const manager = bootstrapManager(instance);

  expect((await request.get('/api/accounts')).status()).toBe(401);
  expect((await request.get('/api/accounts/missing', { headers: { 'X-User-Role': 'Manager', 'X-User-Id': 'forged' } })).status()).toBe(401);
  expect((await csrfWrite(request, 'POST', '/api/accounts', { name: 'Anonymous' })).status()).toBe(401);

  await login(request, manager);

  expect((await request.post('/api/accounts', { data: { name: 'No CSRF' } })).status()).toBe(400);
  expect((await request.put('/api/accounts/missing', { data: { name: 'No CSRF' } })).status()).toBe(400);

  for (const name of ['', '   ', null, 'A'.repeat(41)]) {
    const invalid = await csrfWrite(request, 'POST', '/api/accounts', { name });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: 'invalid_account_name' });
  }

  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: '  Ida  ' });
  const account = await created.json();

  expect(created.status()).toBe(201);
  expect(created.headers()['location']).toBe(`/api/accounts/${account.id}`);
  expect(account).toEqual({ id: expect.any(String), name: 'Ida', currency: 'EUR', balance: null, openingEntry: null, imageUrl: null });

  const duplicate = await csrfWrite(request, 'POST', '/api/accounts', { name: ' iDA ' });

  expect(duplicate.status()).toBe(409);
  expect(await duplicate.json()).toEqual({ code: 'account_name_taken' });

  const accented = await csrfWrite(request, 'POST', '/api/accounts', { name: '\u00c4nne' });
  const accentedDuplicate = await csrfWrite(request, 'POST', '/api/accounts', { name: '\u00e4NNE' });

  expect(accented.status()).toBe(201);
  expect(accentedDuplicate.status()).toBe(409);
  expect(await accentedDuplicate.json()).toEqual({ code: 'account_name_taken' });

  const maximum = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Z'.repeat(40) });

  expect(maximum.status()).toBe(201);

  const missing = await request.get('/api/accounts/missing');
  const missingUpdate = await csrfWrite(request, 'PUT', '/api/accounts/missing', { name: 'Missing' });

  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ code: 'not_found' });
  expect(missingUpdate.status()).toBe(404);
  expect(await missingUpdate.json()).toEqual({ code: 'not_found' });

  await createMember(request);

  expect((await request.get('/api/accounts')).status()).toBe(200);
  expect(await (await request.get(`/api/accounts/${account.id}`)).json()).toEqual(account);
  expect((await csrfWrite(request, 'POST', '/api/accounts', { name: 'Member write' })).status()).toBe(403);
  expect((await csrfWrite(request, 'PUT', `/api/accounts/${account.id}`, { name: 'Member rename' })).status()).toBe(403);
  expect((await request.delete(`/api/accounts/${account.id}`)).status()).toBe(404);
});

test('case-insensitive uniqueness survives concurrent creates and failed renames without a nine-account cap @api', async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const csrf = await request.get('/api/auth/csrf');
  const headers = { 'X-Monkey-CSRF': (await csrf.json()).token };
  const simultaneous = await Promise.all([
    request.post('/api/accounts', { data: { name: 'Shared' }, headers }),
    request.post('/api/accounts', { data: { name: 'sHARED' }, headers }),
  ]);

  expect(simultaneous.map((response) => response.status()).sort()).toEqual([201, 409]);

  for (let index = 0; index < 10; index++) {
    const created = await csrfWrite(request, 'POST', '/api/accounts', { name: `Account ${index}` });

    expect(created.status()).toBe(201);
  }

  const list = await (await request.get('/api/accounts')).json();

  expect(list).toHaveLength(11);

  const original = list.find((account: { name: string }) => account.name === 'Account 0');
  const conflict = await csrfWrite(request, 'PUT', `/api/accounts/${original.id}`, { name: 'SHARED' });

  expect(conflict.status()).toBe(409);
  expect(await conflict.json()).toEqual({ code: 'account_name_taken' });
  expect(await (await request.get(`/api/accounts/${original.id}`)).json()).toEqual(original);

  const invalid = await csrfWrite(request, 'PUT', `/api/accounts/${original.id}`, { name: ' ' });

  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ code: 'invalid_account_name' });
  expect(await (await request.get(`/api/accounts/${original.id}`)).json()).toEqual(original);
});
