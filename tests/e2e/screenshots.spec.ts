import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("pirate-deckbuilder-run-v1");
    window.localStorage.setItem("pirate-web-deckbuilder:battle-tour-complete", "complete");
  });
});

test("captures the P0 battle screen at desktop and mobile sizes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await startBattle(page);
  await expect(page.getByTestId("battle-screen")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/battle-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("battle-screen")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/battle-mobile.png", fullPage: true });
});

async function startBattle(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: /Cannon Ship/ }).click();
}
