import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LINKS, slides} from './content.js';

test('the live pitch links judges to the actual game, not a static video or concept art', () => {
  assert.equal(LINKS.game, 'https://soliq-delta.vercel.app/experience/play/');
  const interactive = slides.find(slide => slide.kind === 'ai');
  assert.ok(interactive);
  assert.match(interactive.items[0][1], /Operate three animated canal gates/);
  assert.match(interactive.items[0][1], /six visible fields/);
  assert.match(interactive.notes, /120 cubic metres per turn/);
  assert.match(interactive.notes, /fictional/);
  assert.match(interactive.notes, /never be presented as observed farm results/);
  assert.match(slides.at(-1).lead, /dated NASA demo/);
});

test('both presentation modes expose a direct playable canal link', async () => {
  const app = await readFile(new URL('./app.js', import.meta.url), 'utf8');
  assert.match(app, /Play the canal challenge/);
  assert.match(app, /Play canal challenge/);
  assert.match(app, /s\.kind==='ai'\?LINKS\.game/);
  assert.match(app, /PLAY CANAL DEMO/);
  assert.match(app, /href="\.\.\/experience\/play\/"/);
});
