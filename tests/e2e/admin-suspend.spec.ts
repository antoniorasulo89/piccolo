import { expect, test } from "@playwright/test";

test("admin suspend -> login bloccato", async ({ page, request }) => {
  const suffix = Date.now();
  const adminEmail = "admin-e2e@example.test";
  const targetEmail = `blocked-${suffix}@example.test`;

  const adminResponse = await request.post("/api/auth/register", {
    data: { name: "Admin E2E", email: adminEmail, password: "Password123!" },
  });
  expect(adminResponse.ok()).toBeTruthy();
  const targetResponse = await request.post("/api/auth/register", {
    data: { name: "Blocked E2E", email: targetEmail, password: "Password123!" },
  });
  expect(targetResponse.ok()).toBeTruthy();
  const target = (await targetResponse.json()) as { id: number };

  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Entra" }).click();
  await page.waitForURL(/\/onboarding|\/feed/);

  const suspendResponse = await page.context().request.patch(
    `/api/admin/users/${target.id}/suspension`,
    { data: { suspended: true } },
  );
  expect(suspendResponse.ok()).toBeTruthy();
  await page.context().request.post("/api/auth/logout");

  await page.goto("/login");
  await page.getByLabel("Email").fill(targetEmail);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page.getByText("Account sospeso")).toBeVisible();
});
