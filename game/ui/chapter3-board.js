import { Chapter3SoilMission, SOIL_PRACTICES, SOIL_TURNS, SOIL_PRIORITIES, SOIL_PLOTS } from '../mission/chapter3.js';

const translations = {
  en: {
    chapter: 'CHAPTER 3 / UNDER OUR FEET', label: 'THE SOIL LAB · FICTIONAL SCENARIO',
    title: 'The answer is under our feet.',
    intro: 'Farida holds two clods of earth beside the canal. One plot is exposed. One has shelter. Nada must plan a fictional trial without pretending she has measured the soil.',
    status: 'SIMULATED GAME · NOT FIELD DATA', missing: 'SALINITY & INFILTRATION: UNAVAILABLE',
    previous: 'BEFORE THE SOIL QUESTION', priorPause: 'The council paused for evidence.', priorTrial: 'A fictional learning trial was proposed.',
    read: 'Read the cutaway',
    cutaway: 'Illustrative cutaway: surface cover, imagined roots and water paths. Not a measured soil profile.',
    instruction: 'Choose cover for both canal reaches. Choose a water-turn rhythm and the family priority. Watch the imagined soil profile and game tokens change. You cannot maximize every benefit within the work budget.',
    head: '01 / HEAD REACH', tail: '02 / TAIL REACH', chooseCover: 'Ground-cover choice',
    water: '03 / THE WATER TURN', priority: '04 / WHAT MATTERS MOST?',
    budget: 'Family work tokens', cap: 'Available: 6', warning: 'Too much work for the fictional family. Adjust a cover choice or water rhythm before presenting it to the council.',
    profile: 'Story consequences', cover: 'Cover tokens', runoff: 'Runoff-warning tokens', tailAccess: 'Tail-access tokens', income: 'Short-term return tokens',
    note: 'These are dimensionless story tokens, not a hydrologic, economic, infiltration or crop-yield model.',
    commit: 'Present the simulated plan →', result: 'THE VILLAGE REACTS',
    decision: 'No field advice was made. The council still needs local infiltration, salinity and weather evidence.',
    replay: 'Try another soil plan', reset: 'Reset the two fields', close: 'Close Chapter 3',
    science: 'Explore the actual NASA/soil evidence workflow ↗',
    verify: 'REAL FIELD ADVICE: NOT AVAILABLE',
  },
  ar: {
    chapter: 'الفصل الثالث / تحت رجلينا', label: 'مختبر التربة · مشهد افتراضي',
    title: 'الإجابة تحت رجلينا.',
    intro: 'فريدة ماسكة كتلتين تربة جنب المسقة. أرض مكشوفة والتانية عليها غطاء. ندى محتاجة تخطط تجربة خيالية من غير ما تدّعي إنها قاست التربة.',
    status: 'لعبة افتراضية · ليست قياسات حقلية', missing: 'الملوحة والترشح: غير متاحين',
    previous: 'قبل سؤال التربة', priorPause: 'المجلس أجّل القرار للأدلة.', priorTrial: 'المجلس اقترح تجربة تعلم خيالية.',
    read: 'اقرأ مقطع التربة',
    cutaway: 'مقطع توضيحي للغطاء السطحي والجذور ومسارات المياه المتخيلة، وليس ملف تربة مقاس.',
    instruction: 'اختار غطاء الأرض في أول وآخر المسقة، ثم نظام نوبة المياه والأولوية الأسرية. شوف تغير طبقات التربة ونقاط اللعبة. مش هتقدر تحقق كل المكاسب ضمن ميزانية المجهود.',
    head: '٠١ / أول المسقة', tail: '٠٢ / آخر المسقة', chooseCover: 'اختيار غطاء الأرض',
    water: '٠٣ / نوبة المياه', priority: '٠٤ / الأهم عندك',
    budget: 'نقاط المجهود الأسري', cap: 'المتاح: ٦', warning: 'المجهود أكبر من قدرة الأسرة الخيالية. غيّر الغطاء أو نظام المياه قبل العرض على المجلس.',
    profile: 'نتائج القصة', cover: 'نقاط الغطاء', runoff: 'نقاط تحذير الجريان', tailAccess: 'نقاط آخر المسقة', income: 'نقاط العائد القصير',
    note: 'دي نقاط قصة بلا وحدات، مش نموذج هيدرولوجي أو اقتصادي أو قياس ترشح أو تنبؤ بإنتاج محصول.',
    commit: 'اعرض الخطة الافتراضية ←', result: 'رد القرية',
    decision: 'لم تُقدَّم أي توصية حقلية. المجلس ما زال محتاج قياسات ترشح وملوحة محلية ودليل طقس.',
    replay: 'جرّب خطة تربة تانية', reset: 'ابدأ الحقلين من الأول', close: 'اقفل الفصل الثالث',
    science: 'استكشف مسار أدلة ناسا والتربة الفعلية ↗',
    verify: 'نصيحة حقلية: غير متاحة',
  },
};

