import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

const councilResult={
  chapter:4,ending:'difficult_balance',mandate:'evidence_first',
  pledges:{water:2,soil:2,livelihood:1},previousPlanId:'B',
  evidenceClass:'SIMULATED',realWorldRecommendation:false,observedWeather:null,
  missingEvidence:['dated_nasa_weather','local_infiltration_test'],
};

test('three interactive canal turns lead to a distinct local-only, evidence-bound ending',async({page})=>{
  await page.goto('/experience/play/story.html');
  await page.evaluate(async(result)=>{
    const {attachChapter5Game,attachChapter6Game}=await import('/game/ui/chapter5-6-board.js');
    window.__chapter5=attachChapter5Game({host:document.body,chapter4:{phase:'result',result},
      onStateChange:mission=>{
        if(mission.phase==='result'&&!window.__chapter6){
          window.__chapter6=attachChapter6Game({host:document.body,chapter5:mission});
        }
      }});
    window.__chapter5.open();
  },councilResult);
  const board=page.locator('#chapter5-canal-turns');
  await expect(board.getByText('The canal remembers every turn.')).toBeVisible();
  await expect(board.locator('[data-choice]')).toHaveCount(3);
  await board.locator('[data-choice="share_turn"]').click();
  await expect(board.getByText('CANAL TURN 2 / 3')).toBeVisible();
  await board.locator('[data-choice="share_turn"]').click();
  await board.locator('[data-choice="ask_for_records"]').click();
  await expect(board.getByText(/Farida is heard more often/)).toBeVisible();
  await expect(board.getByText(/OBSERVED NASA WEATHER: UNAVAILABLE/)).toBeVisible();
  await page.screenshot({path:'test-results/chapter5-canal-three-turns-desktop.png'});
  await board.locator('[data-action="close"]').click();
  await page.evaluate(()=>window.__chapter6.open());
  const future=page.locator('#chapter6-open-future');
  await expect(future.locator('.sf-recorded li')).toHaveCount(3);
  await future.locator('[data-choice="seek_evidence"]').click();
  await expect(future.getByText(/story ends with a question, not a claim/)).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await future.locator('[data-action="download"]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('soil-iq-fictional-six-chapter-story.json');
  const receipt=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(receipt.result.chapter).toBe(6);
  expect(receipt.result.ending).toBe('measure_before_action');
  expect(receipt.result.canalChoices).toEqual(['share_turn','share_turn','ask_for_records']);
  expect(receipt.dataClassification.nasaWeather).toBe('UNAVAILABLE');
  expect(receipt.sourceReceipts).toEqual([]);
  expect(receipt.location).toBeUndefined();
  await page.screenshot({path:'test-results/chapter6-open-future-desktop.png'});
  await future.locator('[data-action="replay"]').click();
  await future.locator('[data-choice="pause_and_listen"]').click();
  await expect(future.getByText(/council pauses to invite unheard neighbours/)).toBeVisible();
});

test('360px Arabic text-only canal game is readable, reduced-motion and keyboard closable',async({page})=>{
  await page.setViewportSize({width:360,height:760});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/experience/play/story.html');
  await page.evaluate(async(result)=>{
    const {attachChapter5Game}=await import('/game/ui/chapter5-6-board.js');
    window.__chapter5=attachChapter5Game({host:document.body,language:'ar',chapter4:{phase:'result',result}});
    window.__chapter5.open();
  },councilResult);
  const board=page.locator('#chapter5-canal-turns');
  await expect(board).toHaveAttribute('dir','rtl');
  await expect(board.getByText('المسقة بتفتكر كل نوبة.')).toBeVisible();
  await board.locator('[data-choice="protect_cover"]').click();
  await board.locator('[data-choice="protect_cover"]').click();
  await board.locator('[data-choice="ask_for_records"]').click();
  await expect(board.getByText(/مريم بتشوف غطاء تربة افتراضي أكتر/)).toBeVisible();
  const metrics=await board.evaluate(node=>({scroll:node.scrollWidth,client:node.clientWidth,
    motion:getComputedStyle(node.querySelector('.sf-action')||node.querySelector('.sf-primary')).transitionDuration,
    canvas:node.querySelectorAll('canvas').length}));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.client+1);
  expect(metrics.motion).toBe('0s');
  expect(metrics.canvas).toBe(0);
  await page.screenshot({path:'test-results/chapter5-canal-arabic-mobile-360.png'});
  await page.keyboard.press('Escape');
  await expect(board).toBeHidden();
});

test('real text-first Chapter 0–6 journey unlocks sequentially and replay clears descendants',async({page})=>{
  test.setTimeout(120_000);
  await page.goto('/experience/play/story.html');
  for(const [target,choice] of [
    ['hassan','hassan_inspect_soil_first'],['maryam','maryam_soil_cover_pact'],
    ['timeEcho','f7_hypothesis_cover'],['pumpStation','council_cover_buffered'],
  ]){
    await page.locator(`[data-story-target="${target}"]`).click();
    await page.locator(`[data-choice-id="${choice}"]`).click();
  }
  await page.locator('#story-desk-close').click();
  await expect(page.locator('#chapter5-launch')).toBeHidden();
  await page.locator('#chapter1-launch').click();
  await page.locator('#chapter1-commit').click();
  await page.locator('#ch1-close').click();
  await page.locator('#chapter2-launch').click();
  for(const [card,classification] of [['power','UNAVAILABLE'],['soil','ASSUMED'],['trial','SIMULATED']]){
    await page.locator(`[data-card="${card}"]`).selectOption(classification);
    await page.locator(`[data-check="${card}"]`).click();
  }
  await page.locator('[data-decision="defer"]').click();
  await page.locator('.evidence-close').click();
  await page.locator('#chapter3-launch').click();
  await page.locator('#soil-tail').selectOption('bare_fallow');
  await page.locator('.soil-commit').click();
  await page.locator('.soil-lab-close').click();
  await page.locator('#chapter4-launch').click();
  await page.locator('#chapter4-harvest-council [data-action="commit"]').click();
  await page.locator('#chapter4-harvest-council .harvest-close').click();
  await expect(page.locator('#chapter5-launch')).toBeVisible();
  await expect(page.locator('#chapter6-launch')).toBeHidden();
  await page.locator('#chapter5-launch').click();
  for(const choice of ['ask_for_records','share_turn','protect_cover'])await page.locator(`#chapter5-canal-turns [data-choice="${choice}"]`).click();
  await page.locator('#chapter5-canal-turns [data-action="close"]').click();
  await expect(page.locator('#chapter6-launch')).toBeVisible();
  await page.locator('#chapter6-launch').click();
  await page.locator('#chapter6-open-future [data-choice="seek_evidence"]').click();
  const result=await page.evaluate(()=>{
    const c=window.__soilIqTextGame.chapterSequence;
    return [c.chapter4.mission.phase,c.chapter5.mission.phase,c.chapter6.mission.phase,
      c.chapter6.mission.result.evidenceClass,c.chapter6.mission.result.realWorldRecommendation];
  });
  expect(result).toEqual(['result','result','result','SIMULATED',false]);
  await page.locator('#chapter6-open-future [data-action="close"]').click();
  await page.locator('#chapter4-launch').click();
  await page.locator('#chapter4-harvest-council [data-action="replay"]').click();
  await expect(page.locator('#chapter5-launch')).toBeHidden();
  await expect(page.locator('#chapter6-launch')).toBeHidden();
  await expect(page.locator('#chapter5-canal-turns')).toHaveCount(0);
  await expect(page.locator('#chapter6-open-future')).toHaveCount(0);
});
