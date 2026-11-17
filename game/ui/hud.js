/**
 * SOLIQ: The Seventh Field - Diegetic HUD, Dialogue System & Accessibility
 * Responsive bilingual interface, evidence notebook drawer, virtual touch joystick.
 */

import { localizeGameUi } from './localization.js';

export class GameHUD {
  constructor(containerElement, callbacks = {}) {
    this.container = containerElement;
    this.callbacks = callbacks;
    this.lang = 'en'; // game defaults to English; Arabic remains available

    this.elements = {};
    this.isNotebookOpen = false;
    this.isSettingsOpen = false;

    this._buildHUD();
    this._setupTouchJoystick();
    this.setLanguage('en');
  }

  _buildHUD() {
    this.container.innerHTML = `
      <div id="soliq-game-hud" class="hud-layer" dir="rtl">
        <!-- Top Navigation / Status Header -->
        <header class="hud-top-bar">
          <div class="hud-title-zone">
            <span class="hud-badge">SOLIQ · الأرض السابعة</span>
            <h1 class="hud-mission-title" id="hud-objective-title">المهمة: المية وصلت!</h1>
          </div>
          <div class="hud-quick-tools">
            <button id="btn-earth-lens" class="hud-tool-btn" title="عدسة الأرض (1/2/3)">
              <span class="icon">🛰️</span>
              <span class="label">عدسة الأرض</span>
            </button>
            <button id="btn-notebook" class="hud-tool-btn" title="دفتر الأدلة (N)">
              <span class="icon">📖</span>
              <span class="label">دفتر الأدلة</span>
              <span id="notebook-badge" class="badge-dot"></span>
            </button>
            <button id="btn-story-desk" class="hud-tool-btn" title="Accessible story mode">
              <span class="icon">📜</span>
              <span class="label">Story mode</span>
            </button>
            <button id="btn-camera" class="hud-tool-btn" title="Switch camera (C)">
              <span class="icon">🎥</span>
              <span class="label">استراتيجي</span>
            </button>
            <button id="btn-audio" class="hud-tool-btn" title="كتم الصوت (M)">
              <span id="audio-icon" class="icon">🔊</span>
            </button>
            <button id="btn-settings" class="hud-tool-btn" title="الإعدادات">
              <span class="icon">⚙️</span>
            </button>
          </div>
        </header>

        <!-- Earth Lens Mode Selector Bar -->
        <div id="earth-lens-bar" class="earth-lens-bar">
          <span class="lens-label">وضع الرؤية:</span>
          <button class="lens-tab active" data-lens="ground">🌱 واقع القرية (Ground)</button>
          <button class="lens-tab" data-lens="nasa">🛰️ رصد NASA الفضائي</button>
          <button class="lens-tab" data-lens="future">🔮 محاكاة المستقبل (Modelled)</button>
        </div>

        <!-- Telemetry Notice Toast -->
        <div id="telemetry-toast" class="telemetry-toast" hidden></div>

        <!-- Center In-World Interaction Prompt -->
        <div id="interaction-prompt" class="interaction-prompt" hidden>
          <span class="prompt-key">E</span>
          <span id="prompt-text" class="prompt-text">اضغط للتفاعل</span>
        </div>

        <!-- Dialogue Box Overlay -->
        <div id="dialogue-box" class="dialogue-box" hidden>
          <div class="dialogue-header">
            <div class="dialogue-avatar" id="dialogue-avatar">🧑‍🌾</div>
            <div class="dialogue-speaker" id="dialogue-speaker">عم حسن</div>
          </div>
          <p id="dialogue-cue" class="dialogue-cue" role="status" aria-live="polite"></p>
          <div class="dialogue-content" id="dialogue-text">
            يا أهلاً يا باشمهندسة ندى...
          </div>
          <div class="dialogue-choices" id="dialogue-choices"></div>
        </div>

        <!-- Evidence Notebook Drawer Modal -->
        <div id="notebook-modal" class="notebook-modal" hidden>
          <div class="notebook-content">
            <div class="notebook-header">
              <h2>📖 دفتر الأدلة وسند القياسات (Evidence Notebook)</h2>
              <button id="btn-close-notebook" class="btn-close">✕</button>
            </div>
            <div class="notebook-body">
              <div class="notebook-tabs">
                <button class="nb-tab active" data-nbtab="receipts">سندات الأدلة (Evidence Receipts)</button>
                <button class="nb-tab" data-nbtab="water">ميزان المسقة (Mesqa Ledger)</button>
                <button class="nb-tab" data-nbtab="provenance">المصادر والحدود العلمية</button>
              </div>
              <div id="nb-panel-receipts" class="nb-panel">
                <div id="receipts-list" class="receipts-list"></div>
              </div>
              <div id="nb-panel-water" class="nb-panel" hidden>
                <div id="water-ledger-content" class="water-ledger-content"></div>
              </div>
              <div id="nb-panel-provenance" class="nb-panel" hidden>
                <div class="provenance-content">
                  <h3>إخلاء المسؤولية العلمية والشفافية (Scientific Provenance)</h3>
                  <p><strong>NASA POWER Sakha:</strong> بيانات إقليمية تاريخية، وليست رصدًا لحظيًا لحقل خاص.</p>
                  <p><strong>Codex Water Solver:</strong> الحسابات تتم بدقة عبر خوارزمية allocateWater دون تكرار الحسابات بالواجهة.</p>
                  <p><strong>The Seventh Field:</strong> محاكاة سيناريوهات تعليمية لتوضيح أثر عدم اليقين (Interval Regret) ولا تشكل توصية زراعية حقلية دون فحص معملي للتربة.</p>
                  <section class="rotation-bridge" aria-labelledby="rotation-bridge-title">
                    <h3 id="rotation-bridge-title">Field Shift: Crop Rotation Decision Support</h3>
                    <p id="rotation-bridge-copy">Compare crop calendars in the separate scientific workspace using source-labelled NASA weather context, declared soil parameters and farmer priorities. The fictional game does not transfer farm data.</p>
                    <a id="open-rotation-workspace" href="../../walkthrough/?from=seventh-field" target="_blank" rel="noopener noreferrer">Open Crop Rotation Workspace ↗</a>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Modal -->
        <div id="settings-modal" class="settings-modal" hidden>
          <div class="settings-box">
            <div class="settings-header">
              <h2>⚙️ إعدادات العرض والأداء</h2>
              <button id="btn-close-settings" class="btn-close">✕</button>
            </div>
            <div class="settings-body">
              <label>
                جودة الرسوم (Graphics Preset):
                <select id="select-quality">
                  <option value="balanced" selected>متوازن</option>
                  <option value="low">منخفض للأجهزة القديمة</option>
                  <option value="ultra">فائق (Ultra Shadows & Bloom)</option>
                </select>
              </label>
              <label>
                لغة الحوار والترجمة (Language):
                <select id="select-lang">
                  <option value="ar">العربية (اللهجة المصرية + ترجمة فصحى)</option>
                  <option value="en" selected>English (Official Subtitles)</option>
                </select>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="chk-reduced-motion">
                تقليل الحركة (Reduced Motion)
              </label>
            </div>
          </div>
        </div>

        <!-- Mobile Touch Virtual Joystick Zone -->
        <div id="virtual-joystick-zone" class="virtual-joystick-zone">
          <div id="joystick-base" class="joystick-base" hidden>
            <div id="joystick-thumb" class="joystick-thumb"></div>
          </div>
        </div>

        <!-- Mobile Floating Action Buttons -->
        <div class="mobile-action-bar">
          <button id="btn-touch-interact" class="mobile-btn mobile-btn-action" title="تفاعل">تفاعل ⚡</button>
          <button id="btn-touch-lens" class="mobile-btn" title="العدسة">عدسة 🛰️</button>
          <button id="btn-touch-book" class="mobile-btn" title="الدفتر">دفتر 📖</button>
          <button id="btn-touch-story" class="mobile-btn" title="Accessible story mode">Story 📜</button>
        </div>
      </div>
    `;

    this._cacheElements();
    this._bindEvents();
  }

