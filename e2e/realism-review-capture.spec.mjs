import {test,expect} from '@playwright/test';
test('capture human-scale visual QA at current branch: physical village and Time Echo',async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.isInitialized),null,{timeout:30000});
 await page.evaluate(()=>window.__seventhFieldGame.start());
 await expect(page.locator('#hud-objective-title')).toBeVisible();
 await page.waitForTimeout(550);
 await testInfo.attach('real-playable-village-human-view',
   {body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
 await page.evaluate(()=>window.__seventhFieldGame.earthLens.setMode('future'));
 await page.waitForTimeout(250);
 await testInfo.attach('future-visual-only-scenario-lines-no-blue-plots',
   {body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
});
