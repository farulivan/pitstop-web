import { test, expect } from "@playwright/test";

test("marketing page renders and links to login", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /auto service ticket system/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});
