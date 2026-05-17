import { expect, test } from "@playwright/test";

test("register -> post -> like", async ({ page }) => {
  const suffix = Date.now();
  const email = `writer-${suffix}@example.test`;
  const password = "Password123!";
  const content = `Post e2e ${suffix}`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Writer E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Crea account" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Bio breve").fill("Scrivo post brevi per il test.");
  await page.getByRole("button", { name: "Continua" }).click();
  await expect(page).toHaveURL(/\/explore/);

  await page.goto("/feed");
  await page.getByLabel("Nuovo post").fill(content);
  await page.getByRole("button", { name: "Pubblica" }).click();

  const post = page.locator("article").filter({ hasText: content }).first();
  await expect(post).toBeVisible();
  await post.getByRole("button", { name: "0" }).click();
  await expect(post.getByRole("button", { name: "1" })).toBeVisible();
});
