import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import semver from 'semver';

import { assembleNotices } from './assemble-notices.mjs';

export const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(repositoryRoot, args) {
  const result = spawnSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

  return result.status === 0 ? result.stdout.trim() : null;
}

function repositoryUrl(value) {
  if (!value) {
    return null;
  }

  const url = new URL(value);

  assert(url.protocol === 'https:' && url.hostname === 'github.com' && !url.port, 'Repository must be a public HTTPS GitHub URL.');
  assert(!url.username && !url.password && !url.search && !url.hash, 'Repository URL must not contain credentials, query, or fragment.');
  assert(/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.pathname), 'Repository URL must identify an owner and repository.');

  return url.href.replace(/\/$/, '').replace(/\.git$/, '');
}

function sourceUrl(info) {
  return info.repositoryUrl && info.revision && info.dirty === false ? `${info.repositoryUrl}/tree/${info.revision}` : null;
}

function validate(info, version, license) {
  assert.equal(info.schemaVersion, 1, 'Unsupported About metadata schema.');
  assert.equal(info.version, version, 'Build and package versions disagree.');
  assert(['development', 'release'].includes(info.kind), 'Invalid build kind.');
  assert(info.revision === null || /^[a-f0-9]{40,64}$/.test(info.revision), 'Invalid source revision.');
  assert(info.revision === null ? info.dirty === null : typeof info.dirty === 'boolean', 'Invalid source cleanliness.');
  assert.equal(info.repositoryUrl, repositoryUrl(info.repositoryUrl), 'Repository URL is not canonical.');
  assert.equal(info.sourceUrl, sourceUrl(info), 'Source URL does not match clean build provenance.');
  assert.equal(info.licenseSha256, createHash('sha256').update(license).digest('hex'), 'Project-license input hash mismatch.');

  if (info.kind === 'release') {
    assert(info.revision && info.dirty === false && info.sourceUrl, 'Release inputs require clean, known source and a repository URL.');
    assert.equal(info.releaseTag, `v${version}`, 'Release tag must match the application version.');
  } else {
    assert.equal(info.releaseTag, null, 'Development builds must not claim a release tag.');
  }
}

function output(filename, content, check) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);

  if (check) {
    assert(readFileSync(filename).equals(bytes), `Stale generated About asset: ${filename}`);
    return;
  }

  mkdirSync(dirname(filename), { recursive: true });
  writeFileSync(filename, bytes);
}

