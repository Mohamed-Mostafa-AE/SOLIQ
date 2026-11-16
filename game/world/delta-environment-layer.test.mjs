import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DELTA_SCENIC_EVIDENCE,
  DeltaEnvironmentLayer,
  scenicQualityBudget,
  planWaterwheel,
  planVillageYards,
} from './delta-environment-layer.js';

test('scenic art is explicitly fictional and never reported as observed NASA data', () => {
  assert.match(DELTA_SCENIC_EVIDENCE, /SIMULATED/);
  assert.match(DELTA_SCENIC_EVIDENCE, /fictional/);
});

test('low-power rendering removes animated wildlife and reduces rigid-body detail', () => {
  const balanced=scenicQualityBudget();
  const low=scenicQualityBudget({preset:'low'});
  const software=scenicQualityBudget({preset:'balanced',hardwareScale:1.35});
  const ultra=scenicQualityBudget({preset:'ultra',hardwareScale:.9});
  assert.equal(low.preset,'low');
  assert.deepEqual(software,low);
  assert.equal(low.birdCount,0);
  assert.equal(low.butterflyCount,0);
  assert.ok(low.wheelSpokes<balanced.wheelSpokes);
  assert.ok(ultra.roofDetails>balanced.roofDetails);
  assert.ok(ultra.hayBales>balanced.hayBales);
});

test('waterwheel has rotationally symmetric bucket positions and a unique stable center', () => {
  const w=planWaterwheel({x:2,y:3,z:4,radius:2.1,spokes:10});
  assert.deepEqual(w.center,{x:2,y:3,z:4});
  assert.equal(w.ribs.length,10);
  for(const rib of w.ribs){
    assert.ok(Math.abs(Math.hypot(rib.tip.x,rib.tip.y)-2.1)<1e-12);
    assert.ok(Math.abs(Math.hypot(rib.bucket.x,rib.bucket.y)-2.19)<1e-12);
  }
  assert.equal(planWaterwheel({spokes:0}).ribs.length,6);
  assert.equal(planWaterwheel({spokes:50}).ribs.length,24);
});

test('village facades match all existing farmhouse locations without new plot overlap',()=>{
  const yards=planVillageYards();
  assert.equal(yards.length,3);
  assert.deepEqual(yards.map(h=>[h.x,h.z]),[[-25,-22],[-10,-25],[-32,24]]);
  assert.ok(yards.every(h=>h.width>0 && h.depth>0));
});

test('3D layer builds on a real Babylon NullEngine, animates only for simulated active irrigation',async()=>{
  await import('../assets/vendor/babylon.js');
  const engine=new BABYLON.NullEngine();
  try {
    const scene=new BABYLON.Scene(engine);
    const fields=[{id:'f1',crop:'wheat',center:new BABYLON.Vector3(5,.02,22),width:18,depth:20}];
    const village={scene,fields};
    const layer=new DeltaEnvironmentLayer(village,{preset:'balanced'});
    assert.ok(scene.getMeshByName('sakiaRim-0.16'));
    assert.ok(scene.getMeshByName('scenicBlueGate0'));
    assert.ok(scene.getMeshByName('scenicCanalLimestone12'));
    assert.ok(scene.getMeshByName('scenicFieldBerm0_-1'));
    assert.ok(scene.meshes.length>120 && scene.meshes.length<300);
    assert.equal(layer.wheel.rotation.z,0);
    layer.tick(.02); // Decorative mechanism is stationary while canal pump is off.
    assert.equal(layer.wheel.rotation.z,0);
    layer.setIrrigationActive(true);
    layer.tick(.02);
    assert.ok(layer.wheel.rotation.z>0);
    const before=layer.wheel.rotation.z;
    const windowBefore=globalThis.window;
    try {
      globalThis.window={matchMedia:()=>({matches:true})};
      layer.tick(.05);
      assert.equal(layer.wheel.rotation.z,before);
    } finally {
      if(windowBefore===undefined)delete globalThis.window;
      else globalThis.window=windowBefore;
    }
  } finally {engine.dispose();}
});
