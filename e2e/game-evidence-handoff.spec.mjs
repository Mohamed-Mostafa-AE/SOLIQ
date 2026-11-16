import { test, expect } from '@playwright/test';

test('text-first game opens an honest NASA evidence workspace without silently loading data', async ({ page, context }) => {
  await page.goto('/experience/play/story.html');
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_hypothesis_water_saving"]').click();
  const link = page.locator('#story-rotation-link');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /walkthrough\/\?from=seventh-field&hypothesis=water_saving/);
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    link.click(),
  ]);
  await newPage.waitForLoadState('domcontentloaded');
  await expect(newPage).toHaveURL(/walkthrough\/\?from=seventh-field&hypothesis=water_saving/);
  await expect(newPage.locator('#game-handoff')).toBeVisible();
  await expect(newPage.locator('#game-handoff')).toContainText('SIMULATED');
  await expect(newPage.locator('#game-handoff')).toContainText('Calendar B');
  await expect(newPage.locator('#source')).toContainText('UNAVAILABLE');
  await expect(newPage.locator('#compare')).toBeDisabled();
  await expect(newPage.locator('#consent')).not.toBeChecked();
  await expect(newPage.locator('input[name="lat"]')).toHaveValue('31.09');
  await newPage.close();
});

test('untrusted game URL does not alter the farmer workflow or expose a narrative badge', async ({ page }) => {
  await page.goto('/walkthrough/?from=seventh-field&hypothesis=cover_first&lat=70');
  await expect(page.locator('#game-handoff')).toBeHidden();
  await expect(page.locator('input[name="lat"]')).toHaveValue('31.09');
  await expect(page.locator('#source')).toContainText('UNAVAILABLE');
});
