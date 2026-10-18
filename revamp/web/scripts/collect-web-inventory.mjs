import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (filename) => JSON.parse(readFileSync(filename, 'utf8'));

function evidence(filename, root) {
  const bytes = readFileSync(filename);

  return { path: relative(root, filename).split(sep).join('/'), sha256: hash(bytes), contentBase64: bytes.toString('base64') };
}

function licenseFiles(directory, root, depth = 0) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = resolve(directory, entry.name);

    if (entry.isFile() && /^(licen[cs]e|notice|copying|copyright)([._-].*)?$/i.test(entry.name)) {
      files.push(evidence(filename, root));
    } else if (entry.isDirectory() && depth < 2 && /^(licen[cs]es?|notices?)$/i.test(entry.name)) {
      files.push(...licenseFiles(filename, root, depth + 1));
    }
  }

  return files.sort((left, right) => (left.path < right.path ? -1 : left.path > right.path ? 1 : 0));
}

export function collectWebInventory(root = webRoot) {
  const dist = resolve(root, 'dist/web');
  const lockfile = resolve(root, 'package-lock.json');
  const lock = json(lockfile);
  const build = json(resolve(root, 'src/generated/about/build-info.json'));
  const components = new Map();
  const inputs = [];
  const assets = [];
  const omittedCssOutputs = [];

  function component(directory, scope, output, bytesInOutput) {
    const packageRoot = resolve(root, directory);

    assert(packageRoot.startsWith(resolve(root, 'node_modules') + sep), 'Bundled package path escapes node_modules.');

    const manifest = json(resolve(packageRoot, 'package.json'));
    const locked = lock.packages[directory];

    assert(locked && locked.version === manifest.version, `Installed and locked package versions disagree: ${directory}`);
    assert(typeof manifest.name === 'string' && typeof manifest.version === 'string', `Package identity missing: ${directory}`);

    const id = `npm:${manifest.name}@${manifest.version}`;
    let entry = components.get(id);

    if (!entry) {
      const declaredLicense = typeof manifest.license === 'string' ? manifest.license : null;
      const texts = licenseFiles(packageRoot, root);

      entry = {
        id,
        ecosystem: 'npm',
        name: manifest.name,
        version: manifest.version,
        declaredLicense,
        licenseTexts: texts,
        contributions: [],
        reviewIssues: ['attribution-and-compatibility-review-required'],
      };

      if (!declaredLicense) {
        entry.reviewIssues.push('license-expression-missing');
      }

      if (!texts.length) {
        entry.reviewIssues.push('license-text-missing');
      }

      components.set(id, entry);
    }

    entry.contributions.push({ directory, scope, output, bytesInOutput, integrity: locked.integrity ?? null });
  }

  for (const scope of ['browser', 'server']) {
    const filename = resolve(dist, `${scope}-stats.json`);
    const stats = json(filename);

    assert(stats.outputs && Object.keys(stats.outputs).length, `Missing ${scope} bundle outputs.`);
    inputs.push({ path: `${scope}-stats.json`, sha256: hash(readFileSync(filename)) });

    for (const [output, details] of Object.entries(stats.outputs)) {
      const emitted = resolve(dist, scope, output);

      assert(emitted.startsWith(resolve(dist, scope) + sep), `Unsafe bundle output: ${output}`);

      if (!existsSync(emitted) && output.endsWith('.css')) {
        omittedCssOutputs.push({ scope, output });
        continue;
      }

      assert(existsSync(emitted), `Bundle output missing: ${output}`);

      for (const [input, contribution] of Object.entries(details.inputs ?? {})) {
        const segments = input.replaceAll('\\', '/').split('/');
        const index = segments.lastIndexOf('node_modules');

        if (index < 0 || contribution.bytesInOutput <= 0) {
          continue;
        }

        const count = segments[index + 1].startsWith('@') ? 3 : 2;
        const directory = segments.slice(0, index + count).join('/');

        component(directory, scope, output, contribution.bytesInOutput);
      }
    }
  }

  const icon = resolve(dist, 'browser/assets/lucide/LICENSE');

  assert(readFileSync(icon).equals(readFileSync(resolve(root, 'node_modules/lucide-static/LICENSE'))), 'Copied Lucide license differs.');
  component('node_modules/lucide-static', 'asset', 'assets/lucide', null);

  const fontDirectory = resolve(dist, 'browser/fonts/roboto');
  const fontFiles = readdirSync(fontDirectory).filter((name) => name.endsWith('.woff2')).sort();

  assert(fontFiles.length, 'Bundled Roboto fonts are missing.');
  assets.push({
    id: 'asset:roboto',
    name: 'Roboto',
    version: null,
    files: fontFiles.map((name) => ({ path: `fonts/roboto/${name}`, sha256: hash(readFileSync(resolve(fontDirectory, name))) })),
    licenseTexts: [evidence(resolve(fontDirectory, 'OFL.txt'), resolve(dist, 'browser'))],
    reviewIssues: ['font-version-and-attribution-review-required'],
  });

  const artwork = readdirSync(resolve(dist, 'browser/images')).sort().map((name) => `images/${name}`);

  if (existsSync(resolve(dist, 'browser/favicon.png'))) {
    artwork.push('favicon.png');
  }

  assets.push({
    id: 'asset:application-artwork',
    name: 'Application artwork',
    version: null,
    files: artwork.map((path) => ({ path, sha256: hash(readFileSync(resolve(dist, 'browser', path))) })),
    licenseTexts: [],
    reviewIssues: ['asset-origins-and-redistribution-rights-review-required'],
  });

  const list = [...components.values()].sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

  for (const entry of list) {
    entry.contributions.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right), 'en'));
  }

  return {
    schemaVersion: 1,
    status: 'unreviewed',
    build,
    lockfileSha256: hash(readFileSync(lockfile)),
    bundleInputs: inputs,
    omittedCssOutputs,
    emittedLicenseReport: evidence(resolve(dist, '3rdpartylicenses.txt'), dist),
    components: list,
    assets,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const inventory = collectWebInventory();
    const output = resolve(webRoot, 'dist/web/inventory/web-components.json');

    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(inventory, null, 2)}\n`);
    console.log(`PASS: ${inventory.components.length} emitted/copied npm components and ${inventory.assets.length} asset groups; unreviewed evidence collected.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
