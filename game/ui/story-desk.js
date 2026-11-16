import { getSeasonStoryBeat } from '../core/season-story.js';

const SCENES = Object.freeze([
  { id: 'hassan', en: 'Hassan · Water turns', ar: 'حسن · دور المياه' },
  { id: 'maryam', en: 'Maryam · Soil cover', ar: 'مريم · غطاء التربة' },
  { id: 'timeEcho', en: 'Seventh Field · Future', ar: 'الأرض السابعة · المستقبل' },
  { id: 'pumpStation', en: 'Canal Council · Decide', ar: 'مجلس المسقة · القرار' },
]);

/**
 * Keyboard and screen-reader accessible companion for Chapter 0.
 * Invokes the same authored mission choices and water engine as 3D,
 * without requiring any movement through the scene.
 * This is not a claim that the full 3D world is screen-reader navigable.
 */
export class AccessibleStoryDesk {
  constructor(host, mission, callbacks = {}) {
    if (!host || !mission) throw new TypeError('Story desk requires a host and mission');
    this.host = host;
    this.mission = mission;
    this.callbacks = callbacks;
    this.lang = 'en';
    this.activeScene = null;
    this.isOpen = false;
    this.returnFocus = null;
    this.root = document.createElement('div');
    this.root.id = 'story-desk-overlay';
    this.root.className = 'story-desk-overlay';
    this.root.hidden = true;
    this.root.innerHTML = `
      <section id="story-desk" class="story-desk" role="dialog" aria-modal="true"
        aria-labelledby="story-desk-title" aria-describedby="story-desk-help">
        <header class="story-desk-header">
          <div>
            <p id="story-desk-kicker" class="story-desk-kicker">THE SEVENTH FIELD · CHAPTER 0</p>
            <h2 id="story-desk-title">The Season That Hasn't Happened Yet</h2>
          </div>
          <button id="story-desk-close" type="button" aria-label="Close story mode">✕</button>
        </header>
        <div class="story-desk-body">
          <p id="story-desk-help" class="story-desk-help">Text-first story path: use Tab, Enter or Space.
            All dialogue is captioned; no spatial navigation or sound is needed here.</p>
          <div id="story-desk-source" class="story-source-label">SIMULATED STORY · NOT A NASA OBSERVATION</div>
          <h3 id="story-beat-title"></h3>
          <p id="story-beat-text"></p>
          <nav id="story-scene-nav" class="story-scene-nav" aria-label="Choose whom to visit"></nav>
          <section class="story-dialogue" aria-labelledby="story-speaker">
            <h3 id="story-speaker">Choose a scene</h3>
            <p id="story-dialogue-text">Meet the people and consider the season.</p>
            <div id="story-choice-list" class="story-choice-list" role="group" aria-label="Dialogue choices"></div>
          </section>
          <p id="story-announcement" class="story-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
          <a id="story-rotation-link" href="../../#rotations" target="_blank" rel="noopener noreferrer">
            Open the real Crop Rotation Workspace ↗
          </a>
          <p id="story-desk-limit" class="story-desk-limit">The 3D free-roam world is visual; this
            companion provides an equivalent Chapter 0 decision path, not a full 3D accessibility certification.</p>
        </div>
      </section>`;
    host.appendChild(this.root);
    this.root.querySelector('#story-desk-close').addEventListener('click', () => this.close());
    this.root.addEventListener('keydown', (event) => this._onKeyDown(event));
    this.refresh();
  }

  _localize(en, ar) {
    return this.lang === 'ar' ? ar : en;
  }

  _set(id, en, ar) {
    this.root.querySelector('#' + id).textContent = this._localize(en, ar);
  }

