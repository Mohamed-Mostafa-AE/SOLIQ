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
    await expect(objective).toContainText('Mission: The Water Has Arrived!');
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

    // Unsafe startup is blocked; the player must complete three meaningful
    // training steps before selecting the powered-pump branch.
    const blocked = await page.evaluate(() => window.__seventhFieldGame.mission.executeOutcome('equilibrium'));
    expect(blocked).toBe(false);
    const training = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      for (const id of ['pumpInspected', 'canalAccessSecured', 'heatPrecautionsReviewed']) {
        g.mission.completeSafetyTraining(id);
      }
      return { checks: g.mission.flags, receipts: g.mission.notebookReceipts.length };
    });
    expect(training.checks.heatPrecautionsReviewed).toBe(true);
    expect(training.receipts).toBeGreaterThanOrEqual(4);

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
    await expect(page.locator('.receipt-title').first()).toContainText('The Water Has Arrived!');

    // Close Notebook
    await page.locator('#btn-close-notebook').click();
    await expect(modal).toBeHidden();
  });

  test('Settings modal and audio mute toggle work without regressions', async ({ page }) => {
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
    await expect(page.locator('#hud-objective-title')).toContainText('Mission:');
    await expect(page.locator('#btn-earth-lens .label')).toHaveText('Earth Lens');
    await page.locator('#btn-settings').click();
    await expect(page.locator('#select-lang')).toHaveValue('en');
    await page.locator('#select-lang').selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('#hud-objective-title')).toContainText('المهمة');
    await page.locator('#select-lang').selectOption('en');
    await expect(page.locator('#hud-objective-title')).toContainText('Mission:');
  });

  test('Evidence Notebook opens the actual crop-rotation decision workspace', async ({ page }) => {
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

  test('Pump mission requires player safety checks before irrigation and logs SDG learning', async ({ page }) => {
    await startSession(page);
    for (let step = 0; step < 3; step++) {
      await page.evaluate(() => {
        const g = window.__seventhFieldGame;
        g.hud.showDialogue(g.mission.getDialogueForTarget({ id: 'pumpStation' }));
      });
      await expect(page.locator('#dialogue-speaker')).toHaveText('Safety Check — Before the Pump');
      await page.locator('.dialogue-choice-btn').first().click();
    }
    const state = await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      return {
        ready: g.mission.flags.pumpInspected && g.mission.flags.canalAccessSecured && g.mission.flags.heatPrecautionsReviewed,
        speaker: g.mission.getDialogueForTarget({ id: 'pumpStation' }).speakerEn,
        options: g.mission.getDialogueForTarget({ id: 'pumpStation' }).choices.length,
      };
    });
    expect(state.ready).toBe(true);
    expect(state.speaker).toBe('Diesel Pump & Canal Regulator');
    expect(state.options).toBe(3);

    await page.evaluate(() => window.__seventhFieldGame.mission.executeOutcome('equilibrium'));
    await page.locator('#btn-notebook').click();
    await expect(page.locator('#receipts-list')).toContainText('Sustainability trade-offs');
    await expect(page.locator('#receipts-list')).toContainText('SDG Learning');
    await expect(page.locator('#receipts-list')).toContainText('NOT real-world operational clearance');
  });

});
