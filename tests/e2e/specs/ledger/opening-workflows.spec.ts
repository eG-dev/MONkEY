import { randomUUID } from 'node:crypto';

import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createAccount, createReader } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test.describe('opening workflow', () => {
  const currency = 'EUR';
  const symbol = '€';

  test.use({ currency });

  test('opening entry, exact display and Member read-only workflow', async ({ page, request, browser, instance }) => {
    const manager = bootstrapManager(instance);

    await login(request, manager);

    const account = await createAccount(request, 'Pocket ledger');
    const maximum = await createAccount(request, 'Maximum ledger');

    expect(account.currency).toBe(currency);
    expect(maximum.currency).toBe(currency);
    expect(
      (
        await csrfWrite(request, 'POST', `/api/accounts/${maximum.id}/opening`, {
          amount: '92233720368547758.07',
          idempotencyKey: randomUUID(),
        })
      ).status(),
    ).toBe(200);

    const reader = await createReader(request);
    const labels = {
      username: 'Username',
      password: 'Password',
      login: 'Sign in',
      post: 'Post opening balance',
      amount: `Opening amount (${currency})`,
      comment: 'Comment (optional)',
      empty: 'Not initialized',
      saved: 'Opening balance posted',
      money: `+12.34 ${symbol}`,
      input: '12.34',
      maximum: `+92,233,720,368,547,758.07 ${symbol}`,
    };
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));

    await signIn(page, manager, `/accounts/${account.id}`);

    const balance = page.locator('#account-details-balance');
    const amount = page.locator('#account-details-opening-amount');
    const submit = page.locator('#account-details-opening-submit');

    await expect(balance).toHaveText(labels.empty);
    await expect(amount).toHaveAccessibleName(labels.amount);
    await expect(submit).toHaveText(labels.post);

    await amount.fill(`${labels.input}1`);
    await submit.click();

    await expect(page.locator('#account-details-opening-error')).toHaveRole('alert');
    await expect(page.locator('#account-details-opening-confirm-dialog')).not.toBeVisible();

    const comment = '<script>private opening comment</script>';

    await expect(page.locator('#account-details-opening-comment')).toHaveAccessibleName(labels.comment);

    await page.locator('#account-details-opening-comment').fill(comment);
    await amount.fill(labels.input);
    await amount.press('Enter');

    await expect(page.locator('#account-details-opening-confirm-summary')).toContainText(labels.money);
    await expect(page.locator('#account-details-opening-confirm-submit')).toHaveText(labels.post);

    await page.locator('#account-details-opening-confirm-submit').click();

    await expect(page.locator('#account-details-saved')).toContainText(labels.saved);
    await expect(balance).toHaveText(labels.money);
    await expect(balance).toHaveClass(/amount-positive/);
    await expect(submit).toHaveCount(0);
    await expect(page.getByTestId('ledger-entry').first()).toContainText(comment);

    await page.reload();

    await expect(balance).toHaveText(labels.money);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.screenshot({
      path: test.info().outputPath('opening-entry.png'),
      fullPage: true,
    });

    await expect(page.getByTestId('ledger-entry').first()).toContainText(comment);

    const persisted = await (await request.get(`/api/accounts/${account.id}`)).json();

    expect(persisted.balance).toBe('12.34');
    expect(persisted.currency).toBe(currency);
    expect(persisted.openingEntry.currency).toBe(currency);

    const recordedAt = new Date(persisted.openingEntry.occurredAtUtc);
    const history = await (await request.get(`/api/accounts/${account.id}/transactions`)).json();
    expect(history.timezone).toBe('Europe/Berlin');
    const englishDate = new Intl.DateTimeFormat('en-US', { timeZone: history.timezone, dateStyle: 'medium' }).format(recordedAt);
    const englishTime = new Intl.DateTimeFormat('en-US', {
      timeZone: history.timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(recordedAt);
    const historyRow = page.getByTestId('ledger-entry').first();

    await expect(historyRow.locator('.meta')).toContainText(englishDate);
    await expect(historyRow.locator('time')).toHaveText(`${englishDate}, ${englishTime}`);

    await page.goto(`/accounts/${maximum.id}`);

    await expect(balance).toHaveText(labels.maximum);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.screenshot({
      path: test.info().outputPath('maximum-balance.png'),
      fullPage: true,
    });

    const context = await browser.newContext({
      ...test.info().project.use,
      baseURL: instance.origin,
      ignoreHTTPSErrors: true,
    });

    try {
      const memberPage = await context.newPage();

      memberPage.on('pageerror', (error) => errors.push(error.message));
      await signIn(memberPage, reader, `/accounts/${account.id}`);

      await expect(memberPage.locator('#account-details-balance')).toHaveText(labels.money);
      await expect(memberPage.locator('#account-details-opening-submit')).toHaveCount(0);
    } finally {
      await context.close();
    }

    expect(errors).toEqual([]);
  });
});
