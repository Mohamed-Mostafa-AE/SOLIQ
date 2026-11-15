import {test,expect} from '@playwright/test';
import { readFileSync } from 'node:fs';
import { projectSeason, summarizeWeather, hindcast } from '../outlook-core.js';
import { DEFAULTS, demoWeather } from '../engine.js';
const history=Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,demoWeather(2016+i)]));
const current=demoWeather(2026).slice(0,200),projection=projectSeason(current,history,DEFAULTS);
const fixture={evidenceId:'test-fixture-not-observations',config:DEFAULTS,coverage:{start:'2026-01-01',through:current.at(-1).date,requestedThrough:current.at(-1).date,validDays:200,calendarDays:365},observed:summarizeWeather(current),samePeriodBaseline:{rainMedian:75},projection,hindcast:hindcast(history,'07-19'),sources:[{request:'https://power.larc.nasa.gov/',retrievedAt:'2026-07-22T00:00:00Z'}]};
async function mock(page){await page.route('https://**',route=>route.abort());await page.route('**/api/outlook?*',route=>route.fulfill({json:fixture}));}
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
 const downloadEvent=page.waitForEvent('download');
 await page.getByRole('button',{name:'↓ Export 2026 evidence',exact:true}).click();
 const download=await downloadEvent;expect(download.suggestedFilename()).toBe('soliq-2026-evidence.json');
 await expect(page.locator('.living-heading h2')).toBeVisible();
});
