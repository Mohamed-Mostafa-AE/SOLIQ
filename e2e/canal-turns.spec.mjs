import {test, expect} from '@playwright/test';

async function beginGame(page) {
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
}

test('live three-gate canal puzzle alters delivered water, six 3D fields and is replayable', async ({page}) => {
  test.setTimeout(180_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, {timeout: 30_000});
  await expect(page.locator('#btn-start-canal')).toBeVisible();
  await page.locator('#btn-start-canal').click();
  await expect(page.locator('#canal-turn-launch')).toBeVisible();
  await expect(page.locator('#canal-turn-panel')).toBeVisible();
  await expect(page.locator('#canal-turn-panel')).toContainText('NOT FIELD DATA');
  await page.locator('.canal-turn-run').click();
  await expect(page.locator('.canal-turn-message')).toContainText('Open the main intake');
  await page.locator('[data-gate="gate_head"]').click();
  await page.locator('[data-gate="gate_hassan"]').click();
  await page.locator('.canal-turn-run').click();
  const first = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return {
      round: game.canalTurns.state.round,
      delivered: game.canalTurns.state.delivered,
      hydration: game.village.fields.map(f => f.hydration),
      headOpen: game.village.gates.find(g => g.id === 'gate_head').isOpen,
      receiptCount: game.mission.notebookReceipts.length,
    };
  });
  expect(first.round).toBe(1);
  expect(first.delivered.slice(0, 3).some(n => n > 0)).toBe(true);
  expect(first.delivered.slice(3)).toEqual([0, 0, 0]);
  expect(first.hydration.slice(0, 3).some(n => n > 0)).toBe(true);
  expect(first.headOpen).toBe(true);
  await page.locator('[data-gate="gate_hassan"]').click();
  await page.locator('[data-gate="gate_maryam"]').click();
  await page.locator('.canal-turn-run').click();
  await expect(page.locator('.canal-turn-message')).toContainText('Two turns complete');
  const final = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return {
      complete: game.canalTurns.state.complete,
      delivered: game.canalTurns.state.delivered,
      hydration: game.village.fields.map(f => f.hydration),
      receipts: game.mission.notebookReceipts.length,
      stored: Object.keys(localStorage).filter(key => /canal.turn/i.test(key)),
    };
  });
  expect(final.complete).toBe(true);
  expect(final.delivered.slice(3).some(n => n > 0)).toBe(true);
  expect(final.hydration.slice(3).some(n => n > 0)).toBe(true);
  expect(final.receipts).toBe(first.receiptCount); // Educational activity cannot claim a NASA evidence receipt.
  expect(final.stored).toEqual([]);
  expect(await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return game.village.fields.slice(0, 6).every((field, i) =>
      Math.abs(field.delivered - game.canalTurns.state.delivered[i]) < 1e-6 &&
      Math.abs(field.shortfall - game.canalTurns.state.remaining[i]) < 1e-6);
  })).toBe(true);
  await page.screenshot({path:'test-results/seventh-field-operable-canal-turns.png'});
  await page.locator('.canal-turn-replay').click();
  expect(await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    // The separate seventh Time Echo is not part of the six-field training
    // solver and must preserve its initial appearance on a puzzle replay.
    return game.canalTurns.state.round === 0 &&
      game.village.fields.slice(0, 6).every((f, i) => f.hydration === 0 && f.delivered === 0 &&
        f.shortfall === [35, 45, 60, 40, 25, 30][i]) &&
      game.village.fields[6].hydration === 0.1 &&
      game.village.gates.every(g => !g.isOpen);
  })).toBe(true);
});

test('360px Arabic controls and proximity gate are keyboard-accessible without horizontal overflow', async ({page}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({width:360,height:800});
  await page.emulateMedia({reducedMotion:'reduce'});
  await beginGame(page);
  await page.evaluate(() => window.__seventhFieldGame.canalTurns.setLanguage('ar'));
  const selected = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    game.characters.nada.root.position.copyFrom(game.village.gates.find(g => g.id === 'gate_head').position);
    game.playerController._checkProximity();
    const id = game.playerController.nearestTarget?.id;
    game.playerController.triggerInteraction();
    return id;
  });
  expect(selected).toBe('gate_head');
  await expect(page.locator('#canal-turn-panel')).toHaveAttribute('dir','rtl');
  await expect(page.locator('[data-gate="gate_head"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-gate="gate_maryam"]').click();
  await page.locator('.canal-turn-run').click();
  await expect(page.locator('.canal-turn-message')).toContainText('انتهت النوبة');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.canal-turn-close').click();
  await expect(page.locator('#canal-turn-panel')).toBeHidden();
  await expect(page.locator('#canal-turn-launch')).toBeFocused();
});
