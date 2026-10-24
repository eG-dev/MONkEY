import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { prepareAbout, webRoot } from './prepare-about.mjs';
import { assembleNotices } from './assemble-notices.mjs';

const temporary = mkdtempSync(resolve(tmpdir(), 'pocket-monkey-about-'));
const root = resolve(temporary, 'revamp/web');
const generated = resolve(root, 'src/generated/about');
const snapshot = resolve(temporary, 'revamp/.build/about');
const repository = 'https://github.com/example/project';
const license = readFileSync(resolve(webRoot, '../../LICENSE'));
const originalNotices = Buffer.from('Fixture third-party notices\r\nAll rights retained.\r\n');
const fixtureDocument = resolve(temporary, 'revamp/notices/originals/fixture/1.0/LICENSE.txt');
const fixtureCatalogPath = resolve(temporary, 'revamp/notices/catalog.json');
let notices;
let passed = 0;

function git(...args) {
  return execFileSync('git', ['-C', temporary, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function check(name, action) {
  action();
  passed++;
  console.log(`PASS: ${name}`);
}

function replaceNotices(bytes) {
  const catalog = JSON.parse(readFileSync(fixtureCatalogPath, 'utf8'));

  catalog.documents[0].sha256 = createHash('sha256').update(bytes).digest('hex');
  writeFileSync(fixtureDocument, bytes);
  writeFileSync(fixtureCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  const assembled = assembleNotices({ inputRoot: temporary });

  writeFileSync(resolve(temporary, 'THIRD-PARTY-NOTICES.txt'), assembled.bundle);
  return assembled.bundle;
}

try {
  mkdirSync(root, { recursive: true });
  writeFileSync(resolve(root, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  writeFileSync(resolve(root, 'package-lock.json'), JSON.stringify({ version: '1.2.3', packages: { '': { version: '1.2.3' } } }));
  writeFileSync(resolve(temporary, 'LICENSE'), license);
  mkdirSync(resolve(fixtureDocument, '..'), { recursive: true });
  writeFileSync(resolve(root, 'fixture-font'), 'fixture');
  writeFileSync(
    fixtureCatalogPath,
    JSON.stringify({
      schemaVersion: 1,
      coverage: 'complete',
      releaseReview: 'reviewed',
      entries: [{ id: 'fixture', displayName: 'Fixture', componentIds: ['fixture'] }],
      components: [
        {
          id: 'fixture',
          kind: 'asset',
          name: 'Fixture',
          version: '1.0',
          licenseExpression: 'MIT',
          licensingStatus: 'licensed',
          reviewStatus: 'reviewed',
          upstreamUrl: 'https://example.test/fixture/1.0',
          documentIds: ['fixture'],
          versionEvidence: {
            kind: 'files',
            description: 'Fixture evidence',
            files: [{ path: 'revamp/web/fixture-font', sha256: createHash('sha256').update('fixture').digest('hex') }],
          },
        },
      ],
      documents: [
        {
          id: 'fixture',
          kind: 'license',
          path: 'revamp/notices/originals/fixture/1.0/LICENSE.txt',
          upstreamUrl: 'https://example.test/fixture/1.0/LICENSE',
          revision: '1.0',
          sha256: '',
        },
      ],
    }),
  );
  notices = replaceNotices(originalNotices);
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
    assert(readFileSync(resolve(generated, 'THIRD-PARTY-NOTICES.txt')).equals(notices));
    assert(readFileSync(resolve(snapshot, 'THIRD-PARTY-NOTICES.txt')).equals(notices));
    assert.equal(JSON.parse(readFileSync(resolve(generated, 'project-license.json'), 'utf8')).text, license.toString('utf8'));
  });
  check('deterministic generation and freshness verification', () => {
    const before = readFileSync(resolve(generated, 'build-info.json'));

    prepareAbout({ root, repository });
    prepareAbout({ root, repository, check: true });
    assert(readFileSync(resolve(generated, 'build-info.json')).equals(before));
  });
  for (const [name, newline] of [
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ]) {
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
  for (const [name, newline] of [
    ['LF', '\n'],
    ['CRLF', '\r\n'],
  ]) {
    check(`${name} notice input preserved in downloadable and container assets`, () => {
      const bytes = Buffer.from(`Fixture third-party notices${newline}All rights retained.${newline}`);

      try {
        const bundle = replaceNotices(bytes);
        prepareAbout({ root, repository });

        assert(readFileSync(resolve(snapshot, 'THIRD-PARTY-NOTICES.txt')).equals(bundle));
        assert(readFileSync(resolve(generated, 'THIRD-PARTY-NOTICES.txt')).equals(bundle));
        assert(readFileSync(resolve(generated, 'notices/fixture.txt')).equals(bytes));
        prepareAbout({ root, repository, check: true });
      } finally {
        replaceNotices(originalNotices);
        prepareAbout({ root, repository });
      }
    });
  }
  check('stale notice assets and changed source rejected', () => {
    writeFileSync(resolve(generated, 'THIRD-PARTY-NOTICES.txt'), 'stale');
    assert.throws(() => prepareAbout({ root, repository, check: true }), /Stale (generated|assembled)/);
    prepareAbout({ root, repository });
    writeFileSync(resolve(temporary, 'THIRD-PARTY-NOTICES.txt'), 'updated notices');
    assert.throws(() => prepareAbout({ root, repository, check: true }), /Stale assembled/);
    writeFileSync(resolve(temporary, 'THIRD-PARTY-NOTICES.txt'), notices);
    prepareAbout({ root, repository });
  });
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
    assert(readFileSync(resolve(generated, 'THIRD-PARTY-NOTICES.txt')).equals(notices));
    process.env['MONKEY_BUILD_VERSION'] = '9.9.9';
    assert.throws(() => prepareAbout({ root, packaged: true }), /label input disagrees/);
    process.env['MONKEY_BUILD_VERSION'] = info.version;
    writeFileSync(resolve(snapshot, 'LICENSE'), 'tampered');
    assert.throws(() => prepareAbout({ root, packaged: true }), /license input hash mismatch/);
    prepareAbout({ root, repository });
  });
  check('manual generated assets and prepared input drift rejected', () => {
    prepareAbout({ root, repository });
    const metadata = JSON.parse(readFileSync(resolve(generated, 'third-party.json'), 'utf8'));

    assert.equal(metadata.entries[0].components[0].version, '1.0');
    assert.equal(metadata.documents[0].text, originalNotices.toString('utf8'));
    assert(readFileSync(resolve(generated, 'notices/fixture.txt')).equals(originalNotices));
    writeFileSync(resolve(generated, 'third-party.json'), 'stale');
    assert.throws(() => prepareAbout({ root, repository, check: true }), /Stale generated/);
    prepareAbout({ root, repository });
    writeFileSync(resolve(snapshot, 'inputs/revamp/notices/originals/fixture/1.0/LICENSE.txt'), 'changed');
    assert.throws(() => prepareAbout({ root, packaged: true }), /Document hash mismatch/);
    prepareAbout({ root, repository });
    writeFileSync(resolve(root, 'fixture-font'), 'changed');
    assert.throws(() => prepareAbout({ root, packaged: true }), /Packaged web input drift/);
    writeFileSync(resolve(root, 'fixture-font'), 'fixture');
    prepareAbout({ root, repository });
  });
  check('nested source archives do not borrow parent Git provenance', () => {
    const nested = resolve(temporary, 'archive/revamp/web');

    mkdirSync(nested, { recursive: true });
    writeFileSync(resolve(nested, 'package.json'), readFileSync(resolve(root, 'package.json')));
    writeFileSync(resolve(nested, 'package-lock.json'), readFileSync(resolve(root, 'package-lock.json')));
    writeFileSync(resolve(nested, '../../LICENSE'), license);
    writeFileSync(resolve(nested, '../../THIRD-PARTY-NOTICES.txt'), notices);

    for (const [path, bytes] of assembleNotices({ inputRoot: temporary }).inputs) {
      const filename = resolve(nested, '../..', path);

      mkdirSync(resolve(filename, '..'), { recursive: true });
      writeFileSync(filename, bytes);
    }

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

  const manualRoot = resolve(temporary, 'manual-proof');
  const documentPath = 'revamp/notices/originals/fixture/1.0.0/LICENSE.txt';
  const evidencePath = 'revamp/backend/fixture/packages.lock.json';
  const assetPath = 'revamp/web/public/fonts/fixture.woff2';
  const originalText = Buffer.from('Fixture original copyright\r\nFixture license text.\r\n');
  const asset = Buffer.from('Fixture font bytes');

  function store(path, bytes) {
    mkdirSync(resolve(manualRoot, path, '..'), { recursive: true });
    writeFileSync(resolve(manualRoot, path), bytes);
  }

  store(documentPath, originalText);
  store(evidencePath, JSON.stringify({ dependencies: { 'net10.0': { Fixture: { resolved: '1.0.0' } } } }));
  store(assetPath, asset);
  const manualCatalog = {
    schemaVersion: 1,
    coverage: 'partial',
    releaseReview: 'pending',
    entries: [{ id: 'fixture', displayName: 'Fixture group', componentIds: ['managed', 'font'] }],
    components: [
      {
        id: 'managed',
        kind: 'nuget',
        name: 'Managed fixture',
        version: '1.0.0',
        licenseExpression: 'MIT',
        licensingStatus: 'licensed',
        reviewStatus: 'reviewed',
        upstreamUrl: 'https://example.test/fixture/v1.0.0',
        documentIds: ['fixture-license'],
        versionEvidence: { kind: 'nuget', path: evidencePath, framework: 'net10.0', package: 'Fixture' },
      },
      {
        id: 'font',
        kind: 'asset',
        name: 'Font fixture',
        version: '2.0',
        licenseExpression: 'OFL-1.1',
        licensingStatus: 'licensed',
        reviewStatus: 'reviewed',
        upstreamUrl: 'https://example.test/font/2.0',
        documentIds: ['fixture-license'],
        versionEvidence: {
          kind: 'files',
          description: 'Fixture embedded version 2.0',
          files: [{ path: assetPath, sha256: createHash('sha256').update(asset).digest('hex') }],
        },
      },
    ],
    documents: [
      {
        id: 'fixture-license',
        kind: 'license',
        path: documentPath,
        upstreamUrl: 'https://example.test/original/LICENSE',
        revision: 'fixture-original-1',
        sha256: createHash('sha256').update(originalText).digest('hex'),
      },
    ],
  };

  function catalogCheck(change = () => {}, options = {}) {
    const catalog = structuredClone(manualCatalog);

    change(catalog);
    store('revamp/notices/catalog.json', JSON.stringify(catalog));
    return assembleNotices({ inputRoot: manualRoot, ...options });
  }

  check('manual grouping, exact original bytes and deterministic bundle', () => {
    const first = catalogCheck();
    const second = catalogCheck();

    assert(first.bundle.equals(second.bundle));
    assert(first.bundle.includes(originalText));
    assert(first.files.get('notices/fixture-license.txt').equals(originalText));
    assert.equal(first.about.entries[0].components.length, 2);
    assert.equal(first.about.documents.length, 1);
    assert.equal(first.about.documents[0].url, '/licenses/notices/fixture-license.txt');
    assert.deepEqual(first.files, second.files);
    assert(first.inputs.has('revamp/notices/catalog.json'));
  });
  check('manual inputs survive a standalone container snapshot', () => {
    const first = catalogCheck();
    const copiedRoot = resolve(temporary, 'standalone-inputs');

    for (const [path, bytes] of first.inputs) {
      mkdirSync(resolve(copiedRoot, path, '..'), { recursive: true });
      writeFileSync(resolve(copiedRoot, path), bytes);
    }

    assert.deepEqual(assembleNotices({ inputRoot: copiedRoot }).files, first.files);
  });
  check('notice groups preserve exact applicability and mixed member metadata', () => {
    const grouped = catalogCheck((catalog) => {
      catalog.entries[0].groups = [{ id: 'packages', titleKey: null, componentIds: ['managed', 'font'] }];
    });
    const entry = grouped.about.entries[0];

    assert.deepEqual(entry.groups, [{ id: 'packages', titleKey: null, componentIds: ['managed', 'font'] }]);
    assert.deepEqual(
      entry.components.map((component) => component.licenseExpression),
      ['MIT', 'OFL-1.1'],
    );
    assert.equal(grouped.about.documents.length, 1);
    assert(grouped.bundle.equals(catalogCheck().bundle));
  });
  check('invalid, overlapping and incomplete notice groups rejected', () => {
    for (const groups of [
      [],
      [{ id: 'invalid group', titleKey: null, componentIds: ['managed', 'font'] }],
      [{ id: 'packages', titleKey: 'invalid.key', componentIds: ['managed', 'font'] }],
      [{ id: 'packages', titleKey: null, componentIds: ['missing'] }],
      [{ id: 'packages', titleKey: null, componentIds: ['managed'] }],
      [
        { id: 'managed', titleKey: null, componentIds: ['managed', 'font'] },
        { id: 'font', titleKey: null, componentIds: ['font'] },
      ],
      [
        { id: 'packages', titleKey: null, componentIds: ['managed'] },
        { id: 'packages', titleKey: null, componentIds: ['font'] },
      ],
    ]) {
      assert.throws(
        () =>
          catalogCheck((catalog) => {
            catalog.entries[0].groups = groups;
          }),
        /notice group/i,
      );
    }
  });
  check('different document sets require separate explicit groups', () => {
    const separateDocuments = (catalog) => {
      catalog.documents.push({ ...catalog.documents[0], id: 'font-license' });
      catalog.components[1].documentIds = ['font-license'];
    };

    assert.throws(() => catalogCheck(separateDocuments), /identical document applicability/);
    const grouped = catalogCheck((catalog) => {
      separateDocuments(catalog);
      catalog.entries[0].groups = [
        { id: 'managed', titleKey: 'managed', componentIds: ['managed'] },
        { id: 'font', titleKey: 'font', componentIds: ['font'] },
      ];
    });

    assert.equal(grouped.about.entries[0].groups.length, 2);
    assert.equal(grouped.about.documents.length, 2);
  });
  check('manual duplicate identities and dangling references rejected', () => {
    for (const collection of ['entries', 'components', 'documents']) {
      assert.throws(() => catalogCheck((catalog) => catalog[collection].push(catalog[collection][0])), /Duplicate/);
    }

    assert.throws(() => catalogCheck((catalog) => catalog.entries[0].componentIds.push('missing')), /Unknown component/);
    assert.throws(() => catalogCheck((catalog) => catalog.components[0].documentIds.push('missing')), /Unknown document/);
    assert.throws(() => catalogCheck((catalog) => catalog.entries[0].componentIds.pop()), /Unmapped component/);
  });
  check('manual version, document hash, asset drift and unsafe paths rejected', () => {
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          catalog.components[0].version = '9.9.9';
        }),
      /Stale component version/,
    );
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          catalog.documents[0].sha256 = '0'.repeat(64);
        }),
      /Document hash mismatch/,
    );
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          catalog.documents[0].path = 'revamp/notices/originals/../../outside';
        }),
      /escapes root/,
    );
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          catalog.documents[0].path = '/outside';
        }),
      /under notices\/originals/,
    );
    store(assetPath, 'changed');
    assert.throws(() => catalogCheck(), /Asset hash mismatch/);
    store(assetPath, asset);
  });
  check('manual npm evidence and release review boundaries', () => {
    store('revamp/web/package-lock.json', JSON.stringify({ packages: { 'node_modules/fixture': { version: '1.0.0' } } }));
    const npm = catalogCheck((catalog) => {
      catalog.components[0].kind = 'npm';
      catalog.components[0].versionEvidence = { kind: 'npm', path: 'revamp/web/package-lock.json', package: 'fixture' };
    });

    assert.equal(npm.about.entries[0].components[0].version, '1.0.0');
    assert.throws(() => catalogCheck(undefined, { release: true }), /coverage is partial/);
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          delete catalog.releaseReview;
        }),
      /Invalid notice release review/,
    );
    assert.throws(
      () =>
        catalogCheck((catalog) => {
          catalog.releaseReview = 'complete';
        }),
      /Invalid notice release review/,
    );
    const completed = catalogCheck((catalog) => {
      catalog.coverage = 'complete';
    });

    assert.equal(completed.about.coverage, 'complete');
    assert.equal(completed.about.releaseReview, 'pending');
    assert(
      completed.bundle
        .toString('utf8')
        .startsWith(
          'POCKET MONkEY - Third-Party Notices\n=================================\n\n' +
            'Generated from revamp/notices/catalog.json; do not edit this assembled file.\n' +
            'Curated collection: COMPLETE. Collection status is not legal approval.\n',
        ),
    );
    assert.throws(
      () =>
        catalogCheck(
          (catalog) => {
            catalog.coverage = 'complete';
          },
          { release: true },
        ),
      /review is pending/,
    );
    assert.throws(
      () =>
        catalogCheck(
          (catalog) => {
            catalog.coverage = 'complete';
            catalog.releaseReview = 'reviewed';
            catalog.components[0].reviewStatus = 'unresolved';
          },
          { release: true },
        ),
      /unresolved components/,
    );
    const reviewed = catalogCheck(
      (catalog) => {
        catalog.coverage = 'complete';
        catalog.releaseReview = 'reviewed';
      },
      { release: true },
    );

    assert.equal(reviewed.about.releaseReview, 'reviewed');
  });

  console.log(`PASS: ${passed} isolated About build-input checks`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