export function prepareAbout({ root = webRoot, check = false, packaged = false, releaseTag, repository } = {}) {
  const replacementRoot = resolve(root, '..');
  const repositoryRoot = replacementRoot;
  const snapshotRoot = resolve(replacementRoot, '.build/about');
  const generatedRoot = resolve(root, 'src/generated/about');
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));

  assert.equal(typeof manifest.version, 'string', 'Application version must be a string.');
  assert.equal(semver.valid(manifest.version), manifest.version, 'Application version must be strict SemVer.');
  assert.equal(lock.version, manifest.version, 'Package and lockfile versions disagree.');
  assert.equal(lock.packages[''].version, manifest.version, 'Package and lockfile root versions disagree.');

  const license = readFileSync(packaged ? resolve(snapshotRoot, 'LICENSE') : resolve(repositoryRoot, 'LICENSE'));
  const notices = readFileSync(resolve(packaged ? snapshotRoot : repositoryRoot, 'THIRD-PARTY-NOTICES.txt'));
  let info;

  if (packaged) {
    assert(!releaseTag && !repository, 'Packaged builds must use the captured input, not override its provenance.');
    info = JSON.parse(readFileSync(resolve(snapshotRoot, 'build-info.json'), 'utf8'));
  } else {
    const gitRoot = git(repositoryRoot, ['rev-parse', '--show-toplevel']);
    const revision = gitRoot && relative(repositoryRoot, gitRoot) === '' ? git(repositoryRoot, ['rev-parse', '--verify', 'HEAD']) : null;
    const status = revision ? git(repositoryRoot, ['status', '--porcelain', '--untracked-files=normal']) : null;

    assert(!revision || status !== null, 'Could not determine source cleanliness.');

    info = {
      schemaVersion: 1,
      version: manifest.version,
      revision,
      dirty: revision ? status.length > 0 : null,
      kind: releaseTag ? 'release' : 'development',
      releaseTag: releaseTag ?? null,
      repositoryUrl: repositoryUrl(repository),
      sourceUrl: null,
      licenseSha256: createHash('sha256').update(license).digest('hex'),
    };
    info.sourceUrl = sourceUrl(info);

    if (releaseTag) {
      assert.equal(releaseTag, `v${manifest.version}`, 'Release tag must match the application version.');
      assert.equal(
        git(repositoryRoot, ['rev-parse', '--verify', `refs/tags/${releaseTag}^{commit}`]),
        revision,
        'Release tag must point to HEAD.',
      );
    }
  }

  validate(info, manifest.version, license);
  const assembled = assembleNotices({
    inputRoot: packaged ? resolve(snapshotRoot, 'inputs') : repositoryRoot,
    release: info.kind === 'release',
  });

  assert(notices.equals(assembled.bundle), 'Stale assembled THIRD-PARTY-NOTICES.txt; run assemble:notices.');

  if (packaged) {
    for (const [path, bytes] of assembled.inputs) {
      if (path.startsWith('web/')) {
        assert(readFileSync(resolve(root, path.slice('web/'.length))).equals(bytes), `Packaged web input drift: ${path}`);
      }
    }
  }

  if (packaged) {
    for (const [variable, expected] of [
      ['MONKEY_BUILD_VERSION', info.version],
      ['MONKEY_BUILD_REVISION', info.revision ?? 'unavailable'],
      ['MONKEY_BUILD_KIND', info.kind],
      ['MONKEY_BUILD_DIRTY', String(info.dirty)],
      ['MONKEY_BUILD_REPOSITORY', info.repositoryUrl ?? ''],
    ]) {
      assert.equal(process.env[variable], expected, `Docker label input disagrees with metadata: ${variable}`);
    }
  }

  const metadata = `${JSON.stringify(info, null, 2)}\n`;

  if (!packaged) {
    if (!check) {
      rmSync(resolve(snapshotRoot, 'inputs'), { recursive: true, force: true });
    }

    for (const [path, bytes] of assembled.inputs) {
      output(resolve(snapshotRoot, 'inputs', path), bytes, check);
    }

    output(resolve(snapshotRoot, 'LICENSE'), license, check);
    output(resolve(snapshotRoot, 'THIRD-PARTY-NOTICES.txt'), notices, check);
    output(resolve(snapshotRoot, 'build-info.json'), metadata, check);
  }

  output(resolve(generatedRoot, 'build-info.json'), metadata, check);
  output(resolve(generatedRoot, 'project-license.json'), `${JSON.stringify({ text: license.toString('utf8') })}\n`, check);
  output(resolve(generatedRoot, 'AGPL-3.0-only.txt'), license, check);
  output(resolve(generatedRoot, 'THIRD-PARTY-NOTICES.txt'), notices, check);

  if (!check) {
    rmSync(resolve(generatedRoot, 'notices'), { recursive: true, force: true });
  }

  for (const [path, bytes] of assembled.files) {
    output(resolve(generatedRoot, path), bytes, check);
  }

  return info;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const { values } = parseArgs({
      options: { check: { type: 'boolean' }, 'release-tag': { type: 'string' }, 'repository-url': { type: 'string' } },
    });
    const info = prepareAbout({
      check: values.check,
      packaged: process.env['MONKEY_PACKAGED_BUILD'] === '1',
      releaseTag: values['release-tag'],
      repository: values['repository-url'],
    });

    console.log(
      `PASS: About ${values.check ? 'checked' : 'generated'}; ${info.version}; ${info.kind}; ${info.revision ?? 'revision unavailable'}; dirty=${info.dirty}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
