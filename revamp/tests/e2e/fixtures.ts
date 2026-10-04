import { test as base, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { Instance } from './instance';

export const image = process.env['MONKEY_TEST_IMAGE'] ?? 'pocket-monkey:foundation';

export function docker(...args: string[]): string {
  return execFileSync('docker', args, { encoding: 'utf8', timeout: 30_000 }).trim();
}

export function containerOrigin(container: string): string {
  const details = JSON.parse(docker('inspect', container))[0];
  return `http://127.0.0.1:${details.NetworkSettings.Ports['8080/tcp'][0].HostPort}`;
}

export function startContainer(container: string, volume: string): string {
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

export const test = base.extend<{ instance: Instance }>({
  instance: async ({}, use, testInfo) => {
    const name = `monkey-e2e-${randomUUID()}`;
    const volume = `${name}-data`;
    docker('volume', 'create', volume);
    try {
      const origin = startContainer(name, volume);
      await waitReady(origin);
      await use({ origin, container: name, volume });
    } finally {
      if (testInfo.status !== testInfo.expectedStatus) {
        const logs = spawnSync('docker', ['logs', name], { encoding: 'utf8', timeout: 10_000 });
        await testInfo.attach('application.log', { body: `${logs.stdout ?? ''}${logs.stderr ?? ''}`, contentType: 'text/plain' });
        const runtime = spawnSync('docker', ['inspect', '--format', '{{json .State}} {{json .NetworkSettings.Ports}}', name], { encoding: 'utf8', timeout: 10_000 });
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
