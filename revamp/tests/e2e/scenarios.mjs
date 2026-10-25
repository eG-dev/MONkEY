import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const testsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(testsRoot, '../..');
const fixtureRoot = resolve(testsRoot, 'fixtures/financial-snapshots');
const stateRoot = resolve(repositoryRoot, 'revamp/.local/financial-scenarios');
const owner = createHash('sha256').update(repositoryRoot.toLowerCase()).digest('hex').slice(0, 16);
const ownerLabel = 'org.pocketmonkey.scenario-owner';
const scenarios = new Set(['uninitialized', 'signed-balances', 'retained-history', 'allowance-recovery']);

function docker(...args) {
  return execFileSync('docker', args, { encoding: 'utf8', timeout: 120_000 }).trim();
}

function inspect(kind, name) {
  const result = spawnSync('docker', [kind, 'inspect', name], { encoding: 'utf8', timeout: 30_000 });

  if (result.status === 0) {
    return JSON.parse(result.stdout)[0];
  }

  assert(/no such|not found/i.test(result.stderr), 'Could not inspect scenario storage; refusing to continue.');
  return null;
}

function rejectLinks(path) {
  for (let current = resolve(path); current !== dirname(current); current = dirname(current)) {
    if (existsSync(current)) {
      assert(!lstatSync(current).isSymbolicLink(), 'Scenario paths must not contain links/reparse points.');
    }
  }
}

export async function loadScenario({
  scenario,
  name = 'manual',
  reset = false,
  image = process.env['MONKEY_TEST_IMAGE'] ?? 'pocket-monkey:foundation',
}) {
  assert(scenarios.has(scenario), 'Unknown scenario.');
  assert(/^[a-z][a-z0-9-]{0,30}$/.test(name), 'Scenario instance names must be lowercase letters, digits or hyphens.');
  rejectLinks(fixtureRoot);
  rejectLinks(stateRoot);
  const filename = resolve(fixtureRoot, `${scenario}.json`);
  rejectLinks(filename);
  const fixture = JSON.parse(readFileSync(filename, 'utf8'));
  const container = `pm-scenario-${owner}-${name}`;
  const volume = `${container}-data`;
  const statePath = resolve(stateRoot, name);
  rejectLinks(statePath);
  const label = `${ownerLabel}=${owner}`;
  const existingContainer = inspect('container', container);
  const existingVolume = inspect('volume', volume);

  if (existingContainer) {
    assert.equal(existingContainer.Config.Labels?.[ownerLabel], owner, 'Refusing to reset an unowned container.');
    assert(
      existingContainer.Mounts.every((mount) => mount.Type === 'volume' && mount.Name === volume),
      'Unexpected scenario mounts.',
    );
  }

  if (existingVolume) {
    assert.equal(existingVolume.Labels?.[ownerLabel], owner, 'Refusing to reset an unowned volume.');
    const users = docker('ps', '--all', '--filter', `volume=${volume}`, '--format', '{{.Names}}').split('\n').filter(Boolean);
    assert(
      users.every((user) => user === container),
      'Scenario volume is used by an unrelated container.',
    );
  }

  assert(
    reset || (!existingContainer && !existingVolume),
    'Scenario storage exists. Use --reset to discard only this owned test instance.',
  );
  console.log(`Scenario: ${scenario}; test container: ${container}; disposable volume: ${volume}; reset=${reset}`);

  if (existingContainer) {
    docker('rm', '--force', container);
  }

  if (existingVolume) {
    docker('volume', 'rm', volume);
  }

  docker('volume', 'create', '--label', label, volume);
  const environment = [
    '--env',
    'MONKEY_PUBLIC_URL=https://localhost',
    '--env',
    `TZ=${fixture.timezone}`,
    '--env',
    `MONKEY_CURRENCY=${fixture.currency}`,
    '--env',
    `MONKEY_TRANSACTION_RETENTION_MONTHS=${fixture.transactionRetentionMonths}`,
    '--env',
    'MONKEY_DEFAULT_LOCALE=en-US',
    '--env',
    'MONKEY_EXPORT_PATH=',
  ];
  const volumeMount = `type=volume,source=${volume},target=/data`;
  const credentials = { username: 'manager', password: `Disposable-Aa1-${randomUUID()}` };

  docker(
    'run',
    '--rm',
    '--network',
    'none',
    '--entrypoint',
    'dotnet',
    ...environment,
    '--mount',
    volumeMount,
    '--mount',
    `type=bind,source=${fixtureRoot},target=/fixtures,readonly`,
    image,
    '/app/backend/PocketMonkey.Host.dll',
    'import-financial',
    `/fixtures/${scenario}.json`,
  );
  const bootstrap = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--interactive',
      '--network',
      'none',
      '--entrypoint',
      'dotnet',
      ...environment,
      '--mount',
      volumeMount,
      image,
      '/app/backend/PocketMonkey.Host.dll',
      'bootstrap-manager',
    ],
    { input: `${credentials.username}\n${credentials.password}\n${credentials.password}\n`, encoding: 'utf8', timeout: 120_000 },
  );
  assert.equal(bootstrap.status, 0, 'Disposable manager bootstrap failed. Instance has not been started.');

  mkdirSync(statePath, { recursive: true, mode: 0o700 });
  chmodSync(statePath, 0o700);
  const credentialsPath = resolve(statePath, 'login.json');
  rejectLinks(credentialsPath);
  writeFileSync(credentialsPath, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
  chmodSync(credentialsPath, 0o600);
  docker(
    'run',
    '--detach',
    '--name',
    container,
    '--label',
    label,
    '--publish',
    '127.0.0.1::8080',
    ...environment,
    '--mount',
    volumeMount,
    image,
  );
  const details = inspect('container', container);
  const origin = `http://127.0.0.1:${details.NetworkSettings.Ports['8080/tcp'][0].HostPort}`;

  try {
    const deadline = Date.now() + 60_000;
    let ready = false;

    while (Date.now() < deadline) {
      try {
        ready = (await fetch(`${origin}/health/ready`, { signal: AbortSignal.timeout(2000) })).ok;
      } catch {
        ready = false;
      }

      if (ready) {
        break;
      }

      await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    }

    assert(ready, 'Scenario instance did not become ready.');
  } catch (error) {
    docker('stop', container);
    throw error;
  }

  return { origin, container, volume, credentialsPath };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: { name: { type: 'string', default: 'manual' }, reset: { type: 'boolean', default: false }, json: { type: 'boolean' } },
    });
    assert.equal(positionals.length, 1, 'Usage: node scenarios.mjs <scenario> [--name name] [--reset]');
    const result = await loadScenario({ scenario: positionals[0], name: values.name, reset: values.reset });
    console.log(values.json ? JSON.stringify(result) : `Ready: ${result.origin}\nDisposable login details: ${result.credentialsPath}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
