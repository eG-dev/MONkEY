import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { test as standalone } from '@playwright/test';

import { test, expect, docker, image } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

for (const [variable, value] of [
  ['TZ', 'Not/A_Timezone'],
  ['MONKEY_DATA_PATH', 'relative'],
  ['MONKEY_DEFAULT_LOCALE', 'zz-ZZ'],
  ['MONKEY_CURRENCY', 'JPY'],
  ['MONKEY_TRUSTED_PROXIES', 'not-a-proxy'],
  ['MONKEY_PUBLIC_URL', 'http://localhost'],
]) {
  standalone(`${variable} rejects invalid configuration before readiness`, async ({}, testInfo) => {
    const name = `monkey-invalid-${randomUUID()}`;

    try {
      const result = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          name,
          '--network',
          'none',
          '--env',
          'MONKEY_PUBLIC_URL=https://localhost',
          '--env',
          `${variable}=${value}`,
          image,
        ],
        { encoding: 'utf8', timeout: 40_000 },
      );

      await testInfo.attach('startup.log', { body: `${result.stdout ?? ''}${result.stderr ?? ''}`, contentType: 'text/plain' });

      expect(result.signal).toBeNull();
      expect(result.status).toBe(1);

      expect(`${result.stdout}${result.stderr}`).toContain(variable);
    } finally {
      spawnSync('docker', ['rm', '--force', '--volumes', name], { encoding: 'utf8', timeout: 10_000 });
    }
  });
}

for (const mode of ['readonly', 'public-permissions']) {
  standalone(`storage rejects ${mode} data volumes`, async ({}, testInfo) => {
    const name = `monkey-storage-${randomUUID()}`;
    const volume = `${name}-data`;

    docker('volume', 'create', volume);

    try {
      if (mode === 'public-permissions') {
        docker(
          'run',
          '--rm',
          '--network',
          'none',
          '--user',
          '0',
          '--entrypoint',
          '/usr/local/bin/node',
          '--mount',
          `type=volume,source=${volume},target=/data`,
          image,
          '-e',
          "const fs = require('node:fs'); fs.writeFileSync('/data/.fixture', 'fixture'); fs.chmodSync('/data', 0o777);",
        );
      }

      const result = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          name,
          '--network',
          'none',
          '--env',
          'MONKEY_PUBLIC_URL=https://localhost',
          '--mount',
          `type=volume,source=${volume},target=/data${mode === 'readonly' ? ',readonly' : ''}`,
          image,
        ],
        { encoding: 'utf8', timeout: 40_000 },
      );

      const logs = `${result.stdout ?? ''}${result.stderr ?? ''}`;

      await testInfo.attach('storage-startup.log', { body: logs, contentType: 'text/plain' });

      expect(result.signal).toBeNull();
      expect(result.status).toBe(1);

      expect(logs).toMatch(mode === 'readonly' ? /[Rr]ead-only file system/ : /owner-only permissions/);
    } finally {
      spawnSync('docker', ['rm', '--force', '--volumes', name], { encoding: 'utf8', timeout: 10_000 });
      docker('volume', 'rm', volume);
    }
  });
}
