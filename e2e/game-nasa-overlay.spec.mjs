import {test,expect} from '@playwright/test';
test('Earth Lens NASA button opens real-source GIBS browse overlay without misrepresenting game pixels',async({page})=>{
 await page.route('**/api/eo-browse?**',async route=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   imageUrl:'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap',
   date:'2026-11-01',footprint:'0.5° × 0.5° regional browse scene',
   scientificUse:'visual_context_only'
  })});
 });
 await page.route('https://gibs.earthdata.nasa.gov/**',async route=>{
  await route.fulfill({status:200,contentType:'image/png',
   body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAJtaeeIAAAAASUVORK5CYII=','base64')});
 });
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>!!window.__seventhFieldGame?.isInitialized,{timeout:30000});
 await page.locator('#btn-start-game').click();
 // The playable prologue is an intentional modal; enter free-roam before
 // exercising Earth Lens, rather than clicking controls behind a dialogue.
 await expect(page.locator('#opening-hook')).toBeVisible();
 await page.locator('#hook-skip').click();
 await expect(page.locator('#opening-hook')).toBeHidden();
 await page.locator('#btn-earth-lens').click();
 await expect(page.locator('#earth-lens-bar')).toHaveClass(/visible/);
 await page.locator('[data-lens="nasa"]').click();
 const panel=page.locator('#nasa-gibs-browse-overlay');
 await expect(panel).toBeVisible();
 await expect(panel).toHaveAttribute('lang','en');
 await expect(panel).toContainText('Regional RGB imagery');
 await expect(panel).toContainText('Image date');
 await expect(panel).toContainText('NASA GIBS');
 await expect(panel).toContainText('No HLS reflectance');
 await expect(panel.locator('img')).toHaveAttribute('src',/gibs\.earthdata\.nasa\.gov/);
 await panel.locator('[data-nasa-close]').click();
 await expect(panel).toBeHidden();
 await page.locator('#btn-settings').click();
 await page.locator('#select-lang').selectOption('ar');
 await expect(page.locator('#select-quality')).not.toContainText(/30fps|60fps/);
 // Switching document direction moves the modal while WebGL is rendering;
 // verify that the visible Close button remains keyboard-operable as well.
 await page.locator('#btn-close-settings').focus();
 await page.locator('#btn-close-settings').press('Enter');
 await expect(page.locator('#settings-modal')).toBeHidden();
 await page.locator('[data-lens="nasa"]').click();
 await expect(panel).toBeVisible();
 await expect(panel).toHaveAttribute('lang','ar');
 await expect(panel).toContainText('تاريخ الصورة');
});
