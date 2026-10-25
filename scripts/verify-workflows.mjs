import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'tests/e2e/package.json'));
const YAML = require('yaml');
const readWorkflow = filename => YAML.parse(fs.readFileSync(path.join(root, '.github/workflows', filename), 'utf8'), { uniqueKeys: true });
const ci = readWorkflow('ci.yml');
const release = readWorkflow('ghcr-prerelease.yml');

function validateWorkflows(verification, publication) {
  assert.deepEqual(verification.permissions, { contents: 'read' });
  assert(!JSON.stringify(verification).includes('secrets.'), 'Verification must remain secret-free');
  assert(!Object.hasOwn(verification.on, 'pull_request_target'), 'Do not verify untrusted code with trusted PR permissions');
  assert(Object.hasOwn(verification.on, 'pull_request'));
  assert(verification.on.push.branches.includes('main'));
  for (const trigger of [verification.on.push, verification.on.pull_request]) {
    assert(!trigger.paths && !trigger['paths-ignore'], 'All contributions must receive verification');
  }
  for (const job of Object.values(verification.jobs)) {
    assert.deepEqual(job.permissions ?? verification.permissions, { contents: 'read' });
  }
  for (const workflow of [verification, publication]) {
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        if (step.uses) assert(/@[a-f0-9]{40}$/.test(step.uses), `Unpinned action: ${step.uses}`);
      }
    }
  }

  assert.deepEqual(Object.keys(publication.on).sort(), ['push', 'workflow_dispatch']);
  assert.deepEqual(publication.on.push.tags, ['v*-*']);
  assert.deepEqual(publication.permissions, { contents: 'read' });
  assert.deepEqual(publication.jobs.identity.permissions ?? publication.permissions, { contents: 'read' });
  assert.equal(publication.concurrency['cancel-in-progress'], false);
  const identity = publication.jobs.identity.steps.map(step => step.run ?? '').join('\n');
  assert(identity.includes('GITHUB_REF_PROTECTED') && identity.includes('merge-base --is-ancestor'));
  const verificationJob = publication.jobs.verify;
  assert.equal(verificationJob.uses, './.github/workflows/ci.yml');
  assert.deepEqual(verificationJob.permissions, { contents: 'read' });
  assert(!verificationJob.secrets);
  assert.equal(verificationJob.with.export_image, true);
  assert.equal(verificationJob.with.release_tag, '${{ github.ref_name }}');
  const publisher = publication.jobs.publish;
  assert(['identity', 'verify', 'draft'].every(dependency => publisher.needs.includes(dependency)));
  assert(!publisher.if || publisher.if.replace(/[${}\s]/g, '') === 'success()');
  assert.equal(publisher.environment.name ?? publisher.environment, 'release');
  assert.deepEqual(publisher.permissions, { actions: 'read', contents: 'write', packages: 'write' });
  assert.deepEqual(publication.jobs.draft.permissions, { contents: 'write' });
  assert(publication.jobs.draft.needs.includes('verify'));
  assert(publisher.steps.every(step => !step.uses), 'Publisher must not check out or execute source actions');
  const scripts = publisher.steps.map(step => step.run ?? '');
  const source = scripts.join('\n');
  const releaseCommand = scripts.find(script => /gh release edit\b/.test(script)) ?? '';
  assert(releaseCommand.includes('--prerelease') && releaseCommand.includes('--latest=false'));
  assert(!/\bdocker\s+(build|buildx)\b/.test(source), 'Publish the tested image without rebuilding');
  for (const evidence of ['required_reviewers', 'GITHUB_RUN_ID', 'sha256sum --check',
    'org.opencontainers.image.revision', 'org.pocketmonkey.build.dirty', '.config.digest']) {
    assert(source.includes(evidence), `Missing publication protection: ${evidence}`);
  }
  const pushes = [...source.matchAll(/^\s*docker\s+push\s+(.+)$/gm)];
  assert(pushes.length > 0);
  assert(pushes.every(match => /^['"]?\$IMAGE:\$VERSION['"]?\s*$/.test(match[1])), 'Pre-releases must push version tags only');
  let previous = -1;
  for (const command of [/gh run download\s+["']?\$GITHUB_RUN_ID/, /docker load\b/, /docker push\b/,
    /docker --config\s+["']?\$anonymous["']?\s+pull\s+["']?\$IMAGE@\$DIGEST/, /gh release edit\b/]) {
    const index = scripts.findIndex(script => command.test(script));
    assert(index > previous, `Missing or premature publication operation: ${command}`);
    previous = index;
  }
}

validateWorkflows(ci, release);
for (const mutate of [
  workflow => { workflow.jobs.verify.permissions.packages = 'write'; },
  workflow => { workflow.jobs.publish.environment.name = 'unprotected'; },
  workflow => { workflow.jobs.publish.needs = ['identity', 'draft']; },
  workflow => { workflow.jobs.publish.steps.push({ run: 'docker build .' }); },
  workflow => { workflow.jobs.publish.steps.push({ run: 'docker push "$IMAGE:latest"' }); },
]) {
  const changed = structuredClone(release);
  mutate(changed);
  assert.throws(() => validateWorkflows(ci, changed), 'Unsafe publication change was accepted');
}
console.log('PASS: read-only verification, pinned actions and protected same-artifact version-only publishing; 5 unsafe changes rejected');

const selector = ci.jobs.verify.steps.find(step => Object.hasOwn(step.env ?? {}, 'FULL_E2E'));
assert(selector && selector.if === undefined, 'Production-image verification must always run');
assert(!selector['continue-on-error'], 'Production-image verification failures must fail the job');
assert.equal(selector.env.FULL_E2E, "${{ contains(github.event.pull_request.labels.*.name, 'full-e2e') }}");
assert.equal(selector.env.EXPORT_IMAGE, '${{ inputs.export_image }}');
assert.equal(selector.env.RELEASE_TAG, '${{ inputs.release_tag }}');
assert(['synchronize', 'labeled', 'unlabeled'].every(activity => ci.on.pull_request.types.includes(activity)));
const bash = process.platform === 'win32'
  ? path.resolve(execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim(), '../../../bin/bash.exe')
  : 'bash';
for (const [event, full, exported, tag, command] of [
  ['pull_request', 'false', 'false', '', 'run test:smoke'],
  ['pull_request', 'true', 'false', '', 'test'],
  ['pull_request', 'false', 'true', '', 'test'],
  ['pull_request', 'false', 'false', 'v0.1.0-beta.1', 'test'],
  ['push', 'false', 'false', '', 'test'],
  ['workflow_dispatch', 'false', 'false', '', 'test'],
  ['workflow_call', 'false', 'false', '', 'test'],
]) {
  const result = spawnSync(bash, ['-e', '-c', `function npm() { printf '%s\\n' "$*"; }\n${selector.run}`], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: event, FULL_E2E: full, EXPORT_IMAGE: exported, RELEASE_TAG: tag },
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  assert.equal(result.stdout.trim(), `--prefix tests/e2e ${command}`, `Incorrect verification tier for ${event}`);
}
console.log('PASS: actual smoke/full shell selection for 7 PR, main, manual and release/export contexts');

const pushScript = release.jobs.publish.steps.find(step => step.id === 'push').run;
const manifestFunctions = pushScript.slice(pushScript.indexOf('accept='), pushScript.indexOf('status=$(manifest)'));
assert(manifestFunctions.includes('verify_manifest()'));
const configDigest = `sha256:${'1'.repeat(64)}`;
const indexDigest = `sha256:${'2'.repeat(64)}`;
const runtimeDigest = `sha256:${'3'.repeat(64)}`;
const otherDigest = `sha256:${'4'.repeat(64)}`;
const runtime = { config: { digest: configDigest } };
const platform = { digest: runtimeDigest, platform: { os: 'linux', architecture: 'amd64' } };
const index = { manifests: [platform, { platform: { os: 'unknown', architecture: 'unknown' } }] };
const manifestCases = [
  ['index with attestation', index, indexDigest, indexDigest, runtime, '200', true],
  ['different index with identical runtime', index, otherDigest, indexDigest, runtime, '200', false],
  ['ambiguous runtime', { manifests: [platform, platform] }, indexDigest, indexDigest, runtime, '200', false],
  ['missing runtime', { manifests: [] }, indexDigest, indexDigest, runtime, '200', false],
  ['missing runtime response', index, indexDigest, indexDigest, runtime, '404', false],
  ['invalid runtime config', index, indexDigest, indexDigest, { config: { digest: 'invalid' } }, '200', false],
  ['classic config identity', runtime, runtimeDigest, configDigest, runtime, '200', true],
  ['single manifest identity', runtime, runtimeDigest, runtimeDigest, runtime, '200', true],
  ['different classic config', runtime, runtimeDigest, otherDigest, runtime, '200', false],
];
const fixtureRoot = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-manifests-'));
try {
  for (const [name, top, topDigest, expected, child, childStatus, succeeds] of manifestCases) {
    fs.writeFileSync(path.join(fixtureRoot, 'top.json'), JSON.stringify(top));
    fs.writeFileSync(path.join(fixtureRoot, 'child.json'), JSON.stringify(child));
    const script = `
      function jq() { "$JQ_EXECUTABLE" "$@"; }
      function curl() {
        local output headers url
        while test "$#" -gt 0; do
          case "$1" in
            --output) output=$2; shift 2 ;;
            --dump-header) headers=$2; shift 2 ;;
            --write-out|--header) shift 2 ;;
            *) url=$1; shift ;;
          esac
        done
        if test "\${url##*/}" = "$VERSION"; then
          cp top.json "$output"
          printf 'Docker-Content-Digest: %s\\r\\n' "$TOP_DIGEST" > "$headers"
          printf 200
        else
          cp child.json "$output"
          printf 'Docker-Content-Digest: %s\\r\\n' "$RUNTIME_DIGEST" > "$headers"
          printf '%s' "$CHILD_STATUS"
        fi
      }
      ${manifestFunctions}
      test "$(manifest)" = 200
      verify_manifest
      test "$config_digest" = "$EXPECTED_CONFIG"
      test "$registry_digest" = "$TOP_DIGEST"
      test "$(tr -d '\\r' < manifest.headers | awk '{ print $2 }')" = "$TOP_DIGEST"
    `;
    const result = spawnSync(bash, ['-e', '-o', 'pipefail', '-c', script], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      env: { ...process.env, JQ_EXECUTABLE: process.env.JQ_EXECUTABLE ?? 'jq', VERSION: 'test-version',
        package: 'owner/package', registry_token: 'fixture', expected_id: expected,
        TOP_DIGEST: topDigest, RUNTIME_DIGEST: runtimeDigest, CHILD_STATUS: childStatus, EXPECTED_CONFIG: configDigest },
    });
    assert.ifError(result.error);
    if (succeeds) assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    else assert.notEqual(result.status, 0, `${name} unexpectedly passed`);
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}
console.log(`PASS: actual registry verifier for ${manifestCases.length} index, classic, mismatch and malformed-manifest cases (jq required; JQ_EXECUTABLE overrides its path)`);