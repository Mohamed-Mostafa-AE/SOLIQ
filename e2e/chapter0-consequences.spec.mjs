import { test, expect } from '@playwright/test';

test('Chapter 0 accessible story carries soil choices into a conditional council simulation', async ({ page }) => {
  await page.goto('/experience/play/story.html');
  await expect(page.locator('#story-desk')).toBeVisible();
  await expect(page.locator('#story-desk-source')).toContainText('SIMULATED');
  await page.locator('#story-thread-soil').press('Enter');
  await page.locator('[data-story-target="hassan"]').click();
  await page.locator('[data-choice-id="hassan_inspect_soil_first"]').press('Enter');
  await page.locator('[data-story-target="maryam"]').click();
  await expect(page.locator('#story-announcement')).toContainText('Emotion:');
  await page.locator('[data-choice-id="maryam_soil_cover_pact"]').press('Enter');
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_hypothesis_cover"]').press('Enter');
  await page.locator('[data-story-target="pumpStation"]').click();
  await expect(page.locator('[data-choice-id="council_cover_buffered"]')).toBeVisible();
  await page.locator('[data-choice-id="council_cover_buffered"]').press('Enter');
  const result = await page.evaluate(() => {
    const { mission, water } = window.__soilIqTextGame;
    return {
      mode: mission.flags.councilMode,
      outcome: mission.activeOutcome,
      demand: water.currentSimulation?.totalDemand,
      evidenceClass: water.currentSimulation?.provenance?.kind,
    };
  });
  expect(result).toEqual({ mode: 'cover_buffered_turn', outcome: 'equilibrium', demand: 215, evidenceClass: 'simulated' });
  await expect(page.locator('#text-receipts')).toContainText('Living-Cover Trial: Assumed Lower Demand');
});

test('Chapter 0 accessible route supports Egyptian Arabic and responsible NASA-evidence deferral', async ({ page }) => {
  await page.goto('/experience/play/story.html');
  await page.locator('[data-story-target="hassan"]').click();
  await page.locator('[data-choice-id="hassan_prioritize_wheat_livelihood"]').press('Enter');
  await page.locator('[data-story-target="maryam"]').click();
  await expect(page.locator('#story-dialogue-text')).toContainText('head-first');
  await page.locator('[data-choice-id="maryam_stress_test_rush"]').press('Enter');
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_refuse_guess_nasa"]').press('Enter');
  await page.locator('[data-story-target="pumpStation"]').click();
  await expect(page.locator('#story-dialogue-text')).toContainText('NASA');
  await page.locator('[data-choice-id="council_deferral"]').press('Enter');
  expect(await page.evaluate(() => ({
    outcome: window.__soilIqTextGame.mission.activeOutcome,
    pump: window.__soilIqTextGame.mission.flags.pumpStarted,
  }))).toEqual({ outcome: 'deferral', pump: false });
  await page.keyboard.press('Escape');
  await page.locator('#story-language').selectOption('ar');
  await page.locator('#btn-open-story').click();
  await expect(page.locator('#story-desk')).toHaveAttribute('dir', 'rtl');
  await page.locator('[data-story-target="maryam"]').click();
  await expect(page.locator('#story-announcement')).toContainText('الحالة:');
  await expect(page.locator('[data-choice-id="maryam_soil_cover_pact"]')).toBeVisible();
});

test('Chapter 0 Field7 hypothesis changes subsequent Council text without inventing NASA results', async ({ page }) => {
  await page.goto('/experience/play/story.html');
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_hypothesis_water_saving"]').press('Enter');
  await page.locator('[data-story-target="pumpStation"]').click();
  await expect(page.locator('#story-dialogue-text')).toContainText('Calendar B');
  await expect(page.locator('#story-dialogue-text')).toContainText('untested');
  await expect(page.locator('#story-desk-source')).toContainText('SIMULATED');
  expect(await page.evaluate(() => window.__soilIqTextGame.water.currentSimulation)).toBeNull();
});
