import { test, expect } from '@playwright/test';

async function loadEvidenceBoard(page, lang = 'en') {
  await page.goto('/experience/play/story.html');
  await page.evaluate(async language => {
    const { attachChapter2Game } = await import('/game/ui/chapter2-board.js');
    window.__chapter2Test = attachChapter2Game({
      host: document.body,
      chapter1: {
        phase: 'result',
        result: { planId: 'B', strategy: 'head_first', ending: 'tail_at_risk', tailUnmet: 42, soilCoverScore: 20 },
      },
      language,
    });
    window.__chapter2Test.open();
  }, lang);
  await expect(page.getByRole('dialog', { name: /The Evidence Gap/ })).toBeVisible();
}

test('Chapter 2 is playable as a keyboard-accessible, honest evidence puzzle', async ({ page }) => {
  await loadEvidenceBoard(page);
  const board = page.locator('.soil-iq-evidence-board');
  const nasa = board.locator('.evidence-card').filter({ hasText: 'The NASA weather record' });
  await nasa.locator('select').selectOption('OBSERVED');
  await nasa.getByRole('button', { name: 'Check evidence' }).click();
  await expect(nasa).toContainText('Not yet');
  await nasa.locator('select').selectOption('UNAVAILABLE');
  await nasa.getByRole('button', { name: 'Check evidence' }).click();

  const soil = board.locator('.evidence-card').filter({ hasText: 'Maryam’s soil-water estimate' });
  await soil.locator('select').selectOption('ASSUMED');
  await soil.getByRole('button', { name: 'Check evidence' }).click();
  const trial = board.locator('.evidence-card').filter({ hasText: 'The two-season village trial' });
  await trial.locator('select').selectOption('SIMULATED');
  await trial.getByRole('button', { name: 'Check evidence' }).click();
  await expect(board.getByText('What should Nada tell the council?')).toBeVisible();
  await board.getByRole('button', { name: /Pause for evidence/ }).click();
  await expect(board.getByText(/requests dated weather evidence and a local soil measurement/)).toBeVisible();
  await expect(board.locator('.evidence-badge')).toHaveText('SIMULATED GAME RESULT');
  const titleTop = await board.locator('.evidence-header h2').evaluate(node => node.getBoundingClientRect().top);
  expect(titleTop).toBeGreaterThanOrEqual(0);
  await page.screenshot({ path: 'test-results/chapter2-honest-evidence-desktop.png' });

  await board.getByRole('button', { name: 'Replay this puzzle' }).click();
  await expect(board.getByText('Evidence cards verified:')).toContainText('0 / 3');
  await page.keyboard.press('Escape');
  await expect(board).toBeHidden();
});

test('Chapter 2 works at 360px with Arabic, reduced motion and no 3D canvas', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadEvidenceBoard(page, 'ar');
  await expect(page.locator('.soil-iq-evidence-board')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByText('تنبؤ من غير مصدر؟')).toBeVisible();
  await expect(page.locator('.evidence-prev strong')).toHaveText('B · أول المسقة أولًا');
  const state = await page.evaluate(() => ({
    outer: document.querySelector('.soil-iq-evidence-board').scrollWidth,
    inner: document.querySelector('.soil-iq-evidence-board').clientWidth,
    animation: getComputedStyle(document.querySelector('.evidence-ripples')).animationName,
    canvas: document.querySelectorAll('#renderCanvas').length,
  }));
  expect(state.outer).toBeLessThanOrEqual(state.inner + 1);
  expect(state.animation).toBe('none');
  expect(state.canvas).toBe(0);
  await page.screenshot({ path: 'test-results/chapter2-arabic-mobile-360.png' });
});
