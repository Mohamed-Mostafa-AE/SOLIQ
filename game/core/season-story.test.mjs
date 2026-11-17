import test from 'node:test';
import assert from 'node:assert/strict';
import { getSeasonStoryBeat } from './season-story.js';

test('story never treats a fictional crop rotation as observed data', () => {
  const intro = getSeasonStoryBeat();
  assert.equal(intro.stage, 'arrival');
  assert.equal(intro.sourceType, 'simulated');
  assert.match(intro.textEn, /two conflicting crop calendars/i);
  assert.ok(!/best crop|guaranteed yield/i.test(intro.textEn));
  const one = getSeasonStoryBeat({ talkedToMaryam: true });
  assert.equal(one.stage, 'investigation');
  const council = getSeasonStoryBeat({ talkedToHassan: true, talkedToMaryam: true });
  assert.equal(council.stage, 'council');
  const mystery = getSeasonStoryBeat({ questionedFuture: true });
  assert.equal(mystery.stage, 'mystery');
  const outcome = getSeasonStoryBeat({}, 'equilibrium');
  assert.equal(outcome.stage, 'decision-recorded');
  assert.match(outcome.textEn, /NASA weather context/);
  assert.equal(outcome.sourceType, 'simulated');
  assert.equal(getSeasonStoryBeat({}, 'deferral').stage, 'decision-recorded');
});

test('opening clue changes the first narrative thread without declaring a winner', () => {
  const water = getSeasonStoryBeat({ firstClue: 'water' });
  const soil = getSeasonStoryBeat({ firstClue: 'soil' });
  assert.equal(water.stage, 'thread');
  assert.equal(soil.stage, 'thread');
  assert.match(water.titleEn, /water/i);
  assert.match(soil.titleEn, /soil/i);
  assert.equal(water.sourceType, 'simulated');
  assert.equal(soil.sourceType, 'simulated');
  assert.notEqual(water.textEn, soil.textEn);
  assert.doesNotMatch(water.textEn, /guaranteed|NASA observed/i);
});
