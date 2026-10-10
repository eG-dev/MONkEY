import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount } from '../../helpers/ledger';

test.use({ currency: 'USD', ignoreHTTPSErrors: true });

test('USD setting reaches API and initial account rendering @desktop', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const account = await createAccount(request, 'Currency setting');
  expect(account.currency).toBe('USD');

  await signIn(page, manager, `/accounts/${account.id}`);
  await expect(page.locator('#account-details-opening-amount')).toHaveAccessibleName('Opening amount (USD)');

  const posted = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
    amount: '12.34',
    idempotencyKey: randomUUID(),
  });
  expect(posted.status()).toBe(200);
  const entry = await posted.json();
  expect(entry.currency).toBe('USD');
  expect(entry.amount).toBe('12.34');

  const response = await page.reload();
  const html = await response!.text();
  const balanceText = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'text/html');
    return document.getElementById('account-details-balance')?.textContent?.trim();
  }, html);
  expect(balanceText).toMatch(/^\+12\.34\s\$$/);
  await expect(page.locator('#account-details-balance')).toHaveText('+12.34 $');
  await expect(page.getByTestId('ledger-entry').first()).toContainText('+12.34 $');
});
