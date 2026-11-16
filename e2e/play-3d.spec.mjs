import { test, expect } from '@playwright/test';

async function startSession(page) {
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame && window.__seventhFieldGame.isInitialized === true, { timeout: 10000 });
  await page.evaluate(() => {
    if (window.__seventhFieldGame) {
      window.__seventhFieldGame.start();
    }
  });
  await expect(page.locator('#hud-objective-title')).toBeVisible({ timeout: 5000 });
}

test.describe('SOLIQ: The Seventh Field - 3D Playable World E2E', () => {

  test('3D scene loads, renders canvas and advances past splash screen', async ({ page }) => {
    await page.goto('/experience/play/');
    await expect(page).toHaveTitle(/The Seventh Field/);

    const canvas = page.locator('#renderCanvas');
    await expect(canvas).toBeAttached();

    await page.waitForFunction(() => window.__seventhFieldGame && window.__seventhFieldGame.isInitialized === true, { timeout: 10000 });
    await page.evaluate(() => {
      if (window.__seventhFieldGame) window.__seventhFieldGame.start();
    });

    const objective = page.locator('#hud-objective-title');
    await expect(objective).toContainText('Chapter 0: A Season Unwritten');
    await expect(page.locator('#telemetry-toast')).toContainText('The dawn council is gathering');
  });

  test('Player Nada locomotion and camera mode toggle', async ({ page }) => {
    await startSession(page);

    // Simulate locomotion inputs
    await page.keyboard.press('KeyW', { delay: 100 });
    await page.keyboard.press('KeyD', { delay: 100 });

    // Camera toggle button
    const camBtn = page.locator('#btn-camera');
    await expect(camBtn).toBeVisible();
    await camBtn.click();
    await camBtn.click();
  });

  test('native Tab focuses HUD, Space activates buttons, camera C only works on canvas', async ({ page }) => {
    test.setTimeout(90_000); // Real 3D render and keyboard input on software CI.
    await startSession(page);
    const canvas=page.locator('#renderCanvas');
    const game=()=>page.evaluate(()=>window.__seventhFieldGame.playerController.isCameraIso);
    await canvas.focus();
    expect(await game()).toBe(false);

    // Tab must navigate from the 3D canvas to the first HUD control without
    // changing camera modes or being swallowed by a global key handler.
    await page.keyboard.press('Tab');
    await expect(page.locator('#btn-earth-lens')).toBeFocused();
    expect(await game()).toBe(false);
    await page.keyboard.press('KeyC');
    expect(await game()).toBe(false);

    // Space on a focused button must click it, rather than interact in the world.
    await page.locator('#btn-settings').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#settings-modal')).toBeVisible();
    await page.locator('#btn-close-settings').click();

    await canvas.focus();
    await page.keyboard.press('KeyC');
    expect(await game()).toBe(true);
    await expect(page.locator('#btn-camera')).toHaveAttribute('title','Switch camera (C)');
  });

  test('real start reveals a dramatic two-plan prologue and records the chosen investigation', async ({ page }) => {
    await page.goto('/experience/play/');
    await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true);
    await page.locator('#btn-start-game').click();
    await expect(page.locator('#opening-hook')).toBeVisible();
    await expect(page.locator('#opening-hook')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#opening-hook')).toContainText('The Seventh Field');
    await expect(page.locator('#opening-hook')).toContainText('UNTESTED');
    await expect(page.locator('#hook-skip')).toBeInViewport();
    await expect(page.locator('#game-ui-container')).toHaveAttribute('inert', '');
    await page.screenshot({ path: 'test-results/seventh-field-opening-desktop.png' });
    await page.setViewportSize({ width: 360, height: 780 });
    await expect(page.locator('#hook-skip')).toBeInViewport();
    await expect(page.locator('#hook-clue-soil')).toBeVisible();
    const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noOverflow).toBe(true);
    await page.screenshot({ path: 'test-results/seventh-field-opening-mobile.png' });
    await page.locator('#hook-clue-soil').press('Enter');
    await expect(page.locator('#opening-hook')).toBeHidden();
    await expect(page.locator('#game-ui-container')).not.toHaveAttribute('inert', '');
    const clue = await page.evaluate(() => window.__seventhFieldGame.mission.flags.firstClue);
    expect(clue).toBe('soil');
    await page.locator('#btn-notebook').click();
    await expect(page.locator('#receipts-list')).toContainText('Soil-cover question');
  });

  test('Interactive conversations with Uncle Hassan and Maryam', async ({ page }) => {
    await startSession(page);

    // Uncle Hassan dialogue
    const dlgHassan = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      return g ? g.mission.getDialogueForTarget({ id: 'hassan' }) : null;
    });

    expect(dlgHassan).toBeTruthy();
    expect(dlgHassan.speakerAr).toContain('عم حسن');
    expect(dlgHassan.choices.length).toBeGreaterThanOrEqual(1);

    // Maryam dialogue
    const dlgMaryam = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      return g ? g.mission.getDialogueForTarget({ id: 'maryam' }) : null;
    });
    expect(dlgMaryam).toBeTruthy();
    expect(dlgMaryam.speakerAr).toContain('مريم');
  });

  test('Mesqa water simulation executes all three outcomes and updates evidence receipts', async ({ page }) => {
    await startSession(page);

    // The canal council is available without fictional equipment inspections.
    const council = await page.evaluate(() => window.__seventhFieldGame.mission.getDialogueForTarget({ id: 'pumpStation' }));
    expect(council.speakerEn).toContain('The Canal Council');
    expect(council.choices).toHaveLength(3);

    // Outcome 1: Proportional Fair Equilibrium
    const res1 = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      g.mission.executeOutcome('equilibrium');
      return {
        outcome: g.mission.activeOutcome,
        fairness: g.waterEngine.currentSimulation?.fairness,
        receiptsCount: g.mission.notebookReceipts.length,
      };
    });

    expect(res1.outcome).toBe('equilibrium');
    expect(res1.fairness).toBeGreaterThan(0.9);
    expect(res1.receiptsCount).toBeGreaterThanOrEqual(2);

    // Outcome 2: Bottleneck Overload
    const res2 = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      g.mission.executeOutcome('bottleneck');
      return {
        outcome: g.mission.activeOutcome,
        deliveredTotal: g.waterEngine.currentSimulation?.deliveredTotal,
      };
    });
    expect(res2.outcome).toBe('bottleneck');

    // Outcome 3: Conservative Deferral
    const res3 = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      g.mission.executeOutcome('deferral');
      return {
        outcome: g.mission.activeOutcome,
        receipt: g.mission.notebookReceipts[0],
      };
    });
    expect(res3.outcome).toBe('deferral');
    expect(res3.receipt.dataClass).toBe('simulated');
  });

  test('Earth Lens toggles between Ground, NASA observed, and Modelled Future with disclaimer', async ({ page }) => {
    await startSession(page);

    // Toggle Lens Bar
    await page.locator('#btn-earth-lens').click();
    await expect(page.locator('#earth-lens-bar')).toHaveClass(/visible/);

    // Click NASA Mode
    await page.locator('[data-lens="nasa"]').click();
    const toast = page.locator('#telemetry-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('NASA POWER');
    await expect(toast).toContainText('source not loaded in game');

    // Click Future Mode
    await page.locator('[data-lens="future"]').click();
    await expect(toast).toContainText('SIMULATION — NOT SATELLITE OBSERVATION');
  });

  test('Time Echo comparative ledger is accessible and conservatively certificates uncertainty', async ({ page }) => {
    await startSession(page);

    const comparison = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      return g.timeEcho.getScenarioComparison();
    });

    expect(comparison.notice).toBe('SIMULATION — NOT SATELLITE OBSERVATION');
    expect(comparison.certificate.status).toBe('comparison_only');
    expect(comparison.baseline.waterDemand).toContain('not calculated');
    expect(comparison.alternative.waterDemand).toContain('not calculated');
  });

  test('Mobile 360px viewport responsiveness, touch joystick and zero overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await startSession(page);

    // Virtual Joystick Zone and Mobile action buttons
    await expect(page.locator('#virtual-joystick-zone')).toBeAttached();
    await expect(page.locator('.mobile-action-bar')).toBeVisible();

    // Check no horizontal overflow
    const hasNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    expect(hasNoOverflow).toBe(true);
  });

  test('Evidence Notebook drawer opens, displays receipts and Mesqa ledger', async ({ page }) => {
    await startSession(page);

    // Open Notebook
    await page.locator('#btn-notebook').click();
    const modal = page.locator('#notebook-modal');
    await expect(modal).toBeVisible();

    // Verify initial receipt
    await expect(page.locator('.receipt-card').first()).toBeVisible();
    await expect(page.locator('.receipt-title').first()).toContainText('Dawn Council: The Seventh Field Mystery');

    // Close Notebook
    await page.locator('#btn-close-notebook').click();
    await expect(modal).toBeHidden();
  });

  test('Settings modal and audio mute toggle work without regressions', async ({ page }) => {
    test.setTimeout(90_000); // Keep the real UI workflow on software WebGL CI.
    await startSession(page);

    // Audio mute button
    const audioBtn = page.locator('#btn-audio');
    await audioBtn.click();
    await expect(page.locator('#audio-icon')).toContainText('🔇');
    await audioBtn.click();
    await expect(page.locator('#audio-icon')).toContainText('🔊');

    // Settings modal
    await page.locator('#btn-settings').click();
    const settingsModal = page.locator('#settings-modal');
    await expect(settingsModal).toBeVisible();
    await page.locator('#select-quality').selectOption('low');
    await page.locator('#btn-close-settings').click();
    await expect(settingsModal).toBeHidden();
  });
  test('English-first HUD and Arabic subtitle option remain usable', async ({ page }) => {
    await startSession(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#hud-objective-title')).toContainText('Chapter 0:');
    await expect(page.locator('#btn-earth-lens .label')).toHaveText('Earth Lens');
    await page.locator('#btn-settings').click();
    await expect(page.locator('#select-lang')).toHaveValue('en');
    await page.locator('#select-lang').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('#hud-objective-title')).toContainText('الفصل');
    await page.locator('#select-lang').selectOption('en');
    await expect(page.locator('#hud-objective-title')).toContainText('Chapter 0:');
  });

  test('Evidence Notebook opens the actual crop-rotation decision workspace', async ({ page }) => {
    test.setTimeout(90_000); // Popup navigation can lag under software WebGL.
    await startSession(page);
    await page.locator('#btn-notebook').click();
    await page.locator('[data-nbtab="provenance"]').click();
    const link = page.locator('#open-rotation-workspace');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Crop Rotation');
    await expect(link).toHaveAttribute('href', '../../#rotations');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const [rotationPage] = await Promise.all([
      page.waitForEvent('popup'),
      link.click(),
    ]);
    await rotationPage.waitForLoadState('domcontentloaded');
    await expect(rotationPage).toHaveURL(/\/#rotations$/);
    await expect(rotationPage).toHaveTitle(/Soil-IQ.*Crop rotation explorer/);
    await expect(rotationPage.locator('[data-view="rotations"]').first()).toBeVisible();
    await rotationPage.close();
  });

  test('Canal council offers water choices and records sustainability trade-offs', async ({ page }) => {
    await startSession(page);
    await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      g.hud.showDialogue(g.mission.getDialogueForTarget({ id: 'pumpStation' }));
    });
    await expect(page.locator('#dialogue-speaker')).toHaveText('The Canal Council — Six Families, One Turn');
    await expect(page.locator('.dialogue-choice-btn')).toHaveCount(3);
    await page.locator('.dialogue-choice-btn').first().click();
    await page.locator('#btn-notebook').click();
    await expect(page.locator('#receipts-list')).toContainText('Sustainability trade-offs');
    await expect(page.locator('#receipts-list')).toContainText('SDG Learning');
    await expect(page.locator('#receipts-list')).not.toContainText('Pump operation blocked');
  });

  test('No-WebGL inclusive story route reuses the real water solver and captions', async ({ page }) => {
    await page.goto('/experience/play/story.html');
    await expect(page).toHaveTitle(/Accessible Story/);
    await expect(page.locator('#story-desk')).toBeVisible();
    await expect(page.locator('#story-desk')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('#content')).toHaveJSProperty('inert', true);
    const noCanvas = await page.evaluate(() => ({
      babylon: typeof window.BABYLON,
      canvasCount: document.querySelectorAll('canvas').length,
    }));
    expect(noCanvas).toEqual({ babylon: 'undefined', canvasCount: 0 });
    await page.locator('[data-story-target="hassan"]').click();
    await page.locator('#story-choice-list button').first().press('Enter');
    await page.locator('[data-story-target="pumpStation"]').click();
    await page.locator('#story-choice-list button').nth(1).press('Enter');
    const result = await page.evaluate(() => {
      const { mission, water } = window.__soilIqTextGame;
      return {
        outcome: mission.activeOutcome,
        delivered: water.currentSimulation?.deliveredTotal,
        source: water.currentSimulation?.provenance?.kind,
        receipts: mission.notebookReceipts.length,
      };
    });
    expect(result.outcome).toBe('bottleneck');
    expect(result.delivered).toBeGreaterThan(0);
    expect(result.source).toBe('simulated');
    expect(result.receipts).toBeGreaterThanOrEqual(3);
    await expect(page.locator('#text-receipts')).toContainText('Sustainability trade-offs');
    await page.keyboard.press('Escape');
    await expect(page.locator('#story-desk-overlay')).toBeHidden();
    await expect(page.locator('#content')).toHaveJSProperty('inert', false);
    await page.locator('#story-language').selectOption('ar');
    await expect(page.locator('#text-progress')).toContainText('قرار المياه');
    await page.locator('#btn-open-story').click();
    await expect(page.locator('#story-desk')).toBeVisible();
    await expect(page.locator('#story-desk-title')).toContainText('الموسم');
  });

  test('text-only route has the same opening investigation choice and evidence receipt', async ({ page }) => {
    await page.goto('/experience/play/story.html');
    await expect(page.locator('#story-thread-list button')).toHaveCount(2);
    await page.locator('#story-thread-soil').press('Enter');
    await expect(page.locator('#story-thread-list button')).toHaveCount(0);
    await expect(page.locator('#story-beat-title')).toContainText('Follow the soil');
    await expect(page.locator('#text-receipts')).toContainText('Soil-cover question');
    const flag = await page.evaluate(() => window.__soilIqTextGame.mission.flags.firstClue);
    expect(flag).toBe('soil');
    await page.locator('[data-story-target="hassan"]').click();
    await expect(page.locator('#story-choice-list button')).toHaveCount(3);
  });

  test('Text-first story route is playable with keyboard, captions and reduced motion', async ({ page }) => {
    test.setTimeout(90_000); // 3D software renderer on CI can delay focus/keyboard interaction.
    await startSession(page);
    await page.locator('#btn-story-desk').click();
    const story = page.locator('#story-desk');
    await expect(story).toBeVisible();
    await expect(story.locator('#story-checkpoint-save')).toBeVisible();
    await expect(story.locator('#story-checkpoint-help')).toContainText('Nothing is saved automatically');
    await expect(page.locator('#story-desk-source')).toContainText('SIMULATED STORY');
    await expect(page.locator('#renderCanvas')).toHaveJSProperty('inert', true);
    await expect(page.locator('#story-beat-title')).toContainText('The Seventh Field');

    await page.locator('[data-story-target="hassan"]').click();
    await page.locator('#story-choice-list button').first().press('Enter');
    await expect(page.locator('#story-beat-title')).toContainText('One voice');
    await page.locator('[data-story-target="maryam"]').click();
    await page.locator('#story-choice-list button').first().press('Enter');
    await expect(page.locator('#story-beat-title')).toContainText('Two families');

    await page.locator('[data-story-target="timeEcho"]').click();
    await page.locator('#story-choice-list button').first().press('Enter');
    await expect(page.locator('#story-beat-title')).toContainText('seventh field');

    await page.locator('[data-story-target="pumpStation"]').click();
    await expect(page.locator('#story-choice-list button')).toHaveCount(3);
    await page.locator('#story-choice-list button').nth(1).press('Enter');
    await expect(page.locator('#story-beat-title')).toContainText('water turn has consequences');
    await expect(page.locator('#story-rotation-link')).toHaveAttribute('href', '../../#rotations');
    await page.keyboard.press('Escape');
    await expect(page.locator('#story-desk-overlay')).toBeHidden();
    await expect(page.locator('#renderCanvas')).toHaveJSProperty('inert', false);

    await page.locator('#btn-settings').click();
    await page.locator('#chk-reduced-motion').check();
    await expect(page.locator('body')).toHaveClass(/reduced-motion/);
    await page.locator('#select-lang').selectOption('ar');
    await expect(page.locator('#btn-story-desk')).toHaveAttribute('title', /القصة/);
  });

});