  setLanguage(language) {
    this.lang = language === 'ar' ? 'ar' : 'en';
    this.root.querySelector('#story-desk').setAttribute('dir', this.lang === 'ar' ? 'rtl' : 'ltr');
    this._set('story-desk-kicker', 'THE SEVENTH FIELD · CHAPTER 0', 'الأرض السابعة · الفصل صفر');
    this._set('story-desk-title', "The Season That Hasn't Happened Yet", 'الموسم اللي لسه ما حصلش');
    this._set('story-desk-help',
      'Text-first story path: use Tab, Enter or Space. All dialogue is captioned; no spatial navigation or sound is needed here.',
      'مسار قصة نصي: استخدم Tab وEnter أو Space. جميع الحوارات مكتوبة ولا تحتاج للحركة في العالم أو سماع الصوت.');
    this._set('story-desk-source', 'SIMULATED STORY · NOT A NASA OBSERVATION', 'قصة افتراضية · ليست رصدًا من NASA');
    this._set('story-desk-limit',
      'The 3D free-roam world is visual; this companion provides an equivalent Chapter 0 decision path, not a full 3D accessibility certification.',
      'العالم ثلاثي الأبعاد يعتمد على الرؤية؛ هذا المسار يوفر اختيارات الفصل صفر نصيًا ولا يعني اكتمال إتاحة التجوال ثلاثي الأبعاد.');
    this._set('story-rotation-link', 'Open the real Crop Rotation Workspace ↗', 'افتح أداة مقارنة دورات المحاصيل الحقيقية ↗');
    this.root.querySelector('#story-desk-close').setAttribute('aria-label',
      this._localize('Close story mode', 'إغلاق وضع القصة'));
    this.root.querySelector('#story-scene-nav').setAttribute('aria-label',
      this._localize('Choose whom to visit', 'اختر الشخصية أو المكان'));
    this.root.querySelector('#story-choice-list').setAttribute('aria-label',
      this._localize('Dialogue choices', 'اختيارات الحوار'));
    this.refresh();
  }

  refresh() {
    const beat = getSeasonStoryBeat(this.mission.flags, this.mission.activeOutcome);
    this._set('story-beat-title', beat.titleEn, beat.titleAr);
    this._set('story-beat-text', beat.textEn, beat.textAr);
    this._renderScenes();
    this._renderDialogue();
  }

  _renderScenes() {
    const nav = this.root.querySelector('#story-scene-nav');
    nav.replaceChildren();
    for (const scene of SCENES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'story-scene-btn';
      button.dataset.storyTarget = scene.id;
      button.textContent = this._localize(scene.en, scene.ar);
      button.setAttribute('aria-pressed', String(scene.id === this.activeScene));
      button.addEventListener('click', () => {
        this.activeScene = scene.id;
        this.refresh();
        const firstChoice = this.root.querySelector('#story-choice-list button');
        if (firstChoice) firstChoice.focus();
      });
      nav.appendChild(button);
    }
  }

  _renderDialogue() {
    const list = this.root.querySelector('#story-choice-list');
    list.replaceChildren();
    const dialogue = this.activeScene
      ? this.mission.getDialogueForTarget({ id: this.activeScene })
      : null;
    this._set('story-speaker',
      dialogue?.speakerEn || 'Choose a scene',
      dialogue?.speakerAr || 'اختر شخصية أو مكان');
    this._set('story-dialogue-text',
      dialogue?.textEn || 'Talk to the village and test a fictional decision.',
      dialogue?.textAr || 'اتكلم مع أهل القرية وجرب قرارًا افتراضيًا.');
    if (!dialogue) return;
    dialogue.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'story-choice-btn';
      button.textContent = this._localize(choice.labelEn, choice.labelAr);
      button.addEventListener('click', () => {
        choice.onSelect?.();
        this.callbacks.onMissionChanged?.();
        this.refresh();
        this._set('story-announcement',
          'Choice recorded in the fictional story. Check the notebook and the canal ledger.',
          'تم تسجيل القرار في القصة الافتراضية. راجع الدفتر وحسابات المسقة.');
        this.root.querySelector(`[data-story-target="${this.activeScene}"]`)?.focus();
      });
      list.appendChild(button);
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.returnFocus = document.activeElement;
    this.root.hidden = false;
    this.refresh();
    this.root.querySelector('#story-desk-close').focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.hidden = true;
    if (this.returnFocus?.isConnected && typeof this.returnFocus.focus === 'function') {
      this.returnFocus.focus();
    }
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  _onKeyDown(event) {
    // Prevent game-movement shortcuts from firing while text-story UI is active.
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
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