const practiceOptions = lang => Object.values(SOIL_PRACTICES)
  .map(p=>`<option value="${p.id}">${p[lang]}</option>`).join('');
const turnOptions = lang => Object.values(SOIL_TURNS)
  .map(t=>`<option value="${t.id}">${t[lang]}</option>`).join('');
const priorityOptions = lang => Object.values(SOIL_PRIORITIES)
  .map(p=>`<option value="${p.id}">${p[lang]}</option>`).join('');

/**
 * Accessible, no-WebGL soil story puzzle. A visually rich educational scene,
 * not a source of farm observations or uncalibrated numerical agronomy.
 */
export function attachChapter3Game({ host = document.body, chapter2, language = 'en', onStateChange } = {}) {
  if (!host) throw new TypeError('Chapter 3 requires a host');
  const mission = new Chapter3SoilMission(chapter2);
  let lang = language === 'ar' ? 'ar' : 'en';
  let returnFocus = null;
  let inerted = [];
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./chapter3-board.css', import.meta.url).href;
  document.head.appendChild(stylesheet);
  const root = document.createElement('section');
  root.className = 'soiliq-soil-lab';
  root.id = 'chapter3-soil-lab';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'soil-lab-title');
  root.hidden = true;
  host.appendChild(root);

  const inertBackground = () => {
    let node = root;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node || sibling.tagName === 'SCRIPT') continue;
        inerted.push([sibling, sibling.inert]);
        sibling.inert = true;
      }
      node = node.parentElement;
    }
  };
  const restoreBackground = () => {
    for (const [element, previous] of inerted) element.inert = previous;
    inerted = [];
  };

  function optionControl(id, label, options, value, detail) {
    return `<div class="soil-choice-group"><label for="${id}">${label}</label><select id="${id}" data-model-control="${id}">${options}</select><p id="${id}-detail" class="soil-control-note">${detail}</p></div>`;
  }

  function soilPlot(id, practice) {
    const plot = SOIL_PLOTS.find(p=>p.id===id);
    return `<article class="soil-plot" data-plot="${id}" data-practice="${practice}">
      <div class="soil-field-name"><span>${id==='head'?translations[lang].head:translations[lang].tail}</span><strong>${plot[lang]}</strong></div>
      <div class="soil-illustration" role="img" aria-label="${translations[lang].cutaway}">
        <div class="soil-skyline"><span class="soil-village-house" aria-hidden="true"></span><span class="soil-sun" aria-hidden="true"></span><span class="soil-reeds" aria-hidden="true">♧ ♧ ♧</span></div>
        <div class="soil-surface"><i class="soil-plant p1"></i><i class="soil-plant p2"></i><i class="soil-plant p3"></i><i class="soil-straw s1"></i><i class="soil-straw s2"></i><i class="soil-straw s3"></i></div>
        <div class="soil-horizon-a"><i class="soil-root r1"></i><i class="soil-root r2"></i><i class="soil-root r3"></i><span class="soil-pore pore1"></span><span class="soil-pore pore2"></span></div>
        <div class="soil-horizon-b"><i class="soil-root r4"></i><span class="soil-pore pore3"></span><span class="soil-stone"></span></div>
        <div class="soil-horizon-c"><i class="soil-stone"></i></div>
        <div class="soil-droplets" aria-hidden="true">◇　◇　◇</div>
      </div>
      <p class="soil-plot-caption">${SOIL_PRACTICES[practice][lang]} · ${SOIL_PRACTICES[practice][lang==='en'?'detailEn':'detailAr']}</p>
    </article>`;
  }

  function render(focus = null) {
    const t = translations[lang];
    const current = mission.compare();
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.dataset.turn = mission.turn;
    root.innerHTML = `
      <div class="soil-lab-backdrop" aria-hidden="true"><div class="soil-stars"></div><div class="soil-fog"></div></div>
      <div class="soil-lab-content">
        <button class="soil-lab-close" type="button" data-action="close" aria-label="${t.close}">×</button>
        <header class="soil-lab-header">
          <span class="soil-lab-eyebrow">${t.chapter}</span><span class="soil-lab-badge">${t.status}</span>
          <h1 id="soil-lab-title">${t.title}</h1><p>${t.intro}</p>
          <div class="soil-story-breadcrumb"><span>${t.previous}</span><strong>${mission.prior.ending === 'evidence_pause' ? t.priorPause : t.priorTrial}</strong></div>
        </header>
        <div class="soil-lab-grid">
          <section class="soil-visual-side" aria-label="${t.read}">
            <div class="soil-lab-section-kicker">${t.read}</div>
            <div class="soil-plot-pair">${soilPlot('head',mission.practices.head)}${soilPlot('tail',mission.practices.tail)}</div>
            <p class="soil-cutaway-explainer">${t.cutaway}</p>
            <p class="soil-missing"><span aria-hidden="true">⊘</span> ${t.missing}</p>
          </section>
          <section class="soil-planner-side">
            ${mission.phase === 'planning' ? `
              <h2>${t.profile}</h2><p class="soil-instructions">${t.instruction}</p>
              <div class="soil-controls">
                ${optionControl('soil-head', `${t.head} · ${t.chooseCover}`, practiceOptions(lang), mission.practices.head, SOIL_PRACTICES[mission.practices.head][lang==='en'?'detailEn':'detailAr'])}
                ${optionControl('soil-tail', `${t.tail} · ${t.chooseCover}`, practiceOptions(lang), mission.practices.tail, SOIL_PRACTICES[mission.practices.tail][lang==='en'?'detailEn':'detailAr'])}
                ${optionControl('soil-turn', t.water, turnOptions(lang), mission.turn, SOIL_TURNS[mission.turn][lang==='en'?'detailEn':'detailAr'])}
                ${optionControl('soil-priority', t.priority, priorityOptions(lang), mission.priority, '')}
              </div>
              <div class="soil-metrics" role="status" aria-live="polite">
                <div><span>${t.cover}</span><strong>${current.coverTokens}</strong></div>
                <div><span>${t.runoff}</span><strong>${current.runoffRiskTokens}</strong></div>
                <div><span>${t.tailAccess}</span><strong>${current.tailAccessTokens}</strong></div>
                <div><span>${t.income}</span><strong>${current.livelihoodTokens}</strong></div>
              </div>
              <div class="soil-work-budget ${current.canCommit?'':'is-over'}"><span>${t.budget} <b>${current.workTokens} / ${current.workBudget}</b></span><div class="soil-work-bar"><i style="width:${Math.min(100,Math.round(current.workTokens/current.workBudget*100))}%"></i></div><small>${t.cap}</small></div>
              ${current.canCommit?'':`<p class="soil-budget-warning" role="alert">${t.warning}</p>`}
              <p class="soil-simulated-note">${t.note}</p>
              <div class="soil-action-row"><button type="button" class="soil-commit" data-action="commit" ${current.canCommit?'':'disabled'}>${t.commit}</button><button type="button" class="soil-reset" data-action="reset">${t.reset}</button></div>
              ` : `
              <div class="soil-verdict" role="status"><span class="soil-lab-section-kicker">${t.result}</span><span class="soil-lab-badge">SIMULATED</span>
                <h2>${mission.result.summary[lang]}</h2><p>${t.decision}</p>
                <div class="soil-metrics"><div><span>${t.cover}</span><strong>${mission.result.coverTokens}</strong></div><div><span>${t.runoff}</span><strong>${mission.result.runoffRiskTokens}</strong></div><div><span>${t.tailAccess}</span><strong>${mission.result.tailAccessTokens}</strong></div><div><span>${t.income}</span><strong>${mission.result.livelihoodTokens}</strong></div></div>
                <button type="button" class="soil-commit" data-action="replay">${t.replay}</button></div>`}
          </section>
        </div>
        <footer class="soil-lab-footer"><span>${t.verify}</span><a href="../../walkthrough/" target="_blank" rel="noopener noreferrer">${t.science}</a></footer>
      </div>`;
    for (const [id,val] of [['soil-head',mission.practices.head],['soil-tail',mission.practices.tail],['soil-turn',mission.turn],['soil-priority',mission.priority]]) {
      const select = root.querySelector(`#${id}`);
      if (select) select.value = val;
    }
    root.querySelectorAll('[data-model-control]').forEach(input => input.addEventListener('change', () => {
      const key = input.id;
      if (key === 'soil-head') mission.setPractice('head',input.value);
      else if (key === 'soil-tail') mission.setPractice('tail',input.value);
      else if (key === 'soil-turn') mission.setTurn(input.value);
      else if (key === 'soil-priority') mission.setPriority(input.value);
      render(`#${key}`);
      onStateChange?.(mission);
    }));
    root.querySelector('[data-action="close"]').addEventListener('click', close);
    root.querySelector('[data-action="commit"]')?.addEventListener('click', () => {
      mission.commit(); render(); onStateChange?.(mission);
    });
    root.querySelector('[data-action="replay"]')?.addEventListener('click', () => {
      mission.replay(); render('#soil-head'); onStateChange?.(mission);
    });
    root.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      mission.reset(); render('#soil-head'); onStateChange?.(mission);
    });
    if (mission.phase === 'result') {
      root.scrollTop = 0;
      const verdict = root.querySelector('.soil-verdict h2');
      verdict.setAttribute('tabindex','-1'); verdict.focus({preventScroll:true});
    } else if (focus) root.querySelector(focus)?.focus();
  }

  function keyHandler(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusables = [...root.querySelectorAll('button:not([disabled]), select:not([disabled]), a[href]')]
      .filter(node => node.getClientRects().length);
    const first = focusables[0], last = focusables.at(-1);
    if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
    else if (!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
  }
  root.addEventListener('keydown',keyHandler);
  function open() {
    if (!root.hidden) return;
    returnFocus = document.activeElement;
    root.hidden=false;
    render();
    inertBackground();
    root.scrollTop=0;
    root.querySelector('.soil-lab-close').focus({preventScroll:true});
  }
  function close() {
    if (root.hidden) return;
    root.hidden=true;
    restoreBackground();
    if(returnFocus?.isConnected && typeof returnFocus.focus==='function')returnFocus.focus();
  }
  render();
  return { mission, root, open, close, setLanguage(next){lang=next==='ar'?'ar':'en';render();},
    refresh(){render();}, destroy(){close();root.remove();stylesheet.remove();} };
}
