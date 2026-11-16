import { test, expect } from '@playwright/test';

async function resolveCouncil(page) {
  await page.locator('[data-story-target="hassan"]').click();
  await page.locator('[data-choice-id="hassan_inspect_soil_first"]').click();
  await page.locator('[data-story-target="maryam"]').click();
  await page.locator('[data-choice-id="maryam_soil_cover_pact"]').click();
  await page.locator('[data-story-target="timeEcho"]').click();
  await page.locator('[data-choice-id="f7_hypothesis_cover"]').click();
  await page.locator('[data-story-target="pumpStation"]').click();
  await page.locator('[data-choice-id="council_cover_buffered"]').click();
  await page.locator('#story-desk-close').click();
}

async function completeSequence(page) {
  for (const chapter of [2, 3, 4]) {
    await expect(page.locator(`#chapter${chapter}-launch`)).toHaveCount(1);
    await expect(page.locator(`#chapter${chapter}-launch`)).toBeHidden();
  }
  await page.locator('#chapter1-launch').click();
  await page.locator('#chapter1-commit').click();
  await page.locator('#ch1-close').click();

  await expect(page.locator('#chapter2-launch')).toBeVisible();
  await page.locator('#chapter2-launch').click();
  for (const [card, classification] of [['power', 'UNAVAILABLE'], ['soil', 'ASSUMED'], ['trial', 'SIMULATED']]) {
    await page.locator(`[data-card="${card}"]`).selectOption(classification);
    await page.locator(`[data-check="${card}"]`).click();
  }
  await page.locator('[data-decision="defer"]').click();
  await expect(page.locator('.evidence-verdict h3')).toBeFocused();
  await page.locator('.evidence-close').click();

  await expect(page.locator('#chapter3-launch')).toBeVisible();
  await expect(page.locator('#chapter4-launch')).toBeHidden();
  await page.locator('#chapter3-launch').click();
  await expect(page.locator('#chapter3-soil-lab')).toBeVisible();
  await page.locator('#soil-tail').selectOption('bare_fallow');
  await expect(page.locator('.soil-commit')).toBeEnabled();
  await page.locator('.soil-commit').click();
  await expect(page.locator('.soil-verdict')).toBeVisible();
  await expect(page.locator('.soil-verdict h2')).toBeFocused();
  await page.locator('.soil-lab-close').click();

  await expect(page.locator('#chapter4-launch')).toBeVisible();
  await page.locator('#chapter4-launch').click();
  await expect(page.locator('#chapter4-harvest-council')).toBeVisible();
  await expect(page.locator('#chapter4-harvest-council [data-action="commit"]')).toBeEnabled();
  await page.locator('#chapter4-harvest-council [data-action="commit"]').click();
  await expect(page.locator('.harvest-verdict')).toBeVisible();
  await expect(page.locator('.harvest-verdict h2')).toBeFocused();
}

test('Babylon council outcome genuinely unlocks Chapters 1–4 and the fictional finale', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await page.locator('#btn-story-desk').click();
  await resolveCouncil(page);
  await completeSequence(page);
  const state = await page.evaluate(() => {
    const c = window.__seventhFieldGame.chapterSequence;
    return [c.chapter1.game.phase, c.chapter2.mission.phase, c.chapter3.mission.phase,
      c.chapter4.mission.phase, c.chapter4.mission.result.evidenceClass,
      c.chapter4.mission.result.realWorldRecommendation];
  });
  expect(state).toEqual(['result', 'result', 'result', 'result', 'SIMULATED', false]);
  await page.screenshot({ path: 'test-results/seventh-field-four-chapter-finale-3d.png' });
  await page.locator('#chapter4-harvest-council .harvest-close').click();
  await page.setViewportSize({ width: 360, height: 740 });
  const dock = await page.evaluate(() => {
    const boxes = [1, 2, 3, 4].map(n => document.querySelector(`#chapter${n}-launch`).getBoundingClientRect());
    const rail = [...document.querySelectorAll('.mobile-action-bar .mobile-btn')]
      .filter(el => getComputedStyle(el).display !== 'none')
      .map(el => el.getBoundingClientRect());
    const intersection = (a,b) => Math.max(0, Math.min(a.right,b.right)-Math.max(a.left,b.left))
      * Math.max(0, Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return { allVisible: boxes.every(rect=>rect.width>0&&rect.height>0),
      railCollision: boxes.some(a=>rail.some(b=>intersection(a,b)>0)),
      selfCollision: boxes.some((a,i)=>boxes.slice(i+1).some(b=>intersection(a,b)>0)) };
  });
  expect(dock).toEqual({ allVisible: true, railCollision: false, selfCollision: false });
  await page.screenshot({ path: 'test-results/seventh-field-four-chapter-mobile-dock.png' });
});

test('Arabic 360px no-WebGL journey reaches finale, then replay invalidates downstream state', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experience/play/story.html');
  await page.locator('#story-language').selectOption('ar');
  await resolveCouncil(page);
  await completeSequence(page);
  const ending = await page.evaluate(() => {
    const c = window.__soilIqTextGame.chapterSequence;
    return { result: c.chapter4.mission.result, launchText: c.chapter4Launch.textContent };
  });
  expect(ending.result.evidenceClass).toBe('SIMULATED');
  expect(ending.result.observedWeather).toBeNull();
  expect(ending.result.hasFieldAdvice).toBe(false);
  expect(ending.launchText).toContain('الفصل الرابع');
  await page.screenshot({ path: 'test-results/seventh-field-four-chapter-finale-ar360.png' });

  await page.locator('#chapter4-harvest-council .harvest-close').click();
  await page.locator('#chapter3-launch').click();
  await page.locator('#chapter3-soil-lab [data-action="replay"]').click();
  await expect(page.locator('#chapter4-launch')).toBeHidden();
  await expect(page.locator('#chapter4-harvest-council')).toHaveCount(0);
  await page.locator('.soil-lab-close').click();

  await page.locator('#chapter2-launch').click();
  await page.locator('.soil-iq-evidence-board [data-action="replay"]').click();
  await expect(page.locator('#chapter3-launch')).toBeHidden();
  await expect(page.locator('#chapter3-soil-lab')).toHaveCount(0);
  await expect(page.locator('#chapter4-launch')).toBeHidden();
  await expect(page.locator('#chapter1-launch')).toHaveCount(1);
});
