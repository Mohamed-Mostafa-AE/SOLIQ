import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createLocalServer, resolvePublicPath } from '../dev-server.mjs';

const entries = [
  ['../welcome/index.html', '../explore/', '/welcome/'],
  ['../index.html', '/explore/', '/'],
  ['../walkthrough/index.html', '../explore/', '/walkthrough/'],
  ['../experience/index.html', '../explore/', '/experience/'],
  ['../experience/play/index.html', '../../explore/', '/experience/play/'],
  ['../experience/play/story.html', '../../explore/', '/experience/play/story.html'],
  ['../pitch-3d/index.html', '../explore/', '/pitch-3d/'],
];

test('P0-06: each public project surface links back to the shared route map', async () => {
  for (const [file, href, base] of entries) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.ok(html.includes(`href="${href}"`), `${base} is missing a project-map link`);
    assert.equal(new URL(href, `https://soil-iq.example${base}`).pathname, '/explore/');
  }
});

test('P0-06: route map links only to actual served local project surfaces', async () => {
  const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const internal = hrefs.filter((href) => !href.startsWith('https://') && !href.startsWith('#'));
  assert.ok(internal.length >= 12, 'route map must cover the distinct project areas');
  for (const href of internal) {
    const url = new URL(href, 'https://soil-iq.example/explore/');
    assert.ok(resolvePublicPath(url.pathname), `broken public navigation path: ${href}`);
  }
  assert.ok(resolvePublicPath('/explore/'));
  assert.ok(resolvePublicPath('/explore/style.css'));
  assert.equal(resolvePublicPath('/explore/navigation.test.mjs'), null);
});

test('P0-06: route map distinguishes observed NASA context from assumptions and simulated outcomes', async () => {
  const html = await readFile(new URL('index.html', import.meta.url), 'utf8');
  for (const label of ['OBSERVED', 'ASSUMED', 'DERIVED', 'SIMULATED']) {
    assert.ok(html.includes(label), `missing explicit evidence class: ${label}`);
  }
  assert.match(html, /not verified field recommendations/i);
  assert.match(html, /Research view/);
  assert.match(html, /without WebGL/);
});

test('P0-06: local server returns the complete project route matrix without exposing test files', async () => {
  const server = createLocalServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/', '/welcome/', '/explore/', '/explore/style.css', '/walkthrough/', '/experience/', '/experience/play/', '/experience/play/story.html', '/pitch-3d/', '/outlook/', '/welcome/paper.html']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, `${path} must resolve in the local preview`);
      assert.ok((await response.arrayBuffer()).byteLength > 100, `${path} must have a real payload`);
    }
    assert.equal((await fetch(base + '/explore/navigation.test.mjs')).status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});


test('P0-06: modal story navigation remains accessible while the background is inert', async () => {
  const source = await readFile(new URL('../game/ui/story-desk.js', import.meta.url), 'utf8');
  assert.match(source, /id="story-project-link" href="\.\.\/\.\.\/explore\/"/);
  assert.match(source, /this\._set\('story-project-link', 'Explore all Soil-IQ project areas/);
});
