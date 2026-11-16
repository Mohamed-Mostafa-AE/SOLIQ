import { test, expect } from '@playwright/test';

/** Standalone mount checks the public attach contract without 3D/WebGL. */
async function attachBoard(page) {
  await page.evaluate(async () => {
    const { attachChapter1Game } = await import('/game/ui/chapter1-board.js');
    window.__chapter1TestBoard = attachChapter1Game({
      host: document.getElementById('text-game'),
      chapter0: window.__soilIqTextGame.mission,
      language: document.getElementById('story-language').value,
    });
  });
}

test('locked Chapter 1 board explains the actual Chapter 0 prerequisite without WebGL', async ({ page }) => {
  await page.goto('/experience/play/story.html');
  await page.keyboard.press('Escape');
  await attachBoard(page);
  await page.locator('#chapter1-launch').click();
  await expect(page.locator('#ch1-title')).toContainText('Two seasons');
  await expect(page.locator('#ch1-source')).toContainText('SIMULATED GAME');
  await expect(page.locator('.ch1-locked')).toContainText('decide the canal turn');
  await expect(page.locator('#chapter1-commit')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#chapter1-overlay')).toBeHidden();
  await expect(page.locator('#chapter1-launch')).toBeFocused();
});

test('a Chapter 0 council outcome unlocks a playable 2-season/3-field puzzle with branch consequences', async ({ page }, testInfo) => {
  await page.goto('/experience/play/story.html');
  await page.locator('[data-story-target="pumpStation"]').click();
  await page.locator('[data-choice-id="council_bottleneck"]').click();
  await page.keyboard.press('Escape');
  await attachBoard(page);
  await page.locator('#chapter1-launch').click();
  await expect(page.locator('.ch1-field-row')).toHaveCount(4);
  await expect(page.locator('.ch1-crop-select')).toHaveCount(12);
  await expect(page.locator('.ch1-budget')).toContainText('82');

  const initial = await page.evaluate(() => window.__chapter1TestBoard.game.getComparison());
  await page.locator('select[data-plan="B"][data-season="0"][data-plot="0"]').selectOption('cover');
  await page.locator('button[data-plan="B"]').click();
  await page.locator('button[data-strategy="head_first"]').click();
  const head = await page.evaluate(() => window.__chapter1TestBoard.game.getComparison());
  expect(head.plans[1].totalDemand).toBeLessThan(initial.plans[1].totalDemand);
  await page.locator('button[data-strategy="balanced"]').click();
  const balanced = await page.evaluate(() => window.__chapter1TestBoard.game.getComparison());
  expect(balanced.plans[1].fairness).toBeGreaterThan(head.plans[1].fairness);
  await page.locator('#chapter1-overlay').evaluate(element => { element.scrollTop = 0; });
  await page.locator('#chapter1-overlay').screenshot({ path: testInfo.outputPath('chapter1-desktop.png') });
  await page.locator('#chapter1-commit').click();
  await expect(page.locator('#ch1-source')).toContainText('SIMULATED');
  await expect(page.locator('#ch1-content')).toContainText('The fields remember');
  expect(await page.evaluate(() => window.__chapter1TestBoard.game.result.hasRealWorldRecommendation)).toBe(false);
  await page.locator('#chapter1-replay').click();
  await expect(page.locator('.ch1-crop-select')).toHaveCount(12);
});

test('Chapter 1 is usable in Arabic at 360px, with keyboard and motion-safe board', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experience/play/story.html');
  await page.locator('[data-story-target="pumpStation"]').click();
  await page.locator('[data-choice-id="council_deferral"]').press('Enter');
  await page.keyboard.press('Escape');
  await attachBoard(page);
  await page.evaluate(() => window.__chapter1TestBoard.setLanguage('ar'));
  await page.locator('#chapter1-launch').click();
  await expect(page.locator('.ch1-window')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#ch1-close')).toHaveAccessibleName('إغلاق الفصل الأول');
  await expect(page.locator('#ch1-close')).toHaveText('✕');
  await expect(page.locator('#ch1-source')).toContainText('افتراضية');
  await expect(page.locator('.ch1-budget')).toContainText('95');
  await page.locator('#chapter1-overlay').screenshot({ path: testInfo.outputPath('chapter1-mobile-ar.png') });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.locator('#chapter1-commit').press('Enter');
  await expect(page.locator('.ch1-ending-narrative')).toContainText('أنت كنت أجلت');
  await page.keyboard.press('Escape');
  await expect(page.locator('#chapter1-overlay')).toBeHidden();
});
