/**
 * The Seventh Field's playable cold open. All claims in this prologue are
 * fictional premises. The two cards are hypotheses, not NASA model results.
 * Selecting a thread changes Chapter 0 state without locking any later route.
 */
export class OpeningHook {
  constructor(host, mission, callbacks = {}) {
    if (!host || !mission) throw new TypeError('Opening hook requires host and mission');
    this.mission = mission;
    this.callbacks = callbacks;
    this.isOpen = false;
    this.returnFocus = null;
    this.backgroundInert = [];
    this.lang = 'en';
    this.root = document.createElement('section');
    this.root.id = 'opening-hook';
    this.root.className = 'opening-hook';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', 'hook-title');
    this.root.setAttribute('aria-describedby', 'hook-premise');
    this.root.hidden = true;
    this.root.innerHTML = `
      <aside class="hook-world-caption" aria-hidden="true">
        <span class="hook-episode" data-i18n="worldEpisode">SOIL-IQ ORIGINAL STORY · THE NILE DELTA</span>
        <span class="hook-world-title" data-i18n="worldTitle">One canal.\nTwo futures.</span>
        <span class="hook-world-location" id="hook-world-location">01 / THE DAWN COUNCIL</span>
        <span class="hook-world-instruction" data-i18n="worldInstruction">The living village is behind this dossier. Focus a clue to look toward its witness.</span>
      </aside>
      <div class="hook-stage">
        <div class="hook-atmosphere" aria-hidden="true">
          <div class="hook-horizon"></div>
          <div class="hook-canal"></div>
          <div class="hook-field hook-field-one"></div>
          <div class="hook-field hook-field-two"></div>
          <div class="hook-field hook-field-three"></div>
          <div class="hook-sun"></div>
        </div>
        <div class="hook-content">
          <div class="hook-topline">
            <span class="hook-chapter" data-i18n="chapter">CHAPTER 0 / THE DAWN COUNCIL</span>
            <div class="hook-top-actions">
              <span class="hook-type" data-i18n="type">FICTIONAL INTERACTIVE STORY</span>
              <button type="button" id="hook-skip" class="hook-skip" data-i18n="skip">Skip intro →</button>
            </div>
          </div>
          <div class="hook-field-report" aria-hidden="true"><span class="hook-record-dot"></span> FIELD RECORD / <span id="hook-scene-label">DAWN OVER THE CANAL</span></div>
          <p class="hook-eyebrow" data-i18n="eyebrow">SIX FIELDS. ONE CANAL. ONE MISSING ANSWER.</p>
          <h1 id="hook-title">The Seventh Field</h1>
          <p id="hook-premise" class="hook-premise" data-i18n="premise">
            At dawn, Nada opens a torn ledger. Six families must agree on their next water turn.
            But the last page shows a seventh field — and two competing futures for the land.
            The village council meets before the next turn. Neither future has been tested.
          </p>
          <div class="hook-stakes" role="list" aria-label="The fictional stakes">
            <span role="listitem"><strong>06</strong><small data-i18n="families">FAMILIES</small></span>
            <span role="listitem"><strong>01</strong><small data-i18n="canal">SHARED CANAL</small></span>
            <span role="listitem"><strong>02</strong><small data-i18n="hypotheses">UNTESTED PLANS</small></span>
          </div>
          <div class="hook-decision-head">
            <h2 data-i18n="question">Which clue will you follow first?</h2>
            <p data-i18n="questionHelp">This sets your opening investigation, not the winning crop. You can explore both questions later.</p>
          </div>
          <p class="hook-camera-instruction" data-i18n="cameraHelp">Preview a clue to see its witness in the living 3D village.</p>
          <div class="hook-choices" role="group" aria-label="Choose your first investigation">
            <button type="button" id="hook-clue-water" class="hook-choice hook-choice-water">
              <span class="hook-choice-number">01 / THE WATER LEDGER</span>
              <span class="hook-choice-symbol" aria-hidden="true">≋</span>
              <strong data-i18n="waterTitle">Follow the Water</strong>
              <span data-i18n="waterText">Who gets the last irrigation turn when capacity is limited?</span>
              <em data-i18n="waterAction">Investigate with Hassan →</em>
              <span class="hook-untested">UNTESTED · SIMULATED</span>
            </button>
            <button type="button" id="hook-clue-soil" class="hook-choice hook-choice-soil">
              <span class="hook-choice-number">02 / THE TORN CALENDAR</span>
              <span class="hook-choice-symbol" aria-hidden="true">✳</span>
              <strong data-i18n="soilTitle">Follow the Soil</strong>
              <span data-i18n="soilText">Can a longer period of soil cover justify different water needs?</span>
              <em data-i18n="soilAction">Investigate with Maryam →</em>
              <span class="hook-untested">UNTESTED · SIMULATED</span>
            </button>
          </div>
          <div class="hook-footer">
            <button type="button" class="hook-view-village" id="hook-view-village" aria-pressed="false" data-i18n="viewVillage">Widen the village view ↗</button>
            <a href="story.html" id="hook-text-story" data-i18n="text">Text-only play · keyboard and screen reader</a>
            <p class="hook-disclaimer" data-i18n="disclaimer">Story choices are fictional. No live NASA observation, field measurement or verified crop comparison is represented in this scene.</p>
          </div>
        </div>
      </div>`;
    host.appendChild(this.root);
    this.root.querySelector('#hook-clue-water').addEventListener('click', () => this._choose('water'));
    this.root.querySelector('#hook-clue-soil').addEventListener('click', () => this._choose('soil'));
    this.root.querySelector('#hook-skip').addEventListener('click', () => this.close());
    for (const [id, clue] of [['hook-clue-water', 'water'], ['hook-clue-soil', 'soil']]) {
      const element = this.root.querySelector('#' + id);
      element.addEventListener('focus', () => this._preview(clue));
      element.addEventListener('pointerenter', () => this._preview(clue));
    }
    this.root.querySelector('#hook-view-village').addEventListener('click', () => {
      const isWide = this.root.classList.toggle('hook-wide-view');
      this.root.querySelector('#hook-view-village').setAttribute('aria-pressed', String(isWide));
      this._updateViewLabel();
      this._preview(isWide ? 'overview' : this.previewClue || 'overview');
    });
    this.root.addEventListener('keydown', (event) => this._onKeyDown(event));
  }

