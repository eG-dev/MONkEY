import { test, expect, bootstrapManager, credentials, csrfWrite, signIn } from '../../fixtures';
import { createMember } from '../../helpers/accounts';
import { expectFeedbackAligned } from '../../helpers/feedback';

test.use({ ignoreHTTPSErrors: true });

for (const role of ['Manager', 'Member'] as const) {
  const viewportTag = role === 'Manager' ? '@desktop' : '@mobile';

  test(`${role} changes their password with exact confirmation and failure recovery ${viewportTag}`, async ({ page, instance }) => {
    let account = bootstrapManager(instance);
    const changed = credentials(account.username);
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    await signIn(page, account);

    if (role === 'Member') {
      account = await createMember(page.request);
      await csrfWrite(page.request, 'POST', '/api/auth/logout', {});
      await signIn(page, account);
    }

    await page.goto('/administration');

    const trigger = page.locator('#profile-change-password');
    const dialog = page.locator('#profile-password-dialog');
    const current = page.locator('#profile-current-password');
    const next = page.locator('#profile-new-password');
    const confirmation = page.locator('#profile-confirm-password');
    const confirmationError = page.locator('#profile-confirm-password-error');
    const submit = page.locator('#profile-password-submit');
    const icon = trigger.locator('.icon-key-round');
    let passwordWrites = 0;

    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/auth/password' && request.method() === 'POST') {
        passwordWrites++;
      }
    });

    await expect(trigger).toHaveAccessibleName('Change password');
    await expect(icon).toBeVisible();
    expect(await icon.evaluate((element) => getComputedStyle(element, '::before').content)).not.toBe('none');
    await trigger.focus();
    await page.keyboard.press('Enter');

    await expect(dialog).toHaveAccessibleName('Change password');
    await expect(current).toHaveAccessibleName('Current password');
    await expect(next).toHaveAccessibleName('New password');
    await expect(confirmation).toHaveAccessibleName('Confirm new password');
    await expect(confirmation).toHaveAttribute('autocomplete', 'new-password');
    await expect(confirmation).toHaveAttribute('type', 'password');
    await expect(confirmation).toHaveAttribute('required', '');
    await current.fill(account.password);
    await next.fill('short');
    await submit.click();

    await expect(page.locator('#profile-password-error')).toHaveText('The new password needs at least 12 characters.');
    await next.fill(changed.password);
    await submit.click();

    await expect(confirmationError).toHaveText('Confirm your new password.');
    await expect(confirmation).toHaveAttribute('aria-invalid', 'true');
    await expect(confirmation).toHaveAttribute('aria-describedby', 'profile-confirm-password-error');
    await expect(confirmation).toBeFocused();
    await confirmation.fill(`${changed.password} `);
    await confirmation.press('Enter');

    await expect(confirmationError).toHaveText('The passwords do not match.');
    await expectFeedbackAligned(confirmationError);
    await page.screenshot({ path: test.info().outputPath('confirmation-feedback.png') });
    await expect(confirmation).toBeFocused();
    await expect(current).toHaveValue(account.password);
    await expect(next).toHaveValue(changed.password);
    await expect(confirmation).toHaveValue(`${changed.password} `);
    expect(passwordWrites).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.locator('#profile-password-cancel').click();

    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    const themeSaved = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/auth/theme' && response.request().method() === 'PUT',
    );

    await page.locator('#profile-dark-mode').click();

    expect((await themeSaved).status()).toBe(204);
    await expect(page.locator('html')).toHaveAttribute('tuiTheme', 'dark');
    await trigger.click();

    await expect(current).toHaveValue('');
    await expect(next).toHaveValue('');
    await expect(confirmation).toHaveValue('');
    await expect(confirmationError).toHaveCount(0);
    await current.fill('Incorrect-current-Aa1');
    await next.fill(changed.password);
    await confirmation.fill(changed.password);

    const failed = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/auth/password' && response.request().method() === 'POST',
    );

    await submit.click();

    expect((await failed).status()).toBe(400);
    await expect(page.locator('#profile-password-error')).toContainText('Check the current password.');
    await expectFeedbackAligned(page.locator('#profile-password-error'));
    await page.screenshot({ path: test.info().outputPath('password-feedback.png') });
    await expect(current).toHaveValue('Incorrect-current-Aa1');
    await expect(next).toHaveValue(changed.password);
    await expect(confirmation).toHaveValue(changed.password);
    await expect(submit).toBeEnabled();
    await expect(confirmation).not.toHaveAttribute('aria-invalid', 'true');
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await current.fill(account.password);
    await confirmation.press('Enter');

    await expect(page.locator('#login-submit')).toBeEnabled();
    expect(passwordWrites).toBe(2);
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
    await signIn(page, {
      username: account.username,
      password: changed.password,
    });

    await expect(page.locator('#overview-title')).toHaveText('Overview');
    expect(errors).toEqual([]);
  });
}
