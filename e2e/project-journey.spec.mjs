import { test, expect } from '@playwright/test';

test('P0-06: Welcome to Guided and Research, then back to the shared pitch route', async ({ page }) => {
  await page.goto('/welcome/');
  await page.getByRole('link', { name: 'All areas' }).click();
  await expect(page).toHaveURL(/\/explore\/$/);
  await expect(page.getByRole('heading', { name: 'Six working destinations' })).toBeVisible();

  await page.getByRole('link', { name: /Open Guided view/ }).click();
  await expect(page.locator('#guided-mode')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#research-mode').click();
  await expect(page.locator('#research-mode')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /All project areas/ }).click();
  await expect(page).toHaveURL(/\/explore\/$/);

  await page.getByRole('link', { name: /Review the pitch/ }).click();
  await expect(page.locator('.slide')).toHaveCount(7);
  await page.getByRole('link', { name: /All project areas/ }).click();
  await expect(page).toHaveURL(/\/explore\/$/);
});

test('P0-06: accessible story provides a truthful return to science routes', async ({ page }) => {
  await page.goto('/explore/');
  await page.getByRole('link', { name: /Text story/ }).click();
  await expect(page).toHaveURL(/\/experience\/play\/story.html$/);
  await expect(page.locator('#story-desk-source')).toContainText('SIMULATED STORY');
  await page.locator('#story-project-link').click();
  await expect(page).toHaveURL(/\/explore\/$/);
  await page.getByRole('link', { name: /Start comparison/ }).click();
  await expect(page.getByRole('heading', { name: /Compare two crop plans/ })).toBeVisible();
  await page.getByRole('link', { name: /All project areas/ }).click();
  await expect(page).toHaveURL(/\/explore\/$/);
});

test('P0-06: complete project map remains readable and keyboard navigable at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/explore/');
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  await expect(page.locator('.card')).toHaveCount(6);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/explore\/#paths$/);
  await page.getByRole('link', { name: /Open the farmer workspace/ }).click();
  await expect(page.locator('#guided-mode')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: /All project areas/ })).toBeVisible();
});
