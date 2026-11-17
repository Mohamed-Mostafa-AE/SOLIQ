import {test, expect} from '@playwright/test';

test('Nada picks up a tool, examines soil, and visibly covers a trial bed', async ({page}) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await expect(page.locator('#fieldwork-panel')).toBeVisible();
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('data-stage', 'tool');
  await expect(page.locator('#fieldwork-panel')).toContainText('SIMULATED');

  async function approachAndInteract(targetId) {
    const nearest = await page.evaluate(id => {
      const game = window.__seventhFieldGame;
      game.characters.nada.root.position.copyFrom(game.fieldwork.locations[id]);
      game.playerController._checkProximity();
      const nearestId = game.playerController.nearestTarget?.id;
      game.playerController.triggerInteraction();
      return nearestId;
    }, targetId);
    expect(nearest).toBe(targetId);
  }

  await approachAndInteract('fieldwork_tool');
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('data-stage', 'sample');
  expect(await page.evaluate(() => window.__seventhFieldGame.fieldwork.probe.parent === window.__seventhFieldGame.characters.nada.root)).toBe(true);

  await approachAndInteract('fieldwork_sample');
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('data-stage', 'cover');
  await expect(page.locator('#fieldwork-panel')).toContainText('not a sensor reading');

  await approachAndInteract('fieldwork_cover');
  await expect(page.locator('#fieldwork-choice-straw')).toBeVisible();
  await page.locator('#fieldwork-choice-straw').click();
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('data-stage', 'done');
  await expect(page.locator('#fieldwork-panel')).toContainText('local water');
  const world = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return {
      outcome: game.fieldwork.state.coverChoice,
      rows: game.fieldwork.strawRows.filter(row => row.isEnabled()).length,
      markerVisible: game.fieldwork.marker.isEnabled(),
      receipts: game.mission.notebookReceipts.length,
      privateKeys: Object.keys(localStorage).filter(key => key.includes('fieldwork')),
    };
  });
  expect(world).toEqual({outcome: 'straw', rows: 5, markerVisible: false, receipts: 1, privateKeys: []});
  await page.screenshot({path: 'test-results/seventh-field-tool-soil-cover.png'});

  await page.locator('#fieldwork-replay').click();
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('data-stage', 'tool');
  expect(await page.evaluate(() => window.__seventhFieldGame.fieldwork.strawRows.every(row => !row.isEnabled()))).toBe(true);
});

test('trial bed can stay bare with Arabic HUD at 360px', async ({page}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({width: 360, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    game.fieldwork.setLanguage('ar');
    game.fieldwork.handleInteraction(game.fieldwork.targets.fieldwork_tool);
    game.fieldwork.handleInteraction(game.fieldwork.targets.fieldwork_sample);
    game.fieldwork.handleInteraction(game.fieldwork.targets.fieldwork_cover);
  });
  await expect(page.locator('#fieldwork-panel')).toHaveAttribute('dir', 'rtl');
  await page.locator('#fieldwork-choice-bare').click();
  await expect(page.locator('#fieldwork-panel')).toContainText('فضل مكشوف');
  expect(await page.evaluate(() => window.__seventhFieldGame.fieldwork.state.coverChoice)).toBe('bare');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
