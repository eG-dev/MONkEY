import { APIRequestContext, Page } from '@playwright/test';

import { expect, csrfWrite } from '../fixtures';
import { createMember } from './accounts';

export async function createAccount(request: APIRequestContext, name: string) {
  const response = await csrfWrite(request, 'POST', '/api/accounts', { name });

  expect(response.status()).toBe(201);

  return response.json();
}

export async function createReader(request: APIRequestContext) {
  const response = await request.get('/api/accounts');
  expect(response.status()).toBe(200);
  const accounts: { id: string }[] = await response.json();

  return createMember(request, accounts.map(account => account.id));
}

export async function openTransactionForm(page: Page, record: string) {
  const trigger = page.locator('#account-details-record-transaction');

  await expect(page.locator('#account-details-transaction-form')).toHaveCount(0);
  await expect(trigger).toHaveText(record);
  expect(
    await trigger.evaluate(
      (element) =>
        !!(document.getElementById('account-details-refresh')!.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING),
    ),
  ).toBe(true);

  await trigger.click();

  await expect(page.locator('#account-details-transaction-dialog')).toHaveAccessibleName(record);
  await expect(page.locator('#account-details-transaction-form')).toBeVisible();
}
