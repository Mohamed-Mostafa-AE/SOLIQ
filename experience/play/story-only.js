import { AccessibleStoryDesk } from '../../game/ui/story-desk.js';
import { Chapter0Mission } from '../../game/mission/chapter0.js';
import { getSeasonStoryBeat } from '../../game/core/season-story.js';
import { runGameWaterWindow } from '../../game/core/water-window-adapter.js';

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

function renderNotes() {
  const beat = getSeasonStoryBeat(mission.flags, mission.activeOutcome);
  progress.textContent = beat.titleEn;
  receipts.replaceChildren();
  for (const entry of mission.notebookReceipts) {
    const li = document.createElement('li');
    li.textContent = `SIMULATED · ${entry.titleEn}: ${entry.detailsEn}`;
    receipts.appendChild(li);
  }
}

const desk = new AccessibleStoryDesk(document.getElementById('text-game'), mission, {
  onMissionChanged: renderNotes,
});
document.getElementById('btn-open-story').addEventListener('click', () => desk.open());
renderNotes();
// Make the story available immediately, including to keyboard-only users.
desk.open();
window.__soilIqTextGame = { mission, water, desk };
