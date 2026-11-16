/**
 * One honest Chapter 0 → 1 → 2 route shared by the Babylon world and the
 * no-WebGL text edition. Chapter 2 must not be instantiated before Chapter 1
 * completes: its evidence puzzle consumes the player's actual fictional plan.
 */
import { attachChapter1Game } from '../../game/ui/chapter1-board.js';
import { attachChapter2Game } from '../../game/ui/chapter2-board.js';

const words = {
  en: { launch: 'Chapter 2 · The Evidence Gap →', replay: 'Replay Chapter 2 · The Evidence Gap ↻',
    summary: 'Your fictional crop plan is ready. Investigate what the village knows — and what it does not.' },
  ar: { launch: 'الفصل الثاني · فجوة الأدلة ←', replay: 'أعد الفصل الثاني · فجوة الأدلة ↻',
    summary: 'خطة اللعبة الافتراضية جاهزة. اكتشف الأدلة الموجودة والناقصة في القرية.' },
};

export function mountChapterSequence({ host, chapter0, language = 'en', onUnlocked = () => {} } = {}) {
  if (!host || !chapter0) throw new TypeError('The chapter sequence requires a host and Chapter 0');
  let lang = language === 'ar' ? 'ar' : 'en';
  let chapter2 = null;
  let wasUnlocked = false;
  const chapter1 = attachChapter1Game({
    host, chapter0, language: lang,
    onStateChange: () => refresh(),
  });
  const chapter2Launch = document.createElement('button');
  chapter2Launch.type = 'button';
  chapter2Launch.id = 'chapter2-launch';
  chapter2Launch.className = 'chapter2-launch';
  chapter2Launch.hidden = true;
  chapter2Launch.addEventListener('click', () => chapter2?.open());
  host.appendChild(chapter2Launch);

  function renderLabel() {
    const t = words[lang];
    chapter2Launch.textContent = chapter2?.mission.phase === 'result' ? t.replay : t.launch;
    chapter2Launch.setAttribute('aria-label', chapter2Launch.textContent);
    chapter2Launch.title = t.summary;
  }

  function refresh() {
    chapter1.refresh();
    const completed = chapter1.game.phase === 'result';
    if (!completed) {
      chapter2?.destroy();
      chapter2 = null;
      chapter2Launch.hidden = true;
      wasUnlocked = false;
      return;
    }
    if (!chapter2) chapter2 = attachChapter2Game({
      host, chapter1: chapter1.game, language: lang,
      onStateChange: () => renderLabel(),
    });
    chapter2Launch.hidden = false;
    renderLabel();
    if (!wasUnlocked) onUnlocked(lang === 'ar' ? words.ar.summary : words.en.summary);
    wasUnlocked = true;
  }

  function setLanguage(next) {
    lang = next === 'ar' ? 'ar' : 'en';
    chapter1.setLanguage(lang);
    chapter2?.setLanguage(lang);
    renderLabel();
  }

  function destroy() {
    chapter2?.destroy();
    chapter1.destroy();
    chapter2Launch.remove();
  }

  refresh();
  return { chapter1, get chapter2() { return chapter2; }, chapter2Launch, refresh, setLanguage, destroy };
}
