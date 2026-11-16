import { AccessibleStoryDesk } from '../../game/ui/story-desk.js';
import { Chapter0Mission } from '../../game/mission/chapter0.js';
import { getSeasonStoryBeat } from '../../game/core/season-story.js';
import { runGameWaterWindow } from '../../game/core/water-window-adapter.js';
import { mountChapterSequence } from './chapter-progression.js';

// No Babylon.js or WebGL dependency. We reuse the actual numerical water bridge,
// while substituting only fictional visual/character effects with no-op adapters.
const village = { setGateOpen() {} };
const actors = { setActorEmotion() {}, setActorState() {} };
const sound = { playGateTurnSFX() {}, playNotebookChime() {} };
const water = {
  currentSimulation: null,
  setPumpState() {},
  runSimulation(supply, demands) {
    this.currentSimulation = runGameWaterWindow({ supplyM3h: supply, demandsM3: demands });
    return this.currentSimulation;
  },
  applySimulationToWorld() {},
};
const mission = new Chapter0Mission(village, actors, water, sound);
const progress = document.getElementById('text-progress');
const receipts = document.getElementById('text-receipts');
let chapterSequence = null;

function renderNotes() {
  const beat = getSeasonStoryBeat(mission.flags, mission.activeOutcome);
  const isArabic = desk.lang === 'ar';
  progress.textContent = isArabic ? beat.titleAr : beat.titleEn;
  receipts.replaceChildren();
  for (const entry of mission.notebookReceipts) {
    const li = document.createElement('li');
    li.textContent = isArabic
      ? `افتراضي · ${entry.titleAr}: ${entry.detailsAr}`
      : `SIMULATED · ${entry.titleEn}: ${entry.detailsEn}`;
    receipts.appendChild(li);
  }
  chapterSequence?.refresh();
}

const desk = new AccessibleStoryDesk(document.getElementById('text-game'), mission, {
  onMissionChanged: renderNotes,
  onCheckpointRestored: () => {
    mission.rehydrateWorldEffects();
    renderNotes();
  },
  onCheckpointReset: () => {
    water.currentSimulation = null;
    renderNotes();
  },
});
chapterSequence = mountChapterSequence({
  host: document.getElementById('text-game'), chapter0: mission, language: desk.lang,
  onUnlocked: message => {
    progress.textContent = message;
    document.getElementById('story-announcement').textContent = message;
  },
});
document.getElementById('btn-open-story').addEventListener('click', () => desk.open());
document.getElementById('story-language').addEventListener('change', (event) => {
  desk.setLanguage(event.target.value);
  chapterSequence.setLanguage(event.target.value);
  renderNotes();
});
renderNotes();
// Make the story available immediately, including to keyboard-only users.
desk.open();
window.__soilIqTextGame = { mission, water, desk, chapterSequence };
