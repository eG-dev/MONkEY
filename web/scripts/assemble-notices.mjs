import assert from 'node:assert/strict';
import { isUtf8 } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const catalogPath = 'notices/catalog.json';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

function text(value, label) {
  assert(typeof value === 'string' && value.trim().length > 0 && !/[\r\n\0]/.test(value), `Invalid ${label}.`);
}

function upstream(value) {
  const url = new URL(value);

  assert(url.protocol === 'https:' && !url.username && !url.password && !url.hash, 'Invalid upstream URL.');
}

function records(values, label) {
  assert(Array.isArray(values) && values.length > 0, `Missing ${label}.`);
  const result = new Map();

  for (const value of values) {
    assert(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id), `Invalid ${label} ID.`);
    assert(!result.has(value.id), `Duplicate ${label} ID: ${value.id}`);
    result.set(value.id, value);
  }

  return result;
}

function references(ids, targets, label) {
  assert(Array.isArray(ids) && ids.length > 0 && new Set(ids).size === ids.length, `Invalid ${label} references.`);

  for (const id of ids) {
    assert(targets.has(id), `Unknown ${label}: ${id}`);
  }
}

export function assembleNotices({ inputRoot, release = false, verify = true }) {
  const verifyConsistency = release || verify;
  const inputs = new Map();

  function input(path) {
    assert(typeof path === 'string' && !path.includes('\\') && !path.includes(':') && !path.includes('\0'), 'Invalid input path.');
    assert(!isAbsolute(path) && path.split('/').every((part) => part && part !== '.' && part !== '..'), 'Input path escapes root.');
    const filename = realpathSync(resolve(inputRoot, path));
    const location = relative(realpathSync(inputRoot), filename);

    assert(location && !location.startsWith('..') && !isAbsolute(location), 'Input path escapes root.');
    const bytes = readFileSync(filename);

    inputs.set(path, bytes);
    return bytes;
  }

  const catalog = JSON.parse(input(catalogPath).toString('utf8'));

  assert.equal(catalog.schemaVersion, 1, 'Unsupported notice catalog schema.');
  assert(['partial', 'complete'].includes(catalog.coverage), 'Invalid notice coverage.');
  assert(['pending', 'reviewed'].includes(catalog.releaseReview), 'Invalid notice release review.');
  const components = records(catalog.components, 'component');
  const entries = records(catalog.entries, 'entry');
  const documents = records(catalog.documents, 'document');
  const entryGroups = new Map();
  const files = new Map();
  const documentData = [];

  for (const document of documents.values()) {
    assert(['license', 'notice', 'copyright', 'public-domain-statement'].includes(document.kind), 'Invalid document kind.');
    assert(document.path?.startsWith('notices/originals/'), 'Document must be under notices/originals.');
    upstream(document.upstreamUrl);
    text(document.revision, 'document revision');
    const bytes = input(document.path);

    assert(isUtf8(bytes) && bytes.length > 0, `Document must be nonempty UTF-8: ${document.id}`);
    if (verifyConsistency) {
      assert(/^[a-f0-9]{64}$/.test(document.sha256) && digest(bytes) === document.sha256, `Document hash mismatch: ${document.id}`);
    }
    const filename = `notices/${document.id}.txt`;

    assert(!files.has(filename), `Generated document URL collision: ${document.id}`);
    files.set(filename, bytes);
    documentData.push({
      id: document.id,
      kind: document.kind,
      url: `/licenses/${filename}`,
      upstreamUrl: document.upstreamUrl,
      revision: document.revision,
      sha256: document.sha256,
      text: bytes.toString('utf8'),
    });
  }

  for (const component of components.values()) {
    text(component.name, 'component name');
    assert(['npm', 'nuget', 'runtime', 'asset', 'native'].includes(component.kind), 'Invalid component kind.');
    assert(['reviewed', 'unresolved'].includes(component.reviewStatus), 'Invalid review status.');
    assert(['licensed', 'public-domain', 'unresolved'].includes(component.licensingStatus), 'Invalid licensing status.');
    assert(component.version === null || typeof component.version === 'string', 'Invalid component version.');
    assert(component.licenseExpression === null || typeof component.licenseExpression === 'string', 'Invalid license expression.');
    upstream(component.upstreamUrl);
    references(component.documentIds, documents, 'document');

    if (component.reviewStatus === 'reviewed') {
      text(component.version, 'reviewed component version');
      assert(component.licensingStatus !== 'unresolved', 'Reviewed component has unresolved licensing.');

      if (component.licensingStatus === 'licensed') {
        text(component.licenseExpression, 'reviewed license expression');
      }
    }

    if (!verifyConsistency) {
      continue;
    }

    const evidence = component.versionEvidence;

    assert(evidence && ['npm', 'nuget', 'files'].includes(evidence.kind), 'Missing version evidence.');

    if (evidence.kind === 'files') {
      text(evidence.description, 'asset version evidence');
      assert(Array.isArray(evidence.files) && evidence.files.length > 0, 'Missing asset evidence files.');

      for (const file of evidence.files) {
        assert(file.lineEndings === undefined || file.lineEndings === 'lf', 'Invalid evidence line endings.');
        const bytes = input(file.path);

        if (file.lineEndings === 'lf') {
          assert(isUtf8(bytes), `Normalized evidence must be UTF-8: ${file.path}`);
        }

        const hashInput = file.lineEndings === 'lf' ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;

        assert(/^[a-f0-9]{64}$/.test(file.sha256) && digest(hashInput) === file.sha256, `Asset hash mismatch: ${file.path}`);
      }
    } else {
      const lock = JSON.parse(input(evidence.path).toString('utf8'));
      const version =
        evidence.kind === 'npm'
          ? lock.packages?.[`node_modules/${evidence.package}`]?.version
          : lock.dependencies?.[evidence.framework]?.[evidence.package]?.resolved;

      assert.equal(version, component.version, `Stale component version: ${component.id}`);
      assert(version, `Missing lockfile evidence: ${component.id}`);
    }
  }

  for (const entry of entries.values()) {
    text(entry.displayName, 'About display name');
    references(entry.componentIds, components, 'component');
    const groups = entry.groups ?? [{ id: entry.id, titleKey: null, componentIds: entry.componentIds }];

    records(groups, 'notice group');
    const assigned = new Set();

    for (const group of groups) {
      assert(
        group.titleKey === null || (typeof group.titleKey === 'string' && /^[a-z][a-zA-Z0-9]*$/.test(group.titleKey)),
        'Invalid notice group title key.',
      );
      references(group.componentIds, components, 'notice group component');
      const documentSets = new Set();

      for (const id of group.componentIds) {
        assert(entry.componentIds.includes(id) && !assigned.has(id), `Invalid notice group assignment: ${id}`);
        assigned.add(id);
        documentSets.add(JSON.stringify([...components.get(id).documentIds].sort()));
      }

      assert.equal(documentSets.size, 1, `Notice group members must share identical document applicability: ${entry.id}/${group.id}`);
    }

    assert.equal(assigned.size, entry.componentIds.length, `Incomplete notice groups: ${entry.id}`);
    entryGroups.set(entry.id, groups);
  }

  for (const component of components.values()) {
    assert(
      catalog.entries.some((entry) => entry.componentIds.includes(component.id)),
      `Unmapped component: ${component.id}`,
    );
  }

  for (const document of documents.values()) {
    assert(
      catalog.components.some((component) => component.documentIds.includes(document.id)),
      `Unmapped document: ${document.id}`,
    );
  }

  if (release) {
    assert.equal(catalog.coverage, 'complete', 'Release notice coverage is partial.');
    assert.equal(catalog.releaseReview, 'reviewed', 'Release notice review is pending.');
    assert(
      catalog.components.every((component) => component.reviewStatus === 'reviewed'),
      'Release notices include unresolved components.',
    );
  }

  const about = {
    schemaVersion: 1,
    coverage: catalog.coverage,
    releaseReview: catalog.releaseReview,
    entries: catalog.entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      groups: entryGroups.get(entry.id),
      components: entry.componentIds.map((id) => {
        const component = components.get(id);

        return {
          id,
          name: component.name,
          version: component.version,
          licenseExpression: component.licenseExpression,
          licensingStatus: component.licensingStatus,
          reviewStatus: component.reviewStatus,
          upstreamUrl: component.upstreamUrl,
          documentIds: component.documentIds,
        };
      }),
    })),
    documents: documentData,
  };
  const chunks = [
    Buffer.from(
      `POCKET MONkEY - Third-Party Notices\n=================================\n\n` +
        `Generated from notices/catalog.json; do not edit this assembled file.\n` +
        `Curated collection: ${catalog.coverage.toUpperCase()}. ` +
        (catalog.coverage === 'partial'
          ? 'Manual proof only; not a complete distribution review or release approval.\n'
          : 'Collection status is not legal approval.\n'),
    ),
  ];

  for (const entry of about.entries) {
    chunks.push(Buffer.from(`\n${entry.displayName}\n${'-'.repeat(entry.displayName.length)}\n`));

    for (const component of entry.components) {
      chunks.push(
        Buffer.from(
          `${component.name} ${component.version ?? '(unresolved version)'}\n` +
            `Licensing: ${component.licenseExpression ?? component.licensingStatus}; review: ${component.reviewStatus}\n` +
            `Source: ${component.upstreamUrl}\nDocuments: ${component.documentIds.join(', ')}\n`,
        ),
      );
    }
  }

  for (const document of documentData) {
    const owners = catalog.components.filter((component) => component.documentIds.includes(document.id));

    chunks.push(
      Buffer.from(
        `\n=== ${document.id} (${document.kind}) ===\n` +
          `Applies to: ${owners.map((component) => `${component.name} ${component.version ?? '(unresolved)'}`).join('; ')}\n` +
          `Source: ${document.upstreamUrl}\nRevision: ${document.revision}\nSHA-256: ${document.sha256}\n\n`,
      ),
    );
    const original = files.get(`notices/${document.id}.txt`);

    chunks.push(original);

    if (original.at(-1) !== 10) {
      chunks.push(Buffer.from('\n'));
    }
  }

  files.set('third-party.json', Buffer.from(`${JSON.stringify(about, null, 2)}\n`));
  return { bundle: Buffer.concat(chunks), files, inputs, about };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const { values } = parseArgs({ options: { check: { type: 'boolean' } } });
    const root = resolve(import.meta.dirname, '../..');
    const result = assembleNotices({ inputRoot: root });
    const filename = resolve(root, 'THIRD-PARTY-NOTICES.txt');

    if (values.check) {
      assert(readFileSync(filename).equals(result.bundle), 'Stale assembled THIRD-PARTY-NOTICES.txt.');
    } else {
      writeFileSync(filename, result.bundle);
    }

    console.log(
      `PASS: manual notices ${values.check ? 'checked' : 'assembled'}; ${result.about.entries.length} entries; coverage=${result.about.coverage}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
