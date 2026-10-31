import { APIRequestContext } from '@playwright/test';

import { expect, credentials, createUser, csrfWrite, login } from '../fixtures';

export async function createMember(request: APIRequestContext, accountIds: string[] = []) {
  const { account: temporary, profile } = await createUser(request, 'reader', 'Reader', 'Member');
  const permanent = credentials('reader');

  if (accountIds.length > 0) {
    expect((await csrfWrite(request, 'PUT', `/api/users/${profile.id}/account-assignments`, { accountIds })).status()).toBe(200);
  }

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
