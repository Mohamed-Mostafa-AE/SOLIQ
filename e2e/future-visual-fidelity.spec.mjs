import {test,expect} from '@playwright/test';
test('Earth Lens future preserves natural soil, water and plants instead of fake cyan field blocks',async({page})=>{
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.isInitialized),null,{timeout:30000});
 const initial=await page.evaluate(()=>{
  const g=window.__seventhFieldGame;
  return {colors:g.village.fields.slice(0,6).map(f=>f.material.albedoColor.asArray()),
    roughness:g.village.fields.slice(0,6).map(f=>f.material.roughness),
    radius:g.renderSetup.cameras.follow.radius,beta:g.renderSetup.cameras.follow.beta};
 });
 expect(initial.radius).toBeLessThan(10);
 expect(initial.beta).toBeGreaterThan(1);
 const modes=await page.evaluate(()=>{
   const g=window.__seventhFieldGame;
   return ['future','nasa','ground'].map(mode=>{
     g.earthLens.setMode(mode);
     return {mode,colors:g.village.fields.slice(0,6).map(f=>f.material.albedoColor.asArray()),
       roughness:g.village.fields.slice(0,6).map(f=>f.material.roughness),
       guides:g.earthLens.futureGuides.filter(f=>f.isEnabled()).length};
   });
 });
 expect(modes[0].guides).toBe(6);
 expect(modes[1].guides).toBe(0);
 expect(modes[2].guides).toBe(0);
 for(const mode of modes){
  expect(mode.colors).toEqual(initial.colors);
  expect(mode.roughness).toEqual(initial.roughness);
 }
});
