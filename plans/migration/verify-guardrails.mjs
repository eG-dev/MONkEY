import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const testTools = path.join(root, 'tests/e2e');
const toolingRoot = fs.existsSync(path.join(testTools, 'node_modules/yaml/package.json'))
  ? testTools : path.join(os.tmpdir(), 'pocket-monkey-guardrail-tools');
const require = createRequire(path.join(toolingRoot, 'package.json'));
const YAML = require('yaml');
const { minimatch } = require('minimatch');
const expected = {
  'web.instructions.md': ['web/src/app/app.ts', 'web/public/i18n/de/shell.json'],
  'backend.instructions.md': ['backend/PocketMonkey.Host/Program.cs', 'backend/PocketMonkey.Host/PocketMonkey.Host.csproj', 'backend/PocketMonkey.Storage/PocketMonkey.Storage.csproj'],
  'csharp.instructions.md': ['backend/PocketMonkey.Host/Program.cs', 'backend/PocketMonkey.Storage/PocketMonkeyDbContext.cs', 'tests/integration/RuntimeChecks/Program.cs'],
  'typescript.instructions.md': ['web/src/foundation-server.ts', 'web/scripts/dev.mjs', 'tests/e2e/specs/shell.spec.ts'],
  'tests.instructions.md': ['tests/e2e/specs/shell.spec.ts', 'tests/integration/RuntimeChecks/Program.cs'],
  'deployment.instructions.md': ['deploy/Dockerfile', '.github/workflows/ci.yml', '.github/workflows/release.yaml'],
  'translations.instructions.md': ['web/public/i18n/de/shell.json', 'web/public/i18n/en/shell.json'],
};
const legacy = [
  'WebApp/Program.cs',
  'Data/Entities/Account.cs',
  'Functions/Workers/PocketMoneyCredit.cs',
  'BusinessLogic/Services/AccountManagementService.cs',
  'MONkEY.sln',
];

