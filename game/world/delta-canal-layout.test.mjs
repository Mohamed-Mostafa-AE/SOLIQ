import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planVisibleCanalBanks } from './delta-canal-layout.js';

const river = [
  { x: -15, y: -0.6, z: 10 },
  { x: 5, y: -0.6, z: 9 },
  { x: 25, y: -0.6, z: 7 },
];

test('readable canal banks form a stable surface-level channel without changing solver flows', () => {
  const sections = planVisibleCanalBanks(river);
  assert.deepEqual(Object.keys(sections), ['nearBank', 'channelBed', 'farBank']);
  for (const group of Object.values(sections)) {
    assert.equal(group.length, 3);
    assert.ok(group.every(section => section.length === river.length));
  }
  for (let i = 0; i < river.length; i++) {
    const near = sections.nearBank.map(p => p[i]);
    const bed = sections.channelBed.map(p => p[i]);
    const far = sections.farBank.map(p => p[i]);
    assert.ok(near[0].z < near[1].z && near[1].z < near[2].z);
    assert.ok(bed[0].z < bed[1].z && bed[1].z < bed[2].z);
    assert.ok(far[0].z < far[1].z && far[1].z < far[2].z);
    assert.ok(near[1].y > bed[1].y);
    assert.ok(far[1].y > bed[1].y);
    assert.equal(bed[1].x, river[i].x);
    assert.equal(bed[1].z, river[i].z);
  }
  assert.deepEqual(river[0], { x: -15, y: -0.6, z: 10 }, 'layout must not mutate the source canal');
});

test('canal art rejects invalid geometry rather than building an invisible/misleading mesh', () => {
  assert.throws(() => planVisibleCanalBanks([]), /two or more/);
  assert.throws(() => planVisibleCanalBanks([{ x: 0, y: 0, z: 0 }]), /two or more/);
  assert.throws(() => planVisibleCanalBanks([{ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: NaN }]), /finite/);
});
