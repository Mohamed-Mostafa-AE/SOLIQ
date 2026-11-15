import {test,expect} from '@playwright/test';
test('researcher can discover authentic NASA CMR metadata without claiming pixels',async({page})=>{
 await page.route('**/api/eo-catalogue?**',async(route)=>{
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
   source:'NASA Earthdata Common Metadata Repository',count:1,totalHits:1,
   evidenceKind:'catalogue_metadata_only',rasterAvailable:false,
   entries:[{id:'G1-LPCLOUD',title:'HLS.L30.T36RUV.20261001.v2.0',start:'2026-10-01T10:00:00Z',end:'2026-10-01T10:00:00Z',collection:'C123-LPCLOUD',dataLink:'https://data.lpdaac.earthdatacloud.nasa.gov/protected/file.tif',pixelsProcessed:false,qa:'not_processed'}]
  })});
 });
 await page.goto('/experience/');
 await page.locator('[data-tab="cmr"]').click();
 await expect(page.locator('#cmr')).toBeVisible();
 await page.locator('#cmr-fetch').click();
 await expect(page.locator('#cmr-result')).toContainText('HLS.L30.T36RUV.20261001');
 await expect(page.locator('#cmr-result')).toContainText('البكسلات/QA غير معالجة');
 await expect(page.locator('#cmr-result a')).toHaveAttribute('rel','noopener noreferrer');
});