  _preview(clue) {
    if (!this.isOpen) return;
    this.previewClue = clue;
    this.root.dataset.preview = clue;
    const label = this.lang === 'ar'
      ? { overview: ['الفجر فوق المسقة', '١ / مجلس الفجر'], water: ['حسن / المياه المشتركة', '٢ / بوابة المسقة'], soil: ['مريم / غطاء التربة', '٣ / الغيط'] }
      : { overview: ['DAWN OVER THE CANAL', '01 / THE DAWN COUNCIL'], water: ['HASSAN / SHARED WATER', '02 / THE CANAL GATE'], soil: ['MARYAM / LIVING SOIL', '03 / THE CROP FIELD'] };
    this.root.querySelector('#hook-scene-label').textContent = label[clue][0];
    this.root.querySelector('#hook-world-location').textContent = label[clue][1];
    this.callbacks.onPreview?.(clue);
  }

  _updateViewLabel() {
    const wide = this.root.classList.contains('hook-wide-view');
    this.root.querySelector('#hook-view-village').textContent = this.lang === 'ar'
      ? (wide ? 'ارجع للملف ↙' : 'شوف القرية بوضوح ↗')
      : (wide ? 'Return to the dossier ↙' : 'Widen the village view ↗');
  }

  setLanguage(lang) {
    this.lang = lang === 'ar' ? 'ar' : 'en';
    const ar = {
      chapter: 'الفصل صفر / مجلس الفجر', type: 'قصة تفاعلية افتراضية',
      eyebrow: 'ستة غيطان. مسقة واحدة. وسؤال مفقود.',
      premise: 'مع الفجر تفتح ندى دفترًا قديمًا ممزقًا. ست عائلات لازم تتفق على دور المياه الجاي. لكن آخر صفحة فيها غيط سابع ومستقبلين مختلفين للأرض. مجلس القرية هيجتمع قبل النوبة الجاية، ومفيش أي خطة اتجربت بعد.',
      families: 'عائلات', canal: 'مسقة مشتركة', hypotheses: 'خطط غير مختبرة',
      question: 'هتبدأ بأي خيط؟', questionHelp: 'اختيارك يحدد بداية البحث، مش المحصول الفائز. تقدر تستكشف السؤالين بعدين.',
      waterTitle: 'اتبع المياه', waterText: 'مين هياخد آخر نوبة ري لو السعة محدودة؟', waterAction: 'اتكلم مع حسن ←',
      soilTitle: 'اتبع التربة', soilText: 'هل غطاء التربة لفترة أطول يستحق احتياجات مياه مختلفة؟', soilAction: 'اتكلم مع مريم ←',
      skip: 'تخطى المقدمة ←', text: 'اللعبة النصية · لوحة مفاتيح وقارئ شاشة',
      viewVillage: 'شوف القرية بوضوح ↗', cameraHelp: 'ركز على أحد الخيطين لتشوف صاحبه في القرية ثلاثية الأبعاد.',
      disclaimer: 'الاختيارات قصة افتراضية؛ لا توجد بيانات NASA حية أو قياس حقلي أو مقارنة محاصيل مثبتة في هذا المشهد.',
      worldEpisode: 'قصة أصلية من SOIL-IQ · دلتا النيل', worldTitle: 'مسقة واحدة.\nمستقبلان.',
      worldInstruction: 'القرية الحية وراء الملف. ركّز على أحد الخيطين لتشوف الشخصية في العالم ثلاثي الأبعاد.',
    };
    const en = {
      chapter: 'CHAPTER 0 / THE DAWN COUNCIL', type: 'FICTIONAL INTERACTIVE STORY',
      eyebrow: 'SIX FIELDS. ONE CANAL. ONE MISSING ANSWER.',
      premise: 'At dawn, Nada opens a torn ledger. Six families must agree on their next water turn. But the last page shows a seventh field — and two competing futures for the land. The village council meets before the next turn. Neither future has been tested.',
      families: 'FAMILIES', canal: 'SHARED CANAL', hypotheses: 'UNTESTED PLANS',
      question: 'Which clue will you follow first?', questionHelp: 'This sets your opening investigation, not the winning crop. You can explore both questions later.',
      waterTitle: 'Follow the Water', waterText: 'Who gets the last irrigation turn when capacity is limited?', waterAction: 'Investigate with Hassan →',
      soilTitle: 'Follow the Soil', soilText: 'Can a longer period of soil cover justify different water needs?', soilAction: 'Investigate with Maryam →',
      skip: 'Skip intro →', text: 'Text-only play · keyboard and screen reader',
      viewVillage: 'Widen the village view ↗', cameraHelp: 'Preview a clue to see its witness in the living 3D village.',
      disclaimer: 'Story choices are fictional. No live NASA observation, field measurement or verified crop comparison is represented in this scene.',
      worldEpisode: 'SOIL-IQ ORIGINAL STORY · THE NILE DELTA', worldTitle: 'One canal.\nTwo futures.',
      worldInstruction: 'The living village is behind this dossier. Focus a clue to look toward its witness.',
    };
    for (const node of this.root.querySelectorAll('[data-i18n]')) {
      node.textContent = (this.lang === 'ar' ? ar : en)[node.dataset.i18n];
    }
    this.root.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this._updateViewLabel();
    if (this.isOpen) this._preview(this.previewClue || 'overview');
  }

