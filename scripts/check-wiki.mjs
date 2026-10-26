import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyPublication, generateWiki, hash, planPublication, publishWiki, safePath, stateFile, writePreview } from './wiki.mjs';

const work = fs.mkdtempSync(path.join(tmpdir(), 'pocket-monkey-wiki-check-'));
const root = path.join(work, 'source');
const source = path.join(root, 'docs/wiki');
const git = (args, cwd = root) => execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false',
  '-c', 'user.name=Wiki fixture', '-c', 'user.email=wiki-fixture@example.invalid', ...args], {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
let cases = 0;
const check = (label, run) => { run(); cases++; console.log(`PASS: ${label}`); };
const json = (filename, value) => fs.writeFileSync(filename, JSON.stringify(value, null, 2) + '\n');
const home = [
  '# Home', '', '[Guide](Guide.md#section)', '[Second section](Guide.md#section-1)',
  '[Same page](#home)', '[Repository](../../README.md#help)', '![Logo](../test.png)',
  '[Reference][guide]', '![Image reference][logo]', '', '[guide]: Guide.md#section', '[logo]: ../test.png',
  '', '| Item | Link |', '| --- | --- |', '| Guide | [Open](Guide.md) |',
  '', '```text', '[Example](missing-example.md)', '```', '',
].join('\n');
const navigation = {
  schemaVersion: 1, repository: 'eG-dev/MONkEY',
  pages: [{ slug: 'Home', title: 'Home', group: 'Start' }, { slug: 'Guide', title: 'Guide', group: 'Start' }],
  assets: [{ source: 'docs/test.png', destination: 'assets/test.png' }], bootstrap: { 'Home.md': hash('Bootstrap\n') },
};
const withHome = (text, run) => {
  fs.writeFileSync(path.join(source, 'Home.md'), text);
  try { run(); } finally { fs.writeFileSync(path.join(source, 'Home.md'), home); }
};
try {
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(root, 'README.md'), '# Repository\n\n## Help\n');
  fs.writeFileSync(path.join(root, 'docs/test.png'), Buffer.from([137, 80, 78, 71, 0, 255]));
  fs.writeFileSync(path.join(source, 'Home.md'), home);
  fs.writeFileSync(path.join(source, 'Guide.md'), '# Guide\n\n## Section\n\nFirst\n\n## Section\n\nSecond\n');
  json(path.join(source, 'navigation.json'), navigation);
  git(['init', '--initial-branch=main']);
  git(['add', '.']);
  git(['commit', '--quiet', '-m', 'Initial source']);
  const firstRevision = git(['rev-parse', 'HEAD']);
  const first = generateWiki({ root, revision: firstRevision });
  check('structural page/reference/image links, GFM, duplicate anchors and unchanged code examples', () => {
    const rendered = first.files.get('Home.md').toString();
    assert(rendered.includes('/wiki/Guide#section'));
    assert(rendered.includes('/wiki/Guide#section-1'));
    assert(rendered.includes('/wiki/Home#home'));
    assert(rendered.includes(`/blob/${firstRevision}/README.md#help`));
    assert(rendered.includes('https://raw.githubusercontent.com/wiki/eG-dev/MONkEY/assets/test.png'));
    assert(rendered.includes('[Example](missing-example.md)'));
    assert(rendered.includes('| Item'));
    assert(first.files.get('assets/test.png').equals(fs.readFileSync(path.join(root, 'docs/test.png'))));
    assert(first.files.get('_Sidebar.md').toString().includes('/wiki/Guide'));
  });
  check('deterministic rendering', () => assert.deepEqual([...generateWiki({ root, revision: firstRevision }).files], [...first.files]));
  for (const [label, text, error] of [
    ['missing page', '# Home\n\n[Bad](missing.md)', /Missing Wiki link/],
    ['missing anchor', '# Home\n\n[Bad](Guide.md#absent)', /Missing Wiki anchor/],
    ['path traversal', '# Home\n\n[Bad](../../../outside.md)', /Unsafe path/],
    ['unsafe scheme', '# Home\n\n[Bad](javascript:alert)', /Unsupported URL scheme/],
    ['raw HTML', '# Home\n\n<img src="test.png">', /raw HTML/],
    ['unselected image', '# Home\n\n![Bad](../../README.md)', /explicitly selected/],
  ]) check(`reject ${label}`, () => withHome(text, () => assert.throws(() => generateWiki({ root, revision: firstRevision }), error)));
  check('duplicate navigation rejected', () => {
    json(path.join(source, 'navigation.json'), { ...navigation, pages: [...navigation.pages, navigation.pages[0]] });
    try { assert.throws(() => generateWiki({ root, revision: firstRevision }), /Duplicate Wiki page/); }
    finally { json(path.join(source, 'navigation.json'), navigation); }
  });
  check('case-insensitive page collisions rejected', () => {
    json(path.join(source, 'navigation.json'), { ...navigation, pages: [...navigation.pages, { slug: 'HOME', title: 'Collision', group: 'Start' }] });
    try { assert.throws(() => generateWiki({ root, revision: firstRevision }), /Duplicate Wiki page/); }
    finally { json(path.join(source, 'navigation.json'), navigation); }
  });
  const preview = path.join(work, 'preview');
  writePreview(preview, first);
  check('identical publication is a no-op', () => assert.equal(planPublication(preview, first).changes.length, 0));
  check('CLI comparison lists removals without changing the inspected checkout', () => {
    const output = execFileSync(process.execPath, [fileURLToPath(new URL('./wiki.mjs', import.meta.url)), '--check-directory', preview], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert(output.includes('REMOVE Guide.md'));
    for (const [relative, bytes] of first.files) assert(fs.readFileSync(path.join(preview, relative)).equals(bytes));
    assert(!fs.existsSync(path.join(preview, 'Getting-Started.md')));
  });
  check('CLI rejects publication outside trusted main before any network operation', () => {
    assert.throws(() => execFileSync(process.execPath, [fileURLToPath(new URL('./wiki.mjs', import.meta.url)), '--publish'], {
      env: { ...process.env, GITHUB_REF: 'refs/pull/1/merge', WIKI_PUBLISH_TOKEN: 'fixture-not-a-secret' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }), /Only trusted main may publish/);
  });
  for (const [label, value, error] of [
    ['null ownership manifest', null, /Invalid Wiki ownership manifest/],
    ['unknown ownership schema', { ...first.state, schemaVersion: 2 }, /Unknown Wiki ownership schema/],
    ['wrong repository ownership', { ...first.state, repository: 'unrelated/repository' }, /Wrong Wiki repository ownership/],
    ['invalid content hash', { ...first.state, files: { 'Home.md': 'not-a-hash' } }, /Invalid managed content hash/],
  ]) check(`reject ${label}`, () => {
    const original = fs.readFileSync(path.join(preview, stateFile));
    json(path.join(preview, stateFile), value);
    try { assert.throws(() => planPublication(preview, first), error); }
    finally { fs.writeFileSync(path.join(preview, stateFile), original); }
  });
  check('managed direct edits refused before any writes', () => {
    fs.writeFileSync(path.join(preview, 'Home.md'), 'Manual edit');
    assert.throws(() => planPublication(preview, first), /was edited/);
    fs.writeFileSync(path.join(preview, 'Home.md'), first.files.get('Home.md'));
  });
  check('managed deletion refused', () => {
    fs.unlinkSync(path.join(preview, 'Guide.md'));
    assert.throws(() => planPublication(preview, first), /disappeared/);
    fs.writeFileSync(path.join(preview, 'Guide.md'), first.files.get('Guide.md'));
  });
  check('unmanaged collision refused, known bootstrap adopted', () => {
    const collision = path.join(work, 'collision');
    fs.mkdirSync(collision);
    fs.writeFileSync(path.join(collision, 'Home.md'), 'Someone else wrote this');
    assert.throws(() => planPublication(collision, first), /Bootstrap Wiki page differs/);
    fs.writeFileSync(path.join(collision, 'Home.md'), 'Bootstrap\n');
    fs.writeFileSync(path.join(collision, '_Sidebar.md'), 'Existing sidebar');
    assert.throws(() => planPublication(collision, first), /Unmanaged Wiki collision/);
    assert.equal(fs.readFileSync(path.join(collision, 'Home.md'), 'utf8'), 'Bootstrap\n');
    fs.unlinkSync(path.join(collision, '_Sidebar.md'));
    applyPublication(collision, planPublication(collision, first));
    assert.equal(planPublication(collision, first).changes.length, 0);
  });
  check('unsafe ownership paths refused', () => {
    const original = fs.readFileSync(path.join(preview, stateFile));
    const state = JSON.parse(original);
    state.files['../outside.md'] = hash('outside');
    json(path.join(preview, stateFile), state);
    try { assert.throws(() => planPublication(preview, first), /Unsafe path/); }
    finally { fs.writeFileSync(path.join(preview, stateFile), original); }
    assert.throws(() => safePath(preview, '.git/config'), /Unsafe path/);
  });
  check('symlink directory refused', () => {
    const outside = path.join(work, 'outside');
    const linked = path.join(work, 'linked');
    fs.mkdirSync(outside);
    fs.mkdirSync(linked);
    fs.symlinkSync(outside, path.join(linked, 'assets'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => planPublication(linked, first), /Symlink/);
    assert.throws(() => planPublication(path.join(linked, 'assets'), first), /Symlink root/);
    assert.deepEqual(fs.readdirSync(outside), []);
  });
  const remote = path.join(work, 'remote.git');
  const seed = path.join(work, 'seed');
  git(['init', '--bare', '--initial-branch=wiki-test', remote]);
  git(['clone', '--quiet', remote, seed]);
  fs.writeFileSync(path.join(seed, 'Home.md'), 'Bootstrap\n');
  fs.writeFileSync(path.join(seed, 'Notes.md'), 'Unmanaged notes\n');
  git(['add', '.'], seed);
  git(['commit', '--quiet', '-m', 'Initial Wiki'], seed);
  git(['push', '--quiet', 'origin', 'HEAD'], seed);
  const publish = (generated, extra = {}) => publishWiki({ root, generated, remote: remote.replaceAll('\\', '/'), token: 'fixture-not-a-secret', ...extra });
  check('real local Git publication and no-op preserve remote history', () => {
    const result = publish(first);
    assert(result.changed);
    const repeated = publish(first);
    assert.equal(repeated.changed, false);
    assert.equal(repeated.head, result.head);
    assert.equal(git(['show', 'HEAD:Notes.md'], remote), 'Unmanaged notes');
  });
  fs.writeFileSync(path.join(source, 'Home.md'), '# Home\n\nUpdated guide.\n');
  json(path.join(source, 'navigation.json'), { ...navigation, pages: [navigation.pages[0]], assets: [] });
  git(['add', '.']);
  git(['commit', '--quiet', '-m', 'Remove managed page and image']);
  const second = generateWiki({ root, revision: git(['rev-parse', 'HEAD']) });
  check('source removals delete only owned files', () => {
    const result = publish(second);
    assert(result.paths.includes('Guide.md'));
    assert(result.paths.includes('assets/test.png'));
    const tracked = git(['ls-tree', '-r', '--name-only', 'HEAD'], remote).split('\n');
    assert(!tracked.includes('Guide.md'));
    assert(!tracked.includes('assets/test.png'));
    assert(tracked.includes('Notes.md'));
  });
  check('older source cannot overwrite newer publication', () => assert.throws(() => publish(first), /older or unrelated/));
  fs.appendFileSync(path.join(source, 'Home.md'), '\nThird source revision.\n');
  git(['add', '.']);
  git(['commit', '--quiet', '-m', 'Third source']);
  const third = generateWiki({ root, revision: git(['rev-parse', 'HEAD']) });
  check('concurrent Wiki commit refused without overwrite', () => {
    const publishedHome = git(['show', 'HEAD:Home.md'], remote);
    assert.throws(() => publish(third, { beforePush: () => {
      git(['pull', '--quiet', '--ff-only'], seed);
      fs.writeFileSync(path.join(seed, 'Notes.md'), 'Concurrent unmanaged edit\n');
      git(['add', 'Notes.md'], seed);
      git(['commit', '--quiet', '-m', 'Concurrent edit'], seed);
      git(['push', '--quiet', 'origin', 'HEAD'], seed);
    } }), /changed concurrently/);
    assert.equal(git(['show', 'HEAD:Home.md'], remote), publishedHome);
    assert.equal(git(['show', 'HEAD:Notes.md'], remote), 'Concurrent unmanaged edit');
  });
  console.log(`PASS: ${cases} Wiki rendering, ownership and real local Git publication checks; no GitHub writes`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}