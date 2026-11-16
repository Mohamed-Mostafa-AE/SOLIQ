import { test, expect } from '@playwright/test';

test('Chapter 0 opens over real 3D, previews both witnesses, then restores playable controls', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.waitForFunction(() => window.__seventhFieldGame?.previewFrames >= 3, { timeout: 15_000 });

  // The actual scene is rendered beneath the transparent opening screen.
  const initial = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    const canal = game.renderSetup.scene.getMeshByName('scenicMesqaStillWater');
    return { meshes: game.renderSetup.scene.meshes.length, initialized: game.isInitialized,
      scenicWater: Boolean(canal?.isEnabled() && canal.isVisible) };
  });
  expect(initial.initialized).toBe(true);
  expect(initial.meshes).toBeGreaterThan(50);
  expect(initial.scenicWater).toBe(true);
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

test('splash reveals the actual village and HUD tools never collide with the chapter title', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.waitForFunction(() => window.__seventhFieldGame?.previewFrames >= 3, { timeout: 15_000 });
  await expect(page.locator('#game-loader')).toBeVisible();
  await expect(page.locator('#btn-start-game')).toBeVisible();
  await expect(page.locator('.hud-top-bar')).toBeHidden();
  const splash = await page.evaluate(() => {
    const loader = document.getElementById('game-loader');
    const canvas = document.getElementById('renderCanvas');
    const scene = window.__seventhFieldGame.renderSetup.scene;
    return { renderer: canvas.width > 0 && canvas.height > 0, previewFrames: window.__seventhFieldGame.previewFrames,
      simulationStarted: window.__seventhFieldGame.isReady,
      waterSimulated: Boolean(window.__seventhFieldGame.waterEngine.currentSimulation),
      gameLoopStarted: window.__seventhFieldGame.renderLoopStarted,
      actualCanal: Boolean(scene.getMeshByName('scenicMesqaStillWater')),
      loaderBackground: getComputedStyle(loader).backgroundImage };
  });
  expect(splash.renderer && splash.actualCanal && splash.previewFrames >= 3).toBe(true);
  expect([splash.simulationStarted, splash.waterSimulated, splash.gameLoopStarted]).toEqual([false, false, false]);
  // The splash is a translucent overlay on live 3D, not the old opaque card.
  expect(splash.loaderBackground).toContain('linear-gradient');
  await page.screenshot({ path: 'test-results/seventh-field-live-3d-splash.png' });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await expect(page.locator('.hud-top-bar')).toBeVisible();

  async function checkToolbarIsReadable() {
    const geometry = await page.evaluate(() => {
      const header = document.querySelector('.hud-title-zone').getBoundingClientRect();
      const controls = [...document.querySelectorAll('.hud-quick-tools .hud-tool-btn')]
        .map(node => node.getBoundingClientRect());
      return { viewport: window.innerWidth,
        overlaps: controls.map(rect => Math.max(0, Math.min(header.right, rect.right) - Math.max(header.left, rect.left))
          * Math.max(0, Math.min(header.bottom, rect.bottom) - Math.max(header.top, rect.top))),
        outside: controls.some(rect => rect.left < -1 || rect.right > window.innerWidth + 1) };
    });
    expect(geometry.overlaps.every(area => area === 0)).toBe(true);
    expect(geometry.outside).toBe(false);
  }
  await checkToolbarIsReadable();
  await page.setViewportSize({ width: 360, height: 740 });
  await checkToolbarIsReadable();
  await page.screenshot({ path: 'test-results/seventh-field-responsive-hud-360.png' });
});

test('water-thread entry keeps the village canal visually substantial behind Nada', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30_000 });
  await page.locator('#btn-start-game').click();
  await page.locator('#hook-clue-water').click();
  await page.waitForFunction(() => {
    const g = window.__seventhFieldGame;
    return g.renderSetup.scene.activeCamera === g.renderSetup.cameras.follow &&
      g.renderSetup.cameras.follow.target.z - g.characters.nada.root.position.z > 4.1;
  });
  // Projection uses the Babylon scene transform; wait for the follow camera's
  // first actual render, not the retired dialogue-camera matrix.
  await page.waitForTimeout(120);
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
