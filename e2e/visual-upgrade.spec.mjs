import {test,expect} from '@playwright/test';
test('visual upgrade populates real 3D crop geometry while preserving playable actors',async({page})=>{
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.visualArtReport),{timeout:30000});
 const state=await page.evaluate(()=>{
  const g=window.__seventhFieldGame;
  const count=g.renderSetup.scene.meshes.filter(m=>m.name.startsWith('liveCrop_'));
  return {
   quality:g.renderSetup.quality,
   plantPlots:g.visualArtReport.plants.plots,
   plantCount:g.visualArtReport.plants.plants,
   meshes:count.length,
   thinInstances:count.reduce((n,m)=>n+(m.thinInstanceCount||0),0),
   actors:g.visualArtReport.characters.enhanced,
   actorDetailReason:g.visualArtReport.characters.reason,
   hasNada:!!g.characters?.nada,
   hasHassan:!!g.characters?.hassan,
   hasMaryam:!!g.characters?.maryam,
  };
 });
 expect(state.plantPlots).toBe(6);
 expect(['low','balanced','ultra']).toContain(state.quality);
 expect(state.meshes).toBe(12);
 // Two real thin-instanced crossed planes per plant, even on low-end devices.
 expect(state.thinInstances).toBe(state.plantCount*2);
 if(state.quality==='low'){
  expect(state.plantCount).toBeGreaterThanOrEqual(250);
  expect(state.thinInstances).toBeGreaterThanOrEqual(500);
 }else{
  expect(state.plantCount).toBeGreaterThan(600);
  expect(state.thinInstances).toBeGreaterThan(1000);
 }
 expect(state.hasNada&&state.hasHassan&&state.hasMaryam).toBe(true);
 // The low preset preserves base actor rigs and gameplay, while omitting
 // decorative PBR face/clothing meshes on software / low-end renderers.
 if(state.quality==='low'){
  expect(state.actors).toBe(0);
  expect(state.actorDetailReason).toBe('low performance preset');
 }else expect(state.actors).toBe(3);
});
