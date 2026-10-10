import { APIRequestContext, Page } from '@playwright/test';
import { resolve } from 'node:path';

import { test, expect, bootstrapManager, credentials, createUser, csrfWrite, login, docker, containerOrigin, waitReady, image } from '../fixtures';

test.use({ ignoreHTTPSErrors: true });

async function picture(page: Page, width = 512, height = 512, type = 'image/png', color = '#d32748'): Promise<Buffer> {
  const base64 = await page.evaluate(({ width, height, type, color }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return canvas.toDataURL(type).split(',')[1];
  }, { width, height, type, color });

  return Buffer.from(base64, 'base64');
}

async function upload(request: APIRequestContext, path: string, data: Buffer, type = 'image/png') {
  const token = await request.get('/api/auth/csrf');
  return request.put(path, { data, headers: { 'X-Monkey-CSRF': (await token.json()).token, 'Content-Type': type } });
}

test('private account images validate content, limits, access and persistence @api', async ({ page, request, instance }) => {
  await page.goto('/');
  const png = await picture(page);
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Image account' });
  const account = await created.json();
  const path = `/api/accounts/${account.id}/image`;

  expect((await request.get(path)).status()).toBe(404);
  expect((await request.put(path, { data: png, headers: { 'Content-Type': 'image/png' } })).status()).toBe(400);
  expect((await upload(request, path, Buffer.alloc(2 * 1024 * 1024 + 1))).status()).toBe(413);
  expect((await upload(request, path, Buffer.alloc(8 * 1024 * 1024))).status()).toBe(413);
  expect((await upload(request, path, await picture(page, 513, 1))).status()).toBe(400);
  expect((await upload(request, path, await picture(page, 1, 513))).status()).toBe(400);
  expect((await upload(request, path, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).status()).toBe(400);
  expect((await upload(request, path, png, 'image/jpeg')).status()).toBe(400);
  expect((await upload(request, '/api/accounts/missing/image', png)).status()).toBe(404);
  expect((await upload(request, '/api/accounts/..%2f..%2fkeys/image', png)).status()).toBe(404);

  const padded = Buffer.alloc(2 * 1024 * 1024);
  png.copy(padded);
  Buffer.from('private metadata marker').copy(padded, png.length);
  expect((await upload(request, path, padded)).status()).toBe(204);
  const stored = await request.get(path);
  expect(stored.status()).toBe(200);
  expect(stored.headers()['content-type']).toContain('image/png');
  expect(stored.headers()['cache-control']).toBe('no-store');
  expect(stored.headers()['x-content-type-options']).toBe('nosniff');
  expect((await stored.body()).includes(Buffer.from('private metadata marker'))).toBe(false);
  const firstUrl = (await (await request.get(`/api/accounts/${account.id}`)).json()).imageUrl;

  for (const type of ['image/jpeg', 'image/webp']) {
    expect((await upload(request, path, await picture(page, 200, 100, type), type)).status()).toBe(204);
    expect((await request.get(path)).headers()['content-type']).toContain('image/png');
  }

  const current = await (await request.get(`/api/accounts/${account.id}`)).json();
  expect(current.imageUrl).not.toBe(firstUrl);
  const lastImage = await (await request.get(path)).body();
  expect((await upload(request, path, Buffer.from('not an image'))).status()).toBe(400);
  expect(await (await request.get(path)).body()).toEqual(lastImage);
  docker('restart', instance.container);
  await waitReady(containerOrigin(instance.container));
  expect(await (await request.get(path)).body()).toEqual(lastImage);

  const member = await createUser(request, 'image-reader', 'Image Reader', 'Member');
  await login(request, member.account);
  const permanent = credentials('image-reader');
  expect((await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: member.account.password, newPassword: permanent.password })).status()).toBe(204);
  await login(request, permanent);
  expect((await request.get(path)).status()).toBe(200);
  expect((await upload(request, path, png)).status()).toBe(403);
  expect((await request.delete(path)).status()).toBe(403);
  await csrfWrite(request, 'POST', '/api/auth/logout', {});
  expect((await request.get(path)).status()).toBe(401);
  expect((await request.put(path, { data: png })).status()).toBe(401);
  expect((await request.delete(path)).status()).toBe(401);
  expect((await request.get(`/images/${current.imageUrl.split('v=')[1]}`)).status()).toBe(404);

  await login(request, manager);
  const token = await request.get('/api/auth/csrf');
  expect((await request.delete(path, { headers: { 'X-Monkey-CSRF': (await token.json()).token } })).status()).toBe(204);
  expect((await request.get(path)).status()).toBe(404);
  expect((await (await request.get(`/api/accounts/${account.id}`)).json()).imageUrl).toBeNull();
});

test('image filesystem failures, atomic audit rollback and orphan recovery hold @api', async () => {
  const output = docker('run', '--rm', '--network', 'none', '--user', '10001:10001', '--entrypoint', 'dotnet', '--mount',
    `type=bind,source=${resolve(__dirname, '../../integration/RuntimeChecks/bin/Release/net10.0')},target=/tests,readonly`,
    image, '/tests/RuntimeChecks.dll', 'image-persistence');
  expect(output).toBe('image_persistence_passed');
});

for (const language of ['de', 'en'] as const) {
  test(`account image upload, replacement, removal and fallback in ${language}`, async ({ page, instance }) => {
    const request = page.request;
    const manager = bootstrapManager(instance);
    await login(request, manager);
    await csrfWrite(request, 'PUT', '/api/auth/language', { language });
    const created = await csrfWrite(request, 'POST', '/api/accounts', { name: 'Image account' });
    const account = await created.json();
    const path = `/api/accounts/${account.id}`;
    const labels = language === 'de'
      ? { change: 'Bild von Image account ändern', dialog: 'Kontobild', upload: 'Bild hochladen', save: 'Speichern', cancel: 'Abbrechen', remove: 'Bild entfernen' }
      : { change: 'Change image of Image account', dialog: 'Account image', upload: 'Upload image', save: 'Save', cancel: 'Cancel', remove: 'Remove image' };
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
    await upload.setInputFiles({ name: 'replacement.webp', mimeType: 'image/webp', buffer: await picture(page, 80, 40, 'image/webp', '#17855a') });
    await expect(preview).toBeVisible();
    await save.click();
    await expect(dialog).not.toBeVisible();
    await expect.poll(async () => avatar.locator('img').evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBe(80);

    const member = await createUser(request, 'image-member', 'Image Member', 'Member');
    await login(request, member.account);
    const permanent = credentials('image-member');
    await csrfWrite(request, 'POST', '/api/auth/password', { currentPassword: member.account.password, newPassword: permanent.password });
    await login(request, permanent);
    await csrfWrite(request, 'PUT', '/api/auth/language', { language });
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
}