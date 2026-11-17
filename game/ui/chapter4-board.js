import { Chapter4CouncilMission, COUNCIL_PLEDGES, COUNCIL_MANDATES, PACT_CAPACITY, createChapter4Export } from '../mission/chapter4.js';

const copy = {
  en: {
    eyebrow: 'THE SEVENTH FIELD / CHAPTER 4 COUNCIL', badge: 'FICTIONAL VILLAGE · SIMULATED',
    title: 'The future is not a single harvest.',
    intro: 'Dawn returns to the Delta. Hassan, Maryam and Farida stand beside Nada. Every choice left a mark, but the council has only five fictional commitment tokens. What will the village protect together?',
    previous: 'THE STORY YOU BRING', plan: 'Two-season fictional plan', soil: 'Previous soil decision', trust: 'Evidence decision',
    pause: 'Evidence-first pause', trial: 'Fictional learning trial',
    invitation: 'WRITE THE VILLAGE PACT', instruction: 'Allocate 0–3 tokens to each promise. Five shared tokens cannot maximize every promise. These are fictional story choices, not water volumes, crop yields or farm economics.',
    water: 'Share the canal', soilPledge: 'Cover the ground', livelihood: 'Keep families earning', pledgeUnit: 'tokens',
    budget: 'Shared council tokens', left: 'Unassigned', overspent: 'The council promised more than its fictional capacity. Rebalance the commitments.',
    without: 'No promise was made. Give at least one commitment to the village.',
    voices: 'WHAT THE VILLAGE HEARS', farida: 'Farida · Tail reach', maryam: 'Maryam · Soil and seed', hassan: 'Hassan · Family harvest',
    faridaLow: '“I need a place in the next water turn, not another promise that skips the end of the canal.”',
    faridaHigh: '“At least the tail of the canal is finally on the council map.”',
    maryamLow: '“The soil does not disappear after harvest; our plan must remember it.”',
    maryamHigh: '“This gives the land some breathing room. But we still need real soil measurements.”',
    hassanLow: '“My family has to eat while the village learns. Please leave a place for us.”',
    hassanHigh: '“I can see a path for our household, though water and soil still matter.”',
    mandateTitle: 'THE LAST QUESTION', mandateIntro: 'Are you making a real-world recommendation?',
    mandateNote: 'No. Both choices remain educational. Choosing an evidence-first pause explicitly defers any real field action.',
    missing: 'MISSING: DATED NASA WEATHER · LOCAL SOIL SAMPLES · REAL CANAL RECORDS',
    note: 'OBSERVED WEATHER: UNAVAILABLE · CROP INPUTS: ASSUMED · STORY OUTCOMES: SIMULATED',
    commit: 'Confirm the village pact →', reset: 'Reset promises', replay: 'Rewrite the pact',
    resultEyebrow: 'THE VILLAGE REMEMBERS', resultTitle: 'One council. No perfect answer.',
    resultEvidence: 'This is a fictional ending, not a field recommendation. No NASA POWER request or local measurement was made in the game.',
    export: 'Download my fictional decisions ↓', exportHint: 'Local JSON only. No name, coordinates or game data are uploaded.',
    science: 'Go to the real crop-rotation evidence comparison ↗', close: 'Close The Harvest Council',
    failure: 'Could not create a local download. The story remains playable and no data was uploaded.',
  },
  ar: {
    eyebrow: 'الحقل السابع / مجلس الفصل الرابع', badge: 'قرية خيالية · نتائج محاكاة',
    title: 'المستقبل مش حصاد واحد.',
    intro: 'الفجر رجع للدلتا. حسن ومريم وفريدة واقفين مع ندى. كل اختيار ساب أثر، لكن المجلس معاه خمس نقاط التزام افتراضية بس. هنحمي إيه مع بعض؟',
    previous: 'الحكاية اللي وصلنا بيها', plan: 'خطة موسمين افتراضية', soil: 'آخر قرار للتربة', trust: 'قرار الأدلة',
    pause: 'تأجيل لحد الدليل', trial: 'تجربة تعلم خيالية',
    invitation: 'اكتب اتفاق القرية', instruction: 'وزع من صفر لتلات نقاط لكل وعد. خمس نقاط مشتركة ما يكفوش نكبر كل حاجة. دي اختيارات خيالية مش كميات مياه أو إنتاج أو اقتصاد مزرعة.',
    water: 'نشارك المياه', soilPledge: 'نغطي الأرض', livelihood: 'نحمي معيشة الأسر', pledgeUnit: 'نقطة',
    budget: 'نقاط مجلس القرية', left: 'متبقي', overspent: 'الوعود أكتر من قدرة المجلس الخيالية. غيّر توزيع الالتزامات.',
    without: 'لسه ما اخترناش أي التزام. ادّي على الأقل نقطة لوعد واحد.',
    voices: 'أصوات أهل القرية', farida: 'فريدة · آخر المسقة', maryam: 'مريم · التربة والبذور', hassan: 'حسن · حصاد الأسرة',
    faridaLow: '«أنا محتاجة دور حقيقي في آخر المسقة، مش وعد يعدّي من غيرنا.»',
    faridaHigh: '«أهو أخيرًا آخر المسقة بقى موجود على خريطة المجلس.»',
    maryamLow: '«التربة مش بتختفي بعد الحصاد. لازم نفتكرها في الخطة.»',
    maryamHigh: '«كده الأرض تاخد نَفَس، لكن لسه محتاجين نقيس التربة فعلاً.»',
    hassanLow: '«أسرتي لازم تعيش وإحنا بنتعلم. سيبوا لنا مكان في القرار.»',
    hassanHigh: '«قدامي طريق لأسرتي، بس المياه والتربة ما ينفعش ننساهم.»',
    mandateTitle: 'السؤال الأخير', mandateIntro: 'هل دي توصية حقيقية للزراعة؟',
    mandateNote: 'لأ. الاختيارين تعليميين. تأجيل الأدلة معناه مفيش قرار حقلي قبل ما نجيب الدليل.',
    missing: 'غير متاح: طقس ناسا المؤرخ · عينات التربة · سجلات المسقة الفعلية',
    note: 'الطقس المرصود: غير متاح · مدخلات المحصول: مفترضة · النتائج: محاكاة',
    commit: 'ثبّت اتفاق القرية ←', reset: 'صفّر الوعود', replay: 'اكتب اتفاق جديد',
    resultEyebrow: 'القرية فاكرة', resultTitle: 'مجلس واحد. مفيش حل مثالي.',
    resultEvidence: 'دي نهاية قصة خيالية، مش توصية حقلية. اللعبة ما عملتش طلب بيانات من NASA POWER ولا قياس محلي.',
    export: 'حمّل اختياراتي الخيالية ↓', exportHint: 'ملف JSON محلي. مش بنرفع اسم أو إحداثيات أو اختيارات لأي خادم.',
    science: 'قارن خطط المحاصيل بأدلة حقيقية ↗', close: 'اقفل مجلس الحصاد',
    failure: 'تعذر تنزيل الملف محليًا. القصة شغالة ومفيش بيانات اترفعت.',
  },
};

