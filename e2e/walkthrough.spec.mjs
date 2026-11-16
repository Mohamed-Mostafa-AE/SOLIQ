import {test,expect} from '@playwright/test';import {readFile} from 'node:fs/promises';
import {demoWeather} from '../engine.js';
test('live NASA POWER walkthrough and evidence screenshot',async({page})=>{
 test.skip(process.env.P005_LIVE!=='1','Explicit live network acceptance, never replaced by fixtures');test.setTimeout(90000);
 await page.goto('/walkthrough/');await page.locator('#consent').check();await page.locator('#load').click();
 await expect(page.locator('#source')).toContainText('366 valid days',{timeout:45000});await page.locator('#compare').click();
 await expect(page.locator('#results')).toContainText('comparison_only');
 await page.screenshot({path:'artifacts/p005-live-desktop.png',fullPage:true});
 const pending=page.waitForEvent('download');await page.locator('#export').click();const download=await pending;await download.saveAs('artifacts/p005-live-browser-export.json');
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:'artifacts/p005-live-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
function payload(){const parameter={T2M_MIN:{},T2M_MAX:{},PRECTOTCORR:{}};for(const r of demoWeather(2024)){const d=r.date.replaceAll('-','');parameter.T2M_MIN[d]=r.tmin;parameter.T2M_MAX[d]=r.tmax;parameter.PRECTOTCORR[d]=r.rain;}return {header:{time_standard:'UTC'},parameters:{T2M_MIN:{units:'C'},T2M_MAX:{units:'C'},PRECTOTCORR:{units:'mm/day'}},properties:{parameter}};}
test('fixture-backed walkthrough validates consent, compares, exports and invalidates changed inputs',async({page})=>{
 await page.route('**/api/trends?**',r=>r.fulfill({json:payload()}));
 await page.goto('/walkthrough/');await expect(page.locator('#compare')).toBeDisabled();
 await page.locator('#load').click();await expect(page.getByRole('alert')).toContainText('Confirm');
 await page.locator('#consent').check();await page.locator('#load').click();await expect(page.locator('#source')).toContainText('366 valid days');
 await page.getByLabel('Option 2 Jun').selectOption('sorghum');await page.locator('#compare').click();
 await expect(page.locator('#results')).toContainText('not a confidence interval');
 const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;const data=JSON.parse(await readFile(await d.path(),'utf8'));
 expect(data.assumptions.plans[1].crops[5]).toBe('sorghum');expect(data.evidence.rawSha256).toMatch(/^[a-f0-9]{64}$/);expect(data.outputs.kind).toBe('SIMULATED');expect(data.sensitivity.scenarios).toHaveLength(3);
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/p005-fixture-mobile.png',fullPage:true});
 await page.getByLabel('Soil-water capacity').fill('180');await expect(page.locator('#export')).toBeDisabled();
 await page.getByLabel('Latitude',{exact:true}).fill('30');await expect(page.locator('#compare')).toBeDisabled();await expect(page.locator('#source')).toContainText('retrieve again');
});
test('API error and offline never produce a comparison',async({page,context})=>{
 await page.route('**/api/trends?**',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.goto('/walkthrough/');await page.locator('#consent').check();await page.locator('#load').click();
 await expect(page.locator('#source')).toContainText('UNAVAILABLE');await expect(page.locator('#error')).toContainText('503');await expect(page.locator('#export')).toBeDisabled();
 await page.screenshot({path:'artifacts/p005-api-error.png',fullPage:true});
 await page.unroute('**/api/trends?**');await context.setOffline(true);await page.locator('#load').click();await expect(page.locator('#error')).not.toBeEmpty();await expect(page.locator('#compare')).toBeDisabled();
});

