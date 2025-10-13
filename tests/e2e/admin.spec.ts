import { test, expect } from '@playwright/test';

test.describe('Admin panel smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // wait for login form to appear
    await page.waitForSelector('form, input[name="email"], input[type="email"], input[name="password"]', { timeout: 10000 });
  });

  test('can login and open dashboard', async ({ page }) => {
    const emailSelector = 'input[name="email"] , input[type="email"] , input#email';
    const passwordSelector = 'input[name="password"] , input[type="password"] , input#password';

    await page.fill(emailSelector, 'admin@example.com');
    await page.fill(passwordSelector, 'password');
    // try multiple submit strategies
    const submitBtn = page.locator('button[type="submit"], button:has-text("ورود"), button:has-text("Login")');
    if (await submitBtn.count() > 0) {
      await submitBtn.first().click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForURL('**/admin', { timeout: 20000 });
    await expect(page.locator('[data-testid="dashboard-content"], [data-testid="admin-dashboard"], h1')).toBeVisible();
  });
});
