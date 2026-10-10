import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import MessageFormat from '@messageformat/core';
import { parse } from '@messageformat/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/i18n');

function flatten(catalog, prefix = '', result = {}) {
  assert(catalog && typeof catalog === 'object' && !Array.isArray(catalog), 'Catalog must be an object');
  for (const [key, value] of Object.entries(catalog)) {
    const name = `${prefix}${key}`;
    if (typeof value === 'string') result[name] = value;
    else flatten(value, `${name}.`, result);
  }
  return result;
}

function argumentsOf(message) {
  const argumentsUsed = new Set();
  function visit(tokens) {
    for (const token of tokens) {
      if ('arg' in token) argumentsUsed.add(`${token.arg}:${token.type}:${token.key ?? ''}:${token.pluralOffset ?? 0}`);
      if ('cases' in token) for (const branch of token.cases) visit(branch.tokens);
      if (Array.isArray(token.param)) visit(token.param);
    }
  }
  visit(parse(message));
  return [...argumentsUsed].sort();
}

function validate(language, source, translated) {
  const sourceMessages = flatten(source);
  const translations = flatten(translated);
  assert.deepEqual(Object.keys(translations).sort(), Object.keys(sourceMessages).sort(), `${language}: keys differ`);
  const compiler = new MessageFormat(language);
  for (const [key, message] of Object.entries(translations)) {
    assert(message.trim(), `${language}.${key}: empty message`);
    compiler.compile(message);
    assert.deepEqual(argumentsOf(message), argumentsOf(sourceMessages[key]), `${language}.${key}: placeholders differ`);
  }
}

function catalogFiles(directory, prefix = '') {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = `${prefix}${entry.name}`;
      if (entry.isDirectory()) return catalogFiles(path.join(directory, entry.name), `${relative}/`);
      return entry.name.endsWith('.json') ? [relative] : [];
    })
    .sort();
}

const sourceFiles = catalogFiles(path.join(root, 'en'));
assert(sourceFiles.length, 'English source catalog is missing');
let checked = 0;
for (const entry of fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  const directory = path.join(root, entry.name);
  assert.deepEqual(catalogFiles(directory), sourceFiles, `${entry.name}: catalog files differ`);
  for (const filename of sourceFiles) {
    const source = JSON.parse(fs.readFileSync(path.join(root, 'en', filename), 'utf8'));
    const catalog = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
    validate(entry.name, source, catalog);
    checked++;
  }
}

const example = { greeting: 'Hello {name}', count: '{count, plural, one {One} other {Many}}' };
assert.throws(() => validate('de', example, { greeting: 'Hallo {name}' }));
assert.throws(() => validate('de', example, { ...example, extra: 'Unexpected' }));
assert.throws(() => validate('de', example, { ...example, greeting: 'Hallo {user}' }));
assert.throws(() => validate('de', example, { ...example, count: '{count, plural, one {One}' }));
assert.throws(() => validate('de', example, { ...example, greeting: 123 }));
for (const language of ['de', 'en']) {
  const format = new MessageFormat(language).compile(example.count);
  assert.notEqual(format({ count: 1 }), format({ count: 2 }));
}
console.log(`PASS: ${checked} catalogs; key/placeholder/ICU checks; malformed fixtures rejected; German/English plural forms compiled`);
