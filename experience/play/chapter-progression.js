/**
 * One honest Chapter 0 → 1 → 2 → 3 → 4 route shared by Babylon and text-only.
 * Every later chapter is instantiated only after the preceding fictional
 * result exists; replay invalidates all downstream decisions.
 */
import { attachChapter1Game } from '../../game/ui/chapter1-board.js';
import { attachChapter2Game } from '../../game/ui/chapter2-board.js';
import { attachChapter3Game } from '../../game/ui/chapter3-board.js';
import { attachChapter4Game } from '../../game/ui/chapter4-board.js';

const words = {
  en: { launch: 'Chapter 2 · The Evidence Gap →', replay: 'Replay Chapter 2 · The Evidence Gap ↻',
    summary: 'Your fictional crop plan is ready. Investigate what the village knows — and what it does not.',
    soil: 'Chapter 3 · The Soil Lab →', soilReplay: 'Replay Chapter 3 · The Soil Lab ↻',
    harvest: 'Chapter 4 · The Harvest Council →', harvestReplay: 'Replay Chapter 4 · The Harvest Council ↻',
    soilSummary: 'Your evidence question is recorded. Explore soil-cover trade-offs in a fictional two-plot lab.',
    harvestSummary: 'Your simulated soil plan is ready. Write the village pact with limited promises.' },
  ar: { launch: 'الفصل الثاني · فجوة الأدلة ←', replay: 'أعد الفصل الثاني · فجوة الأدلة ↻',
    summary: 'خطة اللعبة الافتراضية جاهزة. اكتشف الأدلة الموجودة والناقصة في القرية.',
    soil: 'الفصل الثالث · مختبر التربة ←', soilReplay: 'أعد الفصل الثالث · مختبر التربة ↻',
    harvest: 'الفصل الرابع · مجلس الحصاد ←', harvestReplay: 'أعد الفصل الرابع · مجلس الحصاد ↻',
    soilSummary: 'اتسجل قرار الأدلة. جرّب مفاضلات غطاء التربة افتراضياً في قطعتين.',
    harvestSummary: 'خطة التربة الافتراضية جاهزة. اكتب اتفاق القرية بوعود محدودة.' },
};

