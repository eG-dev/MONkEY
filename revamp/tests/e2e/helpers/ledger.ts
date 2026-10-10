import { APIRequestContext, Page } from '@playwright/test';

import { expect, credentials, createUser, csrfWrite, login } from '../fixtures';

export async function createAccount(request: APIRequestContext, name: string) {
  const response = await csrfWrite(request, 'POST', '/api/accounts', { name });

  expect(response.status()).toBe(201);

  return response.json();
}

export async function createReader(request: APIRequestContext) {
  const { account: temporary } = await createUser(request, 'reader', 'Reader', 'Member');
  const permanent = credentials('reader');

  await csrfWrite(request, 'POST', '/api/auth/logout', {});
  await login(request, temporary);

  const changed = await csrfWrite(request, 'POST', '/api/auth/password', {
    currentPassword: temporary.password,
    newPassword: permanent.password,
  });

  expect(changed.status()).toBe(204);

  await login(request, permanent);

  return permanent;
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
