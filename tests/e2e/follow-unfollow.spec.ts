import { expect, test, type APIRequestContext } from "@playwright/test";

async function register(request: APIRequestContext, name: string, email: string) {
  const response = await request.post("/api/auth/register", {
    data: { name, email, password: "Password123!" },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: number };
}

test("follow -> unfollow", async ({ page, request }) => {
  const suffix = Date.now();
  const followerEmail = `follower-${suffix}@example.test`;
  const target = await register(request, "Target E2E", `target-${suffix}@example.test`);
  await register(request, "Follower E2E", followerEmail);

  await page.goto("/login");
  await page.getByLabel("Email").fill(followerEmail);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Bio breve").fill("Seguo profili nel test.");
  await page.getByRole("button", { name: "Continua" }).click();
  await expect(page).toHaveURL(/\/explore/);

  await page.goto(`/profile/${target.id}`);
  await page.getByRole("button", { name: "Segui" }).click();
  await expect(page.getByRole("button", { name: "Segui gia" })).toBeVisible();
  await page.getByRole("button", { name: "Segui gia" }).click();
  await expect(page.getByRole("button", { name: "Segui" })).toBeVisible();
});
