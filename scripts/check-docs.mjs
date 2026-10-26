import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { base: { type: 'string' } } });
if (values.base && !/^0+$/.test(values.base)) {
  let changed;
  try {
    const entries = execFileSync('git', ['diff', '--name-status', '-z', '--no-renames', values.base, 'HEAD', '--'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).split('\0');
    changed = [];
    for (let index = 0; index < entries.length - 1; index += 2) {
      changed.push({ status: entries[index], filename: entries[index + 1] });
    }
  } catch {
    console.log('Documentation comparison base unavailable; checking all maintained documentation');
  }
  if (changed && !changed.some(({ status, filename }) => status === 'D' || filename.endsWith('.md')
    || ['scripts/check-docs.mjs', 'scripts/wiki.mjs', 'scripts/check-wiki.mjs'].includes(filename) || filename.startsWith('docs/wiki/')
    || /^tests\/e2e\/package(-lock)?\.json$/.test(filename))) {
    console.log('SKIP: no documentation/tooling changes or deleted link targets');
    process.exit(0);
  }
}

const require = createRequire(path.join(root, 'tests/e2e/package.json'));
const YAML = require('yaml');
const directories = ['.github/instructions', 'docs/ADR', 'docs/design', 'docs/wiki', 'plans/migration'];
const markdown = ['README.md', '.github/copilot-instructions.md', '.github/skills/backend-data-design/SKILL.md', 'docs/development.md'];
for (const directory of directories) {
  markdown.push(...fs.readdirSync(path.join(root, directory)).filter(name => name.endsWith('.md')).map(name => `${directory}/${name}`));
}
const slug = value => value.replace(/<[^>]+>/g, '').replace(/[`*_~]/g, '').toLowerCase()
  .replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
let links = 0;
for (const relative of markdown) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, 'utf8');
  if (relative.startsWith('.github/instructions/') || relative.endsWith('/SKILL.md')) {
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert(frontmatter, `${relative}: missing metadata`);
    const metadata = YAML.parse(frontmatter[1], { uniqueKeys: true });
    assert.equal(typeof metadata.description, 'string', `${relative}: missing description`);
    assert.equal(typeof (relative.endsWith('/SKILL.md') ? metadata.name : metadata.applyTo), 'string', `${relative}: missing discovery metadata`);
  }
  for (const match of source.matchAll(/\[[^\]]+\]\(([^\s)]+)\)/g)) {
    const target = match[1];
    if (/^[a-z]+:/i.test(target)) continue;
    const [pathname, fragment] = target.split('#');
    const destination = pathname ? path.resolve(path.dirname(filename), decodeURIComponent(pathname)) : filename;
    assert(fs.existsSync(destination), `${relative}: broken ${target}`);
    if (fragment) {
      const headings = [...fs.readFileSync(destination, 'utf8').matchAll(/^#{1,6}\s+(.+)$/gm)].map(heading => slug(heading[1].trim()));
      assert(headings.includes(decodeURIComponent(fragment)), `${relative}: missing anchor ${target}`);
    }
    links++;
  }
}
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
console.log(`PASS: instruction metadata, ${links} local links/anchors and ${diagrams} Mermaid diagrams`);