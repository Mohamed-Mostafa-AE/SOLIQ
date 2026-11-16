import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveDioramaState,DIORAMA_STATES} from './delta-diorama.js';
import {resolvePublicPath} from '../dev-server.mjs';

const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('refinement.css',import.meta.url),'utf8');
const js=readFileSync(new URL('delta-diorama.js',import.meta.url),'utf8');

test('P1-11: three story decisions visibly change *illustrative* canal and cover',()=>{
  assert.notEqual(DIORAMA_STATES.water.water,DIORAMA_STATES.soil.water);
  assert.notEqual(DIORAMA_STATES.soil.cover,DIORAMA_STATES.water.cover);
  assert.notEqual(DIORAMA_STATES.evidence.soil,DIORAMA_STATES.water.soil);
  assert.match(DIORAMA_STATES.evidence.label,/Missing field evidence/);
  assert.strictEqual(resolveDioramaState('__proto__'),DIORAMA_STATES.water);
  assert.strictEqual(resolveDioramaState('water'),DIORAMA_STATES.water);
});

test('P1-11: actual WebGL scene is included in served Welcome and honors a CSS fallback',()=>{
  assert.match(html,/id="delta-diorama-canvas"/);
  assert.match(html,/3D DELTA DIORAMA/);
  assert.match(html,/ARTISTIC SIMULATION · NOT SATELLITE IMAGERY/);
  assert.match(js,/new THREE\.WebGLRenderer/);
  assert.match(js,/new THREE\.InstancedMesh/);
  assert.match(js,/new THREE\.FogExp2/);
  assert.match(js,/host\.dataset\.dioramaFallback = 'true'/);
  assert.match(js,/MutationObserver\(applyMode\)/);
  assert.match(js,/IntersectionObserver/);
  assert.match(js,/window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(css,/data-diorama-ready="true"/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.ok(resolvePublicPath('/welcome/delta-diorama.js'));
});

test('P1-11: scientific tool remains the primary CTA and no observed field claims appear in visuals',()=>{
  assert.match(html,/class="decision-primary" href="\.\.\/walkthrough\/"/);
  assert.match(html,/class="decision-secondary" href="\.\.\/experience\/play\/"/);
  assert.match(html,/Illustrative story preview, not an Earth observation/);
  assert.doesNotMatch(js,/NASA_API_KEY|farmOwnership|satelliteMeasurement/);
});
