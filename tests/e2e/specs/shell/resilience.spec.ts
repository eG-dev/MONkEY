import { test, expect, docker } from '../../fixtures';

test('backend failure preserves sign-in rendering and fails readiness @desktop', async ({ page, request, instance }) => {
  docker('exec', instance.container, 'supervisorctl', '-c', '/app/supervisord.conf', 'stop', 'backend');

  const readiness = await request.get('/health/ready');
  const failure = await request.get('/api/auth/me');

  expect(readiness.status()).toBe(503);

  expect(failure.status()).toBe(502);
  expect((await failure.json()).code).toBe('backend_unavailable');

  await page.goto('/');

  await expect(page.locator('#login-title')).toHaveText('Sign in');
  await expect(page.getByTestId('sample-id')).toHaveCount(0);
});
