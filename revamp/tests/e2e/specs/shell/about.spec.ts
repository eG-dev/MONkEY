import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

import { test, expect, credentials, docker } from "../../fixtures";

test("public About preserves sign-in values, supports keyboard tabs, and bundles the canonical license", async ({
  page,
  instance,
  isMobile,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  const unfinished = credentials("unfinished");

  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== instance.origin) {
      external.push(route.request().url());
      return route.abort();
    }

    return route.continue();
  });

  if (isMobile) {
    await page.setViewportSize({ width: 320, height: 740 });
  }

  await page.goto("/");
  const metadataResponse = await page.request.get("/about/build-info.json");

  expect(metadataResponse.status()).toBe(200);

  const metadata: Record<string, unknown> = await metadataResponse.json();
  const labels: Record<string, string> = JSON.parse(docker("inspect", instance.container, "--format", "{{json .Config.Labels}}"));
  const manifest: Record<string, unknown> = JSON.parse(readFileSync(resolve(__dirname, "../../../../web/package.json"), "utf8"));

  expect(metadata["schemaVersion"]).toBe(1);
  expect(metadata["version"]).toBe(manifest["version"]);
  expect(metadata["version"]).toBe(labels["org.opencontainers.image.version"]);
  expect(metadata["revision"] ?? "unavailable").toBe(labels["org.opencontainers.image.revision"]);
  expect(metadata["kind"]).toBe(labels["org.pocketmonkey.build.kind"]);
  expect(String(metadata["dirty"])).toBe(labels["org.pocketmonkey.build.dirty"]);
  expect(metadata["repositoryUrl"] ?? "").toBe(labels["org.opencontainers.image.source"]);
  await expect(page.locator("#login-version")).toHaveText(`Version ${metadata["version"]}`);

  const firstRender = await page.request.get("/");

  expect(await firstRender.text()).toContain(`Version ${metadata["version"]}`);
  await expect(page.locator("#login-about")).toBeEnabled();
  await expect(page.locator("#login-about")).toHaveAccessibleName("About");
  await page.locator("#login-username").fill(unfinished.username);
  await page.locator("#login-password").fill(unfinished.password);
  await page.locator("#login-about").click();

  const dialog = page.locator("#about-dialog");

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveRole("dialog");
  await expect(dialog).toHaveAccessibleName("About");
  await expect(page.locator("#about-version")).toHaveText(`Version ${metadata["version"]}`);

  if (typeof metadata["revision"] === "string") {
    await expect(page.locator("#about-revision")).toContainText(metadata["revision"]);
    await expect(page.locator("#about-revision")).toContainText(metadata["kind"] === "release" ? "Release" : "Development build");

    if (metadata["dirty"] === true) {
      await expect(page.locator("#about-revision")).toContainText("uncommitted changes");
      expect(metadata["sourceUrl"]).toBeNull();
    }
  } else {
    await expect(page.locator("#about-revision")).toHaveText("Source revision unavailable in this build.");
  }
  await expect(page.locator("#about-dialog-close")).toBeFocused();
  await expect(page.locator("#about-tab-overview")).toHaveAccessibleName(
    "Overview",
  );
  await expect(page.locator("#about-tab-notices")).toHaveAccessibleName(
    "Third-party notices",
  );
  await expect(page.locator("#about-tab-legal")).toHaveAccessibleName(
    "Legal information",
  );
  await expect(page.locator("#about-tab-overview")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (const [selector, key] of [["#about-github", "repositoryUrl"], ["#about-source", "sourceUrl"]]) {
    if (typeof metadata[key] === "string") {
      await expect(page.locator(selector)).toHaveAttribute("href", metadata[key]);
    } else {
      await expect(page.locator(selector)).toHaveAttribute("aria-disabled", "true");
    }
  }
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.locator("#about-product-title").evaluate((element) => {
      const image = element.previousElementSibling as HTMLImageElement;

      return image.complete && image.naturalWidth > 0;
    }),
  ).toBe(true);

  await page.screenshot({
    path: test.info().outputPath("about-overview.png"),
    fullPage: true,
  });
  await page.locator("#login-username").evaluate((element) => element.focus());

  await expect(page.locator("#about-dialog-close")).toBeFocused();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );

  await page.locator("#about-tab-overview").focus();
  await page.keyboard.press("End");

  await expect(page.locator("#about-tab-legal")).toBeFocused();
  await expect(page.locator("#about-panel-legal")).toBeVisible();
  await expect(page.locator("#about-operator-title")).toHaveText(
    "Operator responsibilities",
  );
  await expect(page.locator("#about-warranty-title")).toHaveText(
    "Warranty and liability",
  );
  await expect(page.locator("#about-privacy-title")).toHaveText(
    "Privacy information",
  );
  await page.screenshot({
    path: test.info().outputPath("about-legal.png"),
    fullPage: true,
  });
  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-overview")).toBeFocused();

  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-notices")).toBeFocused();
  await expect(page.locator("#about-panel-notices")).toBeVisible();
  await page.locator("#about-search").fill("LUCIDE");

  await expect(page.locator("#about-search-status")).toHaveText(
    "Matching components: 1",
  );
  await expect(page.getByTestId("about-component-angular")).toHaveCount(0);
  await page
    .getByTestId("about-component-lucide")
    .getByTestId("about-component-toggle")
    .click();

  await expect(page.getByTestId("about-component-lucide")).toContainText(
    "required NOTICE text",
  );
  await page.screenshot({
    path: test.info().outputPath("about-notices.png"),
    fullPage: true,
  });
  await page.locator("#about-search").fill("no-such-component");

  await expect(page.locator("#about-no-results")).toHaveText(
    "No matching components.",
  );

  await page.locator("#about-tab-notices").focus();
  await page.keyboard.press("Home");
  await page.locator("#about-project-license-toggle").click();

  const license = readFileSync(
    resolve(__dirname, "../../../../../LICENSE"),
    "utf8",
  );

  expect(await page.locator("#about-license-text").textContent()).toBe(license);
  expect(metadata["licenseSha256"]).toBe(createHash("sha256").update(license).digest("hex"));
  await expect(page.locator("#about-license-file")).toHaveAccessibleName(
    "Open full license file",
  );

  const licenseFile = await page.request.get("/licenses/AGPL-3.0-only.txt");

  expect(licenseFile.status()).toBe(200);
  expect(await licenseFile.text()).toBe(license);

  const header = await page.locator("#about-dialog-title").boundingBox();

  await page.locator("#about-license-text").focus();
  await page.keyboard.press("Control+End");

  expect((await page.locator("#about-dialog-title").boundingBox())?.y).toBe(
    header?.y,
  );
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);

  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#login-about")).toBeFocused();
  await expect(page.locator("#login-username")).toHaveValue(
    unfinished.username,
  );
  await expect(page.locator("#login-password")).toHaveValue(
    unfinished.password,
  );

  await page.locator("#login-about").click();

  await expect(page.locator("#about-tab-overview")).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.locator("#about-dialog-close").click();

  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#login-about")).toBeFocused();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
