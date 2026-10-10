import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test as standalone } from '@playwright/test';
import { test, expect, bootstrapManager, csrfWrite, login, containerOrigin, docker, image, startContainer, waitReady } from '../fixtures';

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

for (const process of ['backend', 'web']) {
  test(`${process} crash stops the entire container with a failure status`, async ({ instance }) => {
    docker('exec', instance.container, 'supervisorctl', '-c', '/app/supervisord.conf', 'signal', 'KILL', process);

    await expect.poll(() => JSON.parse(docker('inspect', instance.container))[0].State.Running, { timeout: 25_000 }).toBe(false);

    expect(JSON.parse(docker('inspect', instance.container))[0].State.ExitCode).toBe(1);
  });
}

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

standalone('runtime works with networking disabled and no development executables', async () => {
  const name = `monkey-offline-${randomUUID()}`;

  try {
    docker(
      'run',
      '--detach',
      '--name',
      name,
      '--network',
      'none',
      '--env',
      'MONKEY_PUBLIC_URL=https://localhost',
      '--env',
      'MONKEY_DATA_PATH=/data/offline',
      '--env',
      'MONKEY_DEFAULT_LOCALE=en-GB',
      '--env',
      'MONKEY_LOG_LEVEL=Warning',
      image,
    );

    await expect
      .poll(
        () => {
          const check = spawnSync(
            'docker',
            [
              'exec',
              name,
              'node',
              '-e',
              "Promise.all(['/health/ready','/favicon.png','/assets/lucide/lucide.woff2','/assets/lucide/LICENSE','/'].map(path=>fetch('http://127.0.0.1:8080'+path))).then(responses=>process.exit(responses.every(response=>response.ok)?0:1)).catch(()=>process.exit(1))",
            ],
            { encoding: 'utf8', timeout: 10_000 },
          );
          return check.status;
        },
        { timeout: 30_000, intervals: [100, 250, 500] },
      )
      .toBe(0);

    const language = docker(
      'exec',
      name,
      'node',
      '-e',
      "fetch('http://127.0.0.1:8080/',{headers:{'Accept-Language':'fr'}}).then(response=>response.text()).then(html=>process.exit(html.includes('lang=\"en\"')&&html.includes('Sign in')?0:1))",
    );

    expect(language).toBe('');

    expect(docker('logs', name)).not.toContain('"event":"listening"');

    expect(docker('exec', name, 'dotnet', '--list-sdks')).toBe('');
    docker('exec', name, '/bin/sh', '-c', '! command -v npm && ! command -v ng && ! command -v playwright');
  } finally {
    docker('rm', '--force', '--volumes', name);
  }
});

standalone('Linux Node and .NET agree at DST boundaries with German/English globalization', async () => {
  const probe = resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0');

  const result = JSON.parse(
    docker(
      'run',
      '--rm',
      '--network',
      'none',
      '--env',
      'TZ=Europe/Berlin',
      '--entrypoint',
      '/usr/bin/dotnet',
      '--mount',
      `type=bind,source=${probe},target=/probe,readonly`,
      image,
      '/probe/RuntimeChecks.dll',
    ),
  );

  expect(result.timezone).toBe('Europe/Berlin');

  expect(result.samples.map((sample: { local: string }) => sample.local)).toEqual([
    '2026-03-29 01:59:59',
    '2026-03-29 03:00:00',
    '2026-10-25 02:59:59',
    '2026-10-25 02:00:00',
  ]);
  expect(result.samples.map((sample: { offsetMinutes: number }) => sample.offsetMinutes)).toEqual([60, 120, 120, 60]);

  expect(result.englishMonth).toBe('March');
  expect(result.germanMonth).toBe('M\u00e4rz');

  const nodeSamples = JSON.parse(
    docker(
      'run',
      '--rm',
      '--network',
      'none',
      '--env',
      'TZ=Europe/Berlin',
      '--entrypoint',
      '/usr/local/bin/node',
      image,
      '-e',
      `const instants = ${JSON.stringify(result.samples.map((sample: { instant: string }) => sample.instant))};
     const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
     console.log(JSON.stringify(instants.map(instant => { const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map(part => [part.type, part.value])); return parts.year+'-'+parts.month+'-'+parts.day+' '+parts.hour+':'+parts.minute+':'+parts.second; })));`,
    ),
  );

  expect(nodeSamples).toEqual(result.samples.map((sample: { local: string }) => sample.local));
});
