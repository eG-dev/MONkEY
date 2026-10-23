import { test, expect, bootstrapManager, credentials, signIn, submitLogin } from '../../fixtures';
import { createAccount } from '../../helpers/ledger';

test.use({ ignoreHTTPSErrors: true });

test('manager browser login, theme preference, and logout survive SSR', async ({ page, instance }) => {
  const manager = bootstrapManager(instance);
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));

  await signIn(page, manager);

  await expect(page.locator('#overview-title')).toHaveText('Overview');
  await expect(page.locator('#shell-user-toggle')).toHaveAccessibleName(`${manager.username}, Manager`);

  await createAccount(page.request, 'Tonal account');
  await page.reload();

  const card = page.getByTestId('account-card');

  await expect(card).toHaveAccessibleName('Open Tonal account');
  await expect(card).toHaveCSS('border-top-width', '0px');
  await expect(card).toHaveCSS('background-color', 'rgb(245, 245, 245)');
  await card.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');

  await expect(card).toBeFocused();
  expect(await card.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  expect(await card.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);

  await page.locator('#shell-user-toggle').click();

  await expect(page.locator('#shell-user-menu')).toHaveRole('menu');
  await expect(page.locator('#shell-user-menu-profile')).toHaveRole('menuitem');
  await expect(page.locator('#shell-user-menu-profile')).toHaveAccessibleName('Profile');

  await page.locator('#shell-user-menu-profile').click();

  await expect(page.locator('#administration-title')).toHaveText('Administration');
  await expect(page.locator('#profile-dark-mode')).toHaveRole('switch');
  await expect(page.locator('#profile-dark-mode')).toHaveAccessibleName('Dark mode');
  await expect(page.locator('#profile-dark-mode')).toHaveAttribute('aria-checked', 'false');

  const panel = page.getByRole('region', { name: 'Preferences', exact: true });
  const passwordButton = page.locator('#profile-change-password');

  await expect(panel).toHaveCSS('border-top-width', '0px');
  await expect(panel).toHaveCSS('background-color', 'rgb(245, 245, 245)');
  await expect(passwordButton).toHaveCSS('background-color', 'rgb(235, 235, 235)');
  await passwordButton.click();

  await expect(page.locator('#profile-password-dialog')).toHaveCSS('border-top-width', '0px');
  expect(
    await page.locator('#profile-current-password').evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth)),
  ).toBeGreaterThan(0);

  await page.locator('#profile-password-dialog-close').click();

  const themeSaved = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/auth/theme' && response.request().method() === 'PUT',
  );

  await page.locator('#profile-dark-mode').click();

  expect((await themeSaved).status()).toBe(204);
  await expect(page.locator('html')).toHaveAttribute('tuiTheme', 'dark');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('tuiTheme', 'dark');
  await expect(page.locator('#profile-dark-mode')).toHaveAccessibleName('Dark mode');
  await expect(page.locator('#profile-dark-mode')).toHaveAttribute('aria-checked', 'true');
  await expect(panel).toHaveCSS('background-color', 'rgb(30, 30, 30)');
  await expect(passwordButton).toHaveCSS('background-color', 'rgb(51, 51, 51)');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.screenshot({ path: test.info().outputPath('authenticated.png'), fullPage: true });

  await page.locator('#shell-user-toggle').click();

  await expect(page.locator('#shell-user-menu-logout')).toHaveAccessibleName('Sign out');

  await page.locator('#shell-user-menu-logout').click();

  await expect(page.locator('#login-submit')).toHaveText('Sign in');

  expect(errors).toEqual([]);
});

