import { test, expect, bootstrapManager, csrfWrite, login, containerOrigin, docker, startContainer, waitReady } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('restart and container replacement preserve accounts and private keys', async ({ instance, request }) => {
  await login(request, bootstrapManager(instance));

  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Persistent account' });

  expect(created.status()).toBe(201);

  const before = await created.json();
  const keys = docker('exec', instance.container, 'find', '/data/keys', '-type', 'f', '-printf', '%f\n');

  expect(keys).toMatch(/key-.*\.xml/);
  expect(docker('exec', instance.container, 'stat', '-c', '%a %u', '/data/keys')).toBe('700 10001');

  docker('restart', '--timeout', '25', instance.container);
  instance.origin = containerOrigin(instance.container);
  await waitReady(instance.origin);

  expect(await (await request.get(`/api/accounts/${before.id}`)).json()).toEqual(before);

  const started = Date.now();

  docker('stop', '--timeout', '25', instance.container);

  expect(Date.now() - started).toBeLessThan(25_000);
  expect(JSON.parse(docker('inspect', instance.container))[0].State.ExitCode).toBe(0);

  docker('rm', instance.container);
  instance.origin = startContainer(instance.container, instance.volume);
  await waitReady(instance.origin);

  expect(await (await request.get(`/api/accounts/${before.id}`)).json()).toEqual(before);

  expect(docker('exec', instance.container, 'find', '/data/keys', '-type', 'f', '-printf', '%f\n')).toBe(keys);
});
