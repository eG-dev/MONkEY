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
  waitReady,
  image,
} from '../../fixtures';
import { picture, upload } from '../../helpers/images';

test.use({ ignoreHTTPSErrors: true });

test('private account images validate content, limits, access and persistence @api', async ({ page, request, instance }) => {
  await page.goto('/');
  const png = await picture(page);
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Image account' });
  const account = await created.json();
  const path = `/api/accounts/${account.id}/image`;

  expect((await request.get(path)).status()).toBe(404);
  expect((await request.put(path, { data: png, headers: { 'Content-Type': 'image/png' } })).status()).toBe(400);
  expect((await upload(request, path, Buffer.alloc(2 * 1024 * 1024 + 1))).status()).toBe(413);
  expect((await upload(request, path, Buffer.alloc(8 * 1024 * 1024))).status()).toBe(413);
  expect((await upload(request, path, await picture(page, 513, 1))).status()).toBe(400);
  expect((await upload(request, path, await picture(page, 1, 513))).status()).toBe(400);
  expect((await upload(request, path, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).status()).toBe(400);
  expect((await upload(request, path, png, 'image/jpeg')).status()).toBe(400);
  expect((await upload(request, '/api/accounts/missing/image', png)).status()).toBe(404);
  expect((await upload(request, '/api/accounts/..%2f..%2fkeys/image', png)).status()).toBe(404);

  const padded = Buffer.alloc(2 * 1024 * 1024);
  png.copy(padded);
  Buffer.from('private metadata marker').copy(padded, png.length);
  expect((await upload(request, path, padded)).status()).toBe(204);
  const stored = await request.get(path);
  expect(stored.status()).toBe(200);
  expect(stored.headers()['content-type']).toContain('image/png');
  expect(stored.headers()['cache-control']).toBe('no-store');
  expect(stored.headers()['x-content-type-options']).toBe('nosniff');
  expect((await stored.body()).includes(Buffer.from('private metadata marker'))).toBe(false);
  const firstUrl = (await (await request.get(`/api/accounts/${account.id}`)).json()).imageUrl;

  for (const type of ['image/jpeg', 'image/webp']) {
    expect((await upload(request, path, await picture(page, 200, 100, type), type)).status()).toBe(204);
    expect((await request.get(path)).headers()['content-type']).toContain('image/png');
  }

  const current = await (await request.get(`/api/accounts/${account.id}`)).json();
  expect(current.imageUrl).not.toBe(firstUrl);
  const lastImage = await (await request.get(path)).body();
  expect((await upload(request, path, Buffer.from('not an image'))).status()).toBe(400);
  expect(await (await request.get(path)).body()).toEqual(lastImage);
  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));
  expect(await (await request.get(path)).body()).toEqual(lastImage);

  const member = await createUser(request, 'image-reader', 'Image Reader', 'Member');
  await login(request, member.account);
  const permanent = credentials('image-reader');
  expect(
    (
      await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: member.account.password, newPassword: permanent.password })
    ).status(),
  ).toBe(204);
  await login(request, permanent);
  expect((await request.get(path)).status()).toBe(200);
  expect((await upload(request, path, png)).status()).toBe(403);
  expect((await request.delete(path)).status()).toBe(403);
  await csrfWrite(request, 'POST', '/api/auth/logout', {});
  expect((await request.get(path)).status()).toBe(401);
  expect((await request.put(path, { data: png })).status()).toBe(401);
  expect((await request.delete(path)).status()).toBe(401);
  expect((await request.get(`/images/${current.imageUrl.split('v=')[1]}`)).status()).toBe(404);

  await login(request, manager);
  const token = await request.get('/api/auth/csrf');
  expect((await request.delete(path, { headers: { 'X-Monkey-CSRF': (await token.json()).token } })).status()).toBe(204);
  expect((await request.get(path)).status()).toBe(404);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).imageUrl).toBeNull();
});

test('image filesystem failures, atomic audit rollback and orphan recovery hold @api', async () => {
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
    `type=bind,source=${resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0')},target=/tests,readonly`,
    image,
    '/tests/RuntimeChecks.dll',
    'image-persistence',
  );
  expect(output).toBe('image_persistence_passed');
});