  _choose(clue) {
    const recorded = this.mission.beginInvestigation(clue);
    this.close();
    if (recorded) this.callbacks.onInvestigation?.(clue);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.returnFocus = document.activeElement;
    // A modal must exclude the moving 3D world and HUD from keyboard and
    // assistive-technology navigation until the player chooses a thread.
    this.backgroundInert = [...document.body.children]
      .filter((element) => element !== this.root && element.tagName !== 'SCRIPT')
      .map((element) => ({ element, wasInert: element.inert }));
    for (const { element } of this.backgroundInert) element.inert = true;
    this.root.hidden = false;
    this.previewClue = 'overview';
    this._preview('overview');
    this.root.querySelector('#hook-clue-water').focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.callbacks.onPreview?.('exit');
    this.root.hidden = true;
    this.root.classList.remove('hook-wide-view');
    this.root.querySelector('#hook-view-village').setAttribute('aria-pressed', 'false');
    for (const { element, wasInert } of this.backgroundInert) element.inert = wasInert;
    this.backgroundInert = [];
    if (this.returnFocus?.isConnected && !this.returnFocus.closest('#game-loader, [hidden]')
      && typeof this.returnFocus.focus === 'function') {
      this.returnFocus.focus();
    } else {
      document.getElementById('renderCanvas')?.focus();
    }
  }

  _onKeyDown(event) {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...this.root.querySelectorAll('button, a[href]')]
      .filter((element) => !element.disabled && element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
