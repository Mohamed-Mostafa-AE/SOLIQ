import { test, expect } from '@playwright/test';

async function startSoilLab(page, ending = 'evidence_pause', language = 'en') {
  await page.goto('/experience/play/story.html');
  await page.evaluate(async ({ ending, language }) => {
    const { attachChapter3Game } = await import('/game/ui/chapter3-board.js');
    window.__soilLabTest = attachChapter3Game({
      host: document.body, language,
      chapter2: {
        phase: 'result', result: {
          chapter: 2, ending, sourceClass: 'SIMULATED', readyForFieldAdvice: false,
          previousPlanId: 'B', councilTrust: ending === 'evidence_pause' ? 3 : 1,
        },
      },
    });
    window.__soilLabTest.open();
  }, { ending, language });
  await expect(page.locator('#chapter3-soil-lab')).toBeVisible();
}

test('soil puzzle visibly enforces work budget and delivers an evidence-honest ending', async ({ page }) => {
  await startSoilLab(page);
  const lab = page.locator('#chapter3-soil-lab');
  await expect(lab.getByText('The answer is under our feet.')).toBeVisible();
  await expect(lab.locator('.soil-plot')).toHaveCount(2);
  await lab.locator('#soil-head').selectOption('living_cover');
  await lab.locator('#soil-tail').selectOption('living_cover');
  await expect(lab.getByText(/Too much work for the fictional family/)).toBeVisible();
  await expect(lab.getByRole('button', {name: /Present the simulated plan/})).toBeDisabled();
  await lab.locator('#soil-tail').selectOption('bare_fallow');
  await expect(lab.getByRole('button', {name: /Present the simulated plan/})).toBeEnabled();
  await lab.getByRole('button', {name: /Present the simulated plan/}).click();
  await expect(lab.getByText(/refuses to present invented infiltration or salinity numbers/)).toBeVisible();
  await expect(lab.getByText('SALINITY & INFILTRATION: UNAVAILABLE')).toBeVisible();
  await page.screenshot({path:'test-results/chapter3-soil-lab-evidence-desktop.png'});

  await lab.getByRole('button',{name:'Try another soil plan'}).click();
  await expect(lab.locator('#soil-head')).toHaveValue('living_cover');
  await page.keyboard.press('Escape');
  await expect(lab).toBeHidden();
});

test('fictional pressure branch changes outcome without invented NASA or field data', async ({ page }) => {
  await startSoilLab(page,'fictional_trial');
  const lab = page.locator('#chapter3-soil-lab');
  await lab.locator('#soil-head').selectOption('bare_fallow');
  await lab.locator('#soil-tail').selectOption('bare_fallow');
  await lab.locator('#soil-turn').selectOption('single_fast');
  await lab.getByRole('button',{name:/Present the simulated plan/}).click();
  await expect(lab.getByText(/bare ground raises warning tokens/)).toBeVisible();
  await expect(lab.getByText('REAL FIELD ADVICE: NOT AVAILABLE')).toBeVisible();
});

test('soil laboratory is RTL accessible at 360px and works without WebGL', async ({ page }) => {
  await page.setViewportSize({width:360,height:760});
  await page.emulateMedia({reducedMotion:'reduce'});
  await startSoilLab(page,'evidence_pause','ar');
  const lab=page.locator('#chapter3-soil-lab');
  await expect(lab).toHaveAttribute('dir','rtl');
  await expect(lab.getByText('الإجابة تحت رجلينا.')).toBeVisible();
  const state=await page.evaluate(()=>({
    outer:document.querySelector('#chapter3-soil-lab').scrollWidth,
    inner:document.querySelector('#chapter3-soil-lab').clientWidth,
    animation:getComputedStyle(document.querySelector('.soil-droplets')).animationName,
    webgl:document.querySelectorAll('#renderCanvas').length,
  }));
  expect(state.outer).toBeLessThanOrEqual(state.inner+1);
  expect(state.animation).toBe('none');
  expect(state.webgl).toBe(0);
  await page.screenshot({path:'test-results/chapter3-soil-lab-arabic-360.png'});
});
