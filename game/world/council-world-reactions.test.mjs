import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCouncilWorldMarkers, COUNCIL_MARKER_IDS, CouncilWorldReactions } from './council-world-reactions.js';

test('an unopened or replayed council turn leaves every 3D story marker hidden', () => {
  const empty = deriveCouncilWorldMarkers(null);
  assert.deepEqual(empty.map(x => [x.id, x.count, x.visible]), [
    ['share_turn', 0, false], ['protect_cover', 0, false], ['ask_for_records', 0, false],
  ]);
  assert.equal(empty[0].evidenceClass, 'SIMULATED');
  assert.deepEqual(COUNCIL_MARKER_IDS, ['share_turn','protect_cover','ask_for_records']);
  assert.deepEqual(deriveCouncilWorldMarkers({phase:'turns',choices:[]}), empty);
});

test('successive player choices produce distinct and reversible scene markers', () => {
  const first = deriveCouncilWorldMarkers({phase:'turns',choices:['share_turn']});
  assert.deepEqual(first.map(x => x.count), [1,0,0]);
  const second = deriveCouncilWorldMarkers({phase:'turns',choices:['share_turn','protect_cover']});
  assert.deepEqual(second.map(x => x.count), [1,1,0]);
  const third = deriveCouncilWorldMarkers({phase:'result',choices:['share_turn','protect_cover','share_turn']});
  assert.deepEqual(third.map(x => x.count), [2,1,0]);
  assert.equal(third[0].intensity > first[0].intensity,true);
  assert.deepEqual(deriveCouncilWorldMarkers({phase:'turns',choices:[]}).map(x => x.count),[0,0,0]);
});

test('no unverified measurements, extra turns or invented action IDs enter the scene contract', () => {
  for (const invalid of [
    {phase:'planning',choices:[]},
    {phase:'turns',choices:['unverified_irrigation']},
    {phase:'turns',choices:['share_turn','share_turn','share_turn','share_turn']},
    {phase:'turns',choices:'share_turn'},
  ]) assert.throws(() => deriveCouncilWorldMarkers(invalid), /Invalid Chapter 5/);
  const markers=deriveCouncilWorldMarkers({phase:'result',choices:['ask_for_records','ask_for_records','protect_cover']});
  assert.equal(markers[2].count,2);
  assert.equal(markers[2].isFieldMeasurement,false);
  assert.equal(markers[2].observedWaterVolume,null);
});

test('real Babylon NullEngine builds and reverses visible world meshes without a browser', async () => {
  await import('../assets/vendor/babylon.js');
  const engine=new BABYLON.NullEngine();
  const scene=new BABYLON.Scene(engine);
  const visuals=new CouncilWorldReactions(scene,{reducedMotion:true});
  try {
    assert.equal(scene.meshes.filter(mesh=>mesh.name.startsWith('chapter5Story')).length,12);
    assert.deepEqual(Object.values(visuals.markers).map(x=>x.root.isEnabled()),[false,false,false]);
    visuals.apply({phase:'turns',choices:['share_turn']});
    assert.deepEqual(Object.values(visuals.markers).map(x=>x.root.isEnabled()),[true,false,false]);
    const firstSize=visuals.markers.share_turn.beacon.scaling.x;
    visuals.apply({phase:'turns',choices:['share_turn','share_turn']});
    assert.ok(visuals.markers.share_turn.beacon.scaling.x>firstSize);
    visuals.tick(1);
    assert.equal(visuals.markers.share_turn.halo.rotation.y,0,'reduced motion freezes marker animation');
    visuals.apply(null);
    assert.deepEqual(Object.values(visuals.markers).map(x=>x.root.isEnabled()),[false,false,false]);
  } finally {visuals.dispose();scene.dispose();engine.dispose();}
});
