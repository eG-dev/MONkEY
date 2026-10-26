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
  const candidate = path.join(fixture, 'candidate');
  fs.mkdirSync(candidate);
  const runMetadata = { id: 123, head_sha: identity.revision, head_repository: { full_name: 'eG-dev/MONkEY' },
    path: '.github/workflows/ghcr-prerelease.yml', event: 'push', run_attempt: 1, run_started_at: '2026-10-26T10:00:00Z' };
  const jobs = [{ jobs: [{ name: 'verify / verify', run_attempt: 1, conclusion: 'success' }] }];
  const artifact = { id: 456, name: 'verified-image', expired: false, created_at: '2026-10-26T10:10:00Z',
    workflow_run: { id: 123, head_sha: identity.revision } };
  const image = [{ Id: `sha256:${'c'.repeat(64)}`, Os: 'linux', Architecture: 'amd64', Config: { Labels: {
    'org.opencontainers.image.version': identity.version, 'org.opencontainers.image.revision': identity.revision,
    'org.opencontainers.image.source': 'https://github.com/eG-dev/MONkEY',
    'org.pocketmonkey.build.kind': 'release', 'org.pocketmonkey.build.dirty': 'false',
  } } }];
  const writeMetadata = (runValue = runMetadata, jobsValue = jobs, artifactsValue = [{ artifacts: [artifact] }]) => {
    fs.writeFileSync(path.join(fixture, 'run.json'), JSON.stringify(runValue));
    fs.writeFileSync(path.join(fixture, 'jobs.json'), JSON.stringify(jobsValue));
    fs.writeFileSync(path.join(fixture, 'artifacts.json'), JSON.stringify(artifactsValue));
  };
  const writeCandidate = (buildOverrides = {}, imageValue = image) => {
    for (const filename of ['verified-image.tar.gz', 'compose.yaml', 'compose.exports.yaml', 'deployment.json']) {
      fs.writeFileSync(path.join(candidate, filename), '{}\n');
    }
    fs.writeFileSync(path.join(candidate, 'image.json'), JSON.stringify(imageValue));
    fs.writeFileSync(path.join(candidate, 'build-info.json'), JSON.stringify({ version: identity.version,
      revision: identity.revision, kind: 'release', dirty: false, repositoryUrl: 'https://github.com/eG-dev/MONkEY',
      releaseTag: `v${identity.version}`, ...buildOverrides }));
    const filenames = fs.readdirSync(candidate).filter(filename => filename !== 'SHA256SUMS');
    fs.writeFileSync(path.join(candidate, 'SHA256SUMS'), filenames.map(filename =>
      `${createHash('sha256').update(fs.readFileSync(path.join(candidate, filename))).digest('hex')}  ${filename}\n`).join(''));
  };
  writeMetadata();
  writeCandidate();
  const calls = path.join(fixture, 'calls');
  const run = (args, environment = {}) => spawnSync(bash, ['-e', '-o', 'pipefail', '-c', `
    function jq() { command "$JQ_EXECUTABLE" "$@"; }
    run_reads=0
    function gh() {
      if test "$1" = api; then
        case "$*" in
          */attempts/*) cat jobs.json ;;
          */artifacts*) cat artifacts.json ;;
          *)
            run_reads=$((run_reads + 1))
            if test "$run_reads" -gt 1; then cat "\${CURRENT_RUN_FILE:-run.json}"; else cat run.json; fi
            ;;
        esac
        return
      fi
      if test "$2" = view; then printf '{"isDraft":false,"tagName":"v0.1.0-beta.2"}'; return; fi
      local directory
      local source="$ASSETS"
      if test "$1" = run; then source="$CANDIDATE"; fi
      while test "$#" -gt 0; do
        if test "$1" = --dir; then directory=$2; shift 2; else shift; fi
      done
      cp "$source/"* "$directory/"
    }
    function docker() {
      printf '%s\\n' "$*" >> "$CALLS"
      if test "$1 $2" = 'image inspect'; then cat "$LOADED_IMAGE"; fi
    }
    source .devcontainer/image-testing/manage.sh ${args}
  `], { cwd: fixture, encoding: 'utf8', env: { ...process.env, ASSETS: assets.replaceAll('\\', '/'), CALLS: calls.replaceAll('\\', '/'),
    CANDIDATE: candidate.replaceAll('\\', '/'), LOADED_IMAGE: path.join(candidate, 'image.json').replaceAll('\\', '/'),
    JQ_EXECUTABLE: process.env.JQ_EXECUTABLE ?? 'jq', CODESPACE_NAME: 'example-space',
    GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev', ...environment } });
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
  const candidateCommand = `candidate 123 ${identity.revision}`;
  check('candidate requires an explicit run and full expected revision', () => {
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run('candidate latest').status, 0);
    assert.notEqual(run('candidate 123 abc123').status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
  });
  check('candidate loads the verified artifact by immutable identity without registry pulls or builds', () => {
    const before = fs.readFileSync(calls, 'utf8').length;
    const result = run(candidateCommand);
    assert.equal(result.status, 0, result.stderr);
    const compose = JSON.parse(fs.readFileSync(configuration, 'utf8'));
    assert.equal(compose.services.app.image, image[0].Id);
    assert.equal(compose.services.app.pull_policy, 'never');
    assert.equal(compose.services.app.environment.MONKEY_TRANSACTION_RETENTION_MONTHS, '0');
    assert.deepEqual(compose.services.app.volumes, ['monkey-data:/data']);
    const dockerCalls = fs.readFileSync(calls, 'utf8').slice(before);
    assert(dockerCalls.includes('load --input'));
    assert(dockerCalls.includes('up -d --no-build --pull never'));
    assert(!dockerCalls.split('\n').some(line => line.endsWith(' pull')));
    assert(!dockerCalls.split('\n').some(line => line.includes(' build ')));
    const review = JSON.parse(fs.readFileSync(path.join(fixture, '.local/codespaces/image-testing/candidate-review.json'), 'utf8'));
    assert.deepEqual(review, { run: 123, attempt: 1, artifactId: 456, revision: identity.revision, image: image[0].Id, version: identity.version });
  });
  for (const [name, metadata] of [
    ['wrong source', { ...runMetadata, head_sha: 'd'.repeat(40) }],
    ['fork source', { ...runMetadata, head_repository: { full_name: 'someone/MONkEY' } }],
    ['wrong workflow', { ...runMetadata, path: '.github/workflows/ci.yml' }],
    ['PR event', { ...runMetadata, event: 'pull_request' }],
    ['new attempt without matching verification', { ...runMetadata, run_attempt: 2 }],
  ]) {
    check(`candidate rejects ${name} before Docker runs`, () => {
      writeMetadata(metadata);
      const before = fs.readFileSync(calls, 'utf8');
      assert.notEqual(run(candidateCommand).status, 0);
      assert.equal(fs.readFileSync(calls, 'utf8'), before);
      writeMetadata();
    });
  }
  check('candidate rejects failed verification before Docker runs', () => {
    writeMetadata(runMetadata, [{ jobs: [{ ...jobs[0].jobs[0], conclusion: 'failure' }] }]);
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run(candidateCommand).status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
    writeMetadata();
  });
  for (const [name, artifactsValue] of [
    ['missing artifact', []], ['ambiguous artifact', [artifact, artifact]],
    ['expired artifact', [{ ...artifact, expired: true }]],
    ['previous-attempt artifact', [{ ...artifact, created_at: '2026-10-26T09:00:00Z' }]],
    ['mismatched artifact revision', [{ ...artifact, workflow_run: { id: 123, head_sha: 'd'.repeat(40) } }]],
  ]) {
    check(`candidate rejects ${name} before Docker runs`, () => {
      writeMetadata(runMetadata, jobs, [{ artifacts: artifactsValue }]);
      const before = fs.readFileSync(calls, 'utf8');
      assert.notEqual(run(candidateCommand).status, 0);
      assert.equal(fs.readFileSync(calls, 'utf8'), before);
      writeMetadata();
    });
  }
  for (const [name, overrides] of [
    ['dirty build', { dirty: true }], ['development build', { kind: 'development' }],
    ['mismatched build revision', { revision: 'd'.repeat(40) }],
  ]) {
    check(`candidate rejects ${name} before Docker runs`, () => {
      writeCandidate(overrides);
      const before = fs.readFileSync(calls, 'utf8');
      assert.notEqual(run(candidateCommand).status, 0);
      assert.equal(fs.readFileSync(calls, 'utf8'), before);
      writeCandidate();
    });
  }
  check('candidate rejects archive tampering before Docker runs', () => {
    fs.appendFileSync(path.join(candidate, 'verified-image.tar.gz'), 'tampered');
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run(candidateCommand).status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
    writeCandidate();
  });
  check('candidate rejects loaded identity mismatch before changing Compose or starting containers', () => {
    const wrongImage = path.join(fixture, 'wrong-image.json');
    fs.writeFileSync(wrongImage, JSON.stringify([{ ...image[0], Id: `sha256:${'d'.repeat(64)}` }]));
    const before = fs.readFileSync(calls, 'utf8').length;
    const original = fs.readFileSync(configuration, 'utf8');
    assert.notEqual(run(candidateCommand, { LOADED_IMAGE: wrongImage.replaceAll('\\', '/') }).status, 0);
    assert.equal(fs.readFileSync(configuration, 'utf8'), original);
    assert(!fs.readFileSync(calls, 'utf8').slice(before).includes(' up '));
  });
  check('candidate rejects unexpected checksum paths before Docker runs', () => {
    fs.appendFileSync(path.join(candidate, 'SHA256SUMS'), `${'0'.repeat(64)}  ../outside\n`);
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run(candidateCommand).status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
    writeCandidate();
  });
  check('candidate rejects another image platform before Docker runs', () => {
    writeCandidate({}, [{ ...image[0], Architecture: 'arm64' }]);
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run(candidateCommand).status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
    writeCandidate();
  });
  check('candidate rejects a run restarted during download before Docker runs', () => {
    const current = path.join(fixture, 'current-run.json');
    fs.writeFileSync(current, JSON.stringify({ ...runMetadata, run_attempt: 2 }));
    const before = fs.readFileSync(calls, 'utf8');
    assert.notEqual(run(candidateCommand, { CURRENT_RUN_FILE: current.replaceAll('\\', '/') }).status, 0);
    assert.equal(fs.readFileSync(calls, 'utf8'), before);
  });
  check('published release can resume after candidate review without a stale no-pull policy or review record', () => {
    const cached = path.join(fixture, '.local/codespaces/image-testing/releases/0.1.0-beta.2/release-identity.json');
    fs.copyFileSync(path.join(assets, 'release-identity.json'), cached);
    const before = fs.readFileSync(calls, 'utf8').length;
    const result = run('start 0.1.0-beta.2');
    assert.equal(result.status, 0, result.stderr);
    const compose = JSON.parse(fs.readFileSync(configuration, 'utf8'));
    assert.equal(compose.services.app.image, identity.image);
    assert.equal(compose.services.app.pull_policy, undefined);
    assert.equal(compose.services.app.environment.MONKEY_TRANSACTION_RETENTION_MONTHS, '0');
    assert(fs.readFileSync(calls, 'utf8').slice(before).split('\n').some(line => line.endsWith(' pull')));
    assert(!fs.existsSync(path.join(fixture, '.local/codespaces/image-testing/candidate-review.json')));
  });
  console.log(`PASS: ${checks} Codespaces profile, environment and actual shell safety checks; Docker and GitHub calls stubbed`);
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}