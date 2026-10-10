import { test as base, expect, APIRequestContext, Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:https';
import { request as httpRequest } from 'node:http';
import { generate } from 'selfsigned';
import { Instance } from './instance';

export const image = process.env['MONKEY_TEST_IMAGE'] ?? 'pocket-monkey:foundation';

export function docker(...args: string[]): string {
  return execFileSync('docker', args, { encoding: 'utf8', timeout: 30_000 }).trim();
}

export function containerOrigin(container: string): string {
  const details = JSON.parse(docker('inspect', container))[0];
  return `http://127.0.0.1:${details.NetworkSettings.Ports['8080/tcp'][0].HostPort}`;
}

export function startContainer(container: string, volume: string, currency = 'EUR'): string {
  docker(
    'run',
    '--detach',
    '--name',
    container,
    '--publish',
    '127.0.0.1::8080',
    '--env',
    'MONKEY_PUBLIC_URL=https://localhost',
    '--env',
    'TZ=Europe/Berlin',
    '--env',
    `MONKEY_CURRENCY=${currency}`,
    '--mount',
    `type=volume,source=${volume},target=/data`,
    image,
  );
  return containerOrigin(container);
}

export async function waitReady(origin: string): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          return (await fetch(`${origin}/health/ready`, { signal: AbortSignal.timeout(2000) })).status;
        } catch {
          return 0;
        }
      },
      { timeout: 30_000, intervals: [100, 250, 500] },
    )
    .toBe(200);
}

export function credentials(username = 'manager') {
  return { username, password: `Disposable-Aa1-${randomUUID()}` };
}

export function operator(instance: Instance, command: 'bootstrap-manager' | 'recover-manager', account: ReturnType<typeof credentials>) {
  return spawnSync('docker', ['exec', '-i', instance.container, 'dotnet', '/app/backend/PocketMonkey.Api.dll', command], {
    input: `${account.username}\n${account.password}\n`,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

export function bootstrapManager(instance: Instance) {
  const account = credentials();
  const result = operator(instance, 'bootstrap-manager', account);
  expect(result.status, result.stdout + result.stderr).toBe(0);
  return account;
}

export async function csrfWrite(request: APIRequestContext, method: 'POST' | 'PUT', path: string, data: object) {
  const token = await request.get('/api/auth/csrf');
  expect(token.status()).toBe(200);

  return request.fetch(path, { method, data, headers: { 'X-Monkey-CSRF': (await token.json()).token } });
}

export async function login(request: APIRequestContext, account: ReturnType<typeof credentials>) {
  const response = await csrfWrite(request, 'POST', '/api/auth/login', account);
  expect(response.status()).toBe(200);
  return response.json();
}

export async function createUser(request: APIRequestContext, username: string, displayName: string, role: 'Manager' | 'Member') {
  const response = await csrfWrite(request, 'POST', '/api/users', { username, displayName, role });
  expect(response.status()).toBe(201);
  const created = await response.json();
  return { profile: created.user, account: { username, password: created.temporaryPassword as string } };
}

export async function signIn(page: Page, account: ReturnType<typeof credentials>) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Benutzername', exact: true }).fill(account.username);
  await page.getByLabel('Passwort', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
}

async function secureOrigin(instance: Instance) {
  const certificate = await generate([{ name: 'commonName', value: 'localhost' }], { keyType: 'ec' });
  const server = createServer({ key: certificate.private, cert: certificate.cert }, (request, response) => {
    const target = new URL(request.url ?? '/', containerOrigin(instance.container));
    const upstream = httpRequest(target, { method: request.method, headers: request.headers }, (result) => {
      response.writeHead(result.statusCode ?? 502, result.headers);
      result.pipe(response);
    });
    upstream.on('error', () => {
      if (!response.headersSent) {
        response.writeHead(502);
      }
      response.end();
    });
    request.pipe(upstream);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('HTTPS fixture did not receive a loopback port.');
  }

  return {
    origin: `https://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export const test = base.extend<{ instance: Instance; currency: 'EUR' | 'USD' }>({
  currency: ['EUR', { option: true }],
  instance: async ({ currency }, use, testInfo) => {
    const name = `monkey-e2e-${randomUUID()}`;
    const volume = `${name}-data`;
    docker('volume', 'create', volume);
    let closeProxy: (() => Promise<void>) | undefined;
    try {
      const origin = startContainer(name, volume, currency);
      await waitReady(origin);
      const instance = { origin, container: name, volume };

      if (['authentication.spec.ts', 'accounts.spec.ts', 'ledger.spec.ts'].some((file) => testInfo.file.endsWith(file))) {
        const proxy = await secureOrigin(instance);
        instance.origin = proxy.origin;
        closeProxy = proxy.close;
      }

      await use(instance);
    } finally {
      await closeProxy?.();
      if (testInfo.status !== testInfo.expectedStatus) {
        const logs = spawnSync('docker', ['logs', name], { encoding: 'utf8', timeout: 10_000 });
        await testInfo.attach('application.log', { body: `${logs.stdout ?? ''}${logs.stderr ?? ''}`, contentType: 'text/plain' });
        const runtime = spawnSync('docker', ['inspect', '--format', '{{json .State}} {{json .NetworkSettings.Ports}}', name], {
          encoding: 'utf8',
          timeout: 10_000,
        });
        await testInfo.attach('container-state.txt', { body: runtime.stdout ?? '', contentType: 'text/plain' });
      }
      const cleanup = spawnSync('docker', ['rm', '--force', '--volumes', name], { encoding: 'utf8', timeout: 30_000 });
      if (cleanup.status !== 0) console.warn('Test container cleanup:', cleanup.stderr);
      const volumeCleanup = spawnSync('docker', ['volume', 'rm', volume], { encoding: 'utf8', timeout: 30_000 });
      if (volumeCleanup.status !== 0) throw new Error(`Test volume cleanup failed: ${volumeCleanup.stderr}`);
    }
  },
  baseURL: async ({ instance }, use) => use(instance.origin),
});

export { expect } from '@playwright/test';
