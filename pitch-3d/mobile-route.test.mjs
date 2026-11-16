import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalServer } from '../dev-server.mjs';

test('pitch CSS linked by the HTML is served by the standard local allowlist', async () => {
  const server = createLocalServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(origin + '/pitch-3d/');
    assert.equal(page.status, 200);
    const html = await page.text();
    const stylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
      .map((match) => match[1]);
    assert.ok(stylesheets.length > 0);
    const contents = [];
    for (const href of stylesheets) {
      const response = await fetch(new URL(href, page.url));
      assert.equal(response.status, 200, `Missing pitch stylesheet: ${href}`);
      assert.match(response.headers.get('content-type'), /text\/css/);
      contents.push(await response.text());
    }
    assert.ok(contents.some((css) => css.includes('P0-08: At phone widths')),
      'Mobile reading CSS must be delivered by the standard preview server');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