let matches = 0;
for (const [name, fixtures] of Object.entries(expected)) {
  const source = fs.readFileSync(path.join(root, '.github/instructions', name), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert(frontmatter, `${name}: missing frontmatter`);
  const metadata = YAML.parse(frontmatter[1], { uniqueKeys: true });
  assert.equal(typeof metadata.description, 'string');
  assert(metadata.description.length > 30);
  assert.equal(typeof metadata.applyTo, 'string');
  const patterns = metadata.applyTo.split(',').map(value => value.trim());
  assert(patterns.every(pattern => pattern && pattern !== '**'));
  const applies = filename => patterns.some(pattern => minimatch(filename, pattern, { dot: true }));
  for (const fixture of fixtures) {
    assert(applies(fixture), `${name}: must match ${fixture}`);
    matches++;
  }
  for (const filename of legacy) assert(!applies(filename), `${name}: must exclude ${filename}`);
  if (name === 'csharp.instructions.md') {
    for (const filename of ['web/src/app/app.ts', 'tests/e2e/specs/shell.spec.ts']) {
      assert(!applies(filename), `${name}: must exclude non-C# ${filename}`);
    }
  }
  if (name === 'typescript.instructions.md') {
    for (const filename of ['backend/PocketMonkey.Host/Program.cs', 'web/public/i18n/de/shell.json']) {
      assert(!applies(filename), `${name}: must exclude unrelated language ${filename}`);
    }
  }
}
console.log(`PASS: YAML metadata; ${matches} intended path matches; ${legacy.length * Object.keys(expected).length} legacy exclusions`);

const backendDesignSkill = '.github/skills/backend-data-design/SKILL.md';
const skillSource = fs.readFileSync(path.join(root, backendDesignSkill), 'utf8');
const skillFrontmatter = skillSource.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
assert(skillFrontmatter, `${backendDesignSkill}: missing frontmatter`);
const skillMetadata = YAML.parse(skillFrontmatter[1], { uniqueKeys: true });
assert.equal(skillMetadata.name, path.basename(path.dirname(backendDesignSkill)));
assert(/^[a-z0-9-]{1,64}$/.test(skillMetadata.name));
assert.equal(typeof skillMetadata.description, 'string');
assert(skillMetadata.description.length > 30 && skillMetadata.description.length <= 1024);
console.log('PASS: backend/data design skill discovery metadata and folder/name match');

for (const retired of ['BusinessLogic', 'Data', 'Functions', 'Identity', 'Notifications.Email', 'Support', 'WebApp', 'MONkEY.sln', 'revamp',
  '.github/workflows/publish-monkey-webapp.yml', '.github/workflows/publish-monkey-functions.yml']) {
  assert(!fs.existsSync(path.join(root, retired)), `Retired source remains: ${retired}`);
}
for (const required of ['PocketMonkey.slnx', 'global.json', 'Directory.Build.props', 'Directory.Packages.props', 'NuGet.Config',
  'web/package-lock.json', 'backend/PocketMonkey.Host/Program.cs', 'tests/e2e/package-lock.json', 'deploy/Dockerfile']) {
  assert(fs.existsSync(path.join(root, required)), `Root application input is missing: ${required}`);
}
const foundation = YAML.parse(fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8'));
assert.deepEqual(foundation.on.push.branches, ['main']);
assert(!foundation.on.push.paths && !foundation.on.push['paths-ignore'], 'All main changes must trigger CI');
assert(Object.hasOwn(foundation.on, 'pull_request'));
assert(!foundation.on.pull_request?.paths && !foundation.on.pull_request?.['paths-ignore']);
assert(!Object.hasOwn(foundation.on, 'pull_request_target'));
assert.deepEqual(foundation.permissions, { contents: 'read' });
for (const job of Object.values(foundation.jobs)) {
  for (const step of job.steps) {
    if (step.uses) assert(/^actions\/[a-z-]+@[a-f0-9]{40}$/.test(step.uses), `Unpinned action: ${step.uses}`);
  }
}
assert(!JSON.stringify(foundation).includes('secrets.'), 'Foundation verification must not require secrets');
assert(Object.values(foundation.jobs).every(job => !job.defaults?.run?.['working-directory']), 'CI commands must run from the repository root');
console.log('PASS: root application inputs present; legacy source absent; CI is root-scoped, read-only, unfiltered, secret-free, and SHA-pinned');

function validatePrereleaseWorkflow(workflow) {
  assert.deepEqual(Object.keys(workflow.on).sort(), ['push', 'workflow_dispatch']);
  assert.deepEqual(workflow.on.push.tags, ['v*-*']);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  assert.deepEqual(workflow.jobs.verify.permissions, { contents: 'read' });
  assert.equal(workflow.jobs.verify.uses, './.github/workflows/ci.yml');
  assert.deepEqual(workflow.jobs.verify.with, {
    release_tag: '${{ github.ref_name }}',
    repository_url: 'https://github.com/${{ github.repository }}',
    export_image: true,
  });
  assert(!Object.hasOwn(workflow.jobs.verify, 'secrets'));
  assert.deepEqual(workflow.jobs.draft.needs, ['identity', 'verify']);
  assert.deepEqual(workflow.jobs.draft.permissions, { contents: 'write' });
  assert.deepEqual(workflow.jobs.publish.needs, ['identity', 'verify', 'draft']);
  assert.equal(workflow.jobs.publish.environment.name, 'release');
  assert.deepEqual(workflow.jobs.publish.permissions, { actions: 'read', contents: 'write', packages: 'write' });

  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps ?? []) {
      if (step.uses) assert(/^actions\/[a-z-]+@[a-f0-9]{40}$/.test(step.uses), `Unpinned release action: ${step.uses}`);
    }
  }

  const identity = workflow.jobs.identity.steps.find(step => step.id === 'identity').run;
  assert(identity.includes('GITHUB_REF_PROTECTED'));
  assert(identity.includes('git merge-base --is-ancestor "$GITHUB_SHA" origin/main'));
  const publisher = workflow.jobs.publish.steps;
  assert.deepEqual(publisher.map(step => step.id), ['access', 'download', 'image', 'push', 'anonymous', 'assets']);
  assert(publisher.every(step => !step.uses), 'Publisher must not check out or execute source actions');
  assert(!/\bdocker\s+(build|buildx)\b/.test(publisher.map(step => step.run ?? '').join('\n')), 'Publisher must not rebuild the tested image');
  assert(publisher[0].run.includes('required_reviewers'));
  assert(publisher[0].run.includes('https://api.github.com/repos/$GH_REPO/git/commits/$REVISION'));
  assert(publisher[1].run.includes('gh run download "$GITHUB_RUN_ID"'));
  assert(publisher[1].run.includes('sha256sum --check SHA256SUMS'));
  assert(publisher[2].run.includes('org.opencontainers.image.revision'));
  assert(publisher[2].run.includes('org.pocketmonkey.build.dirty'));
  assert(publisher[3].run.includes('test "$(jq -er \'.config.digest\' manifest.json)" = "$expected_id"'));
  assert.deepEqual([...publisher[3].run.matchAll(/^\s*docker push\s+(.+)$/gm)].map(match => match[1]), ['"$IMAGE:$VERSION"']);
  assert(publisher[4].run.includes('docker --config "$anonymous" pull "$IMAGE@$DIGEST"'));
  assert(publisher[5].run.includes('--draft=false --prerelease --latest=false'));
}