const escapeAttr = string => String(string).replace(/[&"<>]/g, char => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'})[char]);
const promiseNames = { water: 'water', soil: 'soilPledge', livelihood: 'livelihood' };
const order = ['water','soil','livelihood'];
const previousSoilTitles = Object.freeze({
  prepared_for_measurement: {en:'Waiting for field measurements',ar:'بانتظار قياسات من الحقل'},
  runoff_warning: {en:'Runoff warning',ar:'تحذير من جريان المياه'},
  shared_soil_cover: {en:'Shared soil cover',ar:'غطاء تربة مشترك'},
  hard_tradeoff: {en:'A difficult compromise',ar:'مفاضلة صعبة'},
});

/** Mount on Babylon or no-WebGL text entry. No external data or dependencies. */
export function attachChapter4Game({ host = document.body, chapter3, language = 'en', onStateChange } = {}) {
  if (!host) throw new TypeError('Chapter 4 requires a DOM host');
  const mission = new Chapter4CouncilMission(chapter3);
  let lang = language === 'ar' ? 'ar' : 'en';
  let savedFocus = null;
  let inerted = [];
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./chapter4-board.css', import.meta.url).href;
  document.head.appendChild(stylesheet);

  const root = document.createElement('section');
  root.id = 'chapter4-harvest-council';
  root.className = 'harvest-council';
  root.setAttribute('role','dialog');
  root.setAttribute('aria-modal','true');
  root.setAttribute('aria-labelledby','harvest-title');
  root.hidden = true;
  host.appendChild(root);

  function inertBackground() {
    let node = root;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node || sibling.tagName === 'SCRIPT' || sibling.tagName === 'LINK') continue;
        inerted.push([sibling,sibling.inert]);
        sibling.inert = true;
      }
      node = node.parentElement;
    }
  }
  function restoreBackground() {
    for (const [node,wasInert] of inerted) node.inert = wasInert;
    inerted = [];
  }

  function pledgeInput(id, current) {
    const t = copy[lang];
    const label = t[promiseNames[id]];
    return `<div class="harvest-pledge" data-pledge="${id}">
      <label for="harvest-${id}"><span aria-hidden="true">${COUNCIL_PLEDGES[id].icon}</span><strong>${label}</strong></label>
      <select id="harvest-${id}" data-allocation="${id}" aria-label="${label}" ${mission.phase === 'result'?'disabled':''}>
        ${[0,1,2,3].map(n=>`<option value="${n}" ${n===current?'selected':''}>${n} ${t.pledgeUnit}</option>`).join('')}
      </select><span class="harvest-pips" aria-hidden="true">${[1,2,3].map(n=>`<i class="${n<=current?'filled':''}"></i>`).join('')}</span>
    </div>`;
  }
  function render(focusSelector = null) {
    const t = copy[lang];
    const status = mission.compare();
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.dataset.phase = mission.phase;
    root.innerHTML = `<div class="harvest-sky" aria-hidden="true"><div class="harvest-sun"></div><div class="harvest-houses"><i></i><i></i><i></i></div><div class="harvest-field"></div><div class="harvest-canal"></div><div class="harvest-reeds"></div></div>
      <div class="harvest-content">
        <button type="button" class="harvest-close" data-action="close" aria-label="${t.close}">×</button>
        <header class="harvest-header"><span class="harvest-eyebrow">${t.eyebrow}</span><span class="harvest-badge">${t.badge}</span>
          <h1 id="harvest-title">${t.title}</h1><p>${t.intro}</p>
          <div class="harvest-timeline" aria-label="${t.previous}">
            <span><small>${t.plan}</small><strong>${mission.prior.previousPlanId}</strong></span>
            <span><small>${t.soil}</small><strong>${escapeAttr(previousSoilTitles[mission.prior.ending][lang])}</strong></span>
            <span><small>${t.trust}</small><strong>${mission.prior.evidenceDecision==='evidence_pause'?t.pause:t.trial}</strong></span>
          </div>
        </header>
        <div class="harvest-grid">
          <section class="harvest-choice-section" aria-labelledby="harvest-pact-title"><span class="harvest-section-label">01 / ${t.invitation}</span>
            <h2 id="harvest-pact-title">${t.invitation}</h2><p>${t.instruction}</p>
            <div class="harvest-pledges">${order.map(id=>pledgeInput(id,mission.pledges[id])).join('')}</div>
            <div class="harvest-budget" role="status" aria-live="polite" data-valid="${status.canCommit}">
              <span>${t.budget} <strong>${status.spent} / ${PACT_CAPACITY}</strong></span>
              <div class="harvest-budget-track" aria-hidden="true"><i style="width:${Math.min(100,Math.round(status.spent/PACT_CAPACITY*100))}%"></i></div>
              <small>${t.left}: ${Math.max(0,status.remainingTokens)}</small>
            </div>
            ${status.canCommit ? '' : `<p class="harvest-error" role="alert">${status.spent===0?t.without:t.overspent}</p>`}
            <div class="harvest-mandate"><h3>${t.mandateTitle}</h3><p>${t.mandateIntro}</p>
            ${Object.values(COUNCIL_MANDATES).map(m=>`<label class="harvest-mandate-option"><input type="radio" name="harvest-mandate" value="${m.id}" ${mission.mandate===m.id?'checked':''} ${mission.phase==='result'?'disabled':''}><span>${m[lang]}</span></label>`).join('')}
            <small>${t.mandateNote}</small></div>
            ${mission.phase === 'planning' ? `<div class="harvest-actions"><button type="button" class="harvest-primary" data-action="commit" ${status.canCommit?'':'disabled'}>${t.commit}</button><button type="button" class="harvest-secondary" data-action="reset">${t.reset}</button></div>` : ''}
          </section>
          <aside class="harvest-voices" aria-label="${t.voices}"><span class="harvest-section-label">02 / ${t.voices}</span>
            <div class="harvest-voice"><span class="harvest-avatar farida" aria-hidden="true">ف</span><div><h3>${t.farida}</h3><p>${mission.pledges.water>=2?t.faridaHigh:t.faridaLow}</p></div></div>
            <div class="harvest-voice"><span class="harvest-avatar maryam" aria-hidden="true">م</span><div><h3>${t.maryam}</h3><p>${mission.pledges.soil>=2?t.maryamHigh:t.maryamLow}</p></div></div>
            <div class="harvest-voice"><span class="harvest-avatar hassan" aria-hidden="true">ح</span><div><h3>${t.hassan}</h3><p>${mission.pledges.livelihood>=2?t.hassanHigh:t.hassanLow}</p></div></div>
            <div class="harvest-evidence"><span>${t.missing}</span><p>${t.note}</p></div>
          </aside>
        </div>
        ${mission.phase === 'result' ? `<section class="harvest-verdict" role="status" aria-live="polite">
          <span class="harvest-section-label">${t.resultEyebrow} / SIMULATED</span><h2 tabindex="-1">${t.resultTitle}</h2><p>${mission.result.summary[lang]}</p>
          <small>${t.resultEvidence}</small><div class="harvest-actions"><button type="button" class="harvest-primary" data-action="download">${t.export}</button><button type="button" class="harvest-secondary" data-action="replay">${t.replay}</button></div>
          <p class="harvest-export-hint">${t.exportHint}</p><p class="harvest-download-error" role="alert" hidden>${t.failure}</p>
        </section>` : ''}
        <footer class="harvest-footer"><span>${t.note}</span><a href="../../walkthrough/" target="_blank" rel="noopener noreferrer">${t.science}</a></footer>
      </div>`;

    root.querySelector('[data-action="close"]').addEventListener('click',close);
    root.querySelectorAll('[data-allocation]').forEach(select=>select.addEventListener('change',()=>{
      const selector=`#harvest-${select.dataset.allocation}`;
      mission.allocate(select.dataset.allocation,Number(select.value));
      render(selector); onStateChange?.(mission);
    }));
    root.querySelectorAll('input[name="harvest-mandate"]').forEach(radio=>radio.addEventListener('change',()=>{
      mission.setMandate(radio.value); render(`input[value="${radio.value}"]`); onStateChange?.(mission);
    }));
    root.querySelector('[data-action="commit"]')?.addEventListener('click',()=>{
      mission.commit(); render(); onStateChange?.(mission);
    });
    root.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{
      mission.reset(); render('#harvest-water'); onStateChange?.(mission);
    });
    root.querySelector('[data-action="replay"]')?.addEventListener('click',()=>{
      mission.replay(); render('#harvest-water'); onStateChange?.(mission);
    });
    root.querySelector('[data-action="download"]')?.addEventListener('click',()=>{
      let url;
      try {
        const payload = JSON.stringify(createChapter4Export(mission),null,2);
        url = URL.createObjectURL(new Blob([payload],{type:'application/json;charset=utf-8'}));
        const anchor=document.createElement('a');
        anchor.href=url; anchor.download='soil-iq-fictional-village-decisions.json';
        document.body.appendChild(anchor); anchor.click(); anchor.remove();
      } catch (_) {const error=root.querySelector('.harvest-download-error');if(error) error.hidden=false;}
      finally {if(url) setTimeout(()=>URL.revokeObjectURL(url),2000);}
    });
    if (mission.phase === 'result') {
      const verdict=root.querySelector('.harvest-verdict');
      verdict.scrollIntoView({block:'start',behavior:'instant'});
      verdict.querySelector('h2').focus({preventScroll:true});
    } else if (focusSelector) root.querySelector(focusSelector)?.focus({preventScroll:true});
  }

  function keyHandler(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusables=[...root.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),a[href]')].filter(node=>node.getClientRects().length);
    const first=focusables[0],last=focusables.at(-1);
    if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
    else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
  }
  root.addEventListener('keydown',keyHandler);
  function open() {
    if (!root.hidden) return;
    savedFocus=document.activeElement;
    root.hidden=false;
    render(); inertBackground(); root.scrollTop=0;
    root.querySelector('.harvest-close').focus({preventScroll:true});
  }
  function close() {
    if(root.hidden)return;
    root.hidden=true;restoreBackground();
    if(savedFocus?.isConnected && typeof savedFocus.focus==='function')savedFocus.focus();
  }
  render();
  return { mission, root, open, close, setLanguage(next){lang=next==='ar'?'ar':'en';render();},
    refresh(){render();}, destroy(){close();root.remove();stylesheet.remove();} };
}
