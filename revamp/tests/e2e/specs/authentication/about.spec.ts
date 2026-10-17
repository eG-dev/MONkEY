import {
  test,
  expect,
  bootstrapManager,
  createUser,
  credentials,
  login,
  signIn,
} from "../../fixtures";
import { createMember } from "../../helpers/accounts";

test.use({ ignoreHTTPSErrors: true });

for (const role of ["Manager", "Member"] as const) {
  test(`${role} opens the shared About dialog without navigating or closing the drawer`, async ({
    page,
    request,
    instance,
  }) => {
    const manager = bootstrapManager(instance);
    let account = manager;

    if (role === "Member") {
      await login(request, manager);
      account = await createMember(request);
    }

    await signIn(page, account);
    await expect(page.locator("#shell-navigation-toggle")).toBeEnabled();
    const metadataResponse = await page.request.get("/about/build-info.json");

    expect(metadataResponse.status()).toBe(200);

    const metadata: Record<string, unknown> = await metadataResponse.json();

    if (
      (await page
        .locator("#shell-navigation-toggle")
        .getAttribute("aria-expanded")) === "false"
    ) {
      await page.locator("#shell-navigation-toggle").click();
    }

    const navigation = await page
      .locator(
        "#shell-navigation-overview, #shell-navigation-administration, #shell-navigation-accounts, #shell-navigation-about",
      )
      .evaluateAll((elements) => elements.map((element) => element.id));

    expect(navigation).toEqual([
      "shell-navigation-overview",
      ...(role === "Manager" ? ["shell-navigation-accounts"] : []),
      "shell-navigation-administration",
      "shell-navigation-about",
    ]);
    await expect(page.locator("#shell-version")).toHaveText(`Version ${metadata["version"]}`);
    await expect(page.locator("#shell-navigation-about")).toHaveAccessibleName(
      "About",
    );

    const originalUrl = page.url();

    await page.locator("#shell-navigation-about").click();

    await expect(page.locator("#about-dialog")).toHaveCount(1);
    await expect(page.locator("#about-dialog")).toBeVisible();
    await expect(page.locator("#about-dialog")).toHaveAccessibleName("About");
    await expect(page.locator("#about-version")).toHaveText(`Version ${metadata["version"]}`);

    if (typeof metadata["revision"] === "string") {
      await expect(page.locator("#about-revision")).toContainText(metadata["revision"]);
    }
    await expect(page.locator("#about-tab-overview")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(page.url()).toBe(originalUrl);

    await page.keyboard.press("Escape");

    await expect(page.locator("#about-dialog")).not.toBeVisible();
    await expect(page.locator("#shell-navigation-about")).toBeFocused();
    await expect(page.locator("#shell-navigation-toggle")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(page.url()).toBe(originalUrl);

    await page.locator("#shell-navigation-about").click();
    await page.locator("#about-dialog-close").click();

    await expect(page.locator("#shell-navigation-about")).toBeFocused();
    expect(page.url()).toBe(originalUrl);
  });
}

test("About preserves the forced-password-change form", async ({
  page,
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const { account } = await createUser(
    request,
    "new-member",
    "New member",
    "Member",
  );
  const permanent = credentials(account.username);

  await signIn(page, account);
  await expect(page.locator("#login-change-password-submit")).toBeEnabled();
  await page.locator("#login-current-password").fill(account.password);
  await page.locator("#login-new-password").fill(permanent.password);
  await page.locator("#login-about").click();

  await expect(page.locator("#about-dialog")).toHaveAccessibleName("About");

  await page.locator("#about-dialog-close").click();

  await expect(page.locator("#login-about")).toBeFocused();
  await expect(page.locator("#login-current-password")).toHaveValue(
    account.password,
  );
  await expect(page.locator("#login-new-password")).toHaveValue(
    permanent.password,
  );

  await page.locator("#login-change-password-submit").click();

  await expect(page.locator("#login-notice")).toHaveText(
    "Password changed. Sign in again.",
  );
});
