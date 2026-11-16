/**
 * Chapter 1 board — a complete keyboard-accessible 2-season farm mini-game.
 * Standalone DOM module shared by the Babylon game and WebGL-free story route.
 */
import {
  Chapter1Mission, CHAPTER1_CROPS, CHAPTER1_PLOTS,
  CHAPTER1_STRATEGIES, CHAPTER1_PRIORITIES,
} from '../mission/chapter1.js';

const T = {
  en: {
    launch: 'Chapter 1 · My Farm', lockedLaunch: 'Chapter 1 · Finish the Council',
    close: 'Close Chapter 1', kicker: 'THE SEVENTH FIELD / PLAYABLE CHAPTER 01',
    title: 'Two seasons. Six choices. One canal.',
    subtitle: 'Nada opens the family ledger. Hassan is worried about his harvest. Maryam asks who will protect the soil. Farida waits at the end of the canal.',
    source: 'SIMULATED GAME · NO NASA WEATHER OR FIELD MEASUREMENTS LOADED',
    lockedTitle: 'First, decide the canal turn.',
    lockedText: 'Meet Hassan and Maryam, then choose an irrigation experiment or defer in Chapter 0. That decision changes the resources in this next playable chapter.',
    firstButton: 'Return to Chapter 0',
    premise: 'Plant both calendars, then choose the village’s water-turn rules. Explore whether cover, income and fair access can coexist.',
    season: 'Season', plots: 'Reach',
    planA: 'Calendar A · Protect the soil', planB: 'Calendar B · Fast market returns',
    planHint: 'Editable cards: use each dropdown to change the crop on a specific plot and season.',
    select: 'Select Calendar', selected: 'Selected for Council',
    strategyTitle: 'Who receives the water?', priorityTitle: 'What matters most this time?',
    decision: 'Take the plan to the council', retry: 'Try another season',
    restart: 'Return to calendars',
    backToScience: 'Compare real NASA weather and declared soil assumptions ↗',
    water: 'Water demand', shortage: 'Unmet demand', cover: 'Soil cover',
    livelihood: 'Livelihood', fairness: 'Fairness', score: 'Game score',
    budget: 'Fictional budget per season', unit: 'tokens',
    metricNote: 'All numbers are invented tokens; the score only applies to this fictional puzzle. They are not crop coefficients, prices, yield, canal measurements or NASA observations.',
    outcomeTitle: 'The fields remember your choice', outcomeLead: 'Nada records a possible season — not a forecast.',
    outcomeScore: 'Your scenario score', outcomeCompare: 'Alternative scenario score',
    headRisk: 'Farida’s tail-reach plot has a large unmet allocation. A headgate-first schedule may protect one family and leave another exposed. Try shared turns.',
    land: 'Maryam sees stronger soil-cover choices without high fictional water pressure. Hassan asks you to check whether those crops fit real local conditions.',
    shared: 'The ledger exposes a trade-off. Hassan values household income; Maryam weighs ground cover; Farida asks whose turn was missed. There is no automatic winner.',
    evidence: 'You previously deferred irrigation for evidence. This is only a dry-run board: no real pump was started, no actual NASA record was checked. Bring two crop plans to Soil-IQ’s science workspace.',
    resultNote: 'Nothing has been sent to a server or automatically saved. The science workspace requires a real location choice, evidence and farmer-provided assumptions.',
    liveRegion: 'The simulated comparison has changed.',
  },
  ar: {
    launch: 'الفصل الأول · أرضي', lockedLaunch: 'الفصل الأول · أكمل المجلس',
    close: 'إغلاق الفصل الأول', kicker: 'الأرض السابعة / الفصل ٠١ قابل للعب',
    title: 'موسمان. ست قرارات. مسقة واحدة.',
    subtitle: 'ندى بتفتح دفتر الأسرة. حسن قلقان على رزقه. مريم بتسأل مين هيحافظ على التربة. وفريدة مستنية دورها في آخر المسقة.',
    source: 'لعبة افتراضية · لا توجد بيانات NASA أو قياسات حقول محمّلة',
    lockedTitle: 'الأول قرر دور مياه المسقة.',
    lockedText: 'قابل حسن ومريم واختار تجربة توزيع المياه أو تأجيل القرار في الفصل صفر. اختيارك هيغيّر الموارد الافتراضية في الفصل الجديد.',
    firstButton: 'ارجع للفصل صفر',
    premise: 'كوّن تقويمين للمحاصيل، وبعدها اختار قواعد دور المياه. جرّب التوازن بين غطاء التربة ودخل الأسر والعدالة.',
    season: 'الموسم', plots: 'مكان الحقل',
    planA: 'التقويم أ · حماية التربة', planB: 'التقويم ب · عائد السوق الأسرع',
    planHint: 'اختيارات قابلة للتعديل: غيّر المحصول لكل حقل وموسم من القائمة.',
    select: 'اختار التقويم', selected: 'مختار للمجلس',
    strategyTitle: 'المياه هتتوزع إزاي؟', priorityTitle: 'إيه الأهم دلوقتي؟',
    decision: 'اعرض الخطة على المجلس', retry: 'جرب موسم تاني',
    restart: 'ارجع للتقويمات',
    backToScience: 'قارن طقس NASA الحقيقي مع افتراضات التربة المعلنة ↗',
    water: 'احتياج المياه', shortage: 'احتياج غير ملبّى', cover: 'غطاء التربة',
    livelihood: 'دخل الأسر', fairness: 'العدالة', score: 'نقاط اللعبة',
    budget: 'ميزانية افتراضية لكل موسم', unit: 'نقطة',
    metricNote: 'كل الأرقام نقاط لعبة مخترعة؛ التقييم للّغز فقط. ليست معاملات محاصيل ولا أسعارًا ولا إنتاجًا ولا قياسات مياه أو رصد NASA.',
    outcomeTitle: 'الحقول بتفتكر اختيارك', outcomeLead: 'ندى بتسجل موسمًا محتملًا، مش توقعًا للمستقبل.',
    outcomeScore: 'نقاط السيناريو المختار', outcomeCompare: 'نقاط السيناريو البديل',
    headRisk: 'حقل فريدة في آخر المسقة لم يحصل على حصته الافتراضية الكافية. أولوية أول المسقة ممكن تحمي بيت وتضر بيت تاني. جرب النوبات المشتركة.',
    land: 'مريم شايفة غطاء تربة أعلى مع ضغط مياه افتراضي أقل. حسن بيطلب مراجعة مناسبة المحاصيل للظروف المحلية الحقيقية.',
    shared: 'الدفتر كشف مفاضلة: حسن مهتم بالدخل، ومريم بالتربة، وفريدة بدورها في المياه. مفيش فائز تلقائي.',
    evidence: 'أنت كنت أجلت الري لحد ما ييجي دليل. اللوحة دي تجربة ورقية فقط: ما اشتغلتش طلمبة حقيقية ولا اتحمّل رصد NASA. قارن الخطتين في أداة Soil-IQ العلمية.',
    resultNote: 'مفيش حاجة اتبعتت لسيرفر أو اتحفظت تلقائي. أداة العلم محتاجة اختيار موقع حقيقي وأدلة وافتراضات من الفلاح.',
    liveRegion: 'اتغيرت المقارنة الافتراضية.',
  },
};

