import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import cookieParser from 'cookie-parser';
import Negotiator from 'negotiator';
import httpProxy from 'http-proxy';
import { join } from 'node:path';

import { isLanguage, LANGUAGES } from './app/languages';

const backendUrl = process.env['MONKEY_BACKEND_URL'] ?? 'http://127.0.0.1:5080';
const backend = new URL(backendUrl);

if (
  backend.protocol !== 'http:' ||
  !['127.0.0.1', 'localhost', '[::1]'].includes(backend.hostname) ||
  backend.pathname !== '/' ||
  backend.username ||
  backend.password ||
  backend.search ||
  backend.hash
) {
  throw new Error('MONKEY_BACKEND_URL must be a loopback HTTP origin.');
}

const publicUrl = new URL(process.env['MONKEY_PUBLIC_URL'] ?? (process.env['NODE_ENV'] === 'production' ? '' : 'http://localhost:4000'));

if (
  publicUrl.pathname !== '/' ||
  publicUrl.username ||
  publicUrl.password ||
  publicUrl.search ||
  publicUrl.hash ||
  (publicUrl.protocol !== 'https:' && !(process.env['NODE_ENV'] !== 'production' && publicUrl.protocol === 'http:'))
) {
  throw new Error('MONKEY_PUBLIC_URL must be an HTTPS origin in production.');
}

new Intl.DateTimeFormat('en', { timeZone: process.env['TZ'] ?? 'UTC' }).format();

const locale = process.env['MONKEY_DEFAULT_LOCALE'] ?? 'de-DE';
const defaultLanguage = Object.values(LANGUAGES).find((language) => language.locale === locale)?.id;

if (!defaultLanguage) {
  throw new Error('MONKEY_DEFAULT_LOCALE must be de-DE or en-GB.');
}

const levels = ['Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical', 'None'];
const minimumLevel = levels.findIndex((level) => level.toLowerCase() === (process.env['MONKEY_LOG_LEVEL'] ?? 'Information').toLowerCase());

if (minimumLevel < 0) {
  throw new Error('MONKEY_LOG_LEVEL is invalid.');
}

function log(level: 'Information' | 'Error', event: string, details: object = {}): void {
  if (levels.indexOf(level) >= minimumLevel && minimumLevel !== levels.length - 1) {
    const message = JSON.stringify({ level, event, ...details });

    if (level === 'Error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
}

const app = express();

app.disable('x-powered-by');
app.set(
  'trust proxy',
  (process.env['MONKEY_TRUSTED_PROXIES'] ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

app.use(cookieParser());

app.use((_request, response, next) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  next();
});

const proxy = httpProxy.createProxyServer({ target: backendUrl, changeOrigin: true, proxyTimeout: 5000 });

proxy.on('error', (_error, _request, response) => {
  log('Error', 'backend_unavailable');

  if ('writeHead' in response && !response.headersSent) {
    response.writeHead(502, { 'Content-Type': 'application/problem+json' });
    response.end(JSON.stringify({ status: 502, code: 'backend_unavailable' }));
  } else {
    response.destroy();
  }
});

app.use('/api', (request, response) => {
  if (
    !['GET', 'HEAD'].includes(request.method) ||
    !['/api/foundation', '/api/foundation/file'].includes(request.originalUrl.split('?')[0])
  ) {
    response.status(404).json({ status: 404, code: 'not_found' });
    return;
  }

  request.url = request.originalUrl;

  for (const name of ['forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-user-id', 'x-user-role']) {
    delete request.headers[name];
  }

  proxy.web(request, response);
});

app.get('/health/live', (_request, response) => response.json({ status: 'healthy' }));

app.get('/health/ready', async (_request, response) => {
  try {
    const backendResponse = await fetch(`${backendUrl}/health/ready`, { signal: AbortSignal.timeout(5000) });

    response.status(backendResponse.ok ? 200 : 503).json({ status: backendResponse.ok ? 'ready' : 'unavailable' });
  } catch {
    response.status(503).json({ status: 'unavailable' });
  }
});

app.use(express.static(join(import.meta.dirname, '../browser'), { maxAge: '1y', index: false, redirect: false }));

const angularApp = new AngularNodeAppEngine({ allowedHosts: [publicUrl.hostname, 'localhost', '127.0.0.1'] });

app.use((request, response, next) => {
  const preference = request.cookies['monkey-language'];
  const negotiated = new Negotiator(request).language(Object.keys(LANGUAGES));

  const language = isLanguage(preference)
    ? preference
    : isLanguage(negotiated)
      ? negotiated
      : defaultLanguage;

  angularApp
    .handle(request, { language, backendUrl })
    .then((result) => result
      ? writeResponseToNodeResponse(result, response)
      : next())
    .catch(next);
});

app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  log('Error', 'request_failed');
  response.status(500).json({ status: 500, code: 'request_failed' });
});

if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT is invalid.');
  }

  const server = app.listen(port, process.env['HOST'] ?? '127.0.0.1', () => log('Information', 'listening', { port }));

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, () => {
      server.close(() => process.exit(0));
      server.closeIdleConnections();
      setTimeout(() => process.exit(1), 8000).unref();
    });
  }
}

export const reqHandler = createNodeRequestHandler(app);
