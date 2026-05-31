import { expect, test } from "@playwright/test";

test("landing page exposes primary map workflows", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MapWiki" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Create Dataset/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore Map/i }).first()).toBeVisible();
});

test("map page loads layer controls", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("heading", { name: "Layers" })).toBeVisible();
  await expect(page.getByLabel("Layer controls")).toBeVisible();
});