function elem(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function injectStyle() {
  if (document.getElementById('chapter1-css')) return;
  const link = document.createElement('link');
  link.id = 'chapter1-css';
  link.rel = 'stylesheet';
  link.href = new URL('./chapter1-board.css', import.meta.url).href;
  document.head.append(link);
}

function bar(label, value, max = 100, unit = '%') {
  const wrap = elem('div', 'ch1-metric');
  const heading = elem('div', 'ch1-metric-title');
  heading.append(elem('span', '', label), elem('strong', '', `${value}${unit}`));
  const rail = elem('div', 'ch1-meter-rail');
  rail.setAttribute('role', 'meter');
  rail.setAttribute('aria-label', label);
  rail.setAttribute('aria-valuemin', '0');
  rail.setAttribute('aria-valuemax', String(max));
  rail.setAttribute('aria-valuenow', String(Math.max(0, Math.min(max, value))));
  rail.append(elem('span', 'ch1-meter-fill'));
  rail.firstElementChild.style.width = `${Math.min(100, 100 * value / max)}%`;
  wrap.append(heading, rail);
  return wrap;
}

export class Chapter1Board {
  constructor({ host, chapter0, language = 'en', onStateChange = () => {} }) {
    if (!host || !chapter0) throw new TypeError('Chapter 1 UI requires a host and Chapter 0');
    this.host = host;
    this.chapter0 = chapter0;
    this.onStateChange = onStateChange;
    this.game = new Chapter1Mission(chapter0);
    this.language = language === 'ar' ? 'ar' : 'en';
    this.isOpen = false;
    this.returnFocus = null;
    this.backgroundInert = [];
    injectStyle();

    this.launch = elem('button', 'ch1-launch');
    this.launch.type = 'button';
    this.launch.id = 'chapter1-launch';
    this.launch.addEventListener('click', () => this.open());
    this.host.append(this.launch);

    this.overlay = elem('div', 'ch1-overlay');
    this.overlay.id = 'chapter1-overlay';
    this.overlay.hidden = true;
    this.overlay.innerHTML = `
      <section class="ch1-window" role="dialog" aria-modal="true" aria-labelledby="ch1-title" aria-describedby="ch1-source">
        <div class="ch1-sky" aria-hidden="true"><span class="ch1-sun"></span><span class="ch1-canal"></span><span class="ch1-horizon"></span></div>
        <header class="ch1-top">
          <div class="ch1-header-copy"><p id="ch1-kicker" class="ch1-kicker"></p>
            <h2 id="ch1-title"></h2><p id="ch1-subtitle" class="ch1-subtitle"></p></div>
          <button id="ch1-close" class="ch1-close" type="button"></button>
        </header>
        <div id="ch1-source" class="ch1-evidence"></div>
        <main id="ch1-content" class="ch1-content"></main>
        <p id="ch1-status" class="ch1-sr" aria-live="polite" aria-atomic="true"></p>
      </section>`;
    this.overlay.querySelector('#ch1-close').addEventListener('click', () => this.close());
    this.overlay.addEventListener('change', e => this._onChange(e));
    this.overlay.addEventListener('click', e => this._onClick(e));
    this.overlay.addEventListener('keydown', e => this._onKeyDown(e));
    this.host.append(this.overlay);
    this.refresh();
  }

  get l() { return T[this.language]; }
  _lang(en, ar) { return this.language === 'ar' ? ar : en; }
  _notify() { this.overlay.querySelector('#ch1-status').textContent = this.l.liveRegion; this.onStateChange?.(this.game); }

  setLanguage(language) {
    this.language = language === 'ar' ? 'ar' : 'en';
    this.refresh();
  }

  refresh() {
    const l = this.l;
    this.launch.textContent = this.game.canStart ? l.launch : `🔒 ${l.lockedLaunch}`;
    this.launch.setAttribute('aria-label', this.launch.textContent);
    this.overlay.querySelector('.ch1-window').dir = this.language === 'ar' ? 'rtl' : 'ltr';
    const strings = { 'ch1-kicker': l.kicker, 'ch1-title': l.title, 'ch1-subtitle': l.subtitle, 'ch1-source': l.source, 'ch1-close': `✕ ${l.close}` };
    Object.entries(strings).forEach(([id, value]) => { this.overlay.querySelector('#' + id).textContent = value; });
    if (this.isOpen) this._renderContent();
  }

  _renderContent() {
    const content = this.overlay.querySelector('#ch1-content');
    content.replaceChildren();
    if (!this.game.canStart) {
      const box = elem('section', 'ch1-locked');
      box.append(elem('p', 'ch1-seal', '🔒'), elem('h3', '', this.l.lockedTitle), elem('p', '', this.l.lockedText));
      const btn = elem('button', 'ch1-primary', this.l.firstButton);
      btn.type = 'button'; btn.dataset.action = 'close';
      box.append(btn);
      content.append(box);
      return;
    }
    if (this.game.phase === 'result') { this._renderResult(content); return; }
    this.game.start();
    const comparison = this.game.getComparison();
    const intro = elem('div', 'ch1-premise');
    intro.append(elem('p', '', this.l.premise));
    intro.append(elem('strong', 'ch1-budget', `${this.l.budget}: ${comparison.supplyPerSeason} ${this.l.unit}`));
    content.append(intro);

    const fieldDeck = elem('div', 'ch1-decks');
    for (const plan of comparison.plans) fieldDeck.append(this._renderPlan(plan));
    content.append(fieldDeck);
    const council = elem('div', 'ch1-council');
    council.append(this._renderChoiceGroup('strategy', this.l.strategyTitle, CHAPTER1_STRATEGIES, this.game.strategy));
    council.append(this._renderChoiceGroup('priority', this.l.priorityTitle, CHAPTER1_PRIORITIES, this.game.priority));
    content.append(council);
    content.append(elem('p', 'ch1-limit', this.l.metricNote));

    const footer = elem('footer', 'ch1-footer');
    const submit = elem('button', 'ch1-primary ch1-commit', this.l.decision);
    submit.type = 'button'; submit.id = 'chapter1-commit'; submit.dataset.action = 'commit';
    const link = elem('a', 'ch1-science', this.l.backToScience);
    link.href = '../../walkthrough/?from=seventh-field';
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    footer.append(submit, link);
    content.append(footer);
  }

  _renderChoiceGroup(kind, title, options, selected) {
    const group = elem('fieldset', 'ch1-choice-fieldset');
    group.append(elem('legend', '', title));
    const wrap = elem('div', 'ch1-choice-options');
    for (const option of options) {
      const btn = elem('button', 'ch1-choice', this._lang(option.en, option.ar));
      btn.type = 'button'; btn.dataset[kind] = option.id;
      btn.setAttribute('aria-pressed', String(option.id === selected));
      if (option.noteEn) btn.title = this._lang(option.noteEn, option.noteAr);
      wrap.append(btn);
    }
    group.append(wrap);
    return group;
  }

  _renderPlan(plan) {
    const chosen = plan.id === this.game.selectedPlan;
    const panel = elem('article', `ch1-plan${chosen ? ' ch1-plan-selected' : ''}`);
    panel.dataset.planCard = plan.id;
    const head = elem('div', 'ch1-plan-head');
    head.append(elem('div', 'ch1-plan-letter', plan.id));
    const titles = elem('div', 'ch1-plan-heading');
    titles.append(elem('h3', '', plan.id === 'A' ? this.l.planA : this.l.planB));
    titles.append(elem('p', '', this.l.planHint));
    head.append(titles);
    const select = elem('button', chosen ? 'ch1-plan-choice selected' : 'ch1-plan-choice', chosen ? this.l.selected : this.l.select);
    select.type = 'button'; select.dataset.plan = plan.id;
    select.setAttribute('aria-pressed', String(chosen));
    head.append(select);
    panel.append(head);

    const table = elem('div', 'ch1-field-grid');
    table.setAttribute('role', 'group');
    table.setAttribute('aria-label', plan.id === 'A' ? this.l.planA : this.l.planB);
    const labels = elem('div', 'ch1-plot-labels');
    labels.append(elem('span', '', this.l.season));
    for (const plot of CHAPTER1_PLOTS) labels.append(elem('span', '', this._lang(plot.en, plot.ar)));
    table.append(labels);
    for (const [seasonIndex, season] of plan.seasons.entries()) {
      const row = elem('div', 'ch1-field-row');
      row.append(elem('strong', 'ch1-season-label', `${this.l.season} ${seasonIndex + 1}`));
      for (const [plotIndex, cropId] of season.cropIds.entries()) {
        const slot = elem('div', `ch1-crop-slot crop-${cropId}`);
        const icon = elem('span', 'ch1-crop-icon', CHAPTER1_CROPS[cropId].symbol);
        icon.setAttribute('aria-hidden', 'true');
        const combo = elem('select', 'ch1-crop-select');
        combo.dataset.plan = plan.id;
        combo.dataset.season = String(seasonIndex);
        combo.dataset.plot = String(plotIndex);
        combo.setAttribute('aria-label', `${this.l.season} ${seasonIndex + 1}, ${this._lang(CHAPTER1_PLOTS[plotIndex].en, CHAPTER1_PLOTS[plotIndex].ar)}, ${this.l.select}`);
        for (const crop of Object.values(CHAPTER1_CROPS)) {
          const option = elem('option', '', `${crop.symbol} ${this._lang(crop.en, crop.ar)}`);
          option.value = crop.id;
          option.selected = crop.id === cropId;
          combo.append(option);
        }
        slot.append(icon, combo);
        row.append(slot);
      }
      table.append(row);
    }
    panel.append(table);
    const stats = elem('div', 'ch1-stat-grid');
    stats.append(bar(this.l.cover, plan.coverScore), bar(this.l.livelihood, plan.livelihoodScore));
    stats.append(bar(this.l.fairness, Math.round(plan.fairness * 100)));
    const score = elem('div', 'ch1-score');
    score.append(elem('span', '', this.l.score), elem('strong', '', String(plan.gameScore)));
    stats.append(score);
    const shortage = elem('div', 'ch1-shortfall');
    shortage.textContent = `${this.l.water}: ${plan.totalDemand} ${this.l.unit} · ${this.l.shortage}: ${plan.shortfall} ${this.l.unit}`;
    panel.append(stats, shortage);
    return panel;
  }

  _renderResult(content) {
    const result = this.game.result;
    const outcomes = {
      evidence_first: this.l.evidence,
      tail_at_risk: this.l.headRisk,
      living_land: this.l.land,
      shared_work: this.l.shared,
    };
    const hero = elem('div', `ch1-ending ch1-ending-${result.ending}`);
    hero.append(elem('div', 'ch1-ending-art', result.ending === 'living_land' ? '🌿 🌾 💧' : result.ending === 'tail_at_risk' ? '🌾 ⚖️ 💧' : '☘ 🌾 🌽'));
    hero.append(elem('p', 'ch1-kicker', this.l.outcomeLead), elem('h3', '', this.l.outcomeTitle));
    hero.append(elem('p', 'ch1-ending-narrative', outcomes[result.ending]));
    const scoreboard = elem('div', 'ch1-results-scores');
    const chosen = elem('div', 'ch1-result-score');
    chosen.append(elem('span', '', `${this.l.outcomeScore} · ${result.planId}`), elem('strong', '', String(result.chosenGameScore)));
    const other = elem('div', 'ch1-result-score');
    other.append(elem('span', '', this.l.outcomeCompare), elem('strong', '', String(result.alternativeGameScore)));
    scoreboard.append(chosen, other);
    hero.append(scoreboard, elem('p', 'ch1-limit', this.l.resultNote));
    content.append(hero);
    const footer = elem('footer', 'ch1-footer');
    const replay = elem('button', 'ch1-primary', this.l.retry);
    replay.type = 'button'; replay.id = 'chapter1-replay'; replay.dataset.action = 'replay';
    const science = elem('a', 'ch1-science', this.l.backToScience);
    science.href = '../../walkthrough/?from=seventh-field'; science.rel = 'noopener noreferrer'; science.target = '_blank';
    footer.append(replay, science);
    content.append(footer);
  }

  _onChange(event) {
    const select = event.target.closest('select[data-plan][data-season][data-plot]');
    if (!select) return;
    this.game.editSlot(select.dataset.plan, Number(select.dataset.season), Number(select.dataset.plot), select.value);
    const preferred = [select.dataset.plan, select.dataset.season, select.dataset.plot];
    this.refresh();
    this.overlay.querySelector(`select[data-plan="${preferred[0]}"][data-season="${preferred[1]}"][data-plot="${preferred[2]}"]`)?.focus();
    this._notify();
  }

  _onClick(event) {
    const btn = event.target.closest('button');
    if (!btn) return;
    if (btn.dataset.action === 'close') { this.close(); return; }
    if (btn.dataset.action === 'commit') {
      this.game.commit();
      this.refresh();
      this.overlay.querySelector('#chapter1-replay')?.focus();
      this._notify();
      return;
    }
    if (btn.dataset.action === 'replay') {
      this.game.replay(); this.refresh();
      this.overlay.querySelector('#chapter1-commit')?.focus(); this._notify();
      return;
    }
    if (btn.dataset.plan) this.game.choosePlan(btn.dataset.plan);
    else if (btn.dataset.strategy) this.game.chooseStrategy(btn.dataset.strategy);
    else if (btn.dataset.priority) this.game.choosePriority(btn.dataset.priority);
    else return;
    const selector = btn.dataset.plan ? `[data-plan="${btn.dataset.plan}"]:not(select)`
      : btn.dataset.strategy ? `[data-strategy="${btn.dataset.strategy}"]`
        : `[data-priority="${btn.dataset.priority}"]`;
    this.refresh(); this.overlay.querySelector(selector)?.focus(); this._notify();
  }

  _onKeyDown(event) {
    event.stopPropagation();
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...this.overlay.querySelectorAll('button,select,a[href]')]
      .filter(element => !element.disabled && element.getClientRects().length > 0);
    if (!focusable.length) return;
    if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.returnFocus = document.activeElement;
    // The board takes focus entirely, so the moving canvas and HUD are not
    // traversed with Tab while the chapter decision is on screen.
    let node = this.overlay;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node || sibling.tagName === 'SCRIPT') continue;
        this.backgroundInert.push({ element: sibling, wasInert: sibling.inert });
        sibling.inert = true;
      }
      node = node.parentElement;
      if (node === document.body) break;
    }
    this.overlay.hidden = false;
    this.refresh();
    this.overlay.querySelector('#ch1-close').focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.hidden = true;
    for (const { element, wasInert } of this.backgroundInert) element.inert = wasInert;
    this.backgroundInert = [];
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
  }

  destroy() { this.close(); this.overlay.remove(); this.launch.remove(); }
}

/** Add a full Chapter 1 playable board without modifying 3D/science modules. */
export function attachChapter1Game(options) { return new Chapter1Board(options); }
