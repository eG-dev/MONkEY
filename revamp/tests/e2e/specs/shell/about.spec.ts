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
  await expect(page.locator("#about-tab-license")).toHaveAccessibleName(
    "Project license",
  );
  expect(await dialog.getByRole("tab").evaluateAll((elements) => elements.map((element) => element.id))).toEqual([
    "about-tab-overview",
    "about-tab-license",
    "about-tab-notices",
    "about-tab-legal",
  ]);
  await expect(page.locator("#about-panel-overview #about-license-text")).toHaveCount(0);
  await expect(page.locator("#about-panel-license")).toBeHidden();
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

  const legalDocument = readFileSync(resolve(__dirname, "../../../../../docs/terms/self_hosted_legal_information.md"), "utf8");
  const acceptedEnglish = legalDocument.match(/## English\r?\n([\s\S]*?)\r?\n## Deutsch/);

  if (!acceptedEnglish) {
    throw new Error("Missing accepted English legal information");
  }

  const acceptedSections = acceptedEnglish[1].split(/^### /m).slice(1);

  for (const [sectionIndex, sectionId] of ["operator", "warranty", "privacy"].entries()) {
    const expectedParagraphs = acceptedSections[sectionIndex]
      .trim()
      .split(/\r?\n\r?\n/)
      .slice(1)
      .map((paragraph) => paragraph.replaceAll(String.fromCharCode(96), "").replace(/\s+/g, " ").trim());
    const paragraphs = page.locator(`#about-${sectionId}-section p`);

    await expect(paragraphs).toHaveText(expectedParagraphs);
    expect(await paragraphs.evaluateAll((elements) => elements.slice(1).every((element, index) =>
      element.getBoundingClientRect().top > elements[index].getBoundingClientRect().bottom,
    ))).toBe(true);
  }

  await expect(page.locator("#about-legal-review")).toHaveText(
    "This general software description is not a complete privacy notice for every deployment.",
  );
  await page.screenshot({
    path: test.info().outputPath("about-legal.png"),
    fullPage: true,
  });

  const legalHeader = await page.locator("#about-dialog-title").boundingBox();
  const legalTabs = await dialog.getByRole("tablist").boundingBox();

  await page.locator("#about-privacy-section p").last().scrollIntoViewIfNeeded();

  expect(await page.locator(".about-content").evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect((await page.locator("#about-dialog-title").boundingBox())?.y).toBe(legalHeader?.y);
  expect((await dialog.getByRole("tablist").boundingBox())?.y).toBe(legalTabs?.y);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("about-legal-bottom.png"), fullPage: true });

  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-overview")).toBeFocused();

  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-license")).toBeFocused();
  await expect(page.locator("#about-panel-license")).toBeVisible();
  await expect(page.locator("#about-license-text")).toBeVisible();
  await expect(page.locator("#about-project-license-toggle")).toHaveCount(0);

  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-notices")).toBeFocused();
  await expect(page.locator("#about-panel-notices")).toBeVisible();
  const noticesResponse = await page.request.get("/about/third-party.json");

  expect(noticesResponse.status()).toBe(200);

  const notices: {
    coverage: string;
    releaseReview: string;
    entries: {
      id: string;
      displayName: string;
      groups: { id: string; titleKey: string | null; componentIds: string[] }[];
      components: { id: string; name: string; version: string; licenseExpression: string | null; licensingStatus: string; upstreamUrl: string; documentIds: string[] }[];
    }[];
    documents: { id: string; kind: string; url: string; text: string; sha256: string }[];
  } = await noticesResponse.json();

  expect(notices.coverage).toBe("complete");
  expect(notices.releaseReview).toBe("pending");
  await expect(page.locator("#about-inventory-review")).toHaveCount(0);

  const directDependencies = manifest["dependencies"];

  if (!directDependencies || typeof directDependencies !== "object" || Array.isArray(directDependencies)) {
    throw new Error("Missing direct web runtime dependencies");
  }

  const catalogedComponents = notices.entries.flatMap((entry) => entry.components);

  for (const name of Object.keys(directDependencies)) {
    expect(
      catalogedComponents.filter((component) => component.name === name),
      `Direct runtime notice mapping: ${name}`,
    ).toHaveLength(1);
  }

  const matchingEntryCount = (query: string): number => notices.entries
    .filter((entry) => [
      entry.displayName,
      ...entry.components.flatMap((component) => [component.name, component.version, component.licenseExpression ?? ""]),
    ].some((value) => value.toUpperCase().includes(query.toUpperCase())))
    .length;

  await page.locator("#about-search").fill(".nEt");

  await expect(page.locator("#about-search-status")).toHaveText(`Matching components: ${matchingEntryCount(".nEt")}`);
  await expect(page.getByTestId("about-component-dotnet")).toBeVisible();
  await expect(page.getByTestId("about-component-aspnet-core")).toBeVisible();
  await expect(page.getByTestId("about-component-ef-core")).toHaveCount(0);

  for (const entry of notices.entries) {
    await page.locator("#about-search").fill(entry.components[0].name.toUpperCase());

    const row = page.getByTestId(`about-component-${entry.id}`);

    await expect(page.locator("#about-search-status")).toHaveText(`Matching components: ${matchingEntryCount(entry.components[0].name)}`);
    await expect(row).toBeVisible();

    for (const component of entry.components) {
      if (component.licenseExpression === null) {
        expect(component.licensingStatus).toBe("public-domain");
      }
    }

    const metadata = [...new Set(entry.components.map((component) => `${component.version} \u00b7 ${component.licenseExpression ?? "Public domain"}`))];

    if (entry.groups.length > 1) {
      await expect(row.getByTestId('about-component-metadata-groups')).toHaveText(`${entry.groups.length} package / license groups`);
    } else {
      await expect(row.getByTestId('about-component-metadata')).toHaveText(metadata);
      expect(await row.getByTestId('about-metadata-separator').allTextContents()).toEqual(
        metadata.slice(1).map(() => '\u00a0\u00a0|\u00a0\u00a0'),
      );
      expect(await row.getByTestId('about-component-metadata-groups').textContent()).toBe(
        metadata.join('\u00a0\u00a0|\u00a0\u00a0'),
      );
    }
    await page.screenshot({ path: test.info().outputPath(`about-notice-summary-${entry.id}.png`), fullPage: true });

    const collapsedNotices = await page.locator("#about-panel-notices").boundingBox();

    await row.getByTestId("about-component-toggle").focus();
    await page.keyboard.press("Enter");

    const expandedNotices = await page.locator("#about-panel-notices").boundingBox();

    expect(collapsedNotices).not.toBeNull();
    expect(expandedNotices?.x).toBe(collapsedNotices?.x);
    expect(expandedNotices?.width).toBe(collapsedNotices?.width);

    const documentIds = [...new Set(entry.components.flatMap((component) => component.documentIds))];

    await expect(row.getByTestId('about-document-text')).toHaveCount(documentIds.length);
    await expect(row.getByTestId('about-group-members').getByRole('listitem')).toHaveCount(entry.components.length);

    for (const packageGroup of entry.groups) {
      const group = row.getByTestId(`about-group-${packageGroup.id}`);
      const members = entry.components.filter((component) => packageGroup.componentIds.includes(component.id));
      const groupMetadata = [...new Set(members.map((member) => `${member.version} \u00b7 ${member.licenseExpression ?? "Public domain"}`))];
      const title = packageGroup.id === "providers"
        ? "Microsoft SQLite providers"
        : packageGroup.id === "bindings"
          ? "SQLitePCLRaw"
          : packageGroup.id === "engine"
            ? "SQLite engine"
            : entry.displayName;

      await expect(group).toHaveRole("region");
      await expect(group).toHaveAccessibleName(title);
      await expect(group.getByTestId('about-group-members').getByRole('listitem')).toHaveCount(members.length);
      await expect(group.getByTestId('about-group-metadata')).toHaveText(
        groupMetadata.length === 1 ? groupMetadata[0] : "Mixed package metadata; see individual components",
      );

      for (const component of members) {
        const member = group.getByTestId(`about-member-${component.id}`);

        await expect(member).toContainText(component.name);
        await expect(member.getByRole('link', { name: 'Component source', exact: true })).toHaveAttribute('href', component.upstreamUrl);

        if (groupMetadata.length > 1) {
          await expect(member.getByTestId("about-member-metadata")).toHaveText(
            `${component.version} \u00b7 ${component.licenseExpression ?? "Public domain"}`,
          );
        } else {
          await expect(member.getByTestId("about-member-metadata")).toHaveCount(0);
        }
      }
    }

    for (const documentId of documentIds) {
      const document = notices.documents.find((candidate) => candidate.id === documentId);

      if (!document) {
        throw new Error(`Missing mapped original: ${documentId}`);
      }

      const documentRow = row.getByTestId(`about-document-${document.id}`);
      const members = entry.components.filter((component) => component.documentIds.includes(document.id));
      const licenses = [...new Set(members.map((member) => member.licenseExpression))];
      const title = document.kind === "license"
        ? licenses.length === 1 && licenses[0] ? `${licenses[0]} license` : "License"
        : document.kind === "notice" ? "Third-party notices"
          : document.kind === "copyright" ? "Copyright" : "Public-domain statement";
      const toggle = documentRow.getByTestId("about-document-toggle");
      const link = documentRow.getByTestId('about-document-file');
      const originalText = documentRow.getByTestId('about-document-text')
        .and(page.getByLabel(`Original document: ${title}`, { exact: true }));

      await expect(toggle).toHaveAccessibleName(title);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(originalText).toBeHidden();
      await toggle.focus();
      await page.keyboard.press(document.kind === "notice" ? "Space" : "Enter");

      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(originalText).toBeVisible();
      await expect(documentRow.getByRole("region", { name: title, exact: true })).toBeVisible();
      await expect(link).toHaveText("Open original");
      await expect(link).toHaveAccessibleName(`Open original document: ${title}`);
      await expect(link).toHaveAttribute('href', document.url);
      expect(await originalText.textContent()).toBe(document.text);

      const download = await page.request.get(document.url);

      expect(download.status()).toBe(200);
      expect(createHash('sha256').update(await download.body()).digest('hex')).toBe(document.sha256);
      expect(await originalText.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(await originalText.evaluate((element) => ["auto", "scroll"].includes(getComputedStyle(element).overflowY))).toBe(false);

      if (document.id === "sqlitepclraw-license") {
        const [original] = await Promise.all([page.waitForEvent("popup"), link.click()]);

        await expect(original).toHaveURL(new URL(document.url, instance.origin).href);
        await original.close();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
      }

      await originalText.focus();
      await page.keyboard.press('Control+End');
    }

    if (documentIds.length > 1) {
      const first = row.getByTestId(`about-document-${documentIds[0]}`).getByTestId("about-document-toggle");
      const last = row.getByTestId(`about-document-${documentIds[documentIds.length - 1]}`).getByTestId("about-document-toggle");

      await last.press("Space");

      await expect(last).toHaveAttribute("aria-expanded", "false");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await last.press("Enter");
    }

    await page.locator('#about-search').fill(entry.components[0].name);

    await expect(page.locator('#about-search-status')).toHaveText(`Matching components: ${matchingEntryCount(entry.components[0].name)}`);
    await expect(row).toHaveAttribute('open', '');
    await expect(row.getByTestId('about-document-text')).toHaveCount(documentIds.length);
    expect(await row.getByTestId('about-document-toggle').evaluateAll((buttons) =>
      buttons.every((button) => button.getAttribute("aria-expanded") === "true"),
    )).toBe(true);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`about-notices-${entry.id}.png`), fullPage: true });
  }

  await page.locator("#about-search").fill("");

  for (const entry of notices.entries) {
    const row = page.getByTestId(`about-component-${entry.id}`);

    await expect(row).toHaveAttribute("open", "");
    expect(await row.getByTestId("about-document-toggle").evaluateAll((buttons) =>
      buttons.every((button) => button.getAttribute("aria-expanded") === "true"),
    )).toBe(true);
  }

  await page.locator("#about-tab-license").click();
  await page.locator("#about-tab-notices").click();

  for (const entry of notices.entries) {
    await expect(page.getByTestId(`about-component-${entry.id}`)).toHaveAttribute("open", "");
  }

  await page.locator("#about-search").fill("OFL-1.1");

  await expect(page.getByTestId("about-component-roboto")).toBeVisible();
  await expect(page.getByTestId("about-component-ef-core")).toHaveCount(0);
  await page.locator("#about-search").fill("no-such-component");

  await expect(page.locator("#about-no-results")).toHaveText(
    "No matching components.",
  );

  await page.locator("#about-tab-notices").focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#about-tab-license")).toBeFocused();
  await expect(page.locator("#about-panel-license")).toBeVisible();
  await expect(page.locator("#about-license-text")).toBeVisible();

  const licensePanel = await page.locator("#about-panel-license").boundingBox();

  expect(licensePanel).not.toBeNull();

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

  await page.screenshot({ path: test.info().outputPath("about-license.png"), fullPage: true });

  const header = await page.locator("#about-dialog-title").boundingBox();
  const tabs = await dialog.getByRole("tablist").boundingBox();

  await page.locator("#about-license-text").focus();
  await page.keyboard.press("Control+End");

  expect((await page.locator("#about-dialog-title").boundingBox())?.y).toBe(
    header?.y,
  );
  expect((await dialog.getByRole("tablist").boundingBox())?.y).toBe(tabs?.y);
  expect((await page.locator("#about-panel-license").boundingBox())?.x).toBe(licensePanel?.x);
  expect((await page.locator("#about-panel-license").boundingBox())?.width).toBe(licensePanel?.width);
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
  await page.locator("#about-tab-notices").click();
  await expect(page.locator("#about-search")).toHaveValue("");

  for (const entry of notices.entries) {
    const row = page.getByTestId(`about-component-${entry.id}`);

    await expect(row).not.toHaveAttribute("open", "");
    expect(await row.getByTestId("about-document-toggle").evaluateAll((buttons) =>
      buttons.every((button) => button.getAttribute("aria-expanded") === "false"),
    )).toBe(true);
  }

  await page.locator("#about-dialog-close").click();

  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#login-about")).toBeFocused();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
