import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { prepareAbout, webRoot } from './prepare-about.mjs';

try {
  const { values } = parseArgs({
    options: {
      tag: { type: 'string', default: 'pocket-monkey:local' },
      'release-tag': { type: 'string' },
      'repository-url': { type: 'string' },
    },
  });
  const info = prepareAbout({ releaseTag: values['release-tag'], repository: values['repository-url'] });
  const replacementRoot = resolve(webRoot, '..');
  const args = ['build', '--file', resolve(replacementRoot, 'deploy/Dockerfile'), '--tag', values.tag];

  for (const [name, value] of Object.entries({
    BUILD_VERSION: info.version,
    BUILD_REVISION: info.revision ?? 'unavailable',
    BUILD_KIND: info.kind,
    BUILD_DIRTY: String(info.dirty),
    BUILD_REPOSITORY: info.repositoryUrl ?? '',
  })) {
    args.push('--build-arg', `${name}=${value}`);
  }

  args.push(replacementRoot);

  const result = spawnSync('docker', args, { stdio: 'inherit', shell: false });

  if (result.error) {
    throw result.error;
  }

  if (result.status === 0) {
    prepareAbout({ check: true, releaseTag: values['release-tag'], repository: values['repository-url'] });
  }

  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
