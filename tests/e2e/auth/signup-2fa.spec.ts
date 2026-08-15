import { test, expect } from "@playwright/test";
import { TOTP } from "otpauth";

/**
 * Proves the mandatory-2FA gate end-to-end (CLAUDE.md: no grace period —
 * no dashboard route is reachable until TOTP is enrolled and verified).
 * Requires a real DATABASE_URL (e.g. Neon) with migrations applied.
 */
test("signup requires TOTP enrollment before reaching a dashboard", async ({ page }) => {
  const email = `test+${Date.now()}@example.com`;
  const password = "correct-horse-battery-staple";

  await page.goto("/signup");
  await page.getByLabel("Name").fill("Test Owner");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/verify-2fa\/setup/);

  // Stage 1: confirm password to generate a TOTP secret.
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Generate secret" }).click();

  const secret = await page
    .locator("div.font-mono")
    .first()
    .innerText();

  const totp = new TOTP({ secret: secret.trim() });
  const code = totp.generate();

  await page.getByLabel("6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify & continue" }).click();

  await expect(page).toHaveURL(/\/owner\/dashboard/, { timeout: 15_000 });
  await expect(page.getByText("Owner dashboard")).toBeVisible();
});
