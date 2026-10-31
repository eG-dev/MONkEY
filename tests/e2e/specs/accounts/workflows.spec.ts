import { test, expect, bootstrapManager, csrfWrite, login, signIn } from '../../fixtures';
import { createMember } from '../../helpers/accounts';

test.use({ ignoreHTTPSErrors: true });

test('manager account creation/editing and member read-only workflow', async ({ page, request, browser, instance }) => {
  const manager = bootstrapManager(instance);
  const labels = {
    username: 'Username',
    password: 'Password',
    login: 'Sign in',
    title: 'Accounts',
    empty: 'No accounts yet',
    missing: 'This account does not exist.',
    refresh: 'Try again',
    create: 'Create account',
    name: 'Account name',
    edit: 'Edit account',
    editNamed: (name: string) => `Edit ${name}`,
    open: (name: string) => `Open ${name}`,
    save: 'Save',
    saved: (name: string) => `${name} saved`,
    managersOnly: 'Only managers can manage accounts.',
    noOpening: 'This account has no opening balance yet. A manager must post it first.',
    duplicate: 'An account with this name already exists.',
  };
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));

  await login(request, manager);

  const member = await createMember(request);

  await page.goto('/accounts');

  await expect(page.locator('#login-username')).toHaveAccessibleName(labels.username);
  await expect(page.locator('#login-password')).toHaveAccessibleName(labels.password);
  await expect(page.locator('#login-submit')).toHaveText(labels.login);

  await signIn(page, manager, '/accounts');

  await expect(page.locator('#accounts-title')).toHaveText(labels.title);
  await expect(page.locator('#accounts-empty')).toHaveText(labels.empty);
  await expect(page.locator('#accounts-create')).toHaveText(labels.create);

  await page.locator('#accounts-create').click();

  const createDialog = page.locator('#accounts-create-dialog');
  const createName = page.locator('#accounts-create-name');

  await expect(createDialog).toHaveAccessibleName(labels.create);
  await expect(createName).toHaveAccessibleName(labels.name);
  await expect(createName).toHaveAttribute('maxlength', '40');

  await createName.fill('  Ida  ');
  await page.locator('#accounts-create-submit').click();

  await expect(page).toHaveURL(/\/accounts\/[\w-]+$/);
  await expect(page.locator('#account-details-title')).toHaveText('Ida');
  await expect(page.locator('#account-details-rename')).toHaveAccessibleName(labels.editNamed('Ida'));

  await page.locator('#account-details-rename').click();

  await expect(page.locator('#account-details-rename-dialog')).toHaveAccessibleName(labels.editNamed('Ida'));
  await expect(page.locator('#account-details-rename-save')).toHaveText(labels.save);

  await page.locator('#account-details-rename-name').fill('N'.repeat(40));
  await page.locator('#account-details-rename-save').click();

  await expect(page.locator('#account-details-title')).toHaveText('N'.repeat(40));

  await page.reload();

  await expect(page.locator('#account-details-title')).toHaveText('N'.repeat(40));

  await page.goto('/accounts');

  await expect(page.getByTestId('account-row')).toHaveCount(1);
  await expect(page.getByTestId('account-row-link')).toHaveAccessibleName('N'.repeat(40));
  await expect(page.getByTestId('account-row-link')).toBeVisible();
  await expect(page.getByTestId('account-row-allowance')).toHaveText('No monthly allowance');

  await page.reload();

  await expect(page.getByTestId('account-row-link')).toBeVisible();
  await expect(page.getByTestId('account-row-link')).toHaveCSS('text-decoration-line', 'none');
  await expect(page.getByTestId('account-row-link').locator('.account-name')).toHaveCSS('text-decoration-line', 'none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  if (test.info().project.name === 'desktop') {
    const originalViewport = page.viewportSize();
    const row = page.getByTestId('account-row');

    for (const width of [600, 899, 900, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });

      await expect
        .poll(async () => {
          return row.evaluate((element) => {
            const cells = element.querySelectorAll('td');
            const name = cells[0].getBoundingClientRect();
            const balance = cells[1].getBoundingClientRect();
            const allowance = cells[2].getBoundingClientRect();
            const status = cells[3].getBoundingClientRect();

            return {
              cappedName: name.width <= 360,
              adjacentBalance: Math.abs(name.right - balance.left) < 1,
              balanceBeforeAllowance: Math.abs(balance.right - allowance.left) < 1,
              allowanceBeforeStatus: Math.abs(allowance.right - status.left) < 1,
              noOverflow: document.documentElement.scrollWidth <= innerWidth,
            };
          });
        })
        .toEqual({ cappedName: true, adjacentBalance: true, balanceBeforeAllowance: true, allowanceBeforeStatus: true, noOverflow: true });
    }

    await page.setViewportSize(originalViewport!);
  }

  if (test.info().project.name === 'mobile') {
    const originalViewport = page.viewportSize();

    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 800 });

      const row = page.getByTestId('account-row');
      const accountLink = row.getByTestId('account-row-link');

      await expect(row.getByTestId('account-row-open')).toBeHidden();
      await expect(accountLink.locator('.avatar')).toBeVisible();

      const layout = await row.evaluate((element) => {
        const link = element.querySelector('.name-cell > a')!.getBoundingClientRect();
        const name = element.querySelector('.account-name')!.getBoundingClientRect();
        const status = element.querySelector('.mobile-status')!.getBoundingClientRect();
        const balance = element.querySelector('.numeric')!.getBoundingClientRect();
        const allowance = element.querySelector('.allowance')!.getBoundingClientRect();

        return {
          targetHeight: link.height,
          statusBelowName: status.top >= name.bottom,
          statusAlignedWithName: Math.abs(status.left - name.left) < 1,
          noOverlap: link.right <= balance.left,
          allowanceBelowBalance: allowance.top >= balance.bottom,
          allowanceAlignedWithBalance: Math.abs(allowance.right - balance.right) < 1,
          noOverflow: document.documentElement.scrollWidth <= innerWidth,
        };
      });

      expect(layout.targetHeight).toBeGreaterThanOrEqual(44);
      expect(layout.statusBelowName).toBe(true);
      expect(layout.statusAlignedWithName).toBe(true);
      expect(layout.noOverlap).toBe(true);
      expect(layout.allowanceBelowBalance).toBe(true);
      expect(layout.allowanceAlignedWithBalance).toBe(true);
      expect(layout.noOverflow).toBe(true);

      await page.screenshot({ path: test.info().outputPath(`accounts-${width}.png`), fullPage: true });
    }

    await page.setViewportSize(originalViewport!);
  }

  await page.screenshot({ path: test.info().outputPath('accounts.png'), fullPage: true });

  const accountLink = page.getByTestId('account-row-link');

  await accountLink.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');

  await expect(accountLink).toBeFocused();
  await expect(accountLink).toHaveCSS('outline-style', 'solid');

  await accountLink.press('Enter');

  await expect(page.locator('#account-details-title')).toHaveText('N'.repeat(40));

  await page.goto('/accounts');
  await expect(page.locator('#accounts-create')).toBeEnabled();

  await page.locator('#accounts-create').click();
  await createName.fill('n'.repeat(40));
  await page.locator('#accounts-create-submit').click();

  await expect(page.locator('#accounts-create-error')).toHaveRole('alert');
  await expect(page.locator('#accounts-create-error')).toHaveText(labels.duplicate);

  const usersBeforeMember = await (await page.request.get('/api/users')).json();
  const memberBeforeLogin = usersBeforeMember.find((entry: { user: { username: string } }) => entry.user.username === member.username);
  const accountsBeforeMember = await (await page.request.get('/api/accounts')).json();
  expect((await csrfWrite(page.request, 'PUT', `/api/users/${memberBeforeLogin.user.id}/account-assignments`, {
    accountIds: accountsBeforeMember.map((account: { id: string }) => account.id),
  })).status()).toBe(200);

  const context = await browser.newContext({ ...test.info().project.use, baseURL: instance.origin, ignoreHTTPSErrors: true });

  try {
    const memberPage = await context.newPage();

    memberPage.on('pageerror', (error) => errors.push(error.message));
    await signIn(memberPage, member, '/accounts');

    await expect(memberPage.locator('#accounts-managers-only')).toContainText(labels.managersOnly);
    await expect(memberPage.locator('#accounts-create')).toHaveCount(0);

    await memberPage.goto('/');

    const card = memberPage.getByTestId('account-card');

    await expect(card).toHaveCount(1);
    await expect(card).toHaveAccessibleName(labels.open('N'.repeat(40)));

    await card.focus();
    await card.press('Enter');

    await expect(memberPage.locator('#account-details-title')).toHaveText('N'.repeat(40));
    await expect(memberPage.locator('#account-details-no-opening')).toHaveText(labels.noOpening);
    await expect(memberPage.getByRole('textbox')).toHaveCount(0);
    expect(await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await memberPage.screenshot({ path: test.info().outputPath('member-account.png'), fullPage: true });

    await memberPage.goto('/accounts/missing');

    await expect(memberPage.locator('#account-details-error')).toHaveRole('alert');
    await expect(memberPage.locator('#account-details-error')).toContainText(labels.missing);

    await login(request, manager);

    const users = await (await request.get('/api/users')).json();
    const reader = users.find((entry: { user: { username: string } }) => entry.user.username === member.username);
    const disabled = await csrfWrite(request, 'PUT', `/api/users/${reader.user.id}`, {
      displayName: 'Reader',
      role: 'Member',
      isActive: false,
    });

    expect(disabled.status()).toBe(204);

    await expect(memberPage.locator('#account-details-retry')).toHaveText(labels.refresh);

    await memberPage.locator('#account-details-retry').click();

    await expect(memberPage.locator('#login-submit')).toHaveText(labels.login);
    await expect(memberPage.locator('#shell-main')).toHaveCount(0);
    await expect(memberPage.locator('main')).not.toContainText('N'.repeat(40));
  } finally {
    await context.close();
  }

  expect(errors).toEqual([]);
});
