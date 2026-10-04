import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(os.tmpdir(), 'pocket-monkey-guardrail-tools', 'package.json'));
const YAML = require('yaml');
const { minimatch } = require('minimatch');
const expected = {
  'revamp-web.instructions.md': ['revamp/web/src/app/account.ts', 'revamp/web/public/i18n/de/accounts.json'],
  'revamp-backend.instructions.md': ['revamp/backend/Api/Program.cs', 'revamp/backend/Api/Api.csproj'],
  'revamp-tests.instructions.md': ['revamp/tests/e2e/accounts.spec.ts', 'revamp/tests/integration/LedgerTests.cs'],
  'revamp-deployment.instructions.md': ['revamp/deploy/Dockerfile', '.github/workflows/revamp-build.yml', '.github/workflows/revamp-release.yaml'],
  'revamp-translations.instructions.md': ['revamp/web/public/i18n/de/accounts.json', 'revamp/web/public/i18n/en/accounts.json'],
};
const legacy = [
  'WebApp/Program.cs',
  'Data/Entities/Account.cs',
  'Functions/Workers/PocketMoneyCredit.cs',
  'BusinessLogic/Services/AccountManagementService.cs',
  '.github/workflows/publish-monkey-webapp.yml',
  '.github/workflows/publish-monkey-functions.yml',
  'Directory.Packages.props',
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
}
console.log(`PASS: YAML metadata; ${matches} intended path matches; ${legacy.length * Object.keys(expected).length} legacy exclusions`);

const directories = ['.github/instructions', 'docs/ADR', 'plans/migration'];
const markdown = ['.github/copilot-instructions.md'];
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
  assert(!/\b(revamp|migration|legacy|Step 0)\b/i.test(source), `${name}: not greenfield`);
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