import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, 'backend/PocketMonkey.Storage/Migrations');
const entries = fs.readdirSync(directory, { withFileTypes: true });
assert(entries.every(entry => entry.isFile()), 'Keep generated EF artifacts directly in Migrations');
const files = entries.filter(entry => entry.name.endsWith('.cs')).map(entry => entry.name);
let snapshots = 0;
for (const filename of files) {
  const source = fs.readFileSync(path.join(directory, filename), 'utf8');
  assert(/\bnamespace PocketMonkey\.Storage\.Migrations\s*[;{]/.test(source), `${filename}: wrong EF namespace`);
  if (/\bclass\s+\w+\s*:\s*ModelSnapshot\b/.test(source)) {
    snapshots++;
  } else {
    const counterpart = filename.endsWith('.Designer.cs')
      ? filename.replace('.Designer.cs', '.cs')
      : filename.replace(/\.cs$/, '.Designer.cs');
    assert(files.includes(counterpart), `${filename}: missing ${counterpart}`);
  }
}
assert.equal(snapshots, 1, 'Keep exactly one EF model snapshot');
console.log('PASS: EF namespaces, matching implementation/designer pairs and one snapshot; placement is enforced by the build');