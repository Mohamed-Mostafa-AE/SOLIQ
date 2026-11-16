import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const registry = JSON.parse(readFileSync(new URL('./asset-reference-registry.json', import.meta.url), 'utf8'));

test('reference candidates are unique, attributed and not falsely described as installed', () => {
  assert.equal(registry.schemaVersion, 1);
  assert.ok(registry.items.length >= 8);
  const ids = new Set();
  for (const item of registry.items) {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(!ids.has(item.id), `duplicate asset id ${item.id}`);
    ids.add(item.id);
    assert.ok(item.creator?.trim(), `missing author for ${item.id}`);
    assert.ok(item.purpose?.trim(), `missing use case for ${item.id}`);
    assert.match(item.url, /^https:\/\//, `invalid source for ${item.id}`);
    assert.ok(item.expectedLicense?.trim(), `missing license assessment for ${item.id}`);
    assert.ok(['reference-only', 'research-needs-rights-review', 'integrated'].includes(item.status));
    if (item.status !== 'integrated') {
      assert.equal(item.localPath, null, `unreviewed ${item.id} must not claim to ship`);
      assert.equal(item.sha256, null);
      assert.equal(item.redistributionReviewed, false);
    }
    if (item.kind === 'film-study') {
      assert.equal(item.status, 'reference-only', 'film images/actors cannot be silently shipped');
      assert.equal(item.localPath, null);
    }
  }
});

test('any future integrated asset must have a local, audited artifact and redistribution clearance', () => {
  const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
  for (const item of registry.items.filter(({ status }) => status === 'integrated')) {
    assert.equal(item.redistributionReviewed, true, `${item.id} rights gate`);
    assert.match(item.sha256 || '', /^[a-f0-9]{64}$/, `${item.id} actual file digest`);
    assert.ok(item.licenseUrl?.startsWith('https://'), `${item.id} license link`);
    assert.match(item.localPath || '', /^game\/assets\/([a-z0-9_-]+\/)*[a-z0-9_.-]+$/i);
    const filePath = resolve(root, item.localPath);
    assert.ok(filePath.startsWith(root + sep), `${item.id} path traversal`);
    assert.ok(existsSync(filePath), `${item.id} audited file missing`);
    assert.equal(createHash('sha256').update(readFileSync(filePath)).digest('hex'), item.sha256,
      `${item.id} expected a real content checksum`);
  }
});
