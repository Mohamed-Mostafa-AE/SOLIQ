/**
 * SOLIQ: The Seventh Field - Diegetic HUD, Dialogue System & Accessibility
 * Responsive bilingual interface, evidence notebook drawer, virtual touch joystick.
 */

export class GameHUD {
  constructor(containerElement, callbacks = {}) {
    this.container = containerElement;
    this.callbacks = callbacks;
    this.lang = 'ar'; // 'ar' | 'en'

    this.elements = {};
    this.isNotebookOpen = false;
    this.isSettingsOpen = false;

    this._buildHUD();
    this._setupTouchJoystick();
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
            <button id="btn-camera" class="hud-tool-btn" title="تبديل الكاميرا (Tab)">
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
                  <option value="balanced" selected>متوازن (Balanced 60fps)</option>
                  <option value="low">منخفض للأجهزة القديمة (Low 30fps)</option>
                  <option value="ultra">فائق (Ultra Shadows & Bloom)</option>
                </select>
              </label>
              <label>
                لغة الحوار والترجمة (Language):
                <select id="select-lang">
                  <option value="ar" selected>العربية (اللهجة المصرية + ترجمة فصحى)</option>
                  <option value="en">English (Official Subtitles)</option>
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
      dialogueText: q('#dialogue-text'),
      dialogueChoices: q('#dialogue-choices'),
      notebookModal: q('#notebook-modal'),
      notebookBadge: q('#notebook-badge'),
      receiptsList: q('#receipts-list'),
      waterLedger: q('#water-ledger-content'),
      settingsModal: q('#settings-modal'),
      btnEarthLens: q('#btn-earth-lens'),
      btnNotebook: q('#btn-notebook'),
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
    this.elements.promptText.textContent = `اضغط [E] أو انقر للتفاعل مع ${name}`;
    this.elements.prompt.hidden = false;
  }

  showDialogue(dialogue) {
    if (!dialogue) {
      this.elements.dialogueBox.hidden = true;
      return;
    }

    const el = this.elements;
    el.dialogueSpeaker.textContent = this.lang === 'ar' ? dialogue.speakerAr : dialogue.speakerEn;
    el.dialogueText.textContent = this.lang === 'ar' ? dialogue.textAr : dialogue.textEn;

    // Render choice buttons
    el.dialogueChoices.innerHTML = '';
    dialogue.choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
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
    const w = this.elements.waterLedger;
    if (!simResult) {
      w.innerHTML = '<p>لم يتم تشغيل محاكاة المسقة بعد. شغّل طلمبة الري لمعاينة التوزيع.</p>';
      return;
    }

    const { totalDemand, supply, delivered, shortfall, fairness, mode } = simResult;
    const fairnessText = Number.isFinite(fairness) ? (fairness * 100).toFixed(1) + '%' : 'غير محسوب';
    w.innerHTML = `
      <div class="ledger-stats-grid">
        <div class="stat-box">
          <span class="stat-lbl">إجمالي الطلب:</span>
          <span class="stat-val">${totalDemand} م³</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">المورد المتاح:</span>
          <span class="stat-val">${supply} م³</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">مؤشر العدالة (Jain):</span>
          <span class="stat-val">${fairnessText}</span>
        </div>
        <div class="stat-box">
          <span class="stat-lbl">حالة المحاكاة:</span>
          <span class="stat-val">${mode}</span>
        </div>
      </div>
      <table class="ledger-table">
        <thead>
          <tr>
            <th>الحقل</th>
            <th>الطلب</th>
            <th>المسلّم</th>
            <th>العجز</th>
          </tr>
        </thead>
        <tbody>
          ${delivered
            .map(
              (amt, i) => `
            <tr>
              <td>غيط ${i + 1}</td>
              <td>${amt + shortfall[i]}</td>
              <td>${amt.toFixed(1)}</td>
              <td class="${shortfall[i] > 0 ? 'text-deficit' : 'text-ok'}">${shortfall[i].toFixed(1)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  setLanguage(lang) {
    this.lang = lang;
    this.elements.root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
}
