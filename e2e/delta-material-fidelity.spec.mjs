import {test,expect} from '@playwright/test';

test('illustrative soil and crop materials have detail textures, not plain featureless color blocks',async({page})=>{
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('/experience/play/');
 await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.isInitialized),null,{timeout:30000});
 const result=await page.evaluate(()=>{
  const g=window.__seventhFieldGame,mat=g.village.fields[0].material;
  const wheat=g.renderSetup.scene.getMaterialByName('deltaPlantMat_wheat');
  return {surface:g.visualArtReport.realisticSurfaces,
    soilTex:!!mat.albedoTexture,soilTexReady:mat.albedoTexture?.isReady(),
    cropTex:!!wheat?.albedoTexture,cropTexReady:wheat?.albedoTexture?.isReady(),
    cropAlpha:!!wheat?.useAlphaFromAlbedoTexture,
    quality:g.renderSetup.quality,plantCount:g.visualArtReport.plants.plants,
    actors:g.visualArtReport.characters.enhanced,
    actorDetailReason:g.visualArtReport.characters.reason,
    playableActorsPresent:!!(g.characters?.nada&&g.characters?.hassan&&g.characters?.maryam),
    cameraRadius:g.renderSetup.cameras.follow.radius};
 });
 expect(result.surface.textures).toBe(4);
 expect(result.surface.kind).toBe('original_procedural_illustrative_art');
 expect(result.soilTex).toBe(true);
 expect(result.soilTexReady).toBe(true);
 expect(result.cropTex).toBe(true);
 expect(result.cropTexReady).toBe(true);
 expect(result.cropAlpha).toBe(true);
 // Low-end/software WebGL uses deliberately reduced vegetation density while
 // preserving all six crop plots and textured botanical meshes.
 expect(['low','balanced','ultra']).toContain(result.quality);
 if(result.quality==='low')expect(result.plantCount).toBeGreaterThanOrEqual(250);
 else expect(result.plantCount).toBeGreaterThan(600);
 // Decorative sculpted details are intentionally omitted in low preset,
 // but all three base playable actor nodes must still exist and remain usable.
 expect(result.playableActorsPresent).toBe(true);
 if(result.quality==='low'){
  expect(result.actors).toBe(0);
  expect(result.actorDetailReason).toBe('low performance preset');
 }else expect(result.actors).toBe(3);
 expect(result.cameraRadius).toBeLessThan(10);
 expect(pageErrors).toEqual([]);
});
