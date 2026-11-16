import { Chapter2EvidenceMission, EVIDENCE_CARDS, EVIDENCE_CLASSES } from '../mission/chapter2.js';

const words = {
  en: {
    chapter: 'CHAPTER 2 · THE EVIDENCE GAP', title: 'A forecast with no source?',
    premise: 'At the council, somebody declares that the Seventh Field will flourish. Nada asks a harder question: what do we actually know?',
    prior: 'YOUR FICTIONAL PREVIOUS PLAN', source: 'CLASSIFY THE EVIDENCE',
    instruction: 'Read each clue. Choose what its source status really is. The three correct classifications unlock the council response.',
    check: 'Check evidence', right: 'Correct classification', wrong: 'Not yet. Follow the source, not the confidence of the claim.',
    score: 'Evidence cards verified', status: 'Status', choose: 'Choose evidence class',
    decision: 'What should Nada tell the council?', defer: 'Pause for evidence',
    deferHelp: 'Request a dated NASA weather receipt and local soil measurement. Do not prescribe a crop yet.',
    trial: 'Run a clearly fictional trial',
    trialHelp: 'Keep the game plan exploratory, show its uncertainties and seek missing evidence before real decisions.',
    verdict: 'THE COUNCIL RESPONDS', limitation: 'No live NASA request, measured soil, validated yield, or farm recommendation occurs in this game.',
    replay: 'Replay this puzzle', close: 'Close Chapter 2',
    research: 'Explore real evidence in Soil-IQ', model: 'SIMULATED GAME RESULT',
    cardComplete: 'Classified', narrator: 'Evidence guide',
  },
  ar: {
    chapter: 'الفصل الثاني · فجوة الأدلة', title: 'تنبؤ من غير مصدر؟',
    premise: 'في المجلس حد بيقول إن الأرض السابعة هتنجح أكيد. ندى تسأل السؤال الأصعب: إحنا نعرف إيه فعلًا؟',
    prior: 'خطتك الخيالية السابقة', source: 'صنّف الأدلة',
    instruction: 'اقرأ كل دليل وحدد حالة مصدره الحقيقية. التصنيفات الثلاثة الصحيحة تفتح قرار المجلس.',
    check: 'تحقق من الدليل', right: 'تصنيف صحيح', wrong: 'لسه. راجع مصدر المعلومة، مش مدى ثقة اللي بيقولها.',
    score: 'الأدلة المصنفة صح', status: 'الحالة', choose: 'اختار نوع الدليل',
    decision: 'ندى هتقول إيه للمجلس؟', defer: 'نأجل لحد ما تجي الأدلة',
    deferHelp: 'نطلب إيصال طقس مؤرخًا من ناسا وقياس تربة محلي قبل أي توصية بمحصول.',
    trial: 'نجرب تجربة خيالية واضحة',
    trialHelp: 'نخلي خطة اللعبة للتعلم فقط ونوضح الغموض ونطلب الأدلة الناقصة قبل أي قرار حقيقي.',
    verdict: 'رد المجلس', limitation: 'اللعبة لا تجلب رصد ناسا حيًا ولا تقيس التربة ولا تثبت المحصول ولا تقدم توصية حقلية.',
    replay: 'أعد التحدي', close: 'اقفل الفصل الثاني',
    research: 'استكشف الأدلة الحقيقية في Soil-IQ', model: 'نتيجة لعبة افتراضية',
    cardComplete: 'اتصنف', narrator: 'دليل الأدلة',
  },
};

