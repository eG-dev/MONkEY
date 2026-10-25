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
    'MONKEY_DEFAULT_LOCALE=en-US',
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

export function operator(
  instance: Instance,
  command: 'bootstrap-manager' | 'recover-manager',
  account: ReturnType<typeof credentials>,
  confirmation = account.password,
) {
  return spawnSync('docker', ['exec', '-i', instance.container, 'dotnet', '/app/backend/PocketMonkey.Host.dll', command], {
    input: `${account.username}\n${account.password}\n${confirmation}\n`,
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
  const profile = await response.json();

  if (!profile.mustChangePassword && profile.language !== 'en') {
    const preference = await csrfWrite(request, 'PUT', '/api/auth/language', { language: 'en' });
    expect(preference.status()).toBe(204);
    const updated = await request.get('/api/auth/me');
    expect(updated.status()).toBe(200);
    return updated.json();
  }

  return profile;
}

export async function createUser(request: APIRequestContext, username: string, displayName: string, role: 'Manager' | 'Member') {
  const response = await csrfWrite(request, 'POST', '/api/users', { username, displayName, role });
  expect(response.status()).toBe(201);
  const created = await response.json();
  return { profile: created.user, account: { username, password: created.temporaryPassword as string } };
}

async function fillLogin(page: Page, account: ReturnType<typeof credentials>, path: string) {
  await page.goto(path);
  await expect(page.locator('#login-submit')).toBeEnabled();
  await page.locator('#login-username').fill(account.username);
  await page.locator('#login-password').fill(account.password);
}

export async function submitLogin(page: Page, account: ReturnType<typeof credentials>, path = '/') {
  await fillLogin(page, account, path);
  await page.locator('#login-submit').click();
}

// A successful login reloads the document; interacting before that reload races with the old page.
export async function signIn(page: Page, account: ReturnType<typeof credentials>, path = '/') {
  await fillLogin(page, account, path);

  const reloaded = page.waitForEvent('load');

  await page.locator('#login-submit').click();
  await reloaded;

  const profile = await page.request.get('/api/auth/me');
  const user = await profile.json();

  if (!user.mustChangePassword && user.language !== 'en') {
    const preference = await csrfWrite(page.request, 'PUT', '/api/auth/language', { language: 'en' });
    expect(preference.status()).toBe(204);
    await page.reload();
  }
}

export async function secureOrigin(instance: Instance) {
  const certificate = await generate([{ name: 'commonName', value: 'localhost' }], { keyType: 'ec' });
  // Resolving per request would block the worker's event loop on `docker inspect`; refresh only after a connection failure.
  let upstreamOrigin = containerOrigin(instance.container);

  const server = createServer({ key: certificate.private, cert: certificate.cert }, async (request, response) => {
    const chunks: Buffer[] = [];

    try {
      for await (const chunk of request) {
        chunks.push(chunk as Buffer);
      }
    } catch {
      response.destroy();
      return;
    }

    const body = Buffer.concat(chunks);

    const forward = (retry: boolean) => {
      const target = new URL(request.url ?? '/', upstreamOrigin);
      // agent: false avoids reusing pooled sockets the upstream already closed (keep-alive race -> spurious 502).
      const upstream = httpRequest(target, { method: request.method, headers: request.headers, agent: false }, (result) => {
        response.writeHead(result.statusCode ?? 502, result.headers);
        result.pipe(response);
      });

      upstream.on('error', (error) => {
        if (retry && !response.headersSent) {
          // Docker restarts publish a new host port.
          try {
            upstreamOrigin = containerOrigin(instance.container);
            forward(false);
            return;
          } catch {
            // Container is stopped; report the original failure.
          }
        }

        console.warn(`HTTPS fixture upstream ${request.method} ${request.url} failed:`, error.message);

        if (!response.headersSent) {
          response.writeHead(502);
        }

        response.end();
      });

      upstream.end(body);
    };

    forward(true);
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

      const category = testInfo.file.replaceAll('\\', '/').split('/specs/')[1]?.split('/')[0];

      if (['authentication', 'accounts', 'ledger', 'lifecycle'].includes(category ?? '')) {
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
