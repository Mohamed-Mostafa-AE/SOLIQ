import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const baseOutcome = {
  chapter: 3, ending: 'shared_soil_cover', evidenceClass: 'SIMULATED',
  realWorldRecommendation: false, salinityEvidence: 'UNAVAILABLE',
  previousPlanId: 'B', previousChapterEnding: 'fictional_trial',
  coverTokens: 4, runoffRiskTokens: 2, tailAccessTokens: 4,
  livelihoodTokens: 3, workTokens: 5, priority: 'fairness',
};

async function openFinale(page, language = 'en', outcome = baseOutcome) {
  await page.goto('/experience/play/story.html');
  await page.evaluate(async ({language,outcome}) => {
    const {attachChapter4Game}=await import('/game/ui/chapter4-board.js');
    window.__harvestCouncil=attachChapter4Game({
      host:document.body, language,
      chapter3:{phase:'result',result:outcome},
    });
    window.__harvestCouncil.open();
  }, {language,outcome});
  await expect(page.locator('#chapter4-harvest-council')).toBeVisible();
  await expect(page.locator('#harvest-title')).toBeVisible();
}

test('final council offers real playable trade-offs and two distinct fictional endings', async ({page}) => {
  await openFinale(page);
  const council=page.locator('#chapter4-harvest-council');
  await expect(council.getByText('The future is not a single harvest.')).toBeVisible();
  await expect(council.locator('[data-pledge]')).toHaveCount(3);
  await council.locator('#harvest-water').selectOption('3');
  await council.locator('#harvest-soil').selectOption('2');
  await expect(council.getByText(/promised more than its fictional capacity/)).toBeVisible();
  await expect(council.getByRole('button',{name:/Conclude the village story/})).toBeDisabled();
  await council.locator('#harvest-soil').selectOption('1');
  await expect(council.getByRole('button',{name:/Conclude the village story/})).toBeEnabled();
  await council.getByRole('button',{name:/Conclude the village story/}).click();
  await expect(council.getByText(/Hassan gives the first water turn back/)).toBeVisible();
  await expect(council.getByText(/fictional ending, not a field recommendation/)).toBeVisible();
  await expect(council.locator('#harvest-water')).toBeDisabled();
  await page.screenshot({path:'test-results/chapter4-council-final-desktop.png'});
  await council.getByRole('button',{name:'Rewrite the pact'}).click();
  await council.locator('#harvest-water').selectOption('1');
  await council.locator('#harvest-soil').selectOption('3');
  await council.getByRole('button',{name:/Conclude the village story/}).click();
  await expect(council.getByText(/Maryam places living cover/)).toBeVisible();
});

test('evidence-first finale makes an actual local JSON receipt with no invented measurements', async ({page}) => {
  await openFinale(page,'en',{
    ...baseOutcome,ending:'prepared_for_measurement',previousChapterEnding:'evidence_pause',
  });
  const council=page.locator('#chapter4-harvest-council');
  await council.getByRole('button',{name:/Conclude the village story/}).click();
  await expect(council.getByText(/does not call a story result a real harvest/)).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await council.getByRole('button',{name:/Download my fictional decisions/}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('soil-iq-fictional-village-decisions.json');
  const bytes=await readFile(await download.path(),'utf8');
  const receipt=JSON.parse(bytes);
  expect(receipt.dataClassification.game).toBe('SIMULATED');
  expect(receipt.dataClassification.nasaWeather).toBe('UNAVAILABLE');
  expect(receipt.result.realWorldRecommendation).toBe(false);
  expect(receipt.sourceReceipts).toHaveLength(0);
  expect(receipt.location).toBeUndefined();
  await page.keyboard.press('Escape');
  await expect(council).toBeHidden();
});

test('360px Arabic text-only finale is keyboard accessible without motion or horizontal overflow', async ({page}) => {
  await page.setViewportSize({width:360,height:760});
  await page.emulateMedia({reducedMotion:'reduce'});
  await openFinale(page,'ar');
  const council=page.locator('#chapter4-harvest-council');
  await expect(council).toHaveAttribute('dir','rtl');
  await expect(council.getByText('المستقبل مش حصاد واحد.')).toBeVisible();
  await council.locator('#harvest-livelihood').selectOption('3');
  await council.locator('#harvest-water').selectOption('1');
  await council.locator('#harvest-soil').selectOption('1');
  const properties=await council.evaluate(node=>({
    scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,
    animation:getComputedStyle(node.querySelector('.harvest-sun')).animationName,
    canvas:node.querySelectorAll('canvas').length,
    title:node.querySelector('#harvest-title').getBoundingClientRect().top,
  }));
  expect(properties.scrollWidth).toBeLessThanOrEqual(properties.clientWidth+1);
  expect(properties.animation).toBe('none');
  expect(properties.canvas).toBe(0);
  expect(properties.title).toBeGreaterThanOrEqual(0);
  await page.screenshot({path:'test-results/chapter4-council-arabic-mobile-360.png'});
  await council.getByRole('button',{name:/اختم قصة القرية/}).click();
  await expect(council.getByText('مجلس واحد. مفيش حل مثالي.')).toBeVisible();
});
