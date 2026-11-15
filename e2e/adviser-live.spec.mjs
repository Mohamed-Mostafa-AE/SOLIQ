import {test,expect} from '@playwright/test';
test('real open model inference plus real NASA evidence, English and Arabic',async({page})=>{
 test.setTimeout(240000);
 await page.goto('/adviser/');
 await page.locator('#run').click();
 await expect(page.locator('#status')).toHaveText('Complete: real model inference, cited guidance and NASA-backed evidence.',{timeout:180000});
 await expect(page.locator('#proof')).toContainText('384 dimensions');
 await expect(page.locator('#guidance article')).toHaveCount(3);
 await expect(page.locator('#report')).toContainText('NASA POWER weather');
 await expect(page.locator('#report')).toContainText('Evidence SHA-256:');
 await page.locator('#language').click();
 await page.locator('#run').click();
 await expect(page.locator('#status')).toContainText('اكتمل:',{timeout:90000});
 await expect(page.locator('#report')).toContainText('تقرير الأدلة');
 await page.screenshot({path:'test-results/adviser-real-inference.png',fullPage:true});
});