const prerelease = YAML.parse(fs.readFileSync(path.join(root, '.github/workflows/ghcr-prerelease.yml'), 'utf8'), { uniqueKeys: true });
validatePrereleaseWorkflow(prerelease);
for (const change of [
  workflow => { workflow.on.pull_request = {}; },
  workflow => { workflow.jobs.verify.permissions.packages = 'write'; },
  workflow => { workflow.jobs.publish.environment.name = 'unprotected'; },
  workflow => { workflow.jobs.publish.steps[1].run = 'gh run download 123'; },
  workflow => { workflow.jobs.publish.steps[2].uses = 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'; },
  workflow => { workflow.jobs.publish.steps[2].run += '\ndocker build .'; },
  workflow => { workflow.jobs.publish.steps[3].run += '\ndocker push "$IMAGE:latest"'; },
  workflow => { workflow.jobs.publish.steps.reverse(); },
]) {
  const changed = structuredClone(prerelease);
  change(changed);
  assert.throws(() => validatePrereleaseWorkflow(changed), 'Unsafe release workflow fixture was accepted');
}
assert(Object.hasOwn(foundation.on, 'workflow_call'));
assert.equal(foundation.on.workflow_call.inputs.export_image.default, false);
const verificationSteps = foundation.jobs.foundation.steps;
const imageBuilds = verificationSteps.filter(step => step.run?.includes('npm --prefix web run build:image'));
assert.equal(imageBuilds.length, 1, 'CI must build exactly one production image');
assert(verificationSteps.findIndex(step => step.run?.includes('npm --prefix tests/e2e test')) <
  verificationSteps.findIndex(step => step.run?.includes('docker save pocket-monkey:foundation')));
console.log('PASS: protected prerelease flow, same-run tested artifact, immutable version-only pushes, anonymous pull gate; 8 unsafe workflow mutations rejected');

const backendDirectory = path.join(root, 'backend');
const migrationDirectory = path.join(backendDirectory, 'PocketMonkey.Storage/Migrations');

function csharpFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return ['bin', 'obj'].includes(entry.name) ? [] : csharpFiles(filename);
    return entry.name.endsWith('.cs') ? [filename] : [];
  });
}