const icon = { power: '◉', soil: '⬡', trial: '◈' };
const classOptions = Object.values(EVIDENCE_CLASSES);
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** Attach an accessible, self-contained Chapter 2 to the existing 3D or text host. */
export function attachChapter2Game({ host = document.body, chapter1, language = 'en', onStateChange } = {}) {
  if (!host) throw new TypeError('Chapter 2 requires a host element');
  const mission = new Chapter2EvidenceMission(chapter1);
  const root = document.createElement('section');
  root.className = 'soil-iq-evidence-board';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'The Evidence Gap · Chapter 2');
  let lang = language === 'ar' ? 'ar' : 'en';
  let returnFocus = null;
  let previousInert = [];
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./chapter2-board.css', import.meta.url).href;
  document.head.appendChild(link);
  host.appendChild(root);

  function inertBackground() {
    let node = root;
    while (node.parentElement) {
      const siblings = [...node.parentElement.children].filter(el => el !== node && el.tagName !== 'SCRIPT');
      for (const element of siblings) {
        previousInert.push({ element, inert: element.inert });
        element.inert = true;
      }
      node = node.parentElement;
    }
  }

  function restoreBackground() {
    for (const item of previousInert) item.element.inert = item.inert;
    previousInert = [];
  }

  function render(focusId = null) {
    const t = words[lang];
    const progress = mission.getProgress();
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.innerHTML = `
      <div class="evidence-scene" aria-hidden="true"><div class="evidence-moon"></div><div class="evidence-canal"></div><div class="evidence-ripples"></div><div class="evidence-papyrus"></div></div>
      <div class="evidence-panel">
        <header class="evidence-header">
          <span class="evidence-kicker">${t.chapter}</span>
          <button type="button" class="evidence-close" data-action="close">× <span>${t.close}</span></button>
          <h2>${t.title}</h2><p>${t.premise}</p>
          <div class="evidence-prev"><span>${t.prior}</span><strong>${escapeHtml(mission.previous.planId)} · ${escapeHtml(mission.previous.strategy.replaceAll('_', ' '))}</strong><small>${t.model}</small></div>
        </header>
        ${mission.phase === 'classify' ? `
          <div class="evidence-instruction"><h3>${t.source}</h3><p>${t.instruction}</p>
          <p class="evidence-score" role="status">${t.score}: <b>${progress.correct} / ${progress.total}</b></p></div>
          <div class="evidence-cards">${EVIDENCE_CARDS.map(card => {
            const solved = mission.assignments[card.id] === card.answer;
            return `<article class="evidence-card ${solved ? 'is-solved' : ''}">
              <span class="evidence-glyph" aria-hidden="true">${icon[card.id]}</span>
              <h4>${card.title[lang]}</h4><p>${card.clue[lang]}</p>
              <label for="evidence-select-${card.id}">${t.choose}</label>
              <select id="evidence-select-${card.id}" data-card="${card.id}" ${solved ? 'disabled' : ''}>
                <option value="">—</option>${classOptions.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
              <button type="button" class="evidence-check" data-check="${card.id}" ${solved ? 'disabled' : ''}>${solved ? t.cardComplete : t.check}</button>
              <p id="evidence-feedback-${card.id}" class="evidence-feedback" aria-live="polite">${solved ? card.why[lang] : ''}</p>
            </article>`;
          }).join('')}</div>` : mission.phase === 'council' ? `
          <div class="evidence-verdict"><h3>${t.decision}</h3><div class="evidence-actions">
            <button type="button" data-decision="defer"><strong>${t.defer}</strong><span>${t.deferHelp}</span></button>
            <button type="button" data-decision="fictional_trial"><strong>${t.trial}</strong><span>${t.trialHelp}</span></button>
          </div></div>` : `
          <div class="evidence-verdict" role="status"><h3>${t.verdict}</h3><span class="evidence-badge">${t.model}</span><p>${mission.result.summary[lang]}</p>
            <button type="button" data-action="replay">${t.replay}</button></div>`}
        <footer><p>${t.limitation}</p><a href="../../walkthrough/">${t.research} ↗</a></footer>
      </div>`;
    root.querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.check;
      const selected = root.querySelector(`#evidence-select-${id}`).value;
      if (!selected) return root.querySelector(`#evidence-select-${id}`).focus();
      const outcome = mission.classify(id, selected);
      if (outcome.correct) {
        const next = EVIDENCE_CARDS.find(card => mission.assignments[card.id] !== card.answer);
        render(outcome.allCorrect ? '[data-decision="defer"]' : `#evidence-select-${next.id}`);
      }
      else {
        const feedback = root.querySelector(`#evidence-feedback-${id}`);
        feedback.textContent = t.wrong;
        feedback.classList.add('is-error');
        feedback.focus?.();
      }
      onStateChange?.(mission);
    }));
    root.querySelectorAll('[data-decision]').forEach(button => button.addEventListener('click', () => {
      mission.decide(button.dataset.decision);
      render('[data-action="replay"]');
      onStateChange?.(mission);
    }));
    root.querySelector('[data-action="replay"]')?.addEventListener('click', () => {
      mission.replay(); render('#evidence-select-power'); onStateChange?.(mission);
    });
    root.querySelector('[data-action="close"]').addEventListener('click', close);
    if (focusId) (root.querySelector(focusId) ?? root.querySelector('.evidence-close')).focus();
  }

  function handleKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const items = [...root.querySelectorAll('button:not([disabled]), a[href], select:not([disabled])')]
      .filter(element => element.getClientRects().length);
    if (!items.length) return;
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  root.addEventListener('keydown', handleKey);
  function open() {
    if (!root.hidden) return;
    returnFocus = document.activeElement;
    root.hidden = false;
    render();
    inertBackground();
    (root.querySelector('[data-check]') || root.querySelector('[data-decision]') || root.querySelector('.evidence-close')).focus();
  }
  function close() {
    if (root.hidden) return;
    root.hidden = true;
    restoreBackground();
    if (returnFocus?.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus();
  }
  render();
  return {
    mission, root, open, close,
    refresh: () => render(),
    setLanguage: next => { lang = next === 'ar' ? 'ar' : 'en'; render(); },
    destroy: () => { close(); root.remove(); link.remove(); },
  };
}
