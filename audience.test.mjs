import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessView, resolveViewForAudience, viewsForAudience } from './audience.js';

test('Guided mode exposes only the farmer workflow', () => {
  assert.deepEqual(viewsForAudience('guided').sort(), ['overview', 'rotations', 'settings']);
  assert.equal(canAccessView('guided', 'overview'), true);
  assert.equal(canAccessView('guided', 'rotations'), true);
  assert.equal(canAccessView('guided', 'settings'), true);
  for (const view of ['outlook', 'analyzer', 'evidence', 'research']) {
    assert.equal(canAccessView('guided', view), false);
    assert.equal(resolveViewForAudience('guided', view), 'overview');
  }
});

test('Research mode exposes graduate-level methods and analysis modules', () => {
  for (const view of ['overview', 'outlook', 'analyzer', 'rotations', 'evidence', 'research', 'settings']) {
    assert.equal(canAccessView('research', view), true);
    assert.equal(resolveViewForAudience('research', view), view);
  }
  assert.equal(canAccessView('research', 'unknown-view'), false);
  assert.equal(resolveViewForAudience('research', 'unknown-view'), 'overview');
});
