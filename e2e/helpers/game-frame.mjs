/** Assert the actual Babylon projection, not a magic camera-radius number. */
export async function readGameFrame(page) {
  return page.evaluate(() => {
    const game = window.__seventhFieldGame;
    const scene = game.renderSetup.scene;
    const camera = game.renderSetup.cameras.follow;
    const engine = game.renderSetup.engine;
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();
    const viewport = camera.viewport.toGlobal(width, height);
    const project = world => {
      const point = BABYLON.Vector3.Project(world, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), viewport);
      return { x: point.x / width, y: point.y / height, z: point.z };
    };
    const actor = project(game.characters.nada.root.position.add(new BABYLON.Vector3(0, 1.5, 0)));
    const canal = project(new BABYLON.Vector3(-4, .35, 9.5));
    return { actor, canal,
      targetAhead: camera.target.z - game.characters.nada.root.position.z,
      alpha: camera.alpha, beta: camera.beta,
    };
  });
}

export function assertUsefulGameFrame(expect, frame) {
  // Both the playable heroine and the shared resource should remain in the
  // viewport after the prologue, not an arbitrary 3D origin or bare terrain.
  for (const point of [frame.actor, frame.canal]) {
    expect(point.x).toBeGreaterThan(0.02);
    expect(point.x).toBeLessThan(0.98);
    expect(point.y).toBeGreaterThan(0.02);
    expect(point.y).toBeLessThan(0.98);
    expect(point.z).toBeGreaterThan(0);
    expect(point.z).toBeLessThan(1);
  }
  expect(frame.canal.y).toBeLessThan(frame.actor.y);
  expect(frame.targetAhead).toBeGreaterThan(3);
  expect(frame.beta).toBeGreaterThan(0.7);
  expect(frame.beta).toBeLessThan(1.3);
}
