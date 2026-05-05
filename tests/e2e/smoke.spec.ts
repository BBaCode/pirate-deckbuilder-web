import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("pirate-deckbuilder-run-v1");
    window.localStorage.setItem("pirate-web-deckbuilder:battle-tour-complete", "complete");
  });
});

test("starts a Cannon Ship run and reaches the battle screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dark Seas of Ether" })).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: /Cannon Ship/ }).click();

  await expect(page.getByTestId("battle-screen")).toBeVisible();
  await expect(page.getByTestId("player-ship")).toContainText("Cannon Ship");
  await expect(page.getByTestId("enemy-ship")).toContainText("Enemy vessel");
  await expect(page.getByTestId("hand")).toBeVisible();
  await expect(page.getByRole("button", { name: "End Turn" })).toBeVisible();
});

test("opens the core battle utility modals", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: /Cannon Ship/ }).click();

  await page.getByRole("button", { name: "Map" }).click();
  await expect(page.getByRole("dialog", { name: /run map/i })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /Draw/ }).click();
  await expect(page.getByRole("dialog", { name: "Draw Pile" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: /Discard/ }).click();
  await expect(page.getByRole("dialog", { name: "Discard Pile" })).toBeVisible();
});
