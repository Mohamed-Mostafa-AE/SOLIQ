/** Cinematic Chapter 0 *preview* — no game state or scientific data mutation. */
const copy = Object.freeze({
  water: {
    label: 'SIMULATED STORY',
    title: 'Who receives the last turn?',
    text: 'Six fictional families share one canal. A proportional schedule is a possibility to test—not evidence that downstream fields received water.',
  },
  soil: {
    label: 'ASSUMED TRADE-OFF',
    title: 'What stays under cover?',
    text: 'Living clover could change an evaporation assumption. No soil moisture is measured here; the game invites the question, the scientific tool tests scenarios.',
  },
  evidence: {
    label: 'NASA DATA UNAVAILABLE IN THIS PREVIEW',
    title: 'What do we actually know?',
    text: 'A fictional future cannot stand in for an observed season. Open the crop-rotation workspace to retrieve dated NASA POWER weather and declare local assumptions.',
  },
});
const choiceButtons = [...document.querySelectorAll('[data-preview-choice]')];
const scene = document.querySelector('#delta-art');
const status = document.querySelector('#decision-result');

function preview(topic) {
  if (!Object.hasOwn(copy, topic) || !scene || !status) return;
  for (const button of choiceButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.previewChoice === topic));
  }
  scene.dataset.mode = topic;
  const data = copy[topic];
  status.querySelector('[data-preview-label]').textContent = data.label;
  status.querySelector('[data-preview-title]').textContent = data.title;
  status.querySelector('[data-preview-text]').textContent = data.text;
}
choiceButtons.forEach(button => button.addEventListener('click', () => preview(button.dataset.previewChoice)));
preview('water');
