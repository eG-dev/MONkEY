import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { containerOrigin, docker, image, waitReady } from '../../fixtures';

test('real SQLite financial recovery fixtures and failure checks @api @desktop', async () => {
  test.setTimeout(120_000);
  const probe = resolve(__dirname, '../../../integration/RuntimeChecks/bin/Release/net10.0');
  const fixtures = resolve(__dirname, '../../../fixtures/financial-snapshots');
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
    `type=bind,source=${probe},target=/tests,readonly`,
    '--mount',
    `type=bind,source=${fixtures},target=/fixtures,readonly`,
    image,
    '/tests/RuntimeChecks.dll',
    'financial-recovery',
    '/fixtures',
  );

  expect(output.trim().split('\n').at(-1)).toBe('financial_recovery_passed');
});

test('enabled export worker publishes private JSON and survives restart @desktop', async () => {
  test.setTimeout(120_000);
  const container = `monkey-export-${randomUUID()}`;
  const data = `${container}-data`;
  const exports = `${container}-exports`;

  docker('volume', 'create', data);
  docker('volume', 'create', exports);

  try {
    docker(
      'run',
      '--rm',
      '--user',
      '0:0',
      '--network',
      'none',
      '--entrypoint',
      'sh',
      '--mount',
      `type=volume,source=${exports},target=/exports`,
      image,
      '-c',
      'chown 10001:10001 /exports && chmod 700 /exports',
    );
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
      'MONKEY_EXPORT_PATH=/exports',
      '--env',
      'MONKEY_EXPORT_KEEP_COUNT=30',
      '--mount',
      `type=volume,source=${data},target=/data`,
      '--mount',
      `type=volume,source=${exports},target=/exports`,
      image,
    );
    await waitReady(containerOrigin(container));
    const inspectExports = () =>
      JSON.parse(
        docker(
          'exec',
          container,
          'node',
          '-e',
          'const fs=require("node:fs");console.log(JSON.stringify(fs.readdirSync("/exports").filter(name=>name.startsWith("pocket-monkey-"))))',
        ),
      ) as string[];

    await expect.poll(inspectExports).toHaveLength(1);
    await expect.poll(() => docker('exec', container, 'test', '-f', '/exports/.export-state.json')).toBe('');
    const filename = inspectExports()[0];
    const snapshot = JSON.parse(docker('exec', container, 'cat', `/exports/${filename}`));
    expect(snapshot.formatVersion).toBe(1);
    expect(snapshot.applicationVersion).toBe(docker('exec', container, 'printenv', 'MONKEY_BUILD_VERSION'));
    expect(snapshot.accounts).toEqual([]);
    expect(snapshot).not.toHaveProperty('users');
    expect(snapshot).not.toHaveProperty('images');
    expect(docker('exec', container, 'stat', '-c', '%a %u', `/exports/${filename}`)).toBe('600 10001');
    expect(docker('exec', container, 'stat', '-c', '%a %u', '/exports')).toBe('700 10001');
    docker('restart', '--timeout', '25', container);
    await waitReady(containerOrigin(container));
    expect(inspectExports()).toEqual([filename]);
    expect(docker('exec', container, 'find', '/exports', '-name', '*.tmp', '-print')).toBe('');
  } finally {
    if (test.info().status !== test.info().expectedStatus) {
      const logs = spawnSync('docker', ['logs', container], { encoding: 'utf8', timeout: 10_000 });
      await test.info().attach('export-application.log', { body: logs.stdout + logs.stderr, contentType: 'text/plain' });
    }

    spawnSync('docker', ['rm', '--force', container], { encoding: 'utf8', timeout: 30_000 });
    docker('volume', 'rm', data, exports);
  }
});
