import {test,expect} from '@playwright/test';
import {demoWeather} from '../engine.js';

function nasaFixture(){
 const parameter={T2M_MIN:{},T2M_MAX:{},PRECTOTCORR:{}};
 for(const row of demoWeather(2024)){
  const day=row.date.replaceAll('-','');
  parameter.T2M_MIN[day]=row.tmin;
  parameter.T2M_MAX[day]=row.tmax;
  parameter.PRECTOTCORR[day]=row.rain;
 }
 return {header:{time_standard:'UTC'},parameters:{T2M_MIN:{units:'C'},T2M_MAX:{units:'C'},PRECTOTCORR:{units:'mm/day'}},properties:{parameter}};
}

test('auto NASA prototype launches from Welcome with no manual numbers or saved sessions',async({page})=>{
 const requests=[];
 await page.route('**/api/trends?**',route=>{requests.push(route.request().url());return route.fulfill({json:nasaFixture()});});
 await page.goto('/welcome/');
 await page.getByRole('link',{name:/Try live NASA demo/}).click();
 await expect(page).toHaveURL(/walkthrough\/\?demo=1/);
 await expect(page.locator('#demo-status')).toContainText('366 verified daily records');
 await expect(page.locator('#results')).toContainText('comparison_only');
 await expect(page.locator('#auto-summary .demo-metric')).toHaveCount(4);
 await expect(page.locator('#consent')).not.toBeChecked();
 await expect(page.locator('#advanced')).not.toHaveAttribute('open');
 expect(requests).toHaveLength(1);
 expect(requests[0]).toContain('mode=power-year');
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});

test('auto demo priority controls recalculate without another weather request',async({page})=>{
 let count=0;
 await page.route('**/api/trends?**',route=>{count++;return route.fulfill({json:nasaFixture()});});
 await page.goto('/walkthrough/?demo=1');
 await expect(page.locator('#auto-summary .demo-metric')).toHaveCount(4);
 await page.getByRole('button',{name:'Water first'}).click();
 await expect(page.getByRole('button',{name:'Water first'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#priority-state')).toContainText('Preference scores only');
 await page.getByRole('button',{name:'Crop cover first'}).click();
 await expect(page.getByRole('button',{name:'Crop cover first'})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#results')).toContainText('comparison_only');
 expect(count).toBe(1);
});

test('auto demo honestly refuses outputs when NASA is unavailable at mobile width',async({page})=>{
 await page.setViewportSize({width:360,height:800});
 await page.route('**/api/trends?**',route=>route.fulfill({status:503,body:'unavailable'}));
 await page.goto('/walkthrough/?demo=1');
 await expect(page.locator('#demo-status')).toContainText('DATA UNAVAILABLE');
 await expect(page.locator('#results')).toBeHidden();
 await expect(page.locator('#auto-summary')).toBeHidden();
 await expect(page.locator('#export')).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