  _cacheElements() {
    const q = (sel) => this.container.querySelector(sel);
    this.elements = {
      root: q('#soliq-game-hud'),
      objectiveTitle: q('#hud-objective-title'),
      lensBar: q('#earth-lens-bar'),
      lensTabs: this.container.querySelectorAll('.lens-tab'),
      telemetryToast: q('#telemetry-toast'),
      prompt: q('#interaction-prompt'),
      promptText: q('#prompt-text'),
      dialogueBox: q('#dialogue-box'),
      dialogueAvatar: q('#dialogue-avatar'),
      dialogueSpeaker: q('#dialogue-speaker'),
      dialogueCue: q('#dialogue-cue'),
      dialogueText: q('#dialogue-text'),
      dialogueChoices: q('#dialogue-choices'),
      notebookModal: q('#notebook-modal'),
      notebookBadge: q('#notebook-badge'),
      receiptsList: q('#receipts-list'),
      waterLedger: q('#water-ledger-content'),
      settingsModal: q('#settings-modal'),
      btnEarthLens: q('#btn-earth-lens'),
      btnNotebook: q('#btn-notebook'),
      btnStoryDesk: q('#btn-story-desk'),
      btnCamera: q('#btn-camera'),
      btnAudio: q('#btn-audio'),
      audioIcon: q('#audio-icon'),
      btnSettings: q('#btn-settings'),
      btnCloseNotebook: q('#btn-close-notebook'),
      btnCloseSettings: q('#btn-close-settings'),
      selectQuality: q('#select-quality'),
      selectLang: q('#select-lang'),
      chkReducedMotion: q('#chk-reduced-motion'),
      touchInteract: q('#btn-touch-interact'),
      touchLens: q('#btn-touch-lens'),
      touchBook: q('#btn-touch-book'),
      touchStory: q('#btn-touch-story'),
      joystickZone: q('#virtual-joystick-zone'),
      joystickBase: q('#joystick-base'),
      joystickThumb: q('#joystick-thumb'),
    };
  }

