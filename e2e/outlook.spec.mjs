import {test,expect} from '@playwright/test';
import { readOptions } from '../lib/outlook-service.js';
import { contextStrategies, rotationDecisionCards, conditionalOrder } from '../rotation-context.js';
import { projectSeason, summarizeWeather, hindcast } from '../outlook-core.js';
import { DEFAULTS, demoWeather } from '../engine.js';
const history=Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,demoWeather(2016+i)]));
const current=demoWeather(2026).slice(0,200),projection=projectSeason(current,history,DEFAULTS);
const fixture={evidenceId:'test-fixture-not-observations',config:DEFAULTS,coverage:{start:'2026-01-01',through:current.at(-1).date,requestedThrough:current.at(-1).date,validDays:200,calendarDays:365},observed:summarizeWeather(current),samePeriodBaseline:{rainMedian:75},projection,hindcast:hindcast(history,'07-19'),sources:[{request:'https://power.larc.nasa.gov/',retrievedAt:'2026-07-22T00:00:00Z'}]};
async function mock(page){
 await page.route('https://**',route=>route.abort());
 await page.route('**/api/outlook?*',route=>{
  try{
   const config=readOptions(Object.fromEntries(new URL(route.request().url()).searchParams));
   const projection=projectSeason(current,history,config,contextStrategies(config.context));
   const decisionCards=rotationDecisionCards(current,projection,config.context);
   return route.fulfill({json:{...fixture,config,projection,decisionCards,conditionalComparison:{eligibleOrder:conditionalOrder(decisionCards,projection,config.context.priority)}}});
  }catch(error){return route.fulfill({status:400,json:{error:error.message}});}
 });
}

test('living farm shows cutoff and changes provenance while scrubbing without changing evidence',async({page})=>{
 await mock(page);await page.goto('/welcome/');
 await expect(page.locator('[data-date]')).toHaveText('2026-07-19');
 await expect(page.locator('.living-rows i')).toHaveCount(24);
 await expect(page.locator('[data-crop-name]')).toBeVisible();
 await page.locator('[data-day]').fill('340');await expect(page.locator('[data-provenance]')).toContainText('Historical weather');
 await page.locator('[data-rotation="1"]').click();await expect(page.locator('[data-rotation="1"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.living-provenance')).toContainText('2026-07-19');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Arabic outlook and unavailable AI remain clear without fake provider results',async({page})=>{
 await mock(page);await page.route('**/api/explain',route=>route.fulfill({status:503,json:{error:'AI account needs activation'}}));
 await page.goto('/outlook/');await page.locator('#lang').click();
 await expect(page.locator('html')).toHaveAttribute('dir','rtl');
 await expect(page.locator('.living-heading h2')).toContainText('الموسم');
 await page.locator('[data-ai="kimi"]').click();await expect(page.locator('.living-ai-output')).toContainText('AI account needs activation');
 await expect(page.locator('[data-ai="kimi"]')).toBeEnabled();
});
test('API failure stays visible and does not display invented 2026 metrics',async({page})=>{
 await page.route('**/api/outlook?*',route=>route.fulfill({status:502,json:{error:'NASA unavailable'}}));
 await page.goto('/outlook/');await expect(page.locator('.living-status')).toContainText('NASA unavailable');
 await expect(page.locator('.living-metrics')).toHaveCount(0);
});

test('fresh workspace opens 2026 and header export downloads its evidence',async({page})=>{
 await mock(page);await page.goto('/');
 await expect(page.locator('.living-heading h2')).toContainText('Watch the choices');
 await expect(page.locator('[data-download]')).toBeVisible();
 const downloadEvent=page.waitForEvent('download');
 await page.getByRole('button',{name:'↓ Export 2026 evidence',exact:true}).click();
 const download=await downloadEvent;expect(download.suggestedFilename()).toBe('soliq-2026-evidence.json');
 await expect(page.locator('.living-heading h2')).toBeVisible();
});

test('actual calendars, soil evidence and feasibility declarations drive the 2026 comparison',async({page})=>{
 await mock(page);await page.goto('/outlook/');await page.locator('.farm-context summary').click();
 await page.locator('[name=baselineConfirmed]').check();
 await page.locator('[name=soilOrigin]').selectOption('measured');
 await page.locator('[name=soilSource]').fill('Independent lab sample A');
 await page.locator('[name=soilDate]').fill('2026-01-05');
 await page.locator('[name=soilDepth]').fill('100');await page.locator('[name=soilFC]').fill('30');await page.locator('[name=soilWP]').fill('15');
 await page.locator('[name=domain]').selectOption('non_flooded');
 for(let i=0;i<3;i++)for(const key of ['seed','equipment','market','local'])await page.locator(`[name="check${i}.${key}"]`).selectOption(i===1&&key==='market'?'no':'yes');
 await page.getByRole('button',{name:'Load 2026 evidence ↗',exact:true}).click();
 await expect(page.locator('[data-decision-card=R1] [data-feasibility]')).toHaveAttribute('data-feasibility','excluded');
 await expect(page.locator('[data-decision-card=R0] [data-feasibility]')).toHaveAttribute('data-feasibility','conditional');
 await page.locator('[name="calendar0.0"]').selectOption('fallow');
 await expect(page.locator('[name=baselineConfirmed]')).not.toBeChecked();await expect(page.locator('[name="check0.market"]')).toHaveValue('unknown');
 await page.setViewportSize({width:360,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('geolocation denial leaves a correctable point and requires explicit confirmation',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success,failure){failure({code:1});}}}));
 await mock(page);await page.goto('/outlook/');await page.locator('[data-select-location]').click();
 await page.getByRole('button',{name:'Locate my device ⌖',exact:true}).click();
 await expect(page.locator('[data-location-message]')).toContainText('Location denied');
 await page.locator('[name=mapLat]').fill('30.5806');await page.locator('[name=mapLon]').fill('31.4333');
 await expect(page.locator('.living-form [name=lat]')).toHaveValue('30.05');
 await page.locator('[data-confirm]').click();await expect(page.locator('dialog')).toHaveCount(0);
 await expect(page.locator('.living-form [name=lat]')).toHaveValue('30.5806');
});
