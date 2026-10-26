import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { developmentEnvironment } from '../web/scripts/dev-environment.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bash = process.platform === 'win32'
  ? path.resolve(execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim(), '../../../bin/bash.exe') : 'bash';
const fixture = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-codespaces-check-'));
let checks = 0;
const check = (name, run) => { run(); checks++; console.log(`PASS: ${name}`); };
try {
  for (const [profile, port] of [['image-testing', 8080], ['development', 4180]]) {
    check(`${profile}: manual startup, selected port, no backend forwarding and no fixed machine size`, () => {
      const config = JSON.parse(fs.readFileSync(path.join(root, `.devcontainer/${profile}/devcontainer.json`), 'utf8'));
      assert.deepEqual(config.forwardPorts, [port]);
      assert.equal(config.otherPortsAttributes.onAutoForward, 'ignore');
      assert(!config.postStartCommand);
      assert(!config.hostRequirements);
      assert.equal(config.remoteUser, 'vscode');
      assert.deepEqual(config.containerEnv, { TZ: 'Europe/Berlin', MONKEY_DEFAULT_LOCALE: 'de-DE', MONKEY_CURRENCY: 'EUR' });
      assert.deepEqual(config.postCreateCommand, ['bash', '.devcontainer/setup.sh', profile]);
      if (profile === 'development') {
        assert.equal(config.features['ghcr.io/devcontainers/features/dotnet:2'].version,
          JSON.parse(fs.readFileSync(path.join(root, 'global.json'), 'utf8')).sdk.version);
        assert.equal(config.features['ghcr.io/devcontainers/features/node:2'].npmVersion,
          JSON.parse(fs.readFileSync(path.join(root, 'web/package.json'), 'utf8')).packageManager.slice(4));
      }
    });
  }
  check('local development retains origin and data path', () => {
    const config = developmentEnvironment({ root, webPort: 4180, backendPort: 5180, environment: {} });
    assert.equal(config.MONKEY_PUBLIC_URL, 'http://127.0.0.1:4180');
    assert.equal(config.MONKEY_DATA_PATH, path.join(root, '.local/dev'));
  });
  check('Codespaces development uses exact HTTPS/Vite host, loopback backend and isolated data', () => {
    const config = developmentEnvironment({ root, webPort: 4180, backendPort: 5180,
      environment: { CODESPACES: 'true', CODESPACE_NAME: 'example-space', GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev' } });
    assert.equal(config.MONKEY_PUBLIC_URL, 'https://example-space-4180.app.github.dev');
    assert.equal(config.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS, 'example-space-4180.app.github.dev');
    assert.equal(config.MONKEY_BACKEND_URL, 'http://127.0.0.1:5180');
    assert.equal(config.MONKEY_TRUSTED_PROXIES, '');
    assert.equal(config.MONKEY_DATA_PATH, path.join(root, '.local/codespaces/development'));
    assert.throws(() => developmentEnvironment({ root, webPort: 4180, backendPort: 5180,
      environment: { CODESPACES: 'true', CODESPACE_NAME: '../../invalid' } }), /Codespaces requires/);
  });
  for (const filename of ['setup.sh', 'image-testing/manage.sh']) {
    const source = fs.readFileSync(path.join(root, '.devcontainer', filename), 'utf8');
    assert(!source.includes('\r'), 'Bash files require LF bytes');
    execFileSync(bash, ['-n', path.join(root, '.devcontainer', filename)]);
  }
  fs.mkdirSync(path.join(fixture, '.devcontainer/image-testing'), { recursive: true });
  fs.copyFileSync(path.join(root, '.devcontainer/image-testing/manage.sh'), path.join(fixture, '.devcontainer/image-testing/manage.sh'));
  const assets = path.join(fixture, 'assets');
  fs.mkdirSync(assets);
  const identity = { version: '0.1.0-beta.2', revision: 'a'.repeat(40), os: 'linux', architecture: 'amd64',
    image: `ghcr.io/eg-dev/monkey@sha256:${'b'.repeat(64)}` };
  for (const filename of ['deployment.tar.gz', 'image.json', 'build-info.json']) fs.writeFileSync(path.join(assets, filename), '{}\n');
  fs.writeFileSync(path.join(assets, 'release-identity.json'), JSON.stringify(identity));
  fs.writeFileSync(path.join(assets, 'SHA256SUMS'), fs.readdirSync(assets).map(filename =>
    `${createHash('sha256').update(fs.readFileSync(path.join(assets, filename))).digest('hex')}  ${filename}\n`).join(''));
  const calls = path.join(fixture, 'calls');
  const run = args => spawnSync(bash, ['-e', '-o', 'pipefail', '-c', `
    function jq() { command "$JQ_EXECUTABLE" "$@"; }
    function gh() {
      if test "$2" = view; then printf '{"isDraft":false,"tagName":"v0.1.0-beta.2"}'; return; fi
      local directory
      while test "$#" -gt 0; do
        if test "$1" = --dir; then directory=$2; shift 2; else shift; fi
      done
      cp "$ASSETS/"* "$directory/"
    }
    function docker() { printf '%s\\n' "$*" >> "$CALLS"; }
    source .devcontainer/image-testing/manage.sh ${args}
  `], { cwd: fixture, encoding: 'utf8', env: { ...process.env, ASSETS: assets.replaceAll('\\', '/'), CALLS: calls.replaceAll('\\', '/'),
    JQ_EXECUTABLE: process.env.JQ_EXECUTABLE ?? 'jq', CODESPACE_NAME: 'example-space', GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev' } });
  check('image start requires an explicit release and reset requires confirmation', () => {
    assert.notEqual(run('start latest').status, 0);
    assert.notEqual(run('reset').status, 0);
    assert(!fs.existsSync(calls));
  });
  const configuration = path.join(fixture, '.local/codespaces/image-testing/compose.yaml');
  check('actual image script verifies release checksums and generates a digest-only Compose instance', () => {
    const result = run('start 0.1.0-beta.2');
    assert.equal(result.status, 0, result.stderr);
    const compose = JSON.parse(fs.readFileSync(configuration, 'utf8'));
    assert.equal(compose.name, 'pocket-monkey-codespaces-image');
    assert.equal(compose.services.app.image, identity.image);
    assert.equal(compose.services.app.environment.MONKEY_PUBLIC_URL, 'https://example-space-8080.app.github.dev');
    assert.equal(compose.services.app.environment.MONKEY_DEFAULT_LOCALE, 'de-DE');
    assert.deepEqual(compose.services.app.volumes, ['monkey-data:/data']);
    assert(!compose.services.app.build);
    assert(fs.readFileSync(calls, 'utf8').includes('up -d --no-build'));
    assert(fs.readFileSync(calls, 'utf8').includes('--project-name pocket-monkey-codespaces-image'));
  });
  check('repeated image start preserves operator settings and the data volume', () => {
    const compose = JSON.parse(fs.readFileSync(configuration, 'utf8'));
    compose.services.app.environment.MONKEY_TRANSACTION_RETENTION_MONTHS = '0';
    fs.writeFileSync(configuration, JSON.stringify(compose));
    const result = run('start 0.1.0-beta.2');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(fs.readFileSync(configuration, 'utf8')).services.app.environment.MONKEY_TRANSACTION_RETENTION_MONTHS, '0');
  });
  check('corrupt cached release fails before Docker runs', () => {
    const before = fs.readFileSync(calls, 'utf8');
    fs.writeFileSync(path.join(fixture, '.local/codespaces/image-testing/releases/0.1.0-beta.2/release-identity.json'), '{}');
    assert.notEqual(run('start 0.1.0-beta.2').status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
  });
  console.log(`PASS: ${checks} Codespaces profile, environment and actual shell safety checks; Docker and GitHub calls stubbed`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}