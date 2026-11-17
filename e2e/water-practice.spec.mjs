import {test, expect} from '@playwright/test';

async function approachAndInteract(page, id) {
  const nearest = await page.evaluate(targetId => {
    const game = window.__seventhFieldGame;
    game.characters.nada.root.position.copyFrom(game.waterPractice.locations[targetId]);
    game.playerController._checkProximity();
    const selected = game.playerController.nearestTarget?.id;
    game.playerController.triggerInteraction();
    return selected;
  }, id);
  expect(nearest).toBe(id);
}

test('real Babylon tool pickup and animated practice choice are independent of scientific water state', async ({page}) => {
  test.setTimeout(220_000); // Software WebGL snapshot on CI can be slow.
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  const baseline = await page.evaluate(() => window.__seventhFieldGame.mission.notebookReceipts.length);

  await approachAndInteract(page, 'practice_can');
  await expect(page.locator('#water-practice-panel')).toBeVisible();
  await expect(page.locator('#water-practice-panel')).toHaveAttribute('data-stage', 'bed');
  expect(await page.evaluate(() => window.__seventhFieldGame.waterPractice.can.parent === window.__seventhFieldGame.characters.nada.root)).toBe(true);

  await approachAndInteract(page, 'practice_bed');
  await expect(page.locator('#water-practice-illustrate')).toBeVisible();
  await page.locator('#water-practice-illustrate').click();
  await expect(page.locator('#water-practice-panel')).toHaveAttribute('data-stage', 'done');
  await expect(page.locator('#water-practice-panel')).toContainText('SIMULATED');
  const result = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return {
      action: game.waterPractice.state.action,
      droplets: game.waterPractice.droplets.filter(mesh => mesh.isEnabled()).length,
      receipts: game.mission.notebookReceipts.length,
      waterSimulation: game.waterEngine.currentSimulation,
      storedKeys: Object.keys(localStorage).filter(key => /water.practice|practice_can/i.test(key)),
    };
  });
  expect(result).toEqual({action: 'illustrate_watering', droplets: 7, receipts: baseline, waterSimulation: null, storedKeys: []});
  await page.screenshot({path: 'test-results/seventh-field-carried-water-can-and-practice.png'});

  await page.locator('#water-practice-replay').click();
  await expect(page.locator('#water-practice-panel')).toBeHidden();
  expect(await page.evaluate(() => {
    const practice = window.__seventhFieldGame.waterPractice;
    return practice.state.stage === 'pickup' && !practice.can.parent && practice.droplets.every(mesh => !mesh.isEnabled());
  })).toBe(true);
});

test('Arabic 360px defer option preserves no-WebGL safety semantics and reduced motion', async ({page}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({width: 360, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await page.evaluate(() => {
    const practice = window.__seventhFieldGame.waterPractice;
    practice.setLanguage('ar');
    practice.handleInteraction(practice.targets.practice_can);
    practice.handleInteraction(practice.targets.practice_bed);
  });
  await expect(page.locator('#water-practice-panel')).toHaveAttribute('dir', 'rtl');
  await page.locator('#water-practice-defer').click();
  await expect(page.locator('#water-practice-panel')).toContainText('البيانات غير متاحة');
  const state = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return {
      action: game.waterPractice.state.action,
      droplets: game.waterPractice.droplets.filter(mesh => mesh.isEnabled()).length,
      reducedMotion: game.waterPractice.reducedMotion,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(state).toEqual({action: 'defer', droplets: 0, reducedMotion: true, horizontalOverflow: false});
});
