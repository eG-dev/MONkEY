import { APIRequestContext, Page } from '@playwright/test';

export async function picture(page: Page, width = 512, height = 512, type = 'image/png', color = '#d32748'): Promise<Buffer> {
  const base64 = await page.evaluate(
    ({ width, height, type, color }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      context.fillStyle = color;
      context.fillRect(0, 0, width, height);
      return canvas.toDataURL(type).split(',')[1];
    },
    { width, height, type, color },
  );

  return Buffer.from(base64, 'base64');
}

export async function upload(request: APIRequestContext, path: string, data: Buffer, type = 'image/png') {
  const token = await request.get('/api/auth/csrf');
  return request.put(path, { data, headers: { 'X-Monkey-CSRF': (await token.json()).token, 'Content-Type': type } });
}
