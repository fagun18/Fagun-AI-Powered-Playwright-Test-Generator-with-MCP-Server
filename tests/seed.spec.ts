import { test, expect } from '@playwright/test';

test('seed', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/i);
});


