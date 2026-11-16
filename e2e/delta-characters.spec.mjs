import { test, expect } from '@playwright/test';

test('original Egyptian Delta actors keep low-cost silhouettes and reduced-motion poses', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experience/play/');
  await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, { timeout: 30000 });
  const state = await page.evaluate(() => {
    const game = window.__seventhFieldGame;
    const characters = game.characters;
    const scene = game.renderSetup.scene;
    const expected = ['hassanGalabeyaHem', 'maryamDressHem', 'maryamScarfTail', 'nadaJacketHem'];
    const meshes = expected.map(name => scene.getMeshByName(name));
    characters.setActorState('nada', 'run');
    characters.updateAnimations(0.04);
    return {
      labels: [characters.nada.nameEn, characters.hassan.nameEn, characters.maryam.nameEn],
      found: meshes.map(m => Boolean(m)),
      lowCost: meshes.every(m => m && m.getTotalVertices() <= 140),
      motionOff: characters.reducedMotion,
      legAngle: characters.nada.bones.leftThigh.rotation.x,
      headAngle: characters.hassan.bones.head.rotation.x,
      meshesAreProcedural: meshes.every(m => m && m.sourceMesh === undefined),
    };
  });
  expect(state.labels).toEqual(['Nada', 'Uncle Hassan', 'Maryam']);
  expect(state.found).toEqual([true, true, true, true]);
  expect(state.lowCost).toBe(true);
  expect(state.motionOff).toBe(true);
  expect(state.legAngle).toBe(0);
  expect(state.headAngle).toBe(0);
  expect(state.meshesAreProcedural).toBe(true);
  await page.screenshot({ path: 'test-results/original-delta-actors-reduced-motion.png' });
});
