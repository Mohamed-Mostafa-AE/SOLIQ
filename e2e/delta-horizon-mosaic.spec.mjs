import { test, expect } from '@playwright/test';

test('the real playable Delta skyline shows fictional green fields and thin-instanced palms', async ({ page }) => {
  test.setTimeout(90_000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/experience/play/');
  await page.waitForFunction(()=>window.__seventhFieldGame?.isInitialized===true,null,{timeout:30_000});
  const world=await page.evaluate(()=>{
    const game=window.__seventhFieldGame,scene=game.renderSetup.scene;
    const fields=scene.meshes.filter(mesh=>/^scenicHorizonField\d+$/.test(mesh.name));
    const crowns=scene.getMeshByName('scenicHorizonPalmCrown');
    const trunks=scene.getMeshByName('scenicHorizonPalmTrunk');
    const clover=scene.getMeshByName('scenicHorizonSeedlingsClover');
    const cover=scene.getMeshByName('scenicHorizonSeedlingsCover');
    const cropPlots=game.village.fields.map(field=>({x:field.center.x,z:field.center.z,depth:field.depth}));
    return {
      fields:fields.length,
      backdropBehindNamedPlots:fields.every(field=>field.position.z-field.getBoundingInfo().boundingBox.extendSize.z>32),
      greens:fields.filter(field=>field.material?.name==='scenicHorizonClover'||field.material?.name==='scenicHorizonCover').length,
      thinPalms:trunks?.thinInstanceCount,
      thinCrowns:crowns?.thinInstanceCount,
      plants:(clover?.thinInstanceCount||0)+(cover?.thinInstanceCount||0),
      ignoresPhysics:fields.every(field=>!field.checkCollisions&&!field.isPickable),
      namedFields:cropPlots.length,
      gameState:game.isReady,
    };
  });
  expect(world.fields).toBe(12);
  expect(world.greens).toBeGreaterThanOrEqual(9);
  expect(world.backdropBehindNamedPlots).toBe(true);
  expect(world.thinPalms).toBeGreaterThanOrEqual(4);
  expect(world.thinCrowns).toBe(world.thinPalms*7);
  expect(world.plants).toBeGreaterThan(250);
  expect(world.ignoresPhysics).toBe(true);
  expect(world.namedFields).toBe(7);
  expect(world.gameState).toBe(false);

  await page.locator('#btn-start-game').click();
  await page.locator('#hook-skip').click();
  await page.waitForFunction(()=>window.__seventhFieldGame?.renderSetup.activeCameraName==='follow');
  await page.screenshot({path:'test-results/seventh-field-lush-green-horizon-desktop.png'});
  await page.setViewportSize({width:360,height:740});
  await page.screenshot({path:'test-results/seventh-field-lush-green-horizon-mobile.png'});
  expect(errors).toEqual([]);
});
