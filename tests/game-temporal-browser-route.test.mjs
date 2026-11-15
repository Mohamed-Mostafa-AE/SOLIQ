import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicPath } from '../dev-server.mjs';

test('browser can load the exact temporal solver module required by Babylon game', () => {
  const resolved = resolvePublicPath('/science/mesqa-window.js');
  assert.ok(resolved && resolved.endsWith('/science/mesqa-window.js'), 'module must be in local browser allowlist');
});

test('browser scientific allowlist still rejects unrelated private science files', () => {
  assert.equal(resolvePublicPath('/science/private-secret.json'), null);
  assert.equal(resolvePublicPath('/.env'), null);
});
