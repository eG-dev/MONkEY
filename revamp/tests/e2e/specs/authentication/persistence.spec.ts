import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test, expect, image } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

test('existing foundation database upgrades to Identity without data loss @api', async () => {
  const probePath = resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0');

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'none',
      '--user',
      '10001:10001',
      '--entrypoint',
      'dotnet',
      '--mount',
      `type=bind,source=${probePath},target=/checks,readonly`,
      image,
      '/checks/RuntimeChecks.dll',
      'identity-upgrade',
    ],
    { encoding: 'utf8', timeout: 30_000 },
  );

  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout.trim()).toBe('identity_upgrade_passed');
});