test('manager browser creates a user and temporary password requires change', async ({ page, browser, instance }) => {
  const manager = bootstrapManager(instance);
  const permanent = credentials('member');

  await signIn(page, manager);

  await expect(page.locator('#overview-title')).toHaveText('Overview');

  await page.goto('/administration/users');

  await expect(page.locator('#administration-tab-users')).toHaveText('Users');
  await expect(page.locator('#administration-tab-users')).toHaveAttribute('aria-current', 'page');

  await page.locator('#users-create').click();

  const createDialog = page.locator('#users-create-dialog');

  await expect(createDialog).toHaveAccessibleName('Create user');
  await expect(page.locator('#users-create-username')).toHaveAccessibleName('Username');
  await expect(page.locator('#users-create-display-name')).toHaveAccessibleName('Display name');

  await page.locator('#users-create-username').fill('member');
  await page.locator('#users-create-display-name').fill('Member display');
  await page.locator('#users-create-submit').click();

  const passwordDialog = page.locator('#users-password-dialog');
  const temporaryPassword = page.locator('#users-temporary-password');

  await expect(passwordDialog).toHaveAccessibleName('Temporary password');
  await expect(temporaryPassword).toHaveText(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);

  const created = (await temporaryPassword.textContent())!;

  await page.locator('#users-password-done').click();

  const memberRow = page.locator('[data-testid="user-row"][data-username="member"]');

  await expect(passwordDialog).not.toBeVisible();
  await expect(memberRow).toContainText('Password change required');
  await expect(memberRow.getByTestId('user-row-edit')).toHaveAccessibleName('Edit member');

  await memberRow.getByTestId('user-row-edit').click();

  const editDialog = page.locator('#users-edit-dialog');

  await expect(editDialog).toHaveAccessibleName('Edit member');
  await expect(page.locator('#users-edit-active')).toHaveAccessibleName('Active');

  await page.locator('#users-edit-active').click();
  await page.locator('#users-edit-save').click();

  await expect(memberRow).toContainText('Disabled');

  await memberRow.getByTestId('user-row-edit').click();
  await page.locator('#users-edit-active').click();
  await page.locator('#users-edit-save').click();

  await expect(memberRow).not.toContainText('Disabled');
  await expect(memberRow.getByTestId('user-row-reset')).toHaveAccessibleName('Reset password for member');

  await memberRow.getByTestId('user-row-reset').click();

  await expect(page.locator('#users-reset-dialog')).toHaveAccessibleName('Reset password for member');
  await expect(page.locator('#users-reset-submit')).toHaveText('Reset password');

  const resetResponse = page.waitForResponse((response) => /\/api\/users\/[\w-]+\/password$/.test(new URL(response.url()).pathname));

  await page.locator('#users-reset-submit').click();

  expect((await resetResponse).status()).toBe(200);
  await expect(temporaryPassword).not.toHaveText(created);

  const temporary = { username: 'member', password: (await temporaryPassword.textContent())! };

  await page.locator('#users-password-done').click();

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    await submitLogin(memberPage, { username: 'member', password: created });

    await expect(memberPage.locator('#login-error')).toHaveRole('alert');
    await expect(memberPage.locator('#login-error')).toHaveText('Username or password is incorrect.');

    await signIn(memberPage, temporary);

    await expect(memberPage.locator('#login-title')).toHaveText('Choose a new password');
    await expect(memberPage.locator('#login-current-password')).toHaveAccessibleName('Current password');
    await expect(memberPage.locator('#login-new-password')).toHaveAccessibleName('New password');
    await expect(memberPage.locator('#login-change-password-submit')).toBeEnabled();

    await memberPage.locator('#login-current-password').fill(temporary.password);
    await memberPage.locator('#login-new-password').fill(permanent.password);
    await memberPage.locator('#login-change-password-submit').click();

    await expect(memberPage.locator('#login-notice')).toHaveText('Password changed. Sign in again.');

    await signIn(memberPage, { username: 'member', password: permanent.password });

    await expect(memberPage.locator('#overview-title')).toHaveText('Overview');

    await memberPage.goto('/administration/users');

    await expect(memberPage.locator('#users-managers-only')).toHaveText('Only managers can manage users.');
    await expect(memberPage.locator('#users-create')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
