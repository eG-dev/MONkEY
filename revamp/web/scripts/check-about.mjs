import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { prepareAbout, webRoot } from './prepare-about.mjs';

const temporary = mkdtempSync(resolve(tmpdir(), 'pocket-monkey-about-'));
const root = resolve(temporary, 'revamp/web');
const generated = resolve(root, 'src/generated/about');
const snapshot = resolve(temporary, 'revamp/.build/about');
const repository = 'https://github.com/example/project';
const license = readFileSync(resolve(webRoot, '../../LICENSE'));
let passed = 0;

function git(...args) {
  return execFileSync('git', ['-C', temporary, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function check(name, action) {
  action();
  passed++;
  console.log(`PASS: ${name}`);
}

try {
  mkdirSync(root, { recursive: true });
  writeFileSync(resolve(root, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  writeFileSync(resolve(root, 'package-lock.json'), JSON.stringify({ version: '1.2.3', packages: { '': { version: '1.2.3' } } }));
  writeFileSync(resolve(temporary, 'LICENSE'), license);
  writeFileSync(resolve(temporary, '.gitignore'), 'revamp/.build/\nrevamp/web/src/generated/\n');
  git('init', '--quiet');
  git('config', 'core.autocrlf', 'false');
  git('add', '.');
  git('-c', 'user.name=About fixture', '-c', 'user.email=fixture@example.test', 'commit', '--quiet', '-m', 'Fixture');
  git('tag', 'v1.2.3');

  check('clean development provenance and exact license copies', () => {
    const info = prepareAbout({ root, repository });

    assert.equal(info.kind, 'development');
    assert.equal(info.dirty, false);
    assert.equal(info.revision, git('rev-parse', 'HEAD'));
    assert.equal(info.sourceUrl, `${repository}/tree/${info.revision}`);
    assert(readFileSync(resolve(generated, 'AGPL-3.0-only.txt')).equals(license));
    assert.equal(JSON.parse(readFileSync(resolve(generated, 'project-license.json'), 'utf8')).text, license.toString('utf8'));
  });
  check('deterministic generation and freshness verification', () => {
    const before = readFileSync(resolve(generated, 'build-info.json'));

    prepareAbout({ root, repository });
    prepareAbout({ root, repository, check: true });
    assert(readFileSync(resolve(generated, 'build-info.json')).equals(before));
  });
  for (const [name, newline] of [['LF', '\n'], ['CRLF', '\r\n']]) {
    check(`${name} license input preserved in inline, downloadable, and container assets`, () => {
      const bytes = Buffer.from(license.toString('utf8').replace(/\r\n|\r|\n/g, newline));

      try {
        writeFileSync(resolve(temporary, 'LICENSE'), bytes);
        const info = prepareAbout({ root, repository });

        assert(readFileSync(resolve(snapshot, 'LICENSE')).equals(bytes));
        assert(readFileSync(resolve(generated, 'AGPL-3.0-only.txt')).equals(bytes));
        assert.equal(JSON.parse(readFileSync(resolve(generated, 'project-license.json'), 'utf8')).text, bytes.toString('utf8'));
        assert.equal(info.licenseSha256, createHash('sha256').update(bytes).digest('hex'));
        prepareAbout({ root, repository, check: true });
      } finally {
        writeFileSync(resolve(temporary, 'LICENSE'), license);
        prepareAbout({ root, repository });
      }
    });
  }
  check('stale generated license rejected', () => {
    writeFileSync(resolve(generated, 'AGPL-3.0-only.txt'), 'stale');
    assert.throws(() => prepareAbout({ root, repository, check: true }), /Stale generated/);
    prepareAbout({ root, repository });
  });
  check('matching clean tagged-release identity', () => {
    assert.equal(prepareAbout({ root, repository, releaseTag: 'v1.2.3' }).releaseTag, 'v1.2.3');
  });
  check('tag mismatch and missing tag rejected', () => {
    assert.throws(() => prepareAbout({ root, repository, releaseTag: 'v1.2.4' }), /tag must match/);
    git('tag', '-d', 'v1.2.3');
    assert.throws(() => prepareAbout({ root, repository, releaseTag: 'v1.2.3' }), /tag must point/);
    git('tag', 'v1.2.3');
    git(
      '-c',
      'user.name=About fixture',
      '-c',
      'user.email=fixture@example.test',
      'commit',
      '--quiet',
      '--allow-empty',
      '-m',
      'Next fixture revision',
    );
    assert.throws(() => prepareAbout({ root, repository, releaseTag: 'v1.2.3' }), /tag must point/);
    git('tag', '--force', 'v1.2.3');
  });
  check('release without repository rejected', () => {
    assert.throws(() => prepareAbout({ root, releaseTag: 'v1.2.3' }), /clean, known source/);
  });
  check('dirty development is honest and dirty release rejected', () => {
    writeFileSync(resolve(temporary, 'uncommitted.txt'), 'change');
    const info = prepareAbout({ root, repository });

    assert.equal(info.dirty, true);
    assert.equal(info.sourceUrl, null);
    assert.throws(() => prepareAbout({ root, repository, releaseTag: 'v1.2.3' }), /clean, known source/);
    rmSync(resolve(temporary, 'uncommitted.txt'));
  });
  check('mismatched lockfile rejected', () => {
    const filename = resolve(root, 'package-lock.json');
    const original = readFileSync(filename);

    writeFileSync(filename, JSON.stringify({ version: '9.9.9' }));
    assert.throws(() => prepareAbout({ root }), /lockfile versions disagree/);
    writeFileSync(filename, original);
  });
  check('strict SemVer and prerelease handling', () => {
    const manifest = resolve(root, 'package.json');
    const lockfile = resolve(root, 'package-lock.json');
    const originalManifest = readFileSync(manifest);
    const originalLock = readFileSync(lockfile);

    writeFileSync(manifest, JSON.stringify({ version: null }));
    assert.throws(() => prepareAbout({ root }), /must be a string/);
    writeFileSync(manifest, JSON.stringify({ version: '01.2.3' }));
    assert.throws(() => prepareAbout({ root }), /strict SemVer/);
    writeFileSync(manifest, JSON.stringify({ version: '1.2.3-rc.1' }));
    writeFileSync(lockfile, JSON.stringify({ version: '1.2.3-rc.1', packages: { '': { version: '1.2.3-rc.1' } } }));
    assert.equal(prepareAbout({ root }).version, '1.2.3-rc.1');
    writeFileSync(manifest, originalManifest);
    writeFileSync(lockfile, originalLock);
  });
  check('unsafe repository URLs rejected', () => {
    for (const value of [
      'http://github.com/example/project',
      'https://secret@github.com/example/project',
      'https://github.com/example/project?token=secret',
    ]) {
      assert.throws(() => prepareAbout({ root, repository: value }));
    }
  });
  check('packaged snapshot and label identity checked', () => {
    const info = prepareAbout({ root, repository });
    const variables = {
      MONKEY_BUILD_VERSION: info.version,
      MONKEY_BUILD_REVISION: info.revision,
      MONKEY_BUILD_KIND: info.kind,
      MONKEY_BUILD_DIRTY: String(info.dirty),
      MONKEY_BUILD_REPOSITORY: info.repositoryUrl,
    };

    for (const [name, value] of Object.entries(variables)) {
      process.env[name] = value;
    }

    assert.deepEqual(prepareAbout({ root, packaged: true }), info);
    process.env['MONKEY_BUILD_VERSION'] = '9.9.9';
    assert.throws(() => prepareAbout({ root, packaged: true }), /label input disagrees/);
    process.env['MONKEY_BUILD_VERSION'] = info.version;
    writeFileSync(resolve(snapshot, 'LICENSE'), 'tampered');
    assert.throws(() => prepareAbout({ root, packaged: true }), /license input hash mismatch/);
    prepareAbout({ root, repository });
  });
  check('nested source archives do not borrow parent Git provenance', () => {
    const nested = resolve(temporary, 'archive/revamp/web');

    mkdirSync(nested, { recursive: true });
    writeFileSync(resolve(nested, 'package.json'), readFileSync(resolve(root, 'package.json')));
    writeFileSync(resolve(nested, 'package-lock.json'), readFileSync(resolve(root, 'package-lock.json')));
    writeFileSync(resolve(nested, '../../LICENSE'), license);

    assert.equal(prepareAbout({ root: nested }).revision, null);
    rmSync(resolve(temporary, 'archive'), { recursive: true });
  });
  check('source archives without Git report unavailable provenance', () => {
    rmSync(resolve(temporary, '.git'), { recursive: true, force: true });
    const info = prepareAbout({ root });

    assert.equal(info.revision, null);
    assert.equal(info.dirty, null);
    assert.equal(info.sourceUrl, null);
    assert.throws(() => prepareAbout({ root, repository, releaseTag: 'v1.2.3' }));
  });

  console.log(`PASS: ${passed} isolated About build-input checks`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