const migrationArtifacts = csharpFiles(backendDirectory).filter(filename => {
  const source = fs.readFileSync(filename, 'utf8');
  return /\bclass\s+\w+\s*:\s*(?:Migration|ModelSnapshot)\b|\[Migration\(/.test(source);
});
assert(migrationArtifacts.length, 'EF migration history is missing');
for (const filename of migrationArtifacts) {
  assert.equal(path.dirname(filename), migrationDirectory,
    `${path.relative(root, filename)}: EF artifacts must live directly in PocketMonkey.Storage/Migrations`);
  const source = fs.readFileSync(filename, 'utf8');
  assert(/\bnamespace PocketMonkey\.Storage\.Migrations\s*[;{]/.test(source),
    `${path.relative(root, filename)}: wrong EF migration namespace`);
  if (filename.endsWith('.Designer.cs')) {
    assert(fs.existsSync(filename.replace('.Designer.cs', '.cs')), `${filename}: migration implementation is missing`);
  } else if (!filename.endsWith('ModelSnapshot.cs')) {
    assert(fs.existsSync(filename.replace(/\.cs$/, '.Designer.cs')), `${filename}: migration metadata is missing`);
  }
}
assert.deepEqual(migrationArtifacts.filter(filename => /\bclass\s+\w+\s*:\s*ModelSnapshot\b/.test(fs.readFileSync(filename, 'utf8'))),
  [path.join(migrationDirectory, 'PocketMonkeyDbContextModelSnapshot.cs')], 'Keep exactly one EF model snapshot');
console.log(`PASS: ${migrationArtifacts.length} EF artifacts in PocketMonkey.Storage/Migrations; matching namespace/pairs and one snapshot`);

const directories = ['.github/instructions', 'docs/ADR', 'docs/design', 'plans/migration'];
const markdown = ['README.md', '.github/copilot-instructions.md', backendDesignSkill];
if (fs.existsSync(path.join(root, 'docs/development.md'))) markdown.push('docs/development.md');
for (const directory of directories) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (name.endsWith('.md')) markdown.push(`${directory}/${name}`);
  }
}

function slug(value) {
  return value.replace(/<[^>]+>/g, '').replace(/[`*_~]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
}

let links = 0;
for (const relative of markdown) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, 'utf8');
  for (const match of source.matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (/^[a-z]+:/i.test(target)) continue;
    const [pathname, fragment] = target.split('#');
    const destination = pathname ? path.resolve(path.dirname(filename), decodeURIComponent(pathname)) : filename;
    assert(fs.existsSync(destination), `${relative}: broken ${target}`);
    if (fragment) {
      const headings = [...fs.readFileSync(destination, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)]
        .map(heading => slug(heading[1].trim()));
      assert(headings.includes(decodeURIComponent(fragment)), `${relative}: missing anchor ${target}`);
    }
    links++;
  }
}
console.log(`PASS: ${links} local Markdown links/anchors across ${markdown.length} files`);

const records = fs.readdirSync(path.join(root, 'docs/ADR')).filter(name => /^ADR-\d{4}-.+\.md$/.test(name));
for (const name of records) {
  const source = fs.readFileSync(path.join(root, 'docs/ADR', name), 'utf8');
  assert(/^## Context\s*$/m.test(source), `${name}: missing Context`);
  assert(/^## Decision\s*$/m.test(source), `${name}: missing Decision`);
  assert(!/^#{1,6}\s+(Status|Reviewers)\b/im.test(source), `${name}: disallowed section`);
  const prose = source.replace(/\]\([^)]+\)/g, ']');
  assert(!/\b(revamp|migration|legacy|Step 0)\b/i.test(prose), `${name}: not greenfield`);
}
console.log(`PASS: all ${records.length} ADRs follow required headings and greenfield wording`);

const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { default: mermaid } = await import(pathToFileURL(require.resolve('mermaid')).href);
mermaid.initialize({ startOnLoad: false });
let diagrams = 0;
for (const relative of markdown) {
  for (const match of fs.readFileSync(path.join(root, relative), 'utf8').matchAll(/```mermaid\s*\n([\s\S]*?)```/g)) {
    await mermaid.parse(match[1]);
    diagrams++;
  }
}
console.log(`PASS: ${diagrams} Mermaid diagrams parsed`);