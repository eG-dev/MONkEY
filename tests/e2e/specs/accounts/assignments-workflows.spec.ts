import { test, expect, bootstrapManager, createUser, csrfWrite, login, signIn } from '../../fixtures';
import { createMember } from '../../helpers/accounts';

test.use({ ignoreHTTPSErrors: true });

test('managers assign accounts and recover from an unconfirmed save while members see only assigned accounts', async ({
  page, request, browser, instance,
}) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const first = await (await csrfWrite(request, 'POST', '/api/accounts', { name: 'First account' })).json();
  await csrfWrite(request, 'POST', '/api/accounts', { name: 'Second account' });
  const member = await createMember(request);
  await login(request, manager);
  const disabled = await createUser(request, 'reader-disabled', 'Reader', 'Member');
  expect((await csrfWrite(request, 'PUT', `/api/users/${disabled.profile.id}`, {
    displayName: 'Reader', role: 'Member', isActive: false,
  })).status()).toBe(204);

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await signIn(page, manager, '/administration');
  await page.locator('#administration-tab-assignments').click();

  const rows = page.getByTestId('assignment-row');
  const disabledRow = page.locator('[data-testid="assignment-row"][data-username="reader-disabled"]');
  const memberRow = page.locator('[data-testid="assignment-row"][data-username="reader"]');
  await expect(rows).toHaveCount(2);
  await expect(page.locator('#assignments-table thead')).not.toContainText('Status');
  await expect(disabledRow).toContainText('reader-disabled');
  const editDisabled = disabledRow.getByTestId('assignment-row-edit');
  await expect(editDisabled).toHaveAccessibleName('Assigned accounts for Reader (reader-disabled)');
  await editDisabled.click();

  const dialog = page.locator('#assignments-dialog');
  await expect(dialog).toHaveAccessibleName('Assigned accounts for Reader (reader-disabled)');
  const firstOption = dialog.getByLabel('First account');
  await expect(firstOption).toBeEnabled();
  await firstOption.focus();
  await page.keyboard.press('Space');
  await expect(firstOption).toBeChecked();

  const assignmentPath = `**/api/users/${disabled.profile.id}/account-assignments`;
  await page.route(assignmentPath, async (route) => {
    if (route.request().method() === 'PUT') {
      const response = await route.fetch();
      expect(response.status()).toBe(200);
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
  await page.locator('#assignments-save').click();
  await expect(page.locator('#assignments-dialog-error')).toContainText('The save could not be confirmed.');
  await expect(firstOption).toBeChecked();
  await expect(page.locator('#assignments-save')).toBeDisabled();
  await page.unroute(assignmentPath);
  await page.locator('#assignments-reload').click();
  await expect(page.locator('#assignments-save')).toBeEnabled();
  await expect(firstOption).toBeChecked();
  await page.locator('#assignments-save').click();
  await expect(dialog).not.toBeVisible();
  await expect(editDisabled).toBeFocused();
  await expect(disabledRow).toContainText('First account');

  const memberContext = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await memberContext.newPage();
    await signIn(memberPage, member);
    await expect(memberPage.locator('#overview-empty')).toContainText('No active accounts are assigned to you.');
    await memberPage.goto('/administration');
    await expect(memberPage.locator('#administration-tab-assignments')).toHaveCount(0);

    await memberRow.getByTestId('assignment-row-edit').click();
    await expect(page.locator('#assignments-save')).toBeEnabled();
    await dialog.getByLabel('First account').check();
    await page.locator('#assignments-save').click();
    await expect(dialog).not.toBeVisible();
    await expect(memberRow).toContainText('First account');

    await memberPage.goto('/');
    await expect(memberPage.getByTestId('account-card')).toHaveCount(1);
    await expect(memberPage.getByTestId('account-card')).toContainText('First account');

    await memberRow.getByTestId('assignment-row-edit').click();
    await expect(page.locator('#assignments-save')).toBeEnabled();
    await dialog.getByLabel('First account').uncheck();
    await page.locator('#assignments-save').click();
    await expect(dialog).not.toBeVisible();
    await memberPage.reload();
    await expect(memberPage.locator('#overview-empty')).toContainText('No active accounts are assigned to you.');
    expect((await memberPage.request.get(`/api/accounts/${first.id}`)).status()).toBe(404);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await memberContext.close();
  }
});

test('assignment editing recovers from loading errors and changed accounts or roles', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const member = await createUser(request, 'reader', 'Reader', 'Member');
  const first = await (await csrfWrite(request, 'POST', '/api/accounts', { name: 'First account' })).json();
  await csrfWrite(request, 'POST', '/api/accounts', { name: 'Second account' });
  await signIn(page, manager, '/administration');

  await page.route('**/api/users', (route) => route.abort('failed'));
  await page.locator('#administration-tab-assignments').click();
  await expect(page.locator('#assignments-error')).toContainText('Members could not be loaded.');
  await expect(page.locator('#assignments-empty')).toHaveCount(0);
  await page.unroute('**/api/users');
  await page.locator('#assignments-retry').click();

  await page.getByTestId('assignment-row-edit').click();
  const dialog = page.locator('#assignments-dialog');
  await expect(page.locator('#assignments-save')).toBeEnabled();
  await dialog.getByLabel('First account').check();
  expect((await csrfWrite(request, 'DELETE', `/api/accounts/${first.id}`, {})).status()).toBe(204);
  await page.locator('#assignments-save').click();
  await expect(page.locator('#assignments-dialog-error')).toContainText('An account is no longer available for assignment.');
  await expect(dialog.getByLabel('First account')).toBeChecked();
  await page.locator('#assignments-reload').click();
  await expect(dialog.getByLabel('First account')).toHaveCount(0);
  await expect(page.locator('#assignments-save')).toBeEnabled();
  await dialog.getByLabel('Second account').check();

  expect((await csrfWrite(request, 'PUT', `/api/users/${member.profile.id}`, {
    displayName: 'Reader', role: 'Manager', isActive: true,
  })).status()).toBe(204);
  await page.locator('#assignments-save').click();
  await expect(page.locator('#assignments-dialog-error')).toContainText('Accounts can only be assigned to Members.');
  await expect(dialog.getByLabel('Second account')).toBeChecked();
  await page.locator('#assignments-reload').click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#assignments-empty')).toContainText('No Members yet');
});

test('German assignment dialog remains usable in dark mode', async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const member = await createUser(request, 'reader', 'Reader', 'Member');
  await csrfWrite(request, 'POST', '/api/accounts', { name: 'Taschengeld' });
  await signIn(page, manager, '/administration');
  expect((await csrfWrite(page.request, 'PUT', '/api/auth/language', { language: 'de' })).status()).toBe(204);
  expect((await csrfWrite(page.request, 'PUT', '/api/auth/theme', { theme: 'dark' })).status()).toBe(204);
  await page.reload();
  await expect(page.locator('#administration-tab-assignments')).toHaveText('Kontozuweisungen');
  await page.locator('#administration-tab-assignments').click();
  await page.getByTestId('assignment-row-edit').click();

  const dialog = page.locator('#assignments-dialog');
  await expect(dialog).toHaveAccessibleName('Zugewiesene Konten für Reader');
  await expect(page.locator('#assignments-save')).toBeEnabled();
  await dialog.getByLabel('Taschengeld').check();
  const assignmentPath = `**/api/users/${member.profile.id}/account-assignments`;
  await page.route(assignmentPath, (route) => route.request().method() === 'PUT' ? route.abort('failed') : route.continue());
  await page.locator('#assignments-save').click();
  await expect(page.locator('#assignments-dialog-error')).toContainText('Das Speichern konnte nicht bestätigt werden.');
  await expect(page.locator('#assignments-reload')).toHaveText('Neu laden');
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('assignments-de-dark.png') });
});