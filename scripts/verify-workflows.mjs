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
const wikiPublish = readWorkflow('wiki-publish.yml');

function validateWikiWorkflow(workflow) {
  assert.deepEqual(Object.keys(workflow.on).sort(), ['push', 'workflow_dispatch']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  for (const required of ['docs/wiki/**', 'scripts/wiki.mjs', 'scripts/check-wiki.mjs', 'tests/e2e/package-lock.json', '.github/workflows/wiki-publish.yml']) {
    assert(workflow.on.push.paths.includes(required), `Missing Wiki publication trigger: ${required}`);
  }
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.deepEqual(Object.keys(workflow.jobs), ['publish']);
  const job = workflow.jobs.publish;
  assert.equal(job.if, "github.ref == 'refs/heads/main' && github.repository == 'eG-dev/MONkEY'");
  assert.deepEqual(job.permissions ?? workflow.permissions, { contents: 'read' });
  assert(!job.env, 'No job-wide credentials');
  const steps = job.steps;
  const checkout = steps.find(step => step.uses?.startsWith('actions/checkout@'));
  assert.equal(checkout.with['persist-credentials'], false);
  assert.equal(checkout.with['fetch-depth'], 0);
  for (const step of steps) {
    assert(!step.if && !step['continue-on-error'], 'Wiki checks must not be bypassed');
    if (step.uses) assert(/@[a-f0-9]{40}$/.test(step.uses), 'Wiki actions must be pinned');
  }
  const credentialSteps = steps.filter(step => JSON.stringify(step).includes('secrets.'));
  assert.equal(credentialSteps.length, 1);
  const publisher = credentialSteps[0];
  assert.deepEqual(publisher.env, { WIKI_PUBLISH_TOKEN: '${{ secrets.WIKI_PUBLISH_TOKEN }}' });
  assert.equal(steps.indexOf(publisher), steps.length - 1);
  assert(publisher.run.includes('git ls-remote --exit-code origin refs/heads/main'));
  assert(publisher.run.includes('"$current" != "$GITHUB_SHA"'));
  assert(publisher.run.includes('node scripts/wiki.mjs --publish'));
  assert(!publisher.run.includes('set -x'));
  const validation = steps.slice(0, -1).map(step => step.run ?? '').join('\n');
  for (const command of ['npm --prefix tests/e2e ci --ignore-scripts', 'node scripts/check-wiki.mjs',
    'node scripts/check-docs.mjs', 'node scripts/verify-workflows.mjs', 'node scripts/wiki.mjs']) {
    assert(validation.includes(command), `Missing pre-publication check: ${command}`);
  }
  assert(!validation.includes('--publish'));
}

validateWikiWorkflow(wikiPublish);
for (const mutate of [
  workflow => { workflow.permissions.packages = 'write'; },
  workflow => { workflow.on.pull_request_target = {}; },
  workflow => { workflow.jobs.publish.if = "github.ref == 'refs/heads/main'"; },
  workflow => { workflow.jobs.publish.steps[0].env = { TOKEN: '${{ secrets.WIKI_PUBLISH_TOKEN }}' }; },
  workflow => { workflow.jobs.publish.steps[3]['continue-on-error'] = true; },
]) {
  const changed = structuredClone(wikiPublish);
  mutate(changed);
  assert.throws(() => validateWikiWorkflow(changed), 'Unsafe Wiki publication change was accepted');
}
assert(ci.jobs.repository.steps.some(step => step.run === 'node scripts/check-wiki.mjs'));
console.log('PASS: validated main-only Wiki publication, isolated credential step and read-only PR checks; 5 unsafe changes rejected');

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
    assert(!job.if && !job['continue-on-error'], 'Verification jobs must not bypass failures');
  }
  assert.deepEqual(Object.keys(verification.jobs).sort(), ['builds', 'image', 'repository']);
  const repository = verification.jobs.repository;
  const builds = verification.jobs.builds;
  const image = verification.jobs.image;
  assert(!repository.needs && !builds.needs, 'Repository checks and application builds must run independently');
  assert.deepEqual([...image.needs].sort(), ['builds', 'repository'], 'Image verification must wait for both checks');
  for (const [job, commands] of [
    [repository, ['npm --prefix web run check:about', 'node scripts/verify-workflows.mjs',
      'node scripts/verify-migrations.mjs', 'node scripts/check-wiki.mjs', 'node scripts/check-docs.mjs',
      'npm --prefix web run check:catalogs', 'npm --prefix web audit --audit-level=high',
      'npm --prefix tests/e2e audit --audit-level=high']],
    [builds, ['dotnet build PocketMonkey.slnx --configuration Release -p:RestoreLockedMode=true',
      'npm --prefix web run build', 'npm --prefix tests/e2e run check']],
  ]) {
    for (const command of commands) {
      const step = job.steps.find(item => item.run?.includes(command));
      assert(step && !step.if && !step['continue-on-error'], `Missing required check: ${command}`);
    }
  }
  const imageSdk = image.steps.findIndex(step => step.uses?.startsWith('actions/setup-dotnet@'));
  const runtimeChecks = image.steps.findIndex(step =>
    step.run === 'dotnet build tests/integration/RuntimeChecks/RuntimeChecks.csproj --configuration Release -p:RestoreLockedMode=true');
  const imageBuild = image.steps.findIndex(step => step.run?.includes('npm --prefix web run build:image'));
  const imageTest = image.steps.findIndex(step => Object.hasOwn(step.env ?? {}, 'FULL_E2E'));
  const imageExport = image.steps.findIndex(step => step.run?.includes('docker save'));
  const artifactIndex = image.steps.findIndex(step => step.with?.name === 'verified-image');
  const artifact = image.steps[artifactIndex];
  assert(imageSdk >= 0 && runtimeChecks > imageSdk && runtimeChecks < imageTest,
    'Build the runtime checks on the image runner before testing');
  assert.equal(image.steps[imageSdk].with?.['global-json-file'], 'global.json');
  assert(!image.steps[imageSdk].if && !image.steps[imageSdk]['continue-on-error']);
  assert(!image.steps[runtimeChecks].if && !image.steps[runtimeChecks]['continue-on-error']);
  assert(imageBuild >= 0 && imageTest > imageBuild && imageExport > imageTest, 'Build and test the image before exporting it');
  assert(artifactIndex > imageExport, 'Upload the artifact only after exporting it');
  assert(!image.steps[imageBuild].if && !image.steps[imageBuild]['continue-on-error']);
  assert(!image.steps[imageTest].if && !image.steps[imageTest]['continue-on-error']);
  assert.equal(image.steps[imageExport].if, '${{ inputs.export_image }}');
  assert(!image.steps[imageExport]['continue-on-error']);
  assert.equal(artifact?.if, '${{ success() && inputs.export_image }}');
  assert.equal(artifact.with['if-no-files-found'], 'error');
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
for (const mutate of [
  workflow => { workflow.jobs.image.needs = ['builds']; },
  workflow => { workflow.jobs.builds.if = '${{ false }}'; },
  workflow => { workflow.jobs.repository.steps.find(step => step.run?.includes('check:catalogs'))['continue-on-error'] = true; },
  workflow => { workflow.jobs.image.steps.find(step => step.run?.includes('docker save')).if = '${{ always() }}'; },
  workflow => { workflow.jobs.image.steps = workflow.jobs.image.steps.filter(step => !step.run?.includes('RuntimeChecks.csproj')); },
]) {
  const changed = structuredClone(ci);
  mutate(changed);
  assert.throws(() => validateWorkflows(changed, release), 'Unsafe CI split was accepted');
}
console.log('PASS: read-only verification, pinned actions and protected same-artifact version-only publishing; 5 unsafe changes rejected');
console.log('PASS: parallel checks and builds gate image testing and export; 5 unsafe CI changes rejected');

