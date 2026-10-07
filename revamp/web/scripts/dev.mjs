import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const replacementRoot = resolve(webRoot, '..');

function signalGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

async function stopChild({ child, closed }) {
  if (!child.pid) {
    return;
  }

  if (process.platform === 'win32') {
    if (child.exitCode === null && child.signalCode === null) {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });

      await new Promise((resolve, reject) => {
        killer.once('error', reject);
        killer.once('close', (code) => {
          if (code !== 0 && child.exitCode === null && child.signalCode === null) {
            reject(new Error(`Could not stop development process tree ${child.pid}.`));
          } else {
            resolve();
          }
        });
      });
    }

    await closed;
    return;
  }

  signalGroup(child.pid, 'SIGTERM');

  const timeout = setTimeout(() => signalGroup(child.pid, 'SIGKILL'), 5000);

  try {
    await closed;
    signalGroup(child.pid, 'SIGKILL');
  } finally {
    clearTimeout(timeout);
  }
}

async function supervise(commands) {
  const children = [];
  let stopping = false;
  let finish;
  const finished = new Promise((resolve) => {
    finish = resolve;
  });

  const stop = (interrupted = false) => {
    if (stopping) {
      return;
    }

    stopping = true;
    process.exitCode = interrupted ? 0 : 1;

    Promise.allSettled(children.map(stopChild)).then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error(result.reason.message);
          process.exitCode = 1;
        }
      }

      finish();
    });
  };
  const interrupt = () => stop(true);

  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  for (const { name, executable, args, cwd, env } of commands) {
    const child = spawn(executable, args, {
      cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const closed = new Promise((resolve) => child.once('close', resolve));
    children.push({ child, closed });

    for (const [stream, output] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      createInterface({ input: stream }).on('line', (line) => output.write(`[${name}] ${line}\n`));
    }

    child.once('error', (error) => {
      console.error(`[${name}] ${error.message}`);
      stop();
    });
    child.once('exit', (code, signal) => {
      if (!stopping) {
        console.error(`[${name}] exited (${signal ?? code}); stopping both applications.`);
        stop();
      }
    });
  }

  await finished;

  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}

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

  await supervise([
    {
      name: 'backend',
      executable: 'dotnet',
      args: [
        'watch',
        '--project',
        resolve(replacementRoot, 'backend/PocketMonkey.Api/PocketMonkey.Api.csproj'),
        '--non-interactive',
        'run',
        '--no-launch-profile',
        '--urls',
        backendUrl,
      ],
      cwd: replacementRoot,
      env,
    },
    {
      name: 'web',
      executable: process.execPath,
      args: [resolve(webRoot, 'node_modules/@angular/cli/bin/ng.js'), 'serve', '--host', '127.0.0.1', '--port', String(webPort)],
      cwd: webRoot,
      env,
    },
  ]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
