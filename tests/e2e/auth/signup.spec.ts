import { test, expect } from "@playwright/test";

/**
 * Signup is email/password only — no 2FA enrollment step (removed; see
 * CLAUDE.md's Auth section for the reversal).
 */
test("signup lands directly on the owner dashboard", async ({ page }) => {
  const email = `test+${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Test Owner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/owner\/dashboard/, { timeout: 15_000 });
});
