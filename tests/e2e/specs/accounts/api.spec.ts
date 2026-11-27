import { randomUUID } from "node:crypto";

import {
  test,
  expect,
  bootstrapManager,
  credentials,
  createUser,
  csrfWrite,
  login,
} from "../../fixtures";
import { createMember } from "../../helpers/accounts";
import { picture, upload } from "../../helpers/images";

test("Member assignments restrict account reads through the BFF @api", async ({ page, request, instance }) => {
  const manager = bootstrapManager(instance);
  const managerProfile = await login(request, manager);
  const member = await createUser(request, "assigned-reader", "Assigned Reader", "Member");
  const memberPath = `/api/users/${member.profile.id}/account-assignments`;
  const first = await (await csrfWrite(request, "POST", "/api/accounts", { name: "Assigned account" })).json();
  const second = await (await csrfWrite(request, "POST", "/api/accounts", { name: "Hidden account" })).json();
  const firstPath = `/api/accounts/${first.id}`;
  const secondPath = `/api/accounts/${second.id}`;

  await page.goto("/");
  const image = await picture(page, 4, 4);
  expect((await upload(request, `${firstPath}/image`, image)).status()).toBe(204);
  expect((await upload(request, `${secondPath}/image`, image)).status()).toBe(204);
  expect((await request.get(memberPath)).status()).toBe(200);
  expect(await (await request.get(memberPath)).json()).toEqual({ accountIds: [] });
  expect((await request.put(memberPath, { data: { accountIds: [first.id] } })).status()).toBe(400);
  expect(await (await csrfWrite(request, "PUT", memberPath, { accountIds: [first.id, first.id] })).json())
    .toEqual({ code: "invalid_account_assignments" });
  expect(await (await csrfWrite(request, "PUT", memberPath, { accountIds: [randomUUID()] })).json())
    .toEqual({ code: "not_found" });
  expect(await (await csrfWrite(request, "PUT", `/api/users/${managerProfile.id}/account-assignments`, { accountIds: [] })).json())
    .toEqual({ code: "assignment_target_not_member" });
  expect(await (await request.get(memberPath)).json()).toEqual({ accountIds: [] });

  const memberCredentials = credentials("assigned-reader");
  await login(request, member.account);
  expect((await csrfWrite(request, "POST", "/api/auth/password", {
    currentPassword: member.account.password, newPassword: memberCredentials.password,
  })).status()).toBe(204);
  await login(request, memberCredentials);
  expect(await (await request.get("/api/accounts")).json()).toEqual([]);
  expect((await request.get(memberPath)).status()).toBe(403);
  expect((await csrfWrite(request, "PUT", memberPath, { accountIds: [first.id] })).status()).toBe(403);

  await login(request, manager);
  const assigned = await csrfWrite(request, "PUT", memberPath, { accountIds: [first.id] });
  expect(assigned.status()).toBe(200);
  expect(await assigned.json()).toEqual({ accountIds: [first.id] });
  await login(request, memberCredentials);
  expect((await (await request.get("/api/accounts")).json()).map((account: { id: string }) => account.id)).toEqual([first.id]);

  for (const suffix of ["", "/image", "/transactions", "/allowance"]) {
    expect((await request.get(`${firstPath}${suffix}`)).status()).toBe(200);
    const hidden = await request.get(`${secondPath}${suffix}`);
    const missing = await request.get(`/api/accounts/${randomUUID()}${suffix}`);
    expect(hidden.status()).toBe(404);
    expect(await hidden.json()).toEqual({ code: "not_found" });
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toEqual({ code: "not_found" });
  }

  await login(request, manager);
  expect((await csrfWrite(request, "PUT", memberPath, { accountIds: [] })).status()).toBe(200);
  await login(request, memberCredentials);
  expect(await (await request.get("/api/accounts")).json()).toEqual([]);
  expect((await request.get(firstPath)).status()).toBe(404);
});

test.use({ ignoreHTTPSErrors: true });

