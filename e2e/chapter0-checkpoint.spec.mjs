import { test, expect } from '@playwright/test';

const CHECKPOINT_KEY = 'soil-iq:seventh-field:chapter0:v1';

test('Chapter 0 saves only by explicit action, resumes after reload, and resets local progress', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/experience/play/story.html');
  await expect(page.locator('#story-checkpoint-help')).toContainText('Nothing is saved automatically');
  await expect(page.locator('#story-checkpoint-save')).toBeVisible();
  const before = await page.evaluate(key => localStorage.getItem(key), CHECKPOINT_KEY);
  expect(before).toBeNull();

  await page.locator('#story-thread-soil').press('Enter');
  await page.locator('[data-story-target="hassan"]').click();
  await page.locator('[data-choice-id="hassan_inspect_soil_first"]').press('Enter');
  await page.locator('[data-story-target="maryam"]').click();
  await page.locator('[data-choice-id="maryam_soil_cover_pact"]').press('Enter');
  expect(await page.evaluate(key => localStorage.getItem(key), CHECKPOINT_KEY)).toBeNull();
  await page.locator('#story-checkpoint-save').press('Enter');
  await expect(page.locator('#story-checkpoint-status')).toContainText('Saved on this device');

  const raw = await page.evaluate(key => localStorage.getItem(key), CHECKPOINT_KEY);
  expect(JSON.parse(raw).flags.soilCoverChoice).toBe('living_cover');
  expect(raw).not.toMatch(/latitude|longitude|deviceId|accessToken|gps/i);
  await page.reload();
  expect(await page.evaluate(() => window.__soilIqTextGame.mission.flags.firstClue)).toBeNull();
  await page.locator('#story-checkpoint-resume').press('Enter');
  await expect(page.locator('#story-checkpoint-status')).toContainText('Resumed');
  expect(await page.evaluate(() => window.__soilIqTextGame.mission.flags.soilCoverChoice)).toBe('living_cover');

  await page.locator('#story-checkpoint-reset').press('Enter');
  await expect(page.locator('#story-checkpoint-status')).toContainText('deleted');
  expect(await page.evaluate(key => localStorage.getItem(key), CHECKPOINT_KEY)).toBeNull();
  expect(await page.evaluate(() => window.__soilIqTextGame.mission.flags.firstClue)).toBeNull();
  await page.locator('#story-checkpoint-resume').press('Enter');
  await expect(page.locator('#story-checkpoint-status')).toContainText('No checkpoint');
});

test('Chapter 0 rejects outdated checkpoints and explains recovery in Arabic', async ({ page }) => {
  await page.goto('/experience/play/story.html');
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ version: 0, flags: { gps: [1, 2] } })), CHECKPOINT_KEY);
  await page.keyboard.press('Escape');
  await page.locator('#story-language').selectOption('ar');
  await page.locator('#btn-open-story').click();
  await page.locator('#story-checkpoint-resume').press('Enter');
  await expect(page.locator('#story-checkpoint-status')).toContainText('نسخة قديمة');
  expect(await page.evaluate(() => window.__soilIqTextGame.mission.flags.firstClue)).toBeNull();
  await page.locator('#story-checkpoint-reset').press('Enter');
  expect(await page.evaluate(key => localStorage.getItem(key), CHECKPOINT_KEY)).toBeNull();
});
