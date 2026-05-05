import { test, expect } from "@playwright/test";

test("first milestone owner workflow renders", async ({ page }) => {
  await page.goto("/en/register");
  await expect(page.getByRole("heading", { name: /start the drywall operating system/i })).toBeVisible();

  await page.goto("/es/login");
  await expect(page.getByRole("heading", { name: /volver al trabajo/i })).toBeVisible();
});
