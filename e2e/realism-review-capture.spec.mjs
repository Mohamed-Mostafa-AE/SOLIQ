import {test,expect} from '@playwright/test';
test('capture human-scale visual QA at current branch: physical village and Time Echo',async({page},testInfo)=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.isInitialized),null,{timeout:30000});
 const openingComposition=await page.evaluate(()=>{
   const g=window.__seventhFieldGame;
   const nada=g.characters.nada.root.position;
   return {x:nada.x,z:nada.z,fieldCount:g.village.fields.length,activeCamera:g.renderSetup.scene.activeCamera?.name};
 });
 expect(openingComposition.x).toBeGreaterThan(-10);
 expect(openingComposition.x).toBeLessThan(0);
 expect(openingComposition.z).toBeGreaterThan(0);
 expect(openingComposition.fieldCount).toBe(7);
 expect(openingComposition.activeCamera).toBe('followCam');
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
