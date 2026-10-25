import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('whole amounts omit zero cents while fractional and large amounts stay exact', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);
  const cases = [
    { name: 'Zero balance', value: '0.00', expected: '0 €' },
    { name: 'Whole positive', value: '10.00', expected: '+10 €' },
    { name: 'Whole negative', value: '-10.00', expected: '-10 €' },
    { name: 'Fraction tenths', value: '10.10', expected: '+10.10 €' },
    { name: 'Fraction penny', value: '10.01', expected: '+10.01 €' },
    { name: 'Subunit positive', value: '0.01', expected: '+0.01 €' },
    { name: 'Subunit negative', value: '-0.01', expected: '-0.01 €' },
    { name: 'Whole maximum', value: '92233720368547758.00', expected: '+92,233,720,368,547,758 €' },
  ];
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));
  await login(request, manager);

  const accounts = await Promise.all(
    cases.map(async (sample) => {
      const account: { id: string } = await createAccount(request, sample.name);
      const posted = await csrfWrite(request, 'POST', `/api/accounts/${account.id}/opening`, {
        amount: sample.value,
        idempotencyKey: randomUUID(),
      });

      expect(posted.status()).toBe(200);

      return { ...sample, id: account.id };
    }),
  );
  const draft = await createAccount(request, 'Opening preview');

  await signIn(page, manager);

  const response = await page.reload();
  const initial = await page.evaluate(
    (source) => {
      const document = new DOMParser().parseFromString(source, 'text/html');

      return [...document.querySelectorAll('[data-testid="account-card"]')].map((card) => ({
        name: card.getAttribute('aria-label'),
        amount: card.querySelector('[data-testid="card-balance"]')?.textContent?.replace(/\s+/g, ' ').trim(),
      }));
    },
    await response!.text(),
  );

  for (const sample of accounts) {
    const card = page.getByTestId('account-card').filter({ has: page.getByText(sample.name, { exact: true }) });

    expect(initial).toContainEqual({ name: `Open ${sample.name}`, amount: sample.expected });
    await expect(card.getByTestId('card-balance')).toHaveText(sample.expected);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('amount-overview.png'), fullPage: true });
  await page.locator('#overview-manage-accounts').click();

  for (const sample of accounts) {
    const row = page.getByTestId('account-row').filter({ has: page.getByRole('link', { name: sample.name, exact: true }) });

    await expect(row.locator('td.numeric').first()).toHaveText(sample.expected);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  for (const sample of accounts) {
    await page.goto(`/accounts/${sample.id}`);

    await expect(page.locator('#account-details-balance')).toHaveText(sample.expected);
    await expect(page.getByTestId('ledger-entry').first()).toContainText(sample.expected);
    expect((await (await request.get(`/api/accounts/${sample.id}`)).json()).balance).toBe(sample.value);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }

  await page.goto(`/accounts/${draft.id}`);

  for (const [value, expected] of [
    ['10.00', '+10 €'],
    ['10.10', '+10.10 €'],
  ]) {
    await page.locator('#account-details-opening-amount').fill(value);
    await page.locator('#account-details-opening-submit').click();

    await expect(page.locator('#account-details-opening-confirm-summary')).toContainText(expected);
    await page.locator('#account-details-opening-confirm-cancel').click();

    await expect(page.locator('#account-details-opening-amount')).toHaveValue(value);
  }

  expect((await (await request.get(`/api/accounts/${draft.id}`)).json()).balance).toBeNull();
  expect(errors).toEqual([]);
});
