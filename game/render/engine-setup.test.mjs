import test from 'node:test';
import assert from 'node:assert/strict';
import { isSoftwareWebGLRenderer } from './engine-setup.js';

test('software renderer detection uses reported WebGL vendor/renderer, not user agent', () => {
  assert.equal(isSoftwareWebGLRenderer({ renderer: 'WebGL 2.0 (SwiftShader Device)' }), true);
  assert.equal(isSoftwareWebGLRenderer({ unmaskedRenderer: 'llvmpipe (LLVM 17.0.2)' }), true);
  assert.equal(isSoftwareWebGLRenderer({ vendor: 'Mesa Offscreen' }), true);
  assert.equal(isSoftwareWebGLRenderer({ renderer: 'NVIDIA GeForce RTX 3060' }), false);
  assert.equal(isSoftwareWebGLRenderer({ renderer: 'Apple M3 GPU' }), false);
  assert.equal(isSoftwareWebGLRenderer({}), false);
});
