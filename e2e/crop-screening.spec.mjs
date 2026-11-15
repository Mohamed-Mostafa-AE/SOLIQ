import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { demoWeather } from '../engine.js';

test.beforeEach(async({page})=>{
  // Tests are deterministic and never depend on stock imagery, fonts or live NASA availability.
  await page.route('https://**/*',route=>route.abort());
});

test('guided calendar explains the actual planned crop change',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/#overview');
  await expect(page.getByRole('heading',{name:'Plan your next crop.',exact:true})).toBeVisible();
  await page.locator('[data-month="5"]').click();
  await expect(page.locator('.baseline-plan h3')).toHaveText('Maize');
  await expect(page.locator('.alternative-plan h3')).toHaveText('Grain legume');
  await expect(page.locator('.change-caption')).toContainText('Different crop this month');
  expect(errors).toEqual([]);
  await page.screenshot({path:info.outputPath('guided-calendar.png'),fullPage:true});
});

test('Arabic crop analyzer has RTL controls and a bounded mobile layout',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="analyzer"]').click();
  await page.locator('#language-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('lang','ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.getByRole('heading',{name:'ابحث عن خيارات محاصيل لحقلِك.',exact:true})).toBeVisible();
  await expect(page.locator('.crop-candidate h2').filter({hasText:'فول صويا'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath('arabic-crop-analyzer.png'),fullPage:true});
});

test('an explicit market restriction removes a crop from modeled comparisons',async({page})=>{
  await page.goto('/');
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="analyzer"]').click();
  await page.locator('[name="maize.market"]').selectOption('no');
  await page.getByRole('button',{name:/Analyze crop options/}).click();
  const maize=page.locator('.crop-candidate').filter({has:page.getByRole('heading',{name:'Grain maize',exact:true})});
  await expect(maize).toContainText('Excluded');
  await expect(maize).not.toContainText('Annual unmet modeled ET');
  await expect(page.locator('.candidate-bars')).not.toContainText('Grain maize');
});

test('user-declared evidence enables a conditional list without claiming a best crop',async({page})=>{
  await page.goto('/');
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="evidence"]').click();
  const weather=demoWeather(2024);
  const csv='date,tmin,tmax,rain\n'+weather.map(row=>[row.date,row.tmin,row.tmax,row.rain].join(',')).join('\n');
  await page.locator('#weather-file').setInputFiles({name:'synthetic-test-fixture.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await expect(page.locator('#source-pill')).toHaveText('Imported weather');
  await page.locator('nav [data-view="analyzer"]').click();
  await page.locator('[name="soilConfirmed"]').check();
  for(const crop of ['spring_wheat','barley','maize','sorghum','soybean','sunflower']){
    for(const field of ['seed','equipment','market','local'])await page.locator(`[name="${crop}.${field}"]`).selectOption('yes');
  }
  await page.getByRole('button',{name:/Analyze crop options/}).click();
  await expect(page.locator('.shortlist-chips>span')).toHaveCount(6);
  await expect(page.locator('.screening-answer')).toContainText('not an overall');
});

test('unsupported processes block all candidate simulations',async({page})=>{
  await page.goto('/');
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="analyzer"]').click();
  await page.locator('[name="unsupportedProcesses"]').check();
  await page.getByRole('button',{name:/Analyze crop options/}).click();
  await expect(page.locator('.crop-candidate .crop-result-number')).toHaveCount(0);
  await expect(page.locator('.excluded-candidate')).toHaveCount(6);
});

test('language and audience changes preserve the exported scientific results',async({page})=>{
  await page.goto('/');
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="analyzer"]').click();
  async function exportReport(){
    const wait=page.waitForEvent('download');await page.locator('#export-crop-analysis').click();
    const file=await wait;return JSON.parse(await readFile(await file.path(),'utf8'));
  }
  const before=await exportReport();
  await page.locator('#language-toggle').click();
  await page.locator('#guided-mode').click();
  await expect(page.locator('#workspace-nav [data-view="analyzer"]')).toBeHidden();
  await expect(page.getByRole('heading',{name:'Plan what to grow next.',exact:true})).toBeVisible();
  await page.locator('#research-mode').click();
  await page.locator('#workspace-nav [data-view="analyzer"]').click();
  const after=await exportReport();
  expect(after.analysis).toEqual(before.analysis);
  expect(after.weatherSHA256).toEqual(before.weatherSHA256);
});


test('Guided and Research views have distinct navigation and landing pages',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Plan what to grow next.',exact:true})).toBeVisible();
 await expect(page.locator('#workspace-nav [data-view="rotations"]')).toBeVisible();
 await expect(page.locator('#workspace-nav [data-view="evidence"]')).toBeHidden();
 await expect(page.locator('#audience-banner-label')).toContainText('FARMERS & CLIENTS');
 await page.locator('#research-mode').click();
 await expect(page.getByRole('heading',{name:'Research dashboard',exact:true})).toBeVisible();
 await expect(page.locator('#workspace-nav [data-view="evidence"]')).toBeVisible();
 await expect(page.locator('#workspace-nav [data-view="analyzer"]')).toBeVisible();
 await expect(page.locator('.research-results-panel')).toContainText('Seasonal water-balance comparison');
 await expect(page.locator('#audience-banner-label')).toContainText('MSc & PhD');
 await page.locator('#guided-mode').click();
 await expect(page.getByRole('heading',{name:'Plan what to grow next.',exact:true})).toBeVisible();
 await expect(page.locator('#workspace-nav [data-view="evidence"]')).toBeHidden();
});