export function mountChapterSequence({ host, chapter0, language = 'en', onUnlocked = () => {} } = {}) {
  if (!host || !chapter0) throw new TypeError('The chapter sequence requires a host and Chapter 0');
  let lang = language === 'ar' ? 'ar' : 'en';
  let chapter2 = null;
  let chapter3 = null;
  let chapter4 = null;
  let wasUnlocked = false;
  let soilWasUnlocked = false;
  let harvestWasUnlocked = false;
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('./chapter-later.css', import.meta.url).href;
  document.head.appendChild(style);
  const chapter1 = attachChapter1Game({
    host, chapter0, language: lang,
    // Chapter 1 has already rendered and restored keyboard focus before it
    // notifies us. Rendering it again destroys the focused element, causing
    // Escape/Tab to stop working after Commit, especially in the AR 360px UI.
    onStateChange: () => refresh({ preserveChapter1Focus: true }),
  });
  const chapter2Launch = document.createElement('button');
  chapter2Launch.type = 'button';
  chapter2Launch.id = 'chapter2-launch';
  chapter2Launch.className = 'chapter2-launch';
  chapter2Launch.hidden = true;
  chapter2Launch.addEventListener('click', () => chapter2?.open());
  host.appendChild(chapter2Launch);
  // Mount these buttons before any modal opens, so existing inert-background
  // lists include them even if they unlock during a Chapter 2/3 commit.
  function makeLaterButton(id, open) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'chapter-later-launch';
    button.hidden = true;
    button.addEventListener('click', open);
    host.appendChild(button);
    return button;
  }
  const chapter3Launch = makeLaterButton('chapter3-launch', () => chapter3?.open());
  const chapter4Launch = makeLaterButton('chapter4-launch', () => chapter4?.open());

  function renderLabel() {
    const t = words[lang];
    chapter2Launch.textContent = chapter2?.mission.phase === 'result' ? t.replay : t.launch;
    chapter2Launch.setAttribute('aria-label', chapter2Launch.textContent);
    chapter2Launch.title = t.summary;
    chapter3Launch.textContent = chapter3?.mission.phase === 'result' ? t.soilReplay : t.soil;
    chapter3Launch.setAttribute('aria-label', chapter3Launch.textContent);
    chapter3Launch.title = t.soilSummary;
    chapter4Launch.textContent = chapter4?.mission.phase === 'result' ? t.harvestReplay : t.harvest;
    chapter4Launch.setAttribute('aria-label', chapter4Launch.textContent);
    chapter4Launch.title = t.harvestSummary;
  }

  function removeChapter4() {
    chapter4?.destroy();
    chapter4 = null;
    chapter4Launch.hidden = true;
    harvestWasUnlocked = false;
  }

  function removeChapter3() {
    removeChapter4();
    chapter3?.destroy();
    chapter3 = null;
    chapter3Launch.hidden = true;
    soilWasUnlocked = false;
  }

  function refreshFinale() {
    if (chapter3?.mission.phase !== 'result') {
      removeChapter4();
      renderLabel();
      return;
    }
    if (!chapter4) chapter4 = attachChapter4Game({
      host, chapter3: chapter3.mission, language: lang,
      // The Chapter 4 board has already re-rendered and restored focus.
      onStateChange: () => renderLabel(),
    });
    chapter4Launch.hidden = false;
    renderLabel();
    if (!harvestWasUnlocked) onUnlocked(words[lang].harvestSummary);
    harvestWasUnlocked = true;
  }

  function refreshLater() {
    if (chapter2?.mission.phase !== 'result') {
      removeChapter3();
      renderLabel();
      return;
    }
    if (!chapter3) chapter3 = attachChapter3Game({
      host, chapter2: chapter2.mission, language: lang,
      // Never re-render the active board inside its own state-change callback:
      // that would detach its focused verdict and break Escape on mobile.
      onStateChange: () => refreshFinale(),
    });
    chapter3Launch.hidden = false;
    refreshFinale();
    if (!soilWasUnlocked) onUnlocked(words[lang].soilSummary);
    soilWasUnlocked = true;
  }

  function refresh({ preserveChapter1Focus = false } = {}) {
    if (!preserveChapter1Focus) chapter1.refresh();
    const completed = chapter1.game.phase === 'result';
    if (!completed) {
      removeChapter3();
      chapter2?.destroy();
      chapter2 = null;
      chapter2Launch.hidden = true;
      wasUnlocked = false;
      return;
    }
    if (!chapter2) chapter2 = attachChapter2Game({
      host, chapter1: chapter1.game, language: lang,
      onStateChange: () => refreshLater(),
    });
    chapter2Launch.hidden = false;
    refreshLater();
    renderLabel();
    if (!wasUnlocked) onUnlocked(lang === 'ar' ? words.ar.summary : words.en.summary);
    wasUnlocked = true;
  }

  function setLanguage(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    chapter1.setLanguage(lang);
    chapter2?.setLanguage(lang);
    chapter3?.setLanguage(lang);
    chapter4?.setLanguage(lang);
    renderLabel();
  }

  function destroy() {
    removeChapter3();
    chapter2?.destroy();
    chapter1.destroy();
    chapter2Launch.remove();
    chapter3Launch.remove();
    chapter4Launch.remove();
    style.remove();
  }

  refresh();
  return { chapter1, get chapter2() { return chapter2; }, get chapter3() { return chapter3; },
    get chapter4() { return chapter4; }, chapter2Launch, chapter3Launch, chapter4Launch,
    refresh, setLanguage, destroy };
}