const selector = ci.jobs.image.steps.find(step => Object.hasOwn(step.env ?? {}, 'FULL_E2E'));
assert(selector && selector.if === undefined, 'Production-image verification must always run');
assert(!selector['continue-on-error'], 'Production-image verification failures must fail the job');
assert.equal(selector.env.FULL_E2E, "${{ contains(github.event.pull_request.labels.*.name, 'full-e2e') }}");
assert.equal(selector.env.EXPORT_IMAGE, '${{ inputs.export_image }}');
assert.equal(selector.env.RELEASE_TAG, '${{ inputs.release_tag }}');
assert(['synchronize', 'labeled', 'unlabeled'].every(activity => ci.on.pull_request.types.includes(activity)));
const bash = process.platform === 'win32'
  ? path.resolve(execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim(), '../../../bin/bash.exe')
  : 'bash';

const reviewStep = release.jobs.draft.steps.find(step => step.id === 'candidate_review');
assert(reviewStep, 'Missing pre-approval candidate review summary');
assert(release.jobs.draft.needs.includes('verify'));
assert(!release.jobs.draft.environment, 'The candidate instructions must be available before environment approval');
assert(!release.jobs.draft.env.GH_TOKEN, 'Keep draft credentials scoped to release metadata preparation');
assert(!reviewStep.env && !reviewStep.if && !reviewStep['continue-on-error']);
const reviewFixture = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-candidate-summary-'));
try {
  const summaryPath = path.join(reviewFixture, 'summary.md');
  const revision = 'a'.repeat(40);
  const result = spawnSync(bash, ['-e', '-o', 'pipefail', '-c',
    'function gh() { return 99; }\nfunction docker() { return 99; }\n' + reviewStep.run], {
    cwd: reviewFixture,
    encoding: 'utf8',
    env: { ...process.env, GH_REPO: 'eG-dev/MONkEY', RELEASE_TAG: 'v0.1.0-beta.3', VERSION: '0.1.0-beta.3',
      REVISION: revision, GITHUB_RUN_ID: '123456', GITHUB_RUN_ATTEMPT: '2', GITHUB_STEP_SUMMARY: summaryPath },
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const summary = fs.readFileSync(summaryPath, 'utf8');
  assert(summary.includes('https://github.com/eG-dev/MONkEY/actions/runs/123456'));
  assert(summary.includes('(attempt 2)'));
  assert(summary.includes('Version: 0.1.0-beta.3'));
  assert(summary.includes(`Source: \`${revision}\``));
  assert(summary.includes(`https://github.com/eG-dev/MONkEY/blob/${revision}/docs/wiki/Builds-and-Releases.md#review-before-approval`));
  assert(summary.includes('verified-image') && summary.includes('A rerun or changed artifact requires fresh review.'));
} finally {
  fs.rmSync(reviewFixture, { recursive: true, force: true });
}
console.log('PASS: actual pre-approval summary identifies the candidate run, attempt, source and review guidance without lifecycle calls');

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
      function jq() { command "$JQ_EXECUTABLE" "$@"; }
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

const deploymentFixture = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-deployment-'));
try {
  const compose = YAML.parse(fs.readFileSync(path.join(root, 'deploy/compose.yaml'), 'utf8'));
  delete compose.services.app.build;
  for (const value of Object.values(compose.services.app.environment)) {
    assert.equal(typeof value, 'string');
    assert(!value.includes('${'), 'Default deployment settings must be directly editable');
  }
  const assets = release.jobs.publish.steps.find(step => step.id === 'assets').run;
  const boundary = assets.indexOf('cp verified/image.json verified/build-info.json ./');
  assert(boundary > 0, 'Missing release deployment guide');
  assert(!assets.includes('compose.env'), 'Release bundles must not require an environment file');
  fs.mkdirSync(path.join(deploymentFixture, 'verified'));
  fs.writeFileSync(path.join(deploymentFixture, 'verified/deployment.json'), JSON.stringify(compose));
  fs.copyFileSync(path.join(root, 'deploy/compose.exports.yaml'), path.join(deploymentFixture, 'verified/compose.exports.yaml'));
  fs.copyFileSync(path.join(root, 'docs/wiki/Release-Deployment.md'), path.join(deploymentFixture, 'verified/DEPLOYMENT.md'));
  const result = spawnSync(bash, ['-e', '-o', 'pipefail', '-c',
    'function jq() { command "$JQ_EXECUTABLE" "$@"; }\n' + assets.slice(0, boundary)], {
    cwd: deploymentFixture, encoding: 'utf8', env: { ...process.env, IMAGE: 'ghcr.io/eg-dev/monkey',
      DIGEST: indexDigest, GH_REPO: 'eG-dev/MONkEY', REVISION: 'a'.repeat(40),
      JQ_EXECUTABLE: process.env.JQ_EXECUTABLE ?? 'jq' },
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const generated = YAML.parse(fs.readFileSync(path.join(deploymentFixture, 'bundle/compose.yaml'), 'utf8'));
  assert.equal(generated.name, 'pocket-monkey');
  assert.equal(generated.services.app.image, `ghcr.io/eg-dev/monkey@${indexDigest}`);
  assert(!generated.services.app.build);
  assert.deepEqual(generated.services.app.environment, compose.services.app.environment);
  assert.deepEqual(generated.services.app.volumes, ['monkey-data:/data']);
  assert.deepEqual(Object.keys(generated.volumes), ['monkey-data']);
  const exports = YAML.parse(fs.readFileSync(path.join(deploymentFixture, 'bundle/compose.exports.yaml'), 'utf8'));
  assert.equal(exports.services.app.environment.MONKEY_EXPORT_KEEP_COUNT, '30');
  assert.equal(exports.services.app.volumes[0].source, '/srv/pocket-monkey/exports');
  assert.equal(exports.services.app.volumes[0].bind.create_host_path, false);
  assert(!fs.existsSync(path.join(deploymentFixture, 'bundle/compose.env.example')));
  const guide = fs.readFileSync(path.join(deploymentFixture, 'bundle/DEPLOYMENT.md'), 'utf8');
  assert(guide.startsWith(fs.readFileSync(path.join(root, 'docs/wiki/Release-Deployment.md'), 'utf8')));
  for (const page of ['Getting-Started.md', 'Backup-Restore-and-Upgrades.md']) {
    assert(guide.includes(`https://github.com/eG-dev/MONkEY/blob/${'a'.repeat(40)}/docs/wiki/${page}`));
  }
} finally {
  fs.rmSync(deploymentFixture, { recursive: true, force: true });
}
console.log('PASS: actual release bundle generator preserves direct settings, digest pin, stable project/data volume and private export mount without an environment file');

const exportFixture = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-artifact-export-'));
try {
  fs.mkdirSync(path.join(exportFixture, 'deploy'));
  fs.mkdirSync(path.join(exportFixture, '.build/about'), { recursive: true });
  fs.mkdirSync(path.join(exportFixture, 'tests/e2e'), { recursive: true });
  fs.mkdirSync(path.join(exportFixture, 'docs/wiki'), { recursive: true });
  fs.copyFileSync(path.join(root, 'docs/wiki/Release-Deployment.md'), path.join(exportFixture, 'docs/wiki/Release-Deployment.md'));
  fs.symlinkSync(path.join(root, 'tests/e2e/node_modules'), path.join(exportFixture, 'tests/e2e/node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir');
  for (const filename of ['compose.yaml', 'compose.exports.yaml']) {
    fs.copyFileSync(path.join(root, 'deploy', filename), path.join(exportFixture, 'deploy', filename));
  }
  fs.writeFileSync(path.join(exportFixture, '.build/about/build-info.json'), '{}\n');
  const exporter = ci.jobs.image.steps.find(step => step.run?.includes('docker save'));
  assert(exporter, 'Missing verified image exporter');
  const dockerStub = 'function docker() { case "$1" in save) printf fixture-image ;; image) printf \'[{"Id":"fixture-image"}]\\n\' ;; *) return 1 ;; esac; }\n';
  const result = spawnSync(bash, ['-e', '-o', 'pipefail', '-c', dockerStub + exporter.run + '\nsha256sum --check SHA256SUMS'], {
    cwd: exportFixture, encoding: 'utf8', env: process.env,
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const exported = JSON.parse(fs.readFileSync(path.join(exportFixture, '.local/rehearsal/deployment.json'), 'utf8'));
  assert(!exported.services.app.build);
  assert.equal(exported.services.app.environment.TZ, 'Europe/Berlin');
  const verified = path.join(exportFixture, 'verified');
  fs.cpSync(path.join(exportFixture, '.local/rehearsal'), verified, { recursive: true });
  const guide = path.join(verified, 'DEPLOYMENT.md');
  assert.equal(fs.readFileSync(guide, 'utf8'), fs.readFileSync(path.join(root, 'docs/wiki/Release-Deployment.md'), 'utf8'));
  const sumsPath = path.join(verified, 'SHA256SUMS');
  const sums = fs.readFileSync(sumsPath, 'utf8');
  const download = release.jobs.publish.steps.find(step => step.id === 'download').run;
  const checkDownload = () => spawnSync(bash, ['-e', '-o', 'pipefail', '-c', 'function gh() { :; }\n' + download], {
    cwd: exportFixture, encoding: 'utf8', env: { ...process.env, GITHUB_RUN_ID: '123', GH_REPO: 'eG-dev/MONkEY' },
  });
  assert.equal(checkDownload().status, 0, 'Publisher rejected the verified deployment guidance');
  const withoutGuide = sums.split('\n').filter(line => !/\s+[* ]?DEPLOYMENT\.md\s*$/.test(line)).join('\n');
  assert.notEqual(withoutGuide, sums, 'Missing deployment guide checksum in exported artifact');
  fs.writeFileSync(sumsPath, withoutGuide);
  assert.notEqual(checkDownload().status, 0, 'Publisher accepted an unlisted deployment guide');
  fs.writeFileSync(sumsPath, sums);
  fs.appendFileSync(guide, 'Modified guide\n');
  assert.notEqual(checkDownload().status, 0, 'Publisher accepted modified deployment guidance');
} finally {
  fs.rmSync(exportFixture, { recursive: true, force: true });
}
console.log('PASS: actual artifact export and publisher checks reject missing or modified deployment guidance');