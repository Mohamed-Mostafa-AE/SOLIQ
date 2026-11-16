import { test, expect } from '@playwright/test';

/**
 * Independent visual-delivery gate: a GLB on disk or a procedural concept
 * screenshot does not prove that the actual Babylon runtime loaded the models.
 * These assertions exercise the original 3D assets in the running game.
 */
test.describe('The Seventh Field: original 3D art delivery', () => {
  test('Nada, Hassan and Maryam load original skinned GLBs with live motion clips', async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/experience/play/');
    await page.waitForFunction(() => window.__seventhFieldGame?.isInitialized === true, null,
      { timeout: 30_000 });

    const art = await page.evaluate(async () => {
      const game = window.__seventhFieldGame;
      const load = await game.characters.visualLoadPromise;
      const actors = [game.characters.nada, game.characters.hassan, game.characters.maryam];
      return {
        load,
        actors: actors.map(actor => ({
          id: actor.id,
          visualMode: actor.visualMode,
          license: actor.visualLicense,
          clips: [...(actor.motionClips?.keys() ?? [])],
        })),
        skinnedSceneSkeletons: game.renderSetup.scene.skeletons.length,
      };
    });

    expect(art.load.fallback, 'No procedural character fallback should appear in desktop cinematic proof').toEqual([]);
    expect([...art.load.loaded].sort()).toEqual(['hassan', 'maryam', 'nada']);
    expect(art.skinnedSceneSkeletons).toBeGreaterThanOrEqual(3);
    for (const actor of art.actors) {
      expect(actor.visualMode, `${actor.id} is an actual imported skinned model`).toBe('skinned-glb');
      expect(actor.license, `${actor.id} has asset authorship recorded`).toMatch(/original/i);
      expect(actor.clips.sort()).toEqual(['idle', 'interact', 'run', 'talk', 'walk']);
    }

    await page.evaluate(() => window.__seventhFieldGame.start());
    await expect(page.locator('#game-loader')).toBeHidden();
    await expect(page.locator('#renderCanvas')).toBeVisible();
    await info.attach('actual-imported-skinned-actors-desktop', {
      body: await page.screenshot({ animations: 'disabled', timeout: 30_000 }),
      contentType: 'image/png',
    });

    // A close-up is essential: the default playable camera is good for
    // navigation, but a tiny silhouette cannot prove human facial/garment art.
    await page.evaluate(() => {
      const g = window.__seventhFieldGame;
      const cam = g.renderSetup.cameras.follow;
      cam.setTarget(g.characters.nada.root.position.add(new BABYLON.Vector3(0, 1.2, 0)));
      cam.radius = 3.3;
      cam.alpha = 2.35;
      cam.beta = 1.17;
    });
    await info.attach('actual-imported-nada-human-closeup', {
      body: await page.screenshot({ animations: 'disabled', timeout: 30_000 }),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 360, height: 780 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      .toBe(true);
    await info.attach('actual-imported-skinned-actors-mobile-360', {
      body: await page.screenshot({ animations: 'disabled', timeout: 30_000 }),
      contentType: 'image/png',
    });
  });
});
