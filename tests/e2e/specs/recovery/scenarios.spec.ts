import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { csrfWrite, docker, login, secureOrigin, signIn } from '../../fixtures';
import { createMember } from '../../helpers/accounts';
import { Instance } from '../../instance';

test('shared scenario recovery, permissions and explicit disposable reset', async ({ browser, playwright }) => {
  test.setTimeout(180_000);
  const name = `e2e-${randomUUID().slice(0, 12)}`;
  const loader = resolve('scenarios.mjs');
  let instance: (Instance & { credentialsPath: string }) | undefined;
  let proxy: Awaited<ReturnType<typeof secureOrigin>> | undefined;

  function load(reset = false): Instance & { credentialsPath: string } {
    const output = execFileSync(process.execPath, [loader, 'signed-balances', '--name', name, '--json', ...(reset ? ['--reset'] : [])], {
      encoding: 'utf8',
      timeout: 120_000,
    });

    return JSON.parse(output.trim().split('\n').at(-1)!);
  }

  try {
    instance = load();
    const sourcePath = resolve('../fixtures/financial-snapshots/signed-balances.json');
    const sourceBefore = readFileSync(sourcePath, 'utf8');

    for (const [scenario, instanceName, diagnostic] of [
      ['unknown-scenario', name, 'Unknown scenario'],
      ['signed-balances', '../outside', 'Scenario instance names'],
    ]) {
      const refused = spawnSync(process.execPath, [loader, scenario, '--name', instanceName, '--reset'], {
        encoding: 'utf8',
        timeout: 30_000,
      });
      expect(refused.status).not.toBe(0);
      expect(refused.stderr).toContain(diagnostic);
    }

    const linkedName = `${name}-linked`;
    const linkedPath = resolve(dirname(instance.credentialsPath), '..', linkedName);
    const linkTarget = mkdtempSync(resolve(tmpdir(), 'monkey-loader-'));
    symlinkSync(linkTarget, linkedPath, process.platform === 'win32' ? 'junction' : 'dir');

    try {
      const refused = spawnSync(process.execPath, [loader, 'signed-balances', '--name', linkedName, '--reset'], {
        encoding: 'utf8',
        timeout: 30_000,
      });
      expect(refused.status).not.toBe(0);
      expect(refused.stderr).toContain('Scenario paths must not contain links');
      expect(existsSync(linkTarget)).toBe(true);
    } finally {
      rmSync(linkedPath);
      rmSync(linkTarget, { recursive: true });
    }

    const unownedName = `${name}-unowned`;
    const unownedVolume = instance.volume.replace(`${name}-data`, `${unownedName}-data`);
    docker('volume', 'create', unownedVolume);

    try {
      const before = docker('volume', 'inspect', unownedVolume);
      const refused = spawnSync(process.execPath, [loader, 'signed-balances', '--name', unownedName, '--reset'], {
        encoding: 'utf8',
        timeout: 30_000,
      });
      expect(refused.status).not.toBe(0);
      expect(refused.stderr).toContain('Refusing to reset an unowned volume');
      expect(docker('volume', 'inspect', unownedVolume)).toBe(before);
    } finally {
      docker('volume', 'rm', unownedVolume);
    }

    proxy = await secureOrigin(instance);
    const manager = JSON.parse(readFileSync(instance.credentialsPath, 'utf8'));
    const request = await playwright.request.newContext({ baseURL: proxy.origin, ignoreHTTPSErrors: true });
    const context = await browser.newContext({ baseURL: proxy.origin, ignoreHTTPSErrors: true, locale: 'en-US' });
    const page = await context.newPage();
    const accountId = '10000000-0000-0000-0000-000000000001';

    await login(request, manager);

    const accounts = await (await request.get('/api/accounts')).json();
    expect(accounts).toHaveLength(3);
    expect(accounts.find((account: { id: string }) => account.id === accountId).balance).toBe('12.50');
    const posted = await csrfWrite(request, 'POST', `/api/accounts/${accountId}/transactions`, {
      source: 'deposit',
      amount: '1.25',
      idempotencyKey: randomUUID(),
      comment: 'After recovery',
    });
    expect(posted.status()).toBe(200);

    await signIn(page, manager, `/accounts/${accountId}`);
    await expect(page.locator('#account-details-balance')).toHaveText('+13.75 \u20ac');
    await expect(page.getByTestId('ledger-entry').first()).toContainText('After recovery');
    await page.screenshot({ path: test.info().outputPath('recovered-account.png'), fullPage: true });

    const member = await createMember(request);
    expect((await (await request.get(`/api/accounts/${accountId}`)).json()).balance).toBe('13.75');
    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${accountId}/transactions`, {
          source: 'deposit',
          amount: '1.00',
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(403);
    await context.clearCookies();
    await signIn(page, member, `/accounts/${accountId}`);
    await expect(page.locator('#account-details-balance')).toHaveText('+13.75 \u20ac');

    const refused = spawnSync(process.execPath, [loader, 'signed-balances', '--name', name], { encoding: 'utf8', timeout: 30_000 });
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('Use --reset');
    await request.dispose();
    await context.close();
    await proxy.close();
    proxy = undefined;
    instance = load(true);
    proxy = await secureOrigin(instance);
    const resetManager = JSON.parse(readFileSync(instance.credentialsPath, 'utf8'));
    const resetRequest = await playwright.request.newContext({ baseURL: proxy.origin, ignoreHTTPSErrors: true });

    await login(resetRequest, resetManager);
    expect((await (await resetRequest.get(`/api/accounts/${accountId}`)).json()).balance).toBe('12.50');
    expect(readFileSync(sourcePath, 'utf8')).toBe(sourceBefore);
    await resetRequest.dispose();
  } finally {
    await proxy?.close();

    if (instance) {
      if (test.info().status !== test.info().expectedStatus) {
        const logs = spawnSync('docker', ['logs', instance.container], { encoding: 'utf8', timeout: 10_000 });
        await test.info().attach('recovery-application.log', { body: logs.stdout + logs.stderr, contentType: 'text/plain' });
      }

      docker('rm', '--force', instance.container);
      docker('volume', 'rm', instance.volume);
      rmSync(dirname(instance.credentialsPath), { recursive: true, force: true });
    }
  }
});
