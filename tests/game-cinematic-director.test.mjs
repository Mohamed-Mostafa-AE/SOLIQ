import test from 'node:test';
import assert from 'node:assert/strict';
import { CinematicDirector } from '../experience/play/cinematic-director.js';

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  add(other) { return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z); }
  copyFrom(other) { Object.assign(this, { x: other.x, y: other.y, z: other.z }); }
  static Lerp(a, b, t) { return new Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t); }
}

function fixture({ reducedMotion = false } = {}) {
  const previous = { BABYLON: globalThis.BABYLON, document: globalThis.document };
  const meshes = [];
  globalThis.BABYLON = {
    Vector3,
    Color3: class { static FromHexString(hex) { return hex; } },
    MeshBuilder: { CreateTorus() {
      const mesh = { position: new Vector3(), scaling: { set(x, y, z) { Object.assign(this, { x, y, z }); } },
        isVisible: false, dispose() {} };
      meshes.push(mesh);
      return mesh;
    } },
    StandardMaterial: class { dispose() {} },
  };
  globalThis.document = { body: { classList: { contains() { return false; } } } };
  const camera = { position: new Vector3(0, 0, 0), setTarget(point) { this.target = point; } };
  const renderSetup = { scene: {}, cameras: { dialogue: camera, follow: {} }, activeCameraName: 'follow',
    reducedMotion, setActiveCamera(name) { this.activeCameraName = name; } };
  const characters = { nada: { root: { position: new Vector3(-4, 0, 3) } },
    hassan: { root: { position: new Vector3(4.5, 0, 9.8) } },
    maryam: { root: { position: new Vector3(24.5, 0, 7.8) } } };
  const controller = { inputEnabled: true };
  const director = new CinematicDirector(renderSetup, characters, controller);
  return { director, renderSetup, camera, controller, meshes, cleanup() {
    globalThis.BABYLON = previous.BABYLON;
    globalThis.document = previous.document;
  } };
}

test('real scene camera previews distinct Hassan and Maryam positions then restores player input', () => {
  const x = fixture();
  try {
    x.director.preview('water');
    assert.equal(x.renderSetup.activeCameraName, 'dialogue');
    assert.equal(x.controller.inputEnabled, false);
    assert.equal(x.director.marker.isVisible, true);
    x.director.tick(0.2);
    const xWater = x.camera.position.x;
    x.director.preview('soil');
    for (let i = 0; i < 16; i++) x.director.tick(0.1);
    assert.ok(x.camera.position.x > xWater + 5, 'camera truly moves to the other NPC');
    x.director.choose('soil');
    x.director.exit();
    assert.equal(x.renderSetup.activeCameraName, 'follow');
    assert.equal(x.controller.inputEnabled, true);
    assert.equal(x.director.marker.isVisible, true, 'selected objective remains visible');
    x.director.dispose();
  } finally { x.cleanup(); }
});

test('reduced motion changes shots instantly and does not pulse witness marker', () => {
  const x = fixture({ reducedMotion: true });
  try {
    x.director.preview('soil');
    assert.deepEqual(x.camera.position, x.director._shotFor('soil').position);
    x.director.tick(0.4);
    assert.equal(x.director.marker.scaling.x, 1);
    x.director.preview('exit');
    assert.equal(x.controller.inputEnabled, true);
  } finally { x.cleanup(); }
});