  _bindEvents() {
    const el = this.elements;

    // Earth Lens button & tabs
    el.btnEarthLens.addEventListener('click', () => {
      el.lensBar.classList.toggle('visible');
    });

    el.lensTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        el.lensTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-lens');
        this.callbacks.onLensChange?.(mode);
      });
    });

    // Notebook toggle
    el.btnNotebook.addEventListener('click', () => this.toggleNotebook());
    el.btnCloseNotebook.addEventListener('click', () => this.toggleNotebook(false));
    el.touchBook.addEventListener('click', () => this.toggleNotebook());
    el.btnStoryDesk.addEventListener('click', () => this.callbacks.onToggleStoryDesk?.());
    el.touchStory.addEventListener('click', () => this.callbacks.onToggleStoryDesk?.());

    // Notebook tabs
    const nbTabs = this.container.querySelectorAll('.nb-tab');
    nbTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        nbTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const targetTab = tab.getAttribute('data-nbtab');
        this.container.querySelectorAll('.nb-panel').forEach((p) => (p.hidden = true));
        const activePanel = this.container.querySelector(`#nb-panel-${targetTab}`);
        if (activePanel) activePanel.hidden = false;
      });
    });

    // Camera toggle
    el.btnCamera.addEventListener('click', () => this.callbacks.onToggleCamera?.());

    // Audio mute toggle
    el.btnAudio.addEventListener('click', () => {
      const isMuted = this.callbacks.onToggleMute?.();
      el.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    // Settings
    el.btnSettings.addEventListener('click', () => (el.settingsModal.hidden = false));
    el.btnCloseSettings.addEventListener('click', () => (el.settingsModal.hidden = true));

    el.selectQuality.addEventListener('change', (e) => {
      this.callbacks.onQualityChange?.(e.target.value);
    });

    el.selectLang.addEventListener('change', (e) => {
      this.lang = e.target.value;
      this.setLanguage(this.lang);
    });

    // This setting previously rendered a checkbox without any behavior.
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
    el.chkReducedMotion.checked = prefersReducedMotion;
    document.body.classList.toggle('reduced-motion', prefersReducedMotion);
    el.chkReducedMotion.addEventListener('change', (e) => {
      document.body.classList.toggle('reduced-motion', e.target.checked);
    });

    // Mobile Action buttons
    el.touchInteract.addEventListener('click', () => this.callbacks.onInteractClick?.());
    el.touchLens.addEventListener('click', () => {
      el.lensBar.classList.toggle('visible');
    });
  }

  _setupTouchJoystick() {
    const zone = this.elements.joystickZone;
    const base = this.elements.joystickBase;
    const thumb = this.elements.joystickThumb;

    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      base.style.left = `${startX - 50}px`;
      base.style.top = `${startY - 50}px`;
      base.hidden = false;

      thumb.style.transform = `translate(0px, 0px)`;
    };

    const onTouchMove = (e) => {
      if (base.hidden) return;
      const touch = e.touches[0];
      let dx = touch.clientX - startX;
      let dy = touch.clientY - startY;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      thumb.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalized vector
      this.callbacks.onJoystickMove?.(dx / maxRadius, dy / maxRadius);
    };

    const onTouchEnd = () => {
      base.hidden = true;
      thumb.style.transform = `translate(0px, 0px)`;
      this.callbacks.onJoystickMove?.(0, 0);
    };

    zone.addEventListener('touchstart', onTouchStart, { passive: true });
    zone.addEventListener('touchmove', onTouchMove, { passive: true });
    zone.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  showInteractionPrompt(target) {
    if (!target) {
      this.elements.prompt.hidden = true;
      return;
    }
    const name = this.lang === 'ar' ? target.nameAr || target.id : target.nameEn || target.id;
    this.elements.promptText.textContent = this.lang === 'ar' ? `اضغط [E] أو انقر للتفاعل مع ${name}` : `Press [E] or tap to interact with ${name}`;
    this.elements.prompt.hidden = false;
  }

  showDialogue(dialogue) {
    if (!dialogue) {
      this.elements.dialogueBox.hidden = true;
      return;
    }

    this.activeDialogue = dialogue;
    const el = this.elements;
    el.dialogueSpeaker.textContent = this.lang === 'ar' ? dialogue.speakerAr : dialogue.speakerEn;
    const emotionAr = ({ neutral: 'محايد', hopeful: 'متفائل', concerned: 'قلق', satisfied: 'راضٍ', explaining: 'بيشرح', relieved: 'مرتاح' })[dialogue.emotion] || 'محايد';
    el.dialogueCue.textContent = this.lang === 'ar' ? `الحالة: ${emotionAr}` : `Emotion: ${dialogue.emotion || 'neutral'}`;
    el.dialogueText.textContent = this.lang === 'ar' ? dialogue.textAr : dialogue.textEn;

    // Render choice buttons
    el.dialogueChoices.innerHTML = '';
    dialogue.choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.type = 'button';
      if (c.id) btn.dataset.choiceId = c.id;
      btn.textContent = this.lang === 'ar' ? c.labelAr : c.labelEn;
      btn.addEventListener('click', () => {
        c.onSelect?.();
        this.hideDialogue();
      });
      el.dialogueChoices.appendChild(btn);
    });

    el.dialogueBox.hidden = false;
  }

  hideDialogue() {
    this.activeDialogue = null;
    this.elements.dialogueBox.hidden = true;
  }

  showTelemetryToast(title, details, dataClass = 'observed') {
    const t = this.elements.telemetryToast;
    t.innerHTML = `
      <div class="toast-head">
        <span class="toast-badge badge-${dataClass}">${dataClass.toUpperCase()}</span>
        <strong>${title}</strong>
      </div>
      <div class="toast-body">${details}</div>
    `;
    // Cancel the previous toast's timer. Otherwise an earlier notification can
    // hide a newly opened NASA/Earth Lens message and race Playwright or users.
    if (this._telemetryToastTimer) clearTimeout(this._telemetryToastTimer);
    t.hidden = false;
    this._telemetryToastTimer = setTimeout(() => {
      t.hidden = true;
      this._telemetryToastTimer = null;
    }, 6000);
  }

  toggleNotebook(forceState = null) {
    this.isNotebookOpen = forceState !== null ? forceState : !this.isNotebookOpen;
    this.elements.notebookModal.hidden = !this.isNotebookOpen;
    if (this.isNotebookOpen) {
      this.elements.notebookBadge.classList.remove('pulse');
    }
  }

  updateNotebookReceipts(receipts) {
    this.lastReceipts = receipts;
    const list = this.elements.receiptsList;
    list.innerHTML = '';

    receipts.forEach((r) => {
      const card = document.createElement('div');
      card.className = 'receipt-card';
      const title = this.lang === 'ar' ? r.titleAr : r.titleEn;
      const details = this.lang === 'ar' ? r.detailsAr : r.detailsEn;

      card.innerHTML = `
        <div class="receipt-header">
          <span class="receipt-class class-${r.dataClass}">${r.dataClass.toUpperCase()}</span>
          <span class="receipt-category">${r.category}</span>
          <span class="receipt-hash">${r.hashKind === 'noncryptographic_display_id' ? 'SIM ID' : 'SHA'}: ${r.hash}</span>
        </div>
        <h4 class="receipt-title">${title}</h4>
        <p class="receipt-details">${details}</p>
        <div class="receipt-time">${r.timestamp}</div>
      `;
      list.appendChild(card);
    });

    this.elements.notebookBadge.classList.add('pulse');
  }

  updateWaterLedger(simResult) {
    this.lastSimulation = simResult;
    const w = this.elements.waterLedger;
    const isEn = this.lang === 'en';
    if (!simResult) {
      w.textContent = isEn
        ? 'No canal turn simulated yet. Hear the families, then choose a fictional water-sharing scenario.'
        : 'لم تبدأ محاكاة المسقة بعد. اسمع أهل القرية واختَر سيناريو افتراضيًا لتقاسم المياه.';
      return;
    }

    const { totalDemand, supply, delivered, shortfall, fairness, mode } = simResult;
    const fairnessText = Number.isFinite(fairness) ? (fairness * 100).toFixed(1) + '%' : (isEn ? 'N/A' : 'غير محسوب');
    const terms = isEn
      ? { demand: 'Total demand', supply: 'Available supply', fairness: 'Jain fairness', mode: 'Scenario status',
          field: 'Field', demanded: 'Demand', delivered: 'Delivered', shortage: 'Shortfall' }
      : { demand: 'إجمالي الطلب', supply: 'المورد المتاح', fairness: 'مؤشر العدالة (Jain)', mode: 'حالة المحاكاة',
          field: 'الحقل', demanded: 'الطلب', delivered: 'المسلّم', shortage: 'العجز' };
    w.innerHTML = `
      <div class="ledger-stats-grid">
        <div class="stat-box"><span class="stat-lbl">${terms.demand}:</span><span class="stat-val">${totalDemand} m³</span></div>
        <div class="stat-box"><span class="stat-lbl">${terms.supply}:</span><span class="stat-val">${supply} m³</span></div>
        <div class="stat-box"><span class="stat-lbl">${terms.fairness}:</span><span class="stat-val">${fairnessText}</span></div>
        <div class="stat-box"><span class="stat-lbl">${terms.mode}:</span><span class="stat-val">${mode}</span></div>
      </div>
      <table class="ledger-table">
        <thead><tr><th>${terms.field}</th><th>${terms.demanded}</th><th>${terms.delivered}</th><th>${terms.shortage}</th></tr></thead>
        <tbody>
          ${delivered.map((amt,i)=>`<tr>
            <td>${isEn ? 'Field' : 'غيط'} ${i + 1}</td>
            <td>${(amt + shortfall[i]).toFixed(1)}</td>
            <td>${amt.toFixed(1)}</td>
            <td class="${shortfall[i] > 0 ? 'text-deficit' : 'text-ok'}">${shortfall[i].toFixed(1)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="ledger-note">${isEn ? 'Fictional water allocation — not a verified farm measurement.' : 'توزيع مياه افتراضي — ليس قياسًا حقليًا موثقًا.'}</p>
    `;
  }

  setLanguage(lang) {
    this.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    this.elements.selectLang.value = this.lang;
    localizeGameUi(this.container, this.lang);
    if (this.lastReceipts) this.updateNotebookReceipts(this.lastReceipts);
    if (this.lastSimulation !== undefined) this.updateWaterLedger(this.lastSimulation);
    if (this.activeDialogue) this.showDialogue(this.activeDialogue);
    this.callbacks.onLanguageChange?.(this.lang);
  }
}
