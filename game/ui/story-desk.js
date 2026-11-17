import { getSeasonStoryBeat } from '../core/season-story.js';
import { buildGameEvidenceHandoff } from '../core/evidence-handoff.js';
import { Chapter0Checkpoint } from '../core/chapter-checkpoint.js';

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
    this.checkpoint = new Chapter0Checkpoint(mission, {
      ...(callbacks.storageProvider ? { storageProvider: callbacks.storageProvider } : {}),
    });
    this.checkpointMessage = { en: 'Save is optional.', ar: 'الحفظ اختياري.' };
    this.lang = 'en';
    this.activeScene = null;
    this.isOpen = false;
    this.returnFocus = null;
    this.backgroundInert = [];
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
          <section id="story-thread" class="story-thread" aria-labelledby="story-thread-title">
            <h3 id="story-thread-title">Choose your first clue — optional</h3>
            <p id="story-thread-help">Both are untested story questions. You can visit anyone without choosing.</p>
            <div id="story-thread-list" class="story-thread-list" role="group" aria-label="Opening investigation"></div>
          </section>
          <nav id="story-scene-nav" class="story-scene-nav" aria-label="Choose whom to visit"></nav>
          <section class="story-dialogue" aria-labelledby="story-speaker">
            <h3 id="story-speaker">Choose a scene</h3>
            <p id="story-dialogue-text">Meet the people and consider the season.</p>
            <div id="story-choice-list" class="story-choice-list" role="group" aria-label="Dialogue choices"></div>
          </section>
          <p id="story-announcement" class="story-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
          <section id="story-checkpoint" class="story-checkpoint" aria-labelledby="story-checkpoint-title">
            <h3 id="story-checkpoint-title">Optional local story checkpoint</h3>
            <p id="story-checkpoint-help">Nothing is saved automatically. Save stores only fictional Chapter 0 choices and receipts on this browser profile. No GPS or NASA raw data. Reset deletes this story checkpoint.</p>
            <div class="story-checkpoint-buttons" role="group" aria-label="Manage local Chapter 0 progress">
              <button type="button" id="story-checkpoint-save">Save progress</button>
              <button type="button" id="story-checkpoint-resume">Resume saved progress</button>
              <button type="button" id="story-checkpoint-reset">Reset and delete</button>
            </div>
            <p id="story-checkpoint-status" role="status" aria-live="polite" aria-atomic="true">Save is optional.</p>
          </section>
          <a id="story-rotation-link" href="../../walkthrough/?from=seventh-field" target="_blank" rel="noopener noreferrer">
            Open the real Crop Rotation Workspace ↗
          </a>
          <a id="story-project-link" href="../../explore/" style="display:inline-block;margin-top:12px;color:#cef3ab;font-weight:700;text-underline-offset:4px">Explore all Soil-IQ project areas ↗</a>
          <p id="story-desk-limit" class="story-desk-limit">The 3D free-roam world is visual; this
            companion provides an equivalent Chapter 0 decision path, not a full 3D accessibility certification.</p>
        </div>
      </section>`;
    host.appendChild(this.root);
    this.root.querySelector('#story-desk-close').addEventListener('click', () => this.close());
    this.root.querySelector('#story-checkpoint-save').addEventListener('click', () => this._actCheckpoint('save'));
    this.root.querySelector('#story-checkpoint-resume').addEventListener('click', () => this._actCheckpoint('resume'));
    this.root.querySelector('#story-checkpoint-reset').addEventListener('click', () => this._actCheckpoint('reset'));
    this.root.addEventListener('keydown', (event) => this._onKeyDown(event));
    this.refresh();
  }

  _localize(en, ar) {
    return this.lang === 'ar' ? ar : en;
  }

  _set(id, en, ar) {
    this.root.querySelector('#' + id).textContent = this._localize(en, ar);
  }

  _actCheckpoint(action) {
    const result = this.checkpoint[action]();
    const messages = result.ok
      ? {
          save: { en: 'Saved on this device. Nothing was sent to a server.', ar: 'اتحفظت القصة على الجهاز ده فقط، من غير إرسال للسيرفر.' },
          resume: { en: 'Resumed your saved fictional choices.', ar: 'استكملنا اختياراتك الافتراضية المحفوظة.' },
          reset: { en: 'Story reset; local checkpoint deleted.', ar: 'اتصفّرت القصة واتمسح الحفظ المحلي.' },
        }[action]
      : ({
          not_found: { en: 'No checkpoint saved on this device yet.', ar: 'ما فيش قصة محفوظة على الجهاز ده.' },
          unsupported_version: { en: 'This checkpoint is from an older or unsupported version. Reset it to start again.', ar: 'نسخة قديمة أو غير مدعومة من الحفظ. اختار إعادة البدء لمسحها.' },
          invalid_checkpoint: { en: 'Saved data is damaged or unsafe. No progress was changed; reset it to start again.', ar: 'ملف الحفظ تالف أو غير آمن. القصة ما اتغيرتش؛ اختار إعادة البدء.' },
          storage_unavailable: { en: 'Local storage is blocked or full; no save or reset was confirmed.', ar: 'التخزين المحلي ممنوع أو ممتلئ؛ ما نقدرش نؤكد الحفظ أو المسح.' },
        })[result.reason] || { en: 'Checkpoint action was unavailable.', ar: 'إجراء الحفظ غير متاح.' };
    this.checkpointMessage = messages;
    this._set('story-checkpoint-status', messages.en, messages.ar);
    if (!result.ok) return;
    if (action === 'resume') {
      const flags = this.mission.flags;
      this.activeScene = flags.questionedFuture ? 'pumpStation'
        : flags.talkedToMaryam ? 'timeEcho'
          : flags.talkedToHassan ? 'maryam'
            : flags.firstClue ? 'hassan' : null;
      this.refresh();
      this.callbacks.onCheckpointRestored?.();
    }
    if (action === 'reset') {
      this.activeScene = null;
      this.refresh();
      this.callbacks.onCheckpointReset?.();
    }
    this.callbacks.onMissionChanged?.();
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
    this._set('story-thread-title', 'Choose your first clue — optional', 'اختار أول خيط — اختياري');
    this._set('story-thread-help',
      'Both are untested story questions. You can visit anyone without choosing.',
      'الاتنين أسئلة قصة غير مختبرة. تقدر تزور أي شخصية من غير ما تختار.');
    this._set('story-checkpoint-title', 'Optional local story checkpoint', 'حفظ اختياري للقصة على الجهاز');
    this._set('story-checkpoint-help',
      'Nothing is saved automatically. Save stores only fictional Chapter 0 choices and receipts on this browser profile. No GPS or NASA raw data. Reset deletes this story checkpoint.',
      'ما بنحفظش تلقائيًا. زر الحفظ بيخزن اختيارات الفصل صفر وإيصالاته الافتراضية على المتصفح ده فقط، من غير موقع GPS أو بيانات NASA الخام. إعادة البدء بتمسح الحفظ.');
    this._set('story-checkpoint-save', 'Save progress', 'احفظ التقدم');
    this._set('story-checkpoint-resume', 'Resume saved progress', 'استكمل المحفوظ');
    this._set('story-checkpoint-reset', 'Reset and delete', 'ابدأ من جديد وامسح');
    this._set('story-checkpoint-status', this.checkpointMessage.en, this.checkpointMessage.ar);
    this.root.querySelector('#story-thread-list').setAttribute('aria-label',
      this._localize('Opening investigation', 'بداية التحقيق'));
    this._set('story-rotation-link', 'Open the real Crop Rotation Workspace ↗', 'افتح أداة مقارنة دورات المحاصيل الحقيقية ↗');
    this._set('story-project-link', 'Explore all Soil-IQ project areas ↗', 'تصفح أقسام مشروع Soil-IQ ↗');
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
    // URL includes only an enum describing a fictional story question. The
    // scientific tool must still ask for fresh consent and weather evidence.
    this.root.querySelector('#story-rotation-link').href =
      buildGameEvidenceHandoff(this.mission.flags.cropHypothesis);
    this._set('story-beat-title', beat.titleEn, beat.titleAr);
    this._set('story-beat-text', beat.textEn, beat.textAr);
    this._renderOpeningThreads();
    this._renderScenes();
    this._renderDialogue();
  }

  _renderOpeningThreads() {
    const section = this.root.querySelector('#story-thread');
    const list = this.root.querySelector('#story-thread-list');
    list.replaceChildren();
    section.hidden = Boolean(this.mission.flags.firstClue);
    if (section.hidden) return;
    for (const thread of [
      { id: 'water', en: 'Follow the water — who gets the last turn?', ar: 'اتبع المياه — آخر دور ري لمين؟' },
      { id: 'soil', en: 'Follow the soil — what will protect it next season?', ar: 'اتبع التربة — إيه اللي هيحميها الموسم الجاي؟' },
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `story-thread-${thread.id}`;
      button.className = 'story-choice-btn';
      button.textContent = this._localize(thread.en, thread.ar);
      button.addEventListener('click', () => {
        this.mission.beginInvestigation(thread.id);
        this.callbacks.onMissionChanged?.();
        this.refresh();
        this.root.querySelector('#story-announcement').textContent = this._localize(
          'Your question is recorded as simulated; both plans remain untested. Choose a person to investigate.',
          'اتسجل سؤالك باعتباره افتراضيًا؛ الخطتان لسه غير مختبرتين. اختار شخصية علشان تكمّل التحقيق.');
        this.root.querySelector('#story-scene-nav button')?.focus();
      });
      list.appendChild(button);
    }
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
        const speaker = this.root.querySelector('#story-speaker').textContent;
        const dialogueText = this.root.querySelector('#story-dialogue-text').textContent;
        const dialogue = this.mission.getDialogueForTarget({ id: scene.id });
        const emotion = this._localize(
          `Emotion: ${dialogue?.emotion || 'neutral'}`,
          `الحالة: ${({ concerned: 'قلق', hopeful: 'متفائل', satisfied: 'راضٍ', explaining: 'بيشرح', neutral: 'محايد' })[dialogue?.emotion] || 'محايد'}`,
        );
        this.root.querySelector('#story-announcement').textContent = `${speaker} (${emotion}). ${dialogueText}`;
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
      if (choice.id) button.dataset.choiceId = choice.id;
      button.setAttribute('aria-describedby', 'story-dialogue-text');
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
    // Keep the 3D HUD, moving canvas, and text-route page content outside
    // the modal's accessibility tree. The desk can be hosted in a nested UI
    // container, so isolate siblings at every ancestor up to the body.
    let node = this.root;
    while (node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling === node || sibling.tagName === 'SCRIPT') continue;
        this.backgroundInert.push({ element: sibling, wasInert: sibling.inert });
        sibling.inert = true;
      }
      node = node.parentElement;
      if (node === document.body) break;
    }
    this.root.hidden = false;
    this.refresh();
    this.root.querySelector('#story-desk-close').focus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.hidden = true;
    for (const { element, wasInert } of this.backgroundInert) element.inert = wasInert;
    this.backgroundInert = [];
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
