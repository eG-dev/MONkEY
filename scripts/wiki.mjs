import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(repositoryRoot, 'tests/e2e/package.json'));
const { remark } = await import(pathToFileURL(require.resolve('remark')).href);
const { default: gfm } = await import(pathToFileURL(require.resolve('remark-gfm')).href);
const { default: Slugger } = await import(pathToFileURL(require.resolve('github-slugger')).href);
const markdown = remark().use(gfm);
export const stateFile = '.pocket-monkey-wiki.json';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function safePath(root, relative) {
  assert.equal(typeof relative, 'string', 'Expected a relative path');
  let ancestor = path.resolve(root);
  while (true) {
    const info = fs.lstatSync(ancestor, { throwIfNoEntry: false });
    assert(!info?.isSymbolicLink(), `Symlink root not allowed: ${ancestor}`);
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const parts = relative.split('/');
  assert(parts.every(part => /^[A-Za-z0-9_.-]+$/.test(part)
    && part !== '.' && part !== '..' && part.toLowerCase() !== '.git'), `Unsafe path: ${relative}`);
  let current = path.resolve(root);
  for (const part of parts) {
    current = path.join(current, part);
    try {
      assert(!fs.lstatSync(current).isSymbolicLink(), `Symlink not allowed: ${relative}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return current;
}

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

function anchors(source) {
  const found = new Set();
  const slugger = new Slugger();
  visit(markdown.parse(source), node => {
    if (node.type !== 'heading') return;
    let text = '';
    visit(node, child => { if (typeof child.value === 'string') text += child.value; });
    found.add(slugger.slug(text));
  });
  return found;
}

export function generateWiki({ root = repositoryRoot, revision }) {
  assert(/^[a-f0-9]{40}$/.test(revision), 'A full source commit is required');
  const sourceRoot = path.join(root, 'docs/wiki');
  const navigation = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'navigation.json'), 'utf8'));
  assert.equal(navigation.schemaVersion, 1);
  assert.equal(navigation.repository, 'eG-dev/MONkEY');
  const repoUrl = `https://github.com/${navigation.repository}`;
  const wikiUrl = `${repoUrl}/wiki`;
  const files = new Map();
  const destinations = new Set();
  const pages = new Map();
  const assets = new Map();
  for (const page of navigation.pages) {
    assert(/^[A-Z][A-Za-z0-9-]*$/.test(page.slug), 'Invalid Wiki page slug');
    assert.equal(typeof page.title, 'string');
    assert.equal(typeof page.group, 'string');
    const filename = safePath(sourceRoot, `${page.slug}.md`);
    assert(![...pages.keys()].some(existing => existing.toLowerCase() === filename.toLowerCase()), 'Duplicate Wiki page');
    pages.set(filename, page);
  }
  assert([...pages.values()].some(page => page.slug === 'Home'), 'Wiki Home is required');
  const add = (relative, bytes) => {
    safePath(sourceRoot, relative);
    assert(relative !== stateFile, 'Reserved state path');
    assert(!destinations.has(relative.toLowerCase()), `Duplicate Wiki destination: ${relative}`);
    destinations.add(relative.toLowerCase());
    files.set(relative, Buffer.from(bytes));
  };
  for (const asset of navigation.assets) {
    assert(asset.destination.startsWith('assets/'), 'Wiki assets must stay under assets/');
    assert(/\.(png|jpe?g|gif)$/i.test(asset.destination), 'Unsupported Wiki image type');
    const source = safePath(root, asset.source);
    assert(!assets.has(source), 'Duplicate Wiki asset source');
    assets.set(source, asset.destination);
    add(asset.destination, fs.readFileSync(source));
  }
  for (const [filename, page] of pages) {
    const tree = markdown.parse(fs.readFileSync(filename, 'utf8'));
    const imageReferences = new Set();
    visit(tree, node => { if (node.type === 'imageReference') imageReferences.add(node.identifier); });
    visit(tree, node => {
      assert(node.type !== 'html', 'Use Markdown, not raw HTML, in Wiki sources');
      if (!['link', 'image', 'definition'].includes(node.type)) return;
      const image = node.type === 'image' || imageReferences.has(node.identifier);
      const url = node.url;
      if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        assert(/^(https?:|mailto:)/i.test(url), `Unsupported URL scheme: ${url}`);
        return;
      }
      assert(!url.startsWith('//') && !url.startsWith('/'), `Use repository-relative links: ${url}`);
      const fragmentIndex = url.indexOf('#');
      const pathname = decodeURIComponent(fragmentIndex < 0 ? url : url.slice(0, fragmentIndex));
      const fragment = fragmentIndex < 0 ? '' : url.slice(fragmentIndex);
      const target = pathname ? path.resolve(path.dirname(filename), pathname) : filename;
      const relative = path.relative(root, target).split(path.sep).join('/');
      safePath(root, relative);
      assert(fs.existsSync(target), `Missing Wiki link target: ${url}`);
      if (fragment && target.endsWith('.md')) {
        assert(anchors(fs.readFileSync(target, 'utf8')).has(decodeURIComponent(fragment.slice(1))), `Missing Wiki anchor: ${url}`);
      }
      if (image) {
        assert(assets.has(target), `Image must be explicitly selected: ${url}`);
        node.url = `https://raw.githubusercontent.com/wiki/${navigation.repository}/${assets.get(target)}`;
      } else if (pages.has(target)) {
        node.url = `${wikiUrl}/${pages.get(target).slug}${fragment}`;
      } else {
        node.url = `${repoUrl}/blob/${revision}/${relative.split('/').map(encodeURIComponent).join('/')}${fragment}`;
      }
    });
    const source = `docs/wiki/${page.slug}.md`;
    add(`${page.slug}.md`, markdown.stringify(tree) + '\n---\n\n'
      + `[Edit source](${repoUrl}/edit/main/${source}) | [Source snapshot](${repoUrl}/blob/${revision}/${source})\n`);
  }
  const groups = [...new Set(navigation.pages.map(page => page.group))];
  const sidebar = { type: 'root', children: groups.flatMap(group => [
    { type: 'heading', depth: 2, children: [{ type: 'text', value: group }] },
    { type: 'list', ordered: false, spread: false, children: navigation.pages.filter(page => page.group === group).map(page => ({
      type: 'listItem', spread: false, children: [{ type: 'paragraph', children: [{ type: 'link', url: `${wikiUrl}/${page.slug}`,
        children: [{ type: 'text', value: page.title }] }] }],
    })) },
  ]) };
  add('_Sidebar.md', markdown.stringify(sidebar));
  add('_Footer.md', `English documentation from [source ${revision.slice(0, 7)}](${repoUrl}/tree/${revision}). Use matching release assets for version-specific deployment.\n`);
  const state = { schemaVersion: 1, repository: navigation.repository, sourceRevision: revision,
    files: Object.fromEntries([...files].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([name, bytes]) => [name, hash(bytes)])) };
  files.set(stateFile, Buffer.from(JSON.stringify(state, null, 2) + '\n'));
  return { files, state, bootstrap: navigation.bootstrap };
}

export function planPublication(directory, generated) {
  const manifestPath = safePath(directory, stateFile);
  const hasManifest = fs.existsSync(manifestPath);
  const previous = hasManifest ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
  if (hasManifest) {
    assert(previous && typeof previous === 'object' && !Array.isArray(previous), 'Invalid Wiki ownership manifest');
    assert.equal(previous.schemaVersion, 1, 'Unknown Wiki ownership schema');
    assert.equal(previous.repository, generated.state.repository, 'Wrong Wiki repository ownership');
    assert(/^[a-f0-9]{40}$/.test(previous.sourceRevision), 'Invalid previous source revision');
    assert(previous.files && typeof previous.files === 'object' && !Array.isArray(previous.files));
    for (const [relative, expected] of Object.entries(previous.files)) {
      assert(relative !== stateFile, 'Ownership manifest cannot own itself');
      assert(/^[a-f0-9]{64}$/.test(expected), 'Invalid managed content hash');
      const existing = safePath(directory, relative);
      assert(fs.existsSync(existing), `Managed Wiki file disappeared: ${relative}`);
      assert.equal(hash(fs.readFileSync(existing)), expected, `Managed Wiki file was edited: ${relative}`);
    }
  }
  const changes = [];
  for (const [relative, bytes] of generated.files) {
    const destination = safePath(directory, relative);
    const exists = fs.existsSync(destination);
    if (relative !== stateFile && exists && !Object.hasOwn(previous?.files ?? {}, relative)) {
      assert(Object.hasOwn(generated.bootstrap ?? {}, relative), `Unmanaged Wiki collision: ${relative}`);
      assert.equal(hash(fs.readFileSync(destination)), generated.bootstrap[relative], `Bootstrap Wiki page differs: ${relative}`);
    }
    if (!exists || !fs.readFileSync(destination).equals(bytes)) changes.push({ relative, bytes });
  }
  for (const relative of Object.keys(previous?.files ?? {})) {
    if (!generated.files.has(relative)) changes.push({ relative, bytes: null });
  }
  return { changes, previous };
}

export function applyPublication(directory, plan) {
  for (const { relative, bytes } of plan.changes) {
    const destination = safePath(directory, relative);
    if (bytes === null) {
      fs.unlinkSync(destination);
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, bytes);
    }
  }
}

export function writePreview(directory, generated) {
  const plan = planPublication(directory, generated);
  applyPublication(directory, plan);
  return plan;
}

export function publishWiki({ root = repositoryRoot, generated, remote, token, onPlan = () => {}, beforePush = () => {} }) {
  assert(token, 'WIKI_PUBLISH_TOKEN is required');
  const work = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-wiki-publish-'));
  const checkout = path.join(work, 'wiki');
  const askpass = path.join(work, 'askpass');
  fs.writeFileSync(askpass, '#!/bin/sh\ncase "$1" in\n*Username*) printf "%s\\n" x-access-token ;;\n*Password*) printf "%s\\n" "$WIKI_PUBLISH_TOKEN" ;;\n*) exit 1 ;;\nesac\n', { mode: 0o700 });
  const env = { ...process.env, WIKI_PUBLISH_TOKEN: token, GIT_ASKPASS: askpass.replaceAll('\\', '/'),
    GIT_TERMINAL_PROMPT: '0', GIT_TRACE: '0', GIT_TRACE_CURL: '0', LC_ALL: 'C' };
  const git = (args, cwd = work) => execFileSync('git', ['-c', 'credential.helper=', '-c', 'core.autocrlf=false',
    '-c', 'commit.gpgsign=false', ...args], { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git(['clone', '--quiet', '--', remote, checkout]);
    const branch = git(['symbolic-ref', '--short', 'HEAD'], checkout);
    const before = git(['rev-parse', 'HEAD'], checkout);
    const plan = planPublication(checkout, generated);
    if (plan.previous) {
      try {
        git(['merge-base', '--is-ancestor', plan.previous.sourceRevision, generated.state.sourceRevision], root);
      } catch {
        throw new Error('Refusing an older or unrelated source revision');
      }
    }
    onPlan(plan);
    if (plan.changes.length === 0) return { changed: false, head: before, paths: [] };
    applyPublication(checkout, plan);
    git(['add', '--all', '--force', '--', ...plan.changes.map(change => change.relative)], checkout);
    git(['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
      'commit', '--quiet', '-m', `Publish Wiki from ${generated.state.sourceRevision}`], checkout);
    beforePush();
    const current = git(['ls-remote', '--exit-code', 'origin', `refs/heads/${branch}`], checkout).split(/\s+/)[0];
    assert.equal(current, before, 'Wiki changed concurrently; publication refused');
    git(['push', '--porcelain', 'origin', `HEAD:refs/heads/${branch}`], checkout);
    return { changed: true, head: git(['rev-parse', 'HEAD'], checkout), paths: plan.changes.map(change => change.relative) };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { output: { type: 'string', default: '.local/wiki-preview' },
      revision: { type: 'string' }, 'check-directory': { type: 'string' }, publish: { type: 'boolean', default: false } } });
    assert(!(values.publish && values['check-directory']), 'Choose publication or read-only comparison, not both');
    const revision = values.revision ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
    const generated = generateWiki({ revision });
    const printPlan = plan => {
      for (const change of plan.changes) console.log(`${change.bytes === null ? 'REMOVE' : 'WRITE'} ${change.relative}`);
    };
    if (values.publish) {
      assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Only trusted main may publish');
      assert.equal(process.env.GITHUB_REPOSITORY, generated.state.repository, 'Wrong publishing repository');
      assert.equal(process.env.GITHUB_SHA, revision, 'Publishing revision must match the workflow');
      assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim(), revision);
      assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: repositoryRoot, encoding: 'utf8' }).trim(), '', 'Publish only clean source');
      const result = publishWiki({ generated, remote: `https://github.com/${generated.state.repository}.wiki.git`,
        token: process.env.WIKI_PUBLISH_TOKEN, onPlan: printPlan });
      console.log(result.changed ? `Published ${result.paths.length} managed Wiki changes at ${result.head}` : 'Wiki is unchanged; no commit or push');
    } else {
      const plan = values['check-directory'] ? planPublication(path.resolve(values['check-directory']), generated)
        : writePreview(path.resolve(values.output), generated);
      printPlan(plan);
      console.log(`Generated ${generated.files.size} Wiki files for local review; no remote changes`);
    }
  } catch (error) {
    const token = process.env.WIKI_PUBLISH_TOKEN;
    console.error(token ? error.message.replaceAll(token, '[REDACTED]') : error.message);
    process.exitCode = 1;
  }
}