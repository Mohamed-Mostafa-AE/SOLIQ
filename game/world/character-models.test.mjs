import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ids = ['nada', 'hassan', 'maryam'];
const motions = ['Idle', 'Walk', 'Run', 'Talk', 'Interact'];

function readGlb(id) {
  const bytes = readFileSync(new URL(`../assets/models/${id}.glb`, import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'glTF', 'valid GLB magic');
  assert.equal(bytes.readUInt32LE(4), 2, 'GLB version 2');
  assert.equal(bytes.readUInt32LE(8), bytes.byteLength, 'complete container');
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8'));
  return { bytes, json };
}

test('three shipped human GLBs are real skinned assets with all consequential gameplay animations', () => {
  for (const id of ids) {
    const { bytes, json } = readGlb(id);
    assert.ok(bytes.byteLength < 800_000, `${id} fits 800KB per-asset budget`);
    assert.ok(json.skins?.length >= 1, `${id} has an actual glTF skinned rig`);
    assert.ok(json.skins.some(skin => skin.joints.length >= 15), `${id} has articulated body bones`);
    const names = new Set(json.animations?.map(animation => animation.name));
    for (const motion of motions) {
      assert.ok(names.has(motion), `${id} contains ${motion} body animation`);
    }
    assert.ok(json.meshes?.length > 20, `${id} has actual modeled face/garment details`);
    const tris = json.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, prim) => {
      return n + (json.accessors[prim.indices]?.count ?? 0) / 3;
    }, 0), 0);
    assert.ok(tris < 13_000, `${id} <=13k static triangle budget`);
    assert.ok(json.nodes.some(node => /sculpted head|Head/i.test(node.name)), `${id} exports facial head`);
  }
});

test('original GLBs are embedded and make no runtime third-party network requests for textures', () => {
  for (const id of ids) {
    const { json } = readGlb(id);
    for (const buffer of json.buffers ?? []) {
      assert.equal(buffer.uri, undefined, `${id} uses embedded buffer`);
    }
    for (const image of json.images ?? []) {
      assert.equal(image.uri, undefined, `${id} uses embedded images`);
    }
  }
});
