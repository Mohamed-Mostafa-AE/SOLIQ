import {test,expect} from '@playwright/test';
test('visual upgrade populates real 3D crop geometry while preserving playable actors',async({page})=>{
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.visualArtReport),{timeout:30000});
 const state=await page.evaluate(()=>{
  const g=window.__seventhFieldGame;
  const count=g.renderSetup.scene.meshes.filter(m=>m.name.startsWith('liveCrop_'));
  return {
   plantPlots:g.visualArtReport.plants.plots,
   plantCount:g.visualArtReport.plants.plants,
   meshes:count.length,
   thinInstances:count.reduce((n,m)=>n+(m.thinInstanceCount||0),0),
   actors:g.visualArtReport.characters.enhanced,
   hasNada:!!g.characters?.nada,
   hasHassan:!!g.characters?.hassan,
   hasMaryam:!!g.characters?.maryam,
  };
 });
 expect(state.plantPlots).toBe(6);
 expect(state.plantCount).toBeGreaterThan(600);
 expect(state.meshes).toBe(12);
 expect(state.thinInstances).toBeGreaterThan(1000);
 expect(state.actors).toBe(3);
 expect(state.hasNada&&state.hasHassan&&state.hasMaryam).toBe(true);
});
