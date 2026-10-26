import { resolve } from 'node:path';

export function developmentEnvironment({ root, webPort, backendPort, environment = process.env }) {
  const codespaces = environment['CODESPACES'] === 'true';
  let origin = `http://127.0.0.1:${webPort}`;

  if (codespaces) {
    const name = environment['CODESPACE_NAME'] ?? '';
    const domain = environment['GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN'] ?? '';

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(domain)) {
      throw new Error('Codespaces requires a valid CODESPACE_NAME and GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN.');
    }

    origin = `https://${name}-${webPort}.${domain}`;
  }

  return {
    ...environment,
    ASPNETCORE_ENVIRONMENT: 'Development',
    NODE_ENV: 'development',
    MONKEY_DATA_PATH: resolve(root, codespaces ? '.local/codespaces/development' : '.local/dev'),
    MONKEY_PUBLIC_URL: origin,
    MONKEY_BACKEND_URL: `http://127.0.0.1:${backendPort}`,
    MONKEY_TRUSTED_PROXIES: '',
    MONKEY_DEFAULT_LOCALE: environment['MONKEY_DEFAULT_LOCALE'] ?? 'de-DE',
    MONKEY_CURRENCY: environment['MONKEY_CURRENCY'] ?? 'EUR',
    TZ: environment['TZ'] ?? 'Europe/Berlin',
    __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: new URL(origin).hostname,
    DOTNET_WATCH_SUPPRESS_LAUNCH_BROWSER: '1',
    DOTNET_WATCH_SUPPRESS_BROWSER_REFRESH: '1',
    RestoreLockedMode: 'true',
  };
}
