import { test, expect } from '@playwright/test';

async function resolveChapter0InStoryDesk(page) {
  await page.locator('[data-story-target="hassan"]').click();
  await page.locator('[data-choice-id="hassan_inspect_soil_first"]').click();
  await page.locator('[data-story-target="maryam"]').click();
  await page.locator('[data-choice-id="maryam_soil_cover_pact"]').click();
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_hypothesis_cover"]').click();
  await page.locator('[data-story-target="pumpStation"]').click();
  await page.locator('[data-choice-id="council_cover_buffered"]').click();
}

async function advanceToChapter2(page) {
  await expect(page.locator('#chapter1-launch')).toHaveCount(1);
  await expect(page.locator('#chapter2-launch')).toHaveCount(1);
  await expect(page.locator('#chapter1-launch')).toBeVisible();
  await expect(page.locator('#chapter2-launch')).toBeHidden();
  await page.locator('#chapter1-launch').click();
  await expect(page.locator('#ch1-source')).toContainText('SIMULATED');
  await page.locator('#chapter1-commit').click();
  await expect(page.locator('#ch1-content')).toContainText('possible season');
  await page.locator('#ch1-close').click();
  await expect(page.locator('#chapter2-launch')).toBeVisible();
  await page.locator('#chapter2-launch').click();
  await expect(page.locator('.soil-iq-evidence-board')).toBeVisible();
  await expect(page.locator('.evidence-prev')).toContainText('SIMULATED GAME RESULT');
}

test('3D world proceeds from playable council to Chapter 1 crop choices and Chapter 2 evidence', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await expect(page.locator('#chapter1-launch')).toContainText('Finish the Council');
  await page.locator('#btn-story-desk').click();
  await resolveChapter0InStoryDesk(page);
  await page.locator('#story-desk-close').click();
  await advanceToChapter2(page);
  expect(await page.evaluate(() => window.__seventhFieldGame.chapterSequence.chapter2.mission.previous.planId)).toMatch(/^[AB]$/);
  await page.screenshot({ path: 'test-results/seventh-field-chapter2-3d-entry.png' });
});

test('no-WebGL story route plays through evidence classification and honest non-advice ending', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/experience/play/story.html');
  await expect(page.locator('#story-desk')).toBeVisible();
  await resolveChapter0InStoryDesk(page);
  await page.locator('#story-desk-close').click();
  await advanceToChapter2(page);
  for (const [card, klass] of [['power', 'UNAVAILABLE'], ['soil', 'ASSUMED'], ['trial', 'SIMULATED']]) {
    await page.locator(`[data-card="${card}"]`).selectOption(klass);
    await page.locator(`[data-check="${card}"]`).click();
  }
  await expect(page.locator('[data-decision="defer"]')).toBeVisible();
  await page.locator('[data-decision="defer"]').click();
  await expect(page.locator('.evidence-verdict')).toContainText('requests dated weather evidence');
  const result = await page.evaluate(() => {
    const g = window.__soilIqTextGame.chapterSequence;
    return { phase1: g.chapter1.game.phase, phase2: g.chapter2.mission.phase,
      advice: g.chapter2.mission.result.readyForFieldAdvice };
  });
  expect(result).toEqual({ phase1: 'result', phase2: 'result', advice: false });
  await page.screenshot({ path: 'test-results/seventh-field-chapter2-text-360.png' });
});
