import { test, expect, docker } from '../../fixtures';

test.use({ ignoreHTTPSErrors: true });

for (const process of ['backend', 'web']) {
  test(`${process} crash stops the entire container with a failure status`, async ({ instance }) => {
    docker('exec', instance.container, 'supervisorctl', '-c', '/app/supervisord.conf', 'signal', 'KILL', process);

    await expect.poll(() => JSON.parse(docker('inspect', instance.container))[0].State.Running, { timeout: 25_000 }).toBe(false);

    expect(JSON.parse(docker('inspect', instance.container))[0].State.ExitCode).toBe(1);
  });
}
