import {test,expect} from '@playwright/test';
test('researcher can request NASA GIBS satellite picture and see visual-only honesty status',async({page})=>{
 await page.route('**/api/eo-browse?**',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   imageUrl:'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap',
   label:'Terra MODIS · corrected reflectance true-color',
   date:'2026-11-01',footprint:'0.5° × 0.5° regional browse scene',
   scientificUse:'visual_context_only'
  })});
 });
 await page.route('https://gibs.earthdata.nasa.gov/**',async route=>{
  // Transparent 1x1 PNG response represents browser download only. 
  // Test does not assert real NASA image or scientific pixels.
  await route.fulfill({status:200,contentType:'image/png',
   body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAJtaeeIAAAAASUVORK5CYII=','base64')});
 });
 await page.goto('/experience/');
 await page.locator('[data-tab="cmr"]').click();
 await page.locator('#gibs-fetch').click();
 const region=page.locator('#gibs-result');
 await expect(region.locator('img')).toBeVisible();
 await expect(region).toContainText('NASA GIBS');
 await expect(region).toContainText('NO HLS pixel QA / NDVI / SAR');
});
