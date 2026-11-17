import test from 'node:test';
import assert from 'node:assert/strict';
import {WaterPracticeActivity} from './water-practice.js';

test('Babylon NullEngine proves can pickup, carried tool, fictional droplets and replay cleanup', async () => {
  await import('../assets/vendor/babylon.js');
  const originalDocument = globalThis.document;
  class Element {
    constructor() { this.children = []; this.hidden = false; this.dataset = {}; this.textContent = ''; }
    append(...nodes) { this.children.push(...nodes); }
    appendChild(node) { this.children.push(node); }
    setAttribute() {}
    addEventListener() {}
    focus() {}
  }
  globalThis.document = {createElement: () => new Element()};
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  const nada = {root: new BABYLON.TransformNode('practiceNadaRoot', scene)};
  const messages = [];
  let refreshes = 0;
  try {
    const quest = new WaterPracticeActivity({
      scene, host: new Element(), nada, hud: {lang: 'en', showTelemetryToast: (...args) => messages.push(args)},
      onProgress: () => { refreshes += 1; }, reducedMotion: true,
    });
    assert.equal(quest.getInteractables()[0].id, 'practice_can');
    assert.equal(quest.droplets.length, 7);
    assert.equal(quest.panel.hidden, true);
    assert.equal(quest.handleInteraction(quest.targets.practice_bed), false);
    assert.equal(quest.handleInteraction(quest.targets.practice_can), true);
    assert.equal(quest.can.parent, nada.root);
    assert.equal(quest.getInteractables()[0].id, 'practice_bed');
    assert.equal(quest.handleInteraction(quest.targets.practice_bed), true);
    assert.equal(quest.panel.dataset.stage, 'decision');
    assert.equal(quest.choose('illustrate_watering'), true);
    assert.equal(quest.droplets.filter(drop => drop.isEnabled()).length, 7);
    assert.equal(quest.marker.isEnabled(), false);
    const y = quest.droplets[0].position.y;
    quest.tick(1);
    assert.equal(quest.droplets[0].position.y, y, 'reduced motion freezes animation');
    assert.equal(messages.at(-1)[2], 'simulated');
    quest.setLanguage('ar');
    assert.equal(quest.panel.dir, 'rtl');
    quest.reset();
    assert.equal(quest.can.parent, null);
    assert.equal(quest.droplets.every(drop => !drop.isEnabled()), true);
    assert.equal(quest.getInteractables()[0].id, 'practice_can');
    assert.equal(refreshes, 4);
  } finally {
    globalThis.document = originalDocument;
    scene.dispose(); engine.dispose();
  }
});
