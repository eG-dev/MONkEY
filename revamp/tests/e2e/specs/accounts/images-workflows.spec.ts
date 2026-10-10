import { test, expect, bootstrapManager, credentials, createUser, csrfWrite, login } from '../../fixtures';
import { picture, upload } from '../../helpers/images';

test.use({ ignoreHTTPSErrors: true });

test('account image upload, replacement, removal and fallback', async ({ page, instance }) => {
  const request = page.request;
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Image account' });
  const account = await created.json();
  const path = `/api/accounts/${account.id}`;
  const labels = {
    change: 'Change image of Image account',
    dialog: 'Account image',
    upload: 'Upload image',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Remove image',
  };
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`/accounts/${account.id}`);
  const avatar = page.locator('#account-details-avatar');
  const dialog = page.locator('#account-details-image-dialog');
  const edit = page.locator('#account-details-image-edit');
  const upload = page.locator('#account-details-image-upload');
  const preview = page.locator('#account-details-image-preview img');
  const save = page.locator('#account-details-image-save');
  const png = await picture(page);

  await expect(avatar).toHaveText('I');
  await expect(edit).toHaveAccessibleName(labels.change);
  await edit.click();
  await expect(dialog).toHaveAccessibleName(labels.dialog);
  await expect(upload).toHaveAccessibleName(labels.upload);
  await expect(save).toHaveText(labels.save);
  await upload.setInputFiles({ name: '../../image.png', mimeType: 'image/png', buffer: png });
  await expect(preview).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('image-dialog.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('#account-details-image-cancel')).toHaveText(labels.cancel);
  await page.locator('#account-details-image-cancel').click();
  await expect(avatar).toHaveText('I');
  await edit.click();
  await upload.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: await picture(page, 513, 1) });
  await expect(page.locator('#account-details-image-error')).toHaveRole('alert');
  await expect(page.locator('#account-details-image-error')).toContainText('512');
  await upload.setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: png });
  await expect(preview).toBeVisible();
  await save.click();
  await expect(dialog).not.toBeVisible();
  await expect(avatar.locator('img')).toBeVisible();
  expect(await avatar.locator('img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(512);
  await page.reload();
  await expect(avatar.locator('img')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('account-card').locator('img')).toBeVisible();
  await page.goto('/accounts');
  await expect(page.getByTestId('account-row-link').locator('img')).toBeVisible();
  await page.goto(`/accounts/${account.id}`);
  await edit.click();
  await upload.setInputFiles({
    name: 'replacement.webp',
    mimeType: 'image/webp',
    buffer: await picture(page, 80, 40, 'image/webp', '#17855a'),
  });
  await expect(preview).toBeVisible();
  await save.click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(async () => avatar.locator('img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(80);

  const member = await createUser(request, 'image-member', 'Image Member', 'Member');
  await login(request, member.account);
  const permanent = credentials('image-member');
  await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: member.account.password, newPassword: permanent.password });
  await login(request, permanent);
  await page.reload();
  await expect(avatar.locator('img')).toBeVisible();
  await expect(edit).toHaveCount(0);

  await login(request, manager);
  await page.reload();
  await page.route(`**${path}/image?*`, (route) => route.fulfill({ status: 404 }));
  await page.reload();
  await expect(avatar).toHaveText('I');
  await page.unroute(`**${path}/image?*`);
  await page.reload();
  await edit.click();
  await expect(page.locator('#account-details-image-remove')).toHaveText(labels.remove);
  await page.locator('#account-details-image-remove').click();
  await save.click();
  await expect(dialog).not.toBeVisible();
  await expect(avatar).toHaveText('I');
  await page.reload();
  await expect(avatar).toHaveText('I');
  expect(errors).toEqual([]);
});
