import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const scanner = 'anchore/syft@sha256:3eb5379ba7b409c3f4069b686110527af0c47df993fa5c10d13e7cf34f49b1aa';
const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../..', '.build/inventory');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function docker(args, capture = false) {
  const result = spawnSync('docker', args, { shell: false, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });

  assert.equal(result.status, 0, `Inventory Docker command failed: ${args[0]}${capture ? `: ${result.stderr}` : ''}`);

  return capture ? result.stdout.trim() : '';
}

const { values } = parseArgs({ options: { image: { type: 'string', default: 'pocket-monkey:foundation' } } });
mkdirSync(directory, { recursive: true });
const work = mkdtempSync(resolve(directory, 'work-'));
const container = `monkey-inventory-${randomUUID()}`;
let created = false;

try {
  const imageId = docker(['image', 'inspect', values.image, '--format', '{{.Id}}'], true);
  const labels = JSON.parse(docker(['image', 'inspect', imageId, '--format', '{{json .Config.Labels}}'], true));

  docker(['create', '--name', container, imageId], true);
  created = true;
  docker(['cp', `${container}:/app/web/inventory/web-components.json`, resolve(work, 'web-components.json')]);

  const webBytes = readFileSync(resolve(work, 'web-components.json'));
  const web = JSON.parse(webBytes.toString('utf8'));

  assert.equal(web.schemaVersion, 1, 'Unsupported web inventory schema.');
  assert.equal(web.status, 'unreviewed', 'Inventory collection must not imply legal approval.');

  for (const [key, label] of [
    ['version', 'org.opencontainers.image.version'],
    ['revision', 'org.opencontainers.image.revision'],
    ['kind', 'org.pocketmonkey.build.kind'],
    ['dirty', 'org.pocketmonkey.build.dirty'],
  ]) {
    const expected = key === 'dirty' ? String(web.build[key]) : (web.build[key] ?? 'unavailable');

    assert.equal(expected, labels[label], `Image and web inventory build identity disagree: ${key}`);
  }

  docker(['image', 'save', '--output', resolve(work, 'image.tar'), imageId]);
  docker([
    'run', '--rm', '--network', 'none',
    '--env', 'SYFT_CHECK_FOR_APP_UPDATE=false',
    '--env', 'SYFT_LICENSE_CONTENT=all',
    '--env', 'SYFT_DOTNET_DEP_PACKAGES_MUST_HAVE_DLL=false',
    '--env', 'SYFT_DOTNET_DEP_PACKAGES_MUST_CLAIM_DLL=false',
    '--mount', `type=bind,source=${directory},target=/work`,
    scanner, 'scan', `docker-archive:/work/${work.split(/[\\/]/).at(-1)}/image.tar`,
    '-o', 'syft-json=/work/image.syft.json',
    '-o', 'cyclonedx-json=/work/image.cdx.json',
  ]);

  const sourceBytes = readFileSync(resolve(directory, 'image.syft.json'));
  const source = JSON.parse(sourceBytes.toString('utf8'));

  assert.equal(source.descriptor.name, 'syft', 'Unexpected inventory scanner.');
  assert.equal(source.descriptor.version, '1.54.1', 'Unexpected pinned scanner version.');
  assert.equal(source.source.metadata.imageID, imageId, 'Scanner evidence does not match the selected image.');

  const firstParty = [];
  const runtime = [];

  for (const artifact of source.artifacts) {
    const paths = (artifact.locations ?? []).map((location) => location.path);

    if (artifact.type === 'dotnet' && ['PocketMonkey.Host', 'PocketMonkey.Storage'].includes(artifact.name)) {
      firstParty.push({ name: artifact.name, version: artifact.version, paths });
      continue;
    }

    const licenses = artifact.licenses ?? [];
    const reviewIssues = ['attribution-and-compatibility-review-required'];

    if (!licenses.length) {
      reviewIssues.push('license-expression-missing');
    }

    if (!licenses.some((license) => license.contents)) {
      reviewIssues.push('license-text-missing');
    }

    runtime.push({
      id: `${artifact.type}:${artifact.name}@${artifact.version}:${artifact.id}`,
      ecosystem: artifact.type,
      name: artifact.name,
      version: artifact.version,
      licenses,
      paths,
      reviewIssues,
    });
  }

  runtime.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

  const report = {
    schemaVersion: 1,
    status: 'unreviewed',
    releaseReady: false,
    imageId,
    scanner: { image: scanner, version: source.descriptor.version, network: 'none' },
    evidence: { webSha256: hash(webBytes), imageSbomSha256: hash(sourceBytes) },
    build: web.build,
    webComponents: web.components,
    assets: web.assets,
    firstParty,
    runtimeComponents: runtime,
    reviewIssues: [
      'source-and-notice-completeness-review-required',
      'native-package-and-runtime-license-reconciliation-required',
      'unresolved-asset-origins-and-font-version',
      'not-yet-the-bundled-About-notice-inventory',
    ],
  };

  writeFileSync(resolve(directory, 'web-components.json'), webBytes);
  writeFileSync(resolve(directory, 'review.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`PASS: ${web.components.length} web components, ${runtime.length} runtime/image components, ${web.assets.length} asset groups; image ${imageId}`);
  console.log(`UNREVIEWED: ${runtime.filter((entry) => entry.reviewIssues.includes('license-expression-missing')).length} runtime components lack license metadata; ${runtime.filter((entry) => entry.reviewIssues.includes('license-text-missing')).length} lack attached license text.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (created) {
    docker(['rm', '--force', '--volumes', container], true);
  }

  rmSync(work, { recursive: true, force: true });
}
