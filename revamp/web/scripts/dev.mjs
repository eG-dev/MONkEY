import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import concurrently from 'concurrently';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const replacementRoot = resolve(webRoot, '..');

async function checkPort(port) {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`Port ${port} is unavailable. Choose another --web-port or --backend-port.`)));
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function readPort(value, name) {
  const port = Number(value);
  if (!/^\d+$/.test(value) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }
  return port;
}

try {
  const { values } = parseArgs({
    options: {
      'web-port': { type: 'string', default: '4180' },
      'backend-port': { type: 'string', default: '5180' },
    },
  });
  const webPort = readPort(values['web-port'], '--web-port');
  const backendPort = readPort(values['backend-port'], '--backend-port');
  if (webPort === backendPort) {
    throw new Error('The web and backend ports must differ.');
  }

  await checkPort(webPort);
  await checkPort(backendPort);

  const origin = `http://127.0.0.1:${webPort}`;
  const backendUrl = `http://127.0.0.1:${backendPort}`;
  const dataPath = resolve(replacementRoot, '.local/dev');
  const env = {
    ...process.env,
    ASPNETCORE_ENVIRONMENT: 'Development',
    NODE_ENV: 'development',
    MONKEY_DATA_PATH: dataPath,
    MONKEY_PUBLIC_URL: origin,
    MONKEY_BACKEND_URL: backendUrl,
    MONKEY_TRUSTED_PROXIES: '',
    TZ: process.env['TZ'] ?? 'Europe/Berlin',
    DOTNET_WATCH_SUPPRESS_LAUNCH_BROWSER: '1',
    DOTNET_WATCH_SUPPRESS_BROWSER_REFRESH: '1',
    RestoreLockedMode: 'true',
  };

  console.log(`POCKET MONkEY development: ${origin}`);
  console.log(`Persistent development data: ${dataPath}`);
  console.log('Both applications watch for changes. Ctrl+C stops both.');

  let interrupted = false;
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      interrupted = true;
    });
  }

  const { result } = concurrently(
    [
      {
        name: 'backend',
        command: `dotnet watch --project "${resolve(replacementRoot, 'backend/PocketMonkey.Api/PocketMonkey.Api.csproj')}" --non-interactive run --no-launch-profile --urls ${backendUrl}`,
        cwd: replacementRoot,
        env,
      },
      {
        name: 'web',
        command: `"${process.execPath}" "${resolve(webRoot, 'node_modules/@angular/cli/bin/ng.js')}" serve --host 127.0.0.1 --port ${webPort}`,
        cwd: webRoot,
        env,
      },
    ],
    {
      prefix: 'name',
      killOthersOn: ['failure', 'success'],
    },
  );

  await result.catch(() => {
    process.exitCode = interrupted ? 0 : 1;
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
