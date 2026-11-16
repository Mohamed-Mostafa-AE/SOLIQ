import test from 'node:test';
import assert from 'node:assert/strict';
import { CharacterSystem } from './characters.js';

function withBabylonStub(run) {
  const old = globalThis.BABYLON;
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
    set(x, y, z) { Object.assign(this, { x, y, z }); }
  }
  class TransformNode {
    constructor(name, scene) {
      this.name = name;
      this.position = new Vector3();
      this.rotation = new Vector3();
      this.scaling = new Vector3(1, 1, 1);
      scene.nodes.push(this);
    }
  }
  class Material { constructor(name) { this.name = name; } }
  class Mesh extends TransformNode { setEnabled(enabled) { this.enabled = enabled; } }
  globalThis.BABYLON = {
    Vector3,
    TransformNode,
    PBRMaterial: Material,
    Color3: Vector3,
    MeshBuilder: Object.fromEntries(['CreateSphere', 'CreateBox', 'CreateCylinder'].map(name => [
      name, (id, _options, scene) => new Mesh(id, scene),
    ])),
  };
  try {
    const scene = { nodes: [], getMeshByName(id) { return this.nodes.find(n => n.name === id); } };
    return run(new CharacterSystem(scene, null), scene);
  } finally {
    globalThis.BABYLON = old;
  }
}

test('three original procedural Delta actors have distinct low-cost garment silhouettes', () => {
  withBabylonStub((actors, scene) => {
    assert.equal(scene.getMeshByName('hassanGalabeyaHem').parent, scene.getMeshByName('hassan_hipsMesh'));
    assert.equal(scene.getMeshByName('maryamDressHem').parent, scene.getMeshByName('maryam_hipsMesh'));
    assert.equal(scene.getMeshByName('maryamScarfTail').parent, actors.maryam.bones.head);
    assert.equal(scene.getMeshByName('nadaJacketHem').parent, scene.getMeshByName('nada_chestMesh'));
    assert.equal(actors.nada.nameEn, 'Nada');
    assert.equal(actors.hassan.nameEn, 'Uncle Hassan');
    assert.equal(actors.maryam.nameEn, 'Maryam');
  });
});

test('locomotion stops without leaving hip bob or interaction pose stuck', () => {
  withBabylonStub(actors => {
    actors.setActorState('nada', 'run');
    actors.updateAnimations(0.03);
    assert.notEqual(actors.nada.bones.leftThigh.rotation.x, 0);
    assert.ok(actors.nada.bones.hips.position.y > 1.68 * 0.54);
    actors.setActorState('nada', 'interact');
    actors.updateAnimations(0.03);
    assert.notEqual(actors.nada.bones.rightForearm.rotation.x, 0);
    actors.setActorState('nada', 'idle');
    actors.updateAnimations(0.03);
    assert.equal(actors.nada.bones.hips.position.y, 1.68 * 0.54);
    assert.equal(actors.nada.bones.rightForearm.rotation.x, 0);
    assert.equal(actors.nada.bones.leftThigh.rotation.x, 0);
    assert.equal(actors.nada.bones.spine.rotation.x, 0);
  });
});

test('reduced-motion mode preserves readable static poses and unknown IDs do not mutate NPCs', () => {
  withBabylonStub(actors => {
    actors.setReducedMotion(true);
    actors.setActorState('nada', 'run');
    actors.setActorState('hassan', 'talk');
    actors.updateAnimations(0.03);
    assert.equal(actors.nada.bones.leftThigh.rotation.x, 0);
    assert.equal(actors.hassan.bones.leftArm.rotation.x, 0);
    assert.equal(actors.nada.bones.chest.rotation.x, 0);
    assert.equal(actors.nada.bones.hips.position.y, 1.68 * 0.54);
    const before = actors.maryam.state;
    actors.setActorState('unknown', 'run');
    assert.equal(actors.maryam.state, before);
  });
});
