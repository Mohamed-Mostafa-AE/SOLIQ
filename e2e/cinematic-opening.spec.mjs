import { test, expect } from '@playwright/test';

test('Chapter 0 opens over real 3D, previews both witnesses, then restores playable controls', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });

  // The actual scene is rendered beneath the transparent opening screen.
  const initial = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return { meshes: game.renderSetup.scene.meshes.length, initialized: game.isInitialized };
  });
  expect(initial.initialized).toBe(true);
  expect(initial.meshes).toBeGreaterThan(50);
  await page.screenshot({ path: 'test-results/seventh-field-cinematic-splash.png' });

  await page.locator('#btn-start-game').click();
  await expect(page.locator('#opening-hook')).toBeVisible();
  await expect(page.locator('#hook-world-location')).toContainText('CANAL GATE');
  await expect(page.locator('#game-ui-container')).toHaveAttribute('inert', '');
  const waterState = await page.evaluate(() => ({
    camera: window.__seventhFieldGame.renderSetup.activeCameraName,
    input: window.__seventhFieldGame.playerController.inputEnabled,
    beacon: window.__seventhFieldGame.cinematicDirector.marker.isVisible,
  }));
  expect(waterState).toEqual({ camera: 'dialogue', input: false, beacon: true });
  await page.screenshot({ path: 'test-results/seventh-field-cinematic-water.png' });

  await page.locator('#hook-clue-soil').focus();
  await expect(page.locator('#hook-world-location')).toContainText('CROP FIELD');
  await expect(page.locator('#hook-scene-label')).toContainText('MARYAM');
  const focused = await page.evaluate(() => window.__seventhFieldGame.cinematicDirector.shot);
  expect(focused).toBe('soil');
  await page.locator('#hook-view-village').click();
  await expect(page.locator('#hook-view-village')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#hook-scene-label')).toContainText('DAWN');
  await page.locator('#hook-clue-soil').click();
  await expect(page.locator('#opening-hook')).toBeHidden();
  await expect(page.locator('#game-ui-container')).not.toHaveAttribute('inert', '');
  const after = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    return { camera: game.renderSetup.activeCameraName, input: game.playerController.inputEnabled,
      clue: game.mission.flags.firstClue, beacon: game.cinematicDirector.marker.isVisible };
  });
  expect(after).toEqual({ camera: 'follow', input: true, clue: 'soil', beacon: true });
  await expect(page.locator('#telemetry-toast')).toContainText('Maryam');
  await page.waitForFunction(() => {
    const game = window.__seventhFieldGame;
    return game.renderSetup.cameras.follow.target.z - game.characters.nada.root.position.z > 3;
  });
  await page.screenshot({ path: 'test-results/seventh-field-cinematic-after-intro.png' });
});

test('water-thread entry keeps the village canal visually substantial behind Nada', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-clue-water').click();
  const view = await page.evaluate(() => {
    const g = window.__seventhFieldGame;
    const scene = g.renderSetup.scene;
    const engine = g.renderSetup.engine;
    const width = engine.getRenderWidth(), height = engine.getRenderHeight();
    const viewport = g.renderSetup.cameras.follow.viewport.toGlobal(width, height);
    const project = v => BABYLON.Vector3.Project(v, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), viewport);
    const nearBank = project(new BABYLON.Vector3(-4, .15, 7));
    const farBank = project(new BABYLON.Vector3(-4, .15, 12));
    return {
      waterWidthPixels: Math.abs(farBank.y - nearBank.y),
      withinViewport: [nearBank, farBank].every(p => p.x > 0 && p.x < width && p.y > 0 && p.y < height),
      clue: g.mission.flags.firstClue,
    };
  });
  expect(view.clue).toBe('water');
  expect(view.withinViewport).toBe(true);
  expect(view.waterWidthPixels).toBeGreaterThan(25);
  await page.screenshot({ path: 'test-results/seventh-field-water-choice-first-frame.png' });
});

test('Chapter 0 preview respects reduced motion and the keyboard skip path', async ({ page }) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-clue-soil').focus();
  const result = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    const expected = game.cinematicDirector._shotFor('soil').position;
    const position = game.renderSetup.cameras.dialogue.position;
    return { reduced: game.renderSetup.reducedMotion,
      diff: window.BABYLON.Vector3.Distance(expected, position),
      focused: document.activeElement?.id };
  });
  expect(result.reduced).toBe(true);
  expect(result.diff).toBeLessThan(0.001);
  expect(result.focused).toBe('hook-clue-soil');
  await page.locator('#hook-skip').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#opening-hook')).toBeHidden();
  await expect(page.locator('#renderCanvas')).toBeFocused();
  await expect(page.locator('#game-ui-container')).not.toHaveAttribute('inert', '');
});