test("shared-account APIs enforce roles, CSRF, names and missing-account errors @api", async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  expect((await request.get("/api/accounts")).status()).toBe(401);
  expect(
    (
      await request.get("/api/accounts/missing", {
        headers: { "X-User-Role": "Manager", "X-User-Id": "forged" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await csrfWrite(request, "POST", "/api/accounts", { name: "Anonymous" })
    ).status(),
  ).toBe(401);

  await login(request, manager);

  expect(
    (
      await request.post("/api/accounts", { data: { name: "No CSRF" } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.put("/api/accounts/missing", { data: { name: "No CSRF" } })
    ).status(),
  ).toBe(400);

  for (const name of ["", "   ", null, "A".repeat(41)]) {
    const invalid = await csrfWrite(request, "POST", "/api/accounts", { name });

    expect(invalid.status()).toBe(400);
    expect(await invalid.json()).toEqual({ code: "invalid_account_name" });
  }

  const created = await csrfWrite(request, "POST", "/api/accounts", {
    name: "  Ida  ",
  });
  const account = await created.json();

  expect(created.status()).toBe(201);
  expect(created.headers()["location"]).toBe(`/api/accounts/${account.id}`);
  expect(account).toEqual({
    id: expect.any(String),
    name: "Ida",
    currency: "EUR",
    balance: null,
    openingEntry: null,
    imageUrl: null,
    purgeAtUtc: null,
  });

  const duplicate = await csrfWrite(request, "POST", "/api/accounts", {
    name: " iDA ",
  });

  expect(duplicate.status()).toBe(409);
  expect(await duplicate.json()).toEqual({ code: "account_name_taken" });

  const accented = await csrfWrite(request, "POST", "/api/accounts", {
    name: "\u00c4nne",
  });
  const accentedDuplicate = await csrfWrite(request, "POST", "/api/accounts", {
    name: "\u00e4NNE",
  });

  expect(accented.status()).toBe(201);
  expect(accentedDuplicate.status()).toBe(409);
  expect(await accentedDuplicate.json()).toEqual({
    code: "account_name_taken",
  });

  const maximum = await csrfWrite(request, "POST", "/api/accounts", {
    name: "Z".repeat(40),
  });

  expect(maximum.status()).toBe(201);

  const missing = await request.get("/api/accounts/missing");
  const missingUpdate = await csrfWrite(
    request,
    "PUT",
    "/api/accounts/missing",
    { name: "Missing" },
  );

  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ code: "not_found" });
  expect(missingUpdate.status()).toBe(404);
  expect(await missingUpdate.json()).toEqual({ code: "not_found" });

  await createMember(request);

  expect(await (await request.get("/api/accounts")).json()).toEqual([]);
  expect((await request.get(`/api/accounts/${account.id}`)).status()).toBe(404);
  expect(
    (
      await csrfWrite(request, "POST", "/api/accounts", {
        name: "Member write",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await csrfWrite(request, "PUT", `/api/accounts/${account.id}`, {
        name: "Member rename",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await csrfWrite(request, "DELETE", `/api/accounts/${account.id}`, {})
    ).status(),
  ).toBe(403);
});

test("account retirement hides Member reads and restricts lifecycle writes to managers @api", async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);
  await login(request, manager);
  const immediate = await (
    await csrfWrite(request, "POST", "/api/accounts", { name: "Immediate" })
  ).json();
  const immediatePath = `/api/accounts/${immediate.id}`;

  expect(
    (
      await csrfWrite(request, "POST", `${immediatePath}/opening`, {
        amount: "0",
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);
  expect((await csrfWrite(request, "DELETE", immediatePath, {})).status()).toBe(
    204,
  );
  expect((await request.get(immediatePath)).status()).toBe(404);

  const account = await (
    await csrfWrite(request, "POST", "/api/accounts", { name: "Retired" })
  ).json();
  const path = `/api/accounts/${account.id}`;
  expect(
    (
      await csrfWrite(request, "POST", `${path}/opening`, {
        amount: "10",
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await csrfWrite(request, "POST", `${path}/transactions`, {
        amount: "1",
        source: "deposit",
        idempotencyKey: randomUUID(),
      })
    ).status(),
  ).toBe(200);
  expect(
    (await csrfWrite(request, "PUT", `${path}/allowance`, { enabled: true, amount: "5.00" })).status(),
  ).toBe(200);
  const allowanceBeforeRetirement = await (await request.get(`${path}/allowance`)).json();
  expect(allowanceBeforeRetirement.scheduled.enabled).toBe(true);
  expect(allowanceBeforeRetirement.scheduled.amount).toBe("5.00");
  expect((await request.delete(path)).status()).toBe(400);

  const retired = await csrfWrite(request, "DELETE", path, {});
  expect(retired.status()).toBe(202);
  const { purgeAtUtc } = await retired.json();
  expect(typeof purgeAtUtc).toBe("string");
  expect(
    (await (await request.get("/api/accounts")).json()).some(
      (item: { id: string }) => item.id === account.id,
    ),
  ).toBe(false);
  expect(
    (await (await request.get("/api/accounts/archived")).json()).some(
      (item: { id: string }) => item.id === account.id,
    ),
  ).toBe(true);
  expect((await (await request.get(path)).json()).purgeAtUtc).toBe(purgeAtUtc);
  const allowanceWhileRetired = await (await request.get(`${path}/allowance`)).json();
  expect(allowanceWhileRetired.latestRevisionId).toBe(allowanceBeforeRetirement.latestRevisionId);
  expect(allowanceWhileRetired.scheduled).toEqual(allowanceBeforeRetirement.scheduled);
  expect(
    (await csrfWrite(request, "PUT", `${path}/allowance`, { enabled: false, expectedRevisionId: allowanceBeforeRetirement.latestRevisionId })).status(),
  ).toBe(409);
  expect(
    (await csrfWrite(request, "PUT", path, { name: "Not allowed" })).status(),
  ).toBe(409);

  await createMember(request);
  expect((await request.get("/api/accounts/archived")).status()).toBe(403);
  expect((await request.get(path)).status()).toBe(404);
  expect((await request.get(`${path}/transactions`)).status()).toBe(404);
  expect((await request.get(`${path}/allowance`)).status()).toBe(404);
  expect((await csrfWrite(request, "DELETE", path, {})).status()).toBe(403);
  expect(
    (await csrfWrite(request, "POST", `${path}/reactivate`, {})).status(),
  ).toBe(403);

  await login(request, manager);
  expect(
    (await csrfWrite(request, "POST", `${path}/reactivate`, {})).status(),
  ).toBe(204);
  expect((await (await request.get(path)).json()).purgeAtUtc).toBeNull();
  const allowanceAfterReactivation = await (await request.get(`${path}/allowance`)).json();
  expect(allowanceAfterReactivation.latestRevisionId).toBe(allowanceBeforeRetirement.latestRevisionId);
  expect(allowanceAfterReactivation.scheduled).toEqual(allowanceBeforeRetirement.scheduled);
  expect(
    (await (await request.get("/api/accounts")).json()).some(
      (item: { id: string }) => item.id === account.id,
    ),
  ).toBe(true);
});

test("case-insensitive uniqueness survives concurrent creates and failed renames without a nine-account cap @api", async ({
  request,
  instance,
}) => {
  const manager = bootstrapManager(instance);

  await login(request, manager);

  const csrf = await request.get("/api/auth/csrf");
  const headers = { "X-Monkey-CSRF": (await csrf.json()).token };
  const simultaneous = await Promise.all([
    request.post("/api/accounts", { data: { name: "Shared" }, headers }),
    request.post("/api/accounts", { data: { name: "sHARED" }, headers }),
  ]);

  expect(simultaneous.map((response) => response.status()).sort()).toEqual([
    201, 409,
  ]);

  for (let index = 0; index < 10; index++) {
    const created = await csrfWrite(request, "POST", "/api/accounts", {
      name: `Account ${index}`,
    });

    expect(created.status()).toBe(201);
  }

  const list = await (await request.get("/api/accounts")).json();

  expect(list).toHaveLength(11);

  const original = list.find(
    (account: { name: string }) => account.name === "Account 0",
  );
  const conflict = await csrfWrite(
    request,
    "PUT",
    `/api/accounts/${original.id}`,
    { name: "SHARED" },
  );

  expect(conflict.status()).toBe(409);
  expect(await conflict.json()).toEqual({ code: "account_name_taken" });
  expect(
    await (await request.get(`/api/accounts/${original.id}`)).json(),
  ).toEqual(original);

  const invalid = await csrfWrite(
    request,
    "PUT",
    `/api/accounts/${original.id}`,
    { name: " " },
  );

  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ code: "invalid_account_name" });
  expect(
    await (await request.get(`/api/accounts/${original.id}`)).json(),
  ).toEqual(original);
});
