/**
 * Soil-IQ: The Seventh Field - Mission Chapter 0: "An Unwritten Season"
 * Authored interactive quest graph with player agency within 10 seconds,
 * branching dialogues, pump/gate actions, and three distinct outcomes.
 */

import { sharedEvents, EMOTIONS, GESTURES, OUTCOMES } from '../core/events.js';
import { sustainabilityLesson } from '../core/sustainability.js';

const SNAPSHOT_VERSION = 1;
const STAGES = Object.freeze(['intro', 'meet_hassan', 'meet_maryam', 'pump_ready', 'executed']);
const BOOL_FLAGS = Object.freeze([
  'talkedToHassan', 'talkedToMaryam', 'inspectedSoil', 'questionedFuture',
  'pumpStarted', 'cooperationRiskFlag', 'evidenceRequested',
]);
const ENUM_FLAGS = Object.freeze({
  firstClue: [null, 'water', 'soil'],
  selectedPolicy: ['proportional', 'capacity_limited'],
  hassanStance: [null, 'cooperative', 'cautious', 'head_priority'],
  maryamStance: [null, 'aligned', 'cover_advocate', 'skeptical_stress_test'],
  livelihoodPriority: ['balanced', 'immediate_cash', 'risk_averse'],
  soilCoverChoice: [null, 'living_cover', 'moisture_checked', 'bare_fallow_risk'],
  cropHypothesis: [null, 'cover_first', 'water_saving', 'deferred_for_nasa'],
  councilMode: [null, 'standard_proportional', 'cover_buffered_turn', 'bottleneck_overload', 'evidence_deferral'],
});
const RECEIPT_KEYS = Object.freeze([
  'id', 'titleAr', 'titleEn', 'category', 'dataClass', 'timestamp',
  'detailsAr', 'detailsEn', 'hash', 'hashKind',
]);
const isRecord = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value, keys) => isRecord(value) &&
  Object.keys(value).length === keys.length &&
  keys.every(key => Object.hasOwn(value, key));
const safeText = (value, max) => typeof value === 'string' && value.length <= max && !/[<>]/.test(value);

/** Accept only the authored story's bounded, non-sensitive state contract. No GPS or PII fields. */
function validateChapter0Snapshot(snapshot) {
  if (!exactKeys(snapshot, ['version', 'stage', 'activeOutcome', 'flags', 'notebookReceipts']) ||
      snapshot.version !== SNAPSHOT_VERSION) {
    throw new TypeError('Unsupported Chapter 0 checkpoint version or shape');
  }
  if (!STAGES.includes(snapshot.stage) ||
      !Object.values(OUTCOMES).includes(snapshot.activeOutcome) ||
      (snapshot.stage === 'executed') !== (snapshot.activeOutcome !== OUTCOMES.NONE)) {
    throw new TypeError('Invalid Chapter 0 checkpoint stage/outcome');
  }
  const flags = snapshot.flags;
  const expectedFlagKeys = [...BOOL_FLAGS, ...Object.keys(ENUM_FLAGS), 'relationships'];
  if (!exactKeys(flags, expectedFlagKeys)) throw new TypeError('Invalid or unsafe Chapter 0 checkpoint flags');
  for (const key of BOOL_FLAGS) {
    if (typeof flags[key] !== 'boolean') throw new TypeError('Invalid Chapter 0 checkpoint boolean flag');
  }
  for (const [key, values] of Object.entries(ENUM_FLAGS)) {
    if (!values.includes(flags[key])) throw new TypeError(`Invalid Chapter 0 checkpoint enum: ${key}`);
  }
  if (!exactKeys(flags.relationships, ['hassanTrust', 'maryamTrust']) ||
      !['hassanTrust', 'maryamTrust'].every(key =>
        Number.isInteger(flags.relationships[key]) && flags.relationships[key] >= 0 && flags.relationships[key] <= 2)) {
    throw new TypeError('Invalid Chapter 0 checkpoint relationships');
  }
  if (snapshot.activeOutcome !== OUTCOMES.NONE &&
      flags.pumpStarted !== (snapshot.activeOutcome !== OUTCOMES.DEFERRAL)) {
    throw new TypeError('Invalid Chapter 0 checkpoint pump state');
  }
  if ((snapshot.activeOutcome === OUTCOMES.EQUILIBRIUM && flags.selectedPolicy !== 'proportional') ||
      (snapshot.activeOutcome === OUTCOMES.BOTTLENECK && flags.selectedPolicy !== 'capacity_limited')) {
    throw new TypeError('Invalid Chapter 0 checkpoint simulated policy');
  }
  if (!Array.isArray(snapshot.notebookReceipts) || snapshot.notebookReceipts.length > 100) {
    throw new TypeError('Invalid Chapter 0 checkpoint receipts count');
  }
  const receipts = snapshot.notebookReceipts.map(receipt => {
    if (!exactKeys(receipt, RECEIPT_KEYS) || !/^[A-Za-z0-9_]{1,80}$/.test(receipt.id) ||
        !safeText(receipt.titleAr, 200) || !safeText(receipt.titleEn, 200) ||
        !safeText(receipt.category, 120) || !safeText(receipt.detailsAr, 1500) ||
        !safeText(receipt.detailsEn, 1500) || receipt.dataClass !== 'simulated' ||
        receipt.hashKind !== 'noncryptographic_display_id' ||
        !/^SIM-\d{4,}$/.test(receipt.hash) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(receipt.timestamp) ||
        !Number.isFinite(Date.parse(receipt.timestamp))) {
      throw new TypeError('Unsafe Chapter 0 checkpoint receipt');
    }
    return Object.fromEntries(RECEIPT_KEYS.map(key => [key, receipt[key]]));
  });
  return {
    version: SNAPSHOT_VERSION,
    stage: snapshot.stage,
    activeOutcome: snapshot.activeOutcome,
    flags: Object.fromEntries([
      ...BOOL_FLAGS.map(key => [key, flags[key]]),
      ...Object.keys(ENUM_FLAGS).map(key => [key, flags[key]]),
      ['relationships', { hassanTrust: flags.relationships.hassanTrust, maryamTrust: flags.relationships.maryamTrust }],
    ]),
    notebookReceipts: receipts,
  };
}

export class Chapter0Mission {
  constructor(village, characters, waterEngine, audio) {
    this.village = village;
    this.characters = characters;
    this.waterEngine = waterEngine;
    this.audio = audio;

    this.stage = 'intro'; // 'intro' | 'meet_hassan' | 'meet_maryam' | 'pump_ready' | 'executed'
    this.activeOutcome = OUTCOMES.NONE;

    this.flags = {
      firstClue: null,
      talkedToHassan: false,
      talkedToMaryam: false,
      inspectedSoil: false,
      questionedFuture: false,
      pumpStarted: false,
      selectedPolicy: 'proportional',
      hassanStance: null,
      maryamStance: null,
      livelihoodPriority: 'balanced',
      soilCoverChoice: null,
      cropHypothesis: null,
      cooperationRiskFlag: false,
      evidenceRequested: false,
      councilMode: null,
      relationships: { hassanTrust: 0, maryamTrust: 0 },
    };

    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.notebookReceipts = [];

    this._initMission();
  }

  _initMission() {
    // Add initial objective to notebook
    this.addReceipt({
      id: 'REC_CH0_START',
      titleAr: 'مجلس الفجر: لغز الأرض السابعة',
      titleEn: 'Dawn Council: The Seventh Field Mystery',
      category: 'Mission Briefing',
      dataClass: 'simulated',
      timestamp: new Date().toISOString(),
      detailsAr: 'في فجر خيالي، ست عائلات تناقش تقسيم المياه وتظهر الأرض السابعة بموسمين محتملين في حكاية ندى. اسمع الجميع ثم جرّب قراراتك؛ ليست تنبؤات حقيقية.',
      detailsEn: 'At dawn, six families face a water-sharing decision, while a seventh field shows two possible seasons in Nada’s storybook. Explore people, then test choices; no real future is predicted.',
    });
  }

  addReceipt(receipt) {
    this.notebookReceipts.unshift({
      ...receipt,
      hash: `SIM-${String(this.notebookReceipts.length + 1).padStart(4, '0')}`, // Display receipt ID, NOT SHA-256 evidence hash
      hashKind: 'noncryptographic_display_id',
    });
    this.audio.playNotebookChime();
  }

  /** Pure JSON snapshot. Storage, consent and replay belong to a later checkpoint task. */
  getSerializableState() {
    return validateChapter0Snapshot({
      version: SNAPSHOT_VERSION,
      stage: this.stage,
      activeOutcome: this.activeOutcome,
      flags: this.flags,
      notebookReceipts: this.notebookReceipts.slice(0, 100),
    });
  }

  /** Atomic restore of validated narrative flags and receipts; deliberately no pump replay. */
  restoreState(snapshot) {
    const clean = validateChapter0Snapshot(snapshot);
    this.stage = clean.stage;
    this.activeOutcome = clean.activeOutcome;
    this.flags = clean.flags;
    this.notebookReceipts = clean.notebookReceipts;
    this.currentDialogue = null;
    this.dialogueQueue = [];
    sharedEvents.emit('mission_receipts_updated');
    return true;
  }

  /**
   * Explicitly rehydrate fictional 3D scene visuals after a user-selected
   * resume. State restore alone stays pure; this does not add receipts or
   * replay any observed NASA evidence. It does rerun the same modelled
   * scenario from its declared assumptions, not actual canal hydraulics.
   */
  rehydrateWorldEffects() {
    const outcome = this.activeOutcome;
    if (outcome === OUTCOMES.NONE) return false;
    if (outcome === OUTCOMES.DEFERRAL) {
      this.waterEngine.setPumpState(false);
      for (const gate of ['gate_head', 'gate_hassan', 'gate_maryam']) {
        this.village.setGateOpen(gate, false);
      }
      return true;
    }
    const coverBuffered = outcome === OUTCOMES.EQUILIBRIUM &&
      this.flags.councilMode === 'cover_buffered_turn' && this.flags.inspectedSoil &&
      this.flags.soilCoverChoice === 'living_cover';
    const supply = outcome === OUTCOMES.EQUILIBRIUM ? 235 : 120;
    const policy = outcome === OUTCOMES.EQUILIBRIUM ? 'proportional' : 'capacity_limited';
    this.waterEngine.setPumpState(true, false);
    const result = this.waterEngine.runSimulation(supply, this._scenarioDemands(outcome, coverBuffered), policy);
    this.waterEngine.applySimulationToWorld(result);
    for (const gate of ['gate_head', 'gate_hassan', 'gate_maryam']) {
      this.village.setGateOpen(gate, true);
    }
    const emotion = outcome === OUTCOMES.EQUILIBRIUM ? EMOTIONS.SATISFIED : EMOTIONS.CONCERNED;
    this.characters.setActorEmotion('hassan', emotion);
    this.characters.setActorEmotion('maryam', emotion);
    return true;
  }

  _scenarioDemands(outcome, coverBuffered = false) {
    return coverBuffered
      ? [32, 41, 54, 37, 23, 28]
      : outcome === OUTCOMES.BOTTLENECK && this.flags.hassanStance === 'head_priority'
        ? [45, 50, 60, 40, 25, 30]
        : [35, 45, 60, 40, 25, 30];
  }

  /** The opening branch is a research question, never a crop recommendation. */
  beginInvestigation(clue) {
    if (!['water', 'soil'].includes(clue)) {
      throw new RangeError('Unknown opening investigation');
    }
    if (this.flags.firstClue) return false;
    this.flags.firstClue = clue;
    const water = clue === 'water';
    this.addReceipt({
      id: water ? 'STORY_CLUE_WATER' : 'STORY_CLUE_SOIL',
      titleAr: water ? 'سؤال ندى: جدول حصص المياه' : 'سؤال ندى: غطاء التربة',
      titleEn: water ? 'Water-turn question' : 'Soil-cover question',
      category: 'Opening Investigation',
      dataClass: 'simulated',
      timestamp: new Date().toISOString(),
      detailsAr: water
        ? 'اخترت البحث أولًا في مواعيد المياه المفترضة. لا توجد توصية مؤكدة ولا قياس ميداني في هذا المشهد.'
        : 'اخترت البحث أولًا في الغطاء النباتي والدورة الزراعية. لا توجد نتيجة محسومة أو رصد من أقمار NASA في هذا المشهد.',
      detailsEn: water
        ? 'You chose to investigate the fictional water schedule first. This is a question, not a tested irrigation recommendation.'
        : 'You chose to investigate fictional soil-cover and crop-calendar trade-offs first. No winner has been established and no NASA observation is shown here.',
    });
    sharedEvents.emit('mission_receipts_updated');
    return true;
  }

  getDialogueForTarget(target) {
    if (!target) return null;
    const id = target.id;

    if (id === 'hassan') {
      return this._getHassanDialogue();
    } else if (id === 'maryam') {
      return this._getMaryamDialogue();
    } else if (id === 'pumpStation' || target.name === 'pumpTrigger' || id === 'pump') {
      return this._getPumpDialogue();
    } else if (id === 'f7' || id === 'timeEcho') {
      return this._getSeventhFieldDialogue();
    }

    return null;
  }

  _getHassanDialogue() {
    if (!this.flags.talkedToHassan) {
      const introEn = this.flags.firstClue === 'water'
        ? 'You brought the old water-turn ledger, Nada. A schedule only works if the canal has enough capacity; let us test it before promising anyone a full turn. Maryam may see what this misses about next season.'
        : this.flags.firstClue === 'soil'
          ? 'You started with the soil calendar, Nada? That is worth asking about. But no crop plan works if we ignore when the canal can actually deliver water. Let us test the turn, then hear Maryam.'
          : 'Welcome, Nada! The turn has begun. If canal and pump capacity are sufficient we can all irrigate. Let us inspect this turn rather than assume a fault or tail shortage.';
      const introAr = this.flags.firstClue === 'water'
        ? 'معاكي دفتر نوبات المياه القديم يا ندى؟ أي جدول محتاج سعة كافية. لازم نحسب قبل ما نوعد حد بدوره كامل. ومريم ممكن تشوف حاجة تانية تخص الموسم الجاي.'
        : this.flags.firstClue === 'soil'
          ? 'بدأتي من تقويم التربة يا ندى؟ سؤال مهم. بس أي دورة زراعية محتاجة نعرف المسقة توصل مياه إمتى. تعالي نحسب الدور ونسمع مريم.'
          : 'يا أهلاً يا باشمهندسة ندى! المية وصلت. لو التصرف والسعة كافيين كلنا ممكن نروي. خلينا نفحص الطلمبة ووقت النوبة؛ العطل أو ضعف الضغط احتمال مش قاعدة ثابتة.';
      return {
        speakerAr: 'عم حسن (مزارع قمح)',
        speakerEn: 'Uncle Hassan (Wheat Farmer)',
        textAr: introAr,
        textEn: introEn,
        emotion: EMOTIONS.EXPLAINING,
        choices: [
          {
            id: 'hassan_pledge_fair_turn',
            labelAr: 'هننظم دورات ري متناوبة ومنصفة يا عم حسن.',
            labelEn: 'We will coordinate balanced, turn-based irrigation, Uncle Hassan.',
            onSelect: () => {
              this.flags.talkedToHassan = true;
              this.flags.hassanStance = 'cooperative';
              this.flags.selectedPolicy = 'proportional';
              this.flags.livelihoodPriority = 'balanced';
              this.flags.relationships.hassanTrust = Math.min(2, this.flags.relationships.hassanTrust + 1);
              this.stage = this.flags.talkedToMaryam ? 'pump_ready' : 'meet_maryam';
              this.characters.setActorEmotion('hassan', EMOTIONS.SATISFIED);
              this.addReceipt({
                id: 'REC_HASSAN_AGREEMENT',
                titleAr: 'شهادة عم حسن: الاتفاق على تنظيم الأدوار',
                titleEn: "Hassan's Testimony: Turn-Coordination Agreement",
                category: 'Farmer Consultation',
                dataClass: 'simulated',
                timestamp: new Date().toISOString(),
                detailsAr: 'وافق عم حسن على الري المتناوب بنسبة الاحتياج الفعلي لحماية باقي مزارعي المسقة.',
                detailsEn: 'Hassan agreed to coordinated proportional turns to preserve downstream water.',
              });
            },
          },
          {
            id: 'hassan_inspect_soil_first',
            labelAr: 'خلينا نقيس رطوبة التربة الأول قبل ما نفتح البوابة.',
            labelEn: 'Let us check soil moisture first before opening the gate.',
            onSelect: () => {
              this.flags.talkedToHassan = true;
              this.flags.inspectedSoil = true;
              this.flags.hassanStance = 'cautious';
              this.flags.soilCoverChoice = 'moisture_checked';
              this.flags.relationships.hassanTrust = Math.min(2, this.flags.relationships.hassanTrust + 1);
              this.stage = this.flags.talkedToMaryam ? 'pump_ready' : 'meet_maryam';
              this.characters.setActorEmotion('hassan', EMOTIONS.HOPEFUL);
              this.addReceipt({
                id: 'REC_SOIL_INSPECT',
                titleAr: 'فحص عينة التربة: غيط القمح',
                titleEn: 'Soil Core Sample: Wheat Plot',
                category: 'Field Evidence',
                dataClass: 'simulated',
                timestamp: new Date().toISOString(),
                detailsAr: 'في هذا السيناريو التعليمي فقط، نفترض قراءة رطوبة 24%؛ لا تُعد قياسًا حقليًا ولا تثبت أمان تأجيل الري الحقيقي.',
                detailsEn: 'This fictional teaching scenario assumes a 24% moisture reading; it is not a verified field measurement or safe-irrigation advice.',
              });
            },
          },
          {
            id: 'hassan_prioritize_wheat_livelihood',
            labelAr: 'فاهم ضغط قسط القمح، بس هنختبر أثر أولوية أول المسقة على الجميع.',
            labelEn: 'I hear your wheat-loan pressure. Let us stress-test a head-first proposal for everyone.',
            onSelect: () => {
              this.flags.talkedToHassan = true;
              this.flags.hassanStance = 'head_priority';
              this.flags.selectedPolicy = 'capacity_limited';
              this.flags.livelihoodPriority = 'immediate_cash';
              this.flags.cooperationRiskFlag = true;
              this.flags.relationships.hassanTrust = Math.min(2, this.flags.relationships.hassanTrust + 1);
              this.stage = this.flags.talkedToMaryam ? 'pump_ready' : 'meet_maryam';
              this.characters.setActorEmotion('hassan', EMOTIONS.CONCERNED);
              this.addReceipt({
                id: 'REC_HASSAN_LIVELIHOOD',
                titleAr: 'حسن: ضغط الديون ومخاطر أولوية أول المسقة',
                titleEn: 'Hassan: Livelihood Pressure and Head-First Risk',
                category: 'Farmer Consultation', dataClass: 'simulated',
                timestamp: new Date().toISOString(),
                detailsAr: 'اختيار قصصي افتراضي يكشف تعارض دخل الموسم وعدالة المياه؛ المحرك لا يحاكي فرق الضغط الحقيقي بين أول وآخر المسقة.',
                detailsEn: 'A fictional priority proposal, not verified head-to-tail hydraulics. The solver only tests aggregate limited capacity and cannot prove tail-end deprivation.',
              });
            },
          },
        ],
      };
    } else {
      return {
        speakerAr: 'عم حسن',
        speakerEn: 'Uncle Hassan',
        textAr: 'ربنا يوفقك يا بنتي. شوفي مريم عند البوابة التانية، وربنا يجعل فيها البركة.',
        textEn: 'God bless your work, Nada. Check in with Maryam at Gate 2 so we keep our schedule intact.',
        emotion: EMOTIONS.SATISFIED,
        choices: [{ id: 'hassan_acknowledge', labelAr: 'تمام يا عم حسن.', labelEn: 'Understood, Uncle Hassan.', onSelect: () => {} }],
      };
    }
  }

  _getMaryamDialogue() {
    const introEn = this.flags.hassanStance === 'head_priority'
      ? 'Hassan told me about the head-first proposal, Nada. The loan is real, but we must test any harm to families farther down this fictional canal.'
      : this.flags.inspectedSoil
      ? 'Hassan said you checked below the soil crust before promising water. That is a better starting question for the berseem cover plan, but still not a field-calibrated measurement.'
      : this.flags.hassanStance === 'cooperative'
      ? 'Hassan has agreed to test shared turns. Let us check whether keeping the soil covered changes the trade-off before the council meets.'
      : this.flags.firstClue === 'soil'
      ? 'You found the torn crop calendar, Nada. More weeks of soil cover may matter, but that alone cannot prove which rotation is best. Let us compare the water assumptions and bring the unanswered question to the council.'
      : this.flags.firstClue === 'water'
        ? 'You began with Hassan\'s water ledger. Fair turns matter, and so does what the soil needs next season. Let us calculate supply carefully and keep both crop calendars open to evidence.'
        : 'Good morning, Nada. The lesson compares a sufficient-supply turn with a limited-capacity turn; we should calculate the actual water delivered in each window.';
    const introAr = this.flags.hassanStance === 'head_priority'
      ? 'عم حسن حكالي عن أولوية أول المسقة يا ندى. القسط حقيقي، بس لازم نفحص أثر الاقتراح على باقي العائلات في السيناريو الافتراضي.'
      : this.flags.inspectedSoil
      ? 'عم حسن قال إنك فحصتي تحت قشرة التربة قبل ما نوعد بالمياه. سؤال أحسن لغطاء البرسيم، لكن ده مش قياس ميداني معاير.'
      : this.flags.hassanStance === 'cooperative'
      ? 'عم حسن وافق يجرب تقسيم الدور. تعالي نفحص لو غطاء التربة هيغير المفاضلة قبل اجتماع المجلس.'
      : this.flags.firstClue === 'soil'
      ? 'لقيتي تقويم المحاصيل الممزق يا ندى. الغطاء النباتي ممكن يفرق، لكن ده لوحده مش دليل إن دورة زراعية أفضل. تعالي نفحص افتراضات المياه ونطرح السؤال على المجلس.'
      : this.flags.firstClue === 'water'
        ? 'بدأتي بدفتر المياه بتاع حسن. عدالة الأدوار مهمة، وكمان التربة الموسم الجاي. تعالي نحسب السعة ونسيب الخطتين مفتوحين للدليل.'
        : 'صباح الخير يا ندى. البرسيم عندي محتاج رية محسوبة. قدامنا مثالين افتراضيين: سعة تكفي الستة، أو سعة أقل من الطلب. لازم نحسب النتيجة من نافذة الري نفسها.';
    return {
      speakerAr: 'مريم (مزارعة برسيم)',
      speakerEn: 'Maryam (Clover Farmer)',
      textAr: introAr,
      textEn: introEn,
      emotion: EMOTIONS.EXPLAINING,
      choices: [
        {
          id: 'maryam_align_proportional',
          labelAr: 'معاكِ يا مريم، هنطبق التوزيع النسبي العادل (Jain Fairness).',
          labelEn: 'Agreed Maryam, we will apply proportional fair allocation (Jain Fairness).',
          onSelect: () => {
            this.flags.talkedToMaryam = true;
            this.flags.maryamStance = 'aligned';
            this.flags.selectedPolicy = 'proportional';
            this.flags.cooperationRiskFlag = false;
            this.flags.relationships.maryamTrust = Math.min(2, this.flags.relationships.maryamTrust + 1);
            this.stage = this.flags.talkedToHassan ? 'pump_ready' : 'meet_hassan';
            this.characters.setActorEmotion('maryam', EMOTIONS.SATISFIED);
            this.addReceipt({
              id: 'REC_MARYAM_LEDGER',
              titleAr: 'سجل مريم: سعة طلمبة المسقة',
              titleEn: "Maryam's Ledger: Mesqa Hydraulic Capacity",
              category: 'Water Ledger',
              dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'السعة 180 وحدة هي افتراض محاكاة، وليست قياسًا حقيقيًا لقدرة طلمبة المسقة.',
              detailsEn: 'The 180-unit supply is a declared game scenario parameter, not a verified pump throughput measurement.',
            });
          },
        },
        {
          id: 'maryam_soil_cover_pact',
          labelAr: this.flags.inspectedSoil
            ? 'نحافظ على البرسيم الحي ونختبر فرضية تقليل البخر بعد فحص التربة.'
            : 'نحافظ على غطاء البرسيم بين المواسم ونختبر تأثيره، من غير وعود.',
          labelEn: this.flags.inspectedSoil
            ? 'Keep living berseem cover and test a lower-evaporation hypothesis after the soil check.'
            : 'Keep living berseem cover between seasons and test the effect without promises.',
          onSelect: () => {
            this.flags.talkedToMaryam = true;
            this.flags.maryamStance = 'cover_advocate';
            this.flags.soilCoverChoice = 'living_cover';
            this.flags.relationships.maryamTrust = Math.min(2, this.flags.relationships.maryamTrust + 1);
            this.stage = this.flags.talkedToHassan ? 'pump_ready' : 'meet_hassan';
            this.characters.setActorEmotion('maryam', EMOTIONS.HOPEFUL);
            this.addReceipt({
              id: 'REC_MARYAM_COVER',
              titleAr: 'مريم: فرضية غطاء البرسيم الحي',
              titleEn: 'Maryam: Living Berseem Cover Hypothesis',
              category: 'Soil Cover', dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'أثر الغطاء على البخر والاحتياج المائي مجرد فرضية سيناريو، وليس قياسًا أو توصية للمزارعين.',
              detailsEn: 'The reduced-evaporation benefit is an uncalibrated story assumption, not measured soil moisture, a NASA result or a field recommendation.',
            });
          },
        },
        {
          id: 'maryam_stress_test_rush',
          labelAr: 'إيه اللي هيحصل لو الكل فتح بوابته في نفس الوقت؟',
          labelEn: 'What happens if everyone opens their gates simultaneously?',
          onSelect: () => {
            this.flags.talkedToMaryam = true;
            this.flags.maryamStance = 'skeptical_stress_test';
            this.flags.cooperationRiskFlag = true;
            this.stage = this.flags.talkedToHassan ? 'pump_ready' : 'meet_hassan';
            this.characters.setActorEmotion('maryam', EMOTIONS.CONCERNED);
            this.addReceipt({
              id: 'REC_MARYAM_STRESS_TEST',
              titleAr: 'مريم: اختبار ضغط الإمداد المفترض',
              titleEn: 'Maryam: Simulated Simultaneous-Gate Stress Test',
              category: 'Water Ledger', dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'الفتح المتزامن فرضية اختبار للسعة الإجمالية في اللعبة؛ لا توجد قياسات ضغط حقيقية عند آخر المسقة.',
              detailsEn: 'The fictional capacity stress test does not model or prove measured tail-end hydraulic pressure.',
            });
          },
        },
      ],
    };
  }

  _getPumpDialogue() {
    const voicesHeard = Number(this.flags.talkedToHassan) + Number(this.flags.talkedToMaryam);
    const coverUnlocked = this.flags.inspectedSoil && this.flags.soilCoverChoice === 'living_cover';
    const statusEn = this.flags.evidenceRequested
      ? 'You requested real NASA evidence; the game has no verified NASA weather receipt.'
      : this.flags.cooperationRiskFlag
        ? 'A head-first or simultaneous-gate proposal needs a fairness stress test; tail-end hydraulics are not modelled here.'
        : coverUnlocked
          ? 'Your root-zone check and living-cover pact unlocked a simulated cover-buffered trial.'
          : 'Compare assumptions, water sharing and uncertain next-season soil cover.';
    const statusAr = this.flags.evidenceRequested
      ? 'طلبتي دليل NASA الحقيقي؛ جلسة اللعبة ما فيهاش سجل طقس موثّق.'
      : this.flags.cooperationRiskFlag
        ? 'اقتراح أولوية أول المسقة أو فتح الجميع محتاج اختبار عدالة؛ المحرك لا يقيس الضغط الحقيقي لآخر المسقة.'
        : coverUnlocked
          ? 'فحص الجذور واتفاق غطاء البرسيم فتحا تجربة افتراضية إضافية.'
          : 'وازني بين افتراضات توزيع المياه والغطاء النباتي في الموسم القادم.';
    // Field7's chosen crop-calendar *question* changes what the Council
    // discusses, but never changes the hydraulic solver or claims NASA evidence.
    const hypothesisEn = this.flags.cropHypothesis === 'cover_first'
      ? 'Calendar A (living soil cover) remains an untested crop hypothesis, not a calculated water saving.'
      : this.flags.cropHypothesis === 'water_saving'
        ? 'Calendar B (lower peak water demand) remains an untested crop hypothesis, not a measured livelihood gain.'
        : this.flags.cropHypothesis === 'deferred_for_nasa'
          ? 'The Seventh Field crop comparison is still UNAVAILABLE until real NASA context and declared soil inputs are checked.'
          : '';
    const hypothesisAr = this.flags.cropHypothesis === 'cover_first'
      ? 'التقويم (أ) بافتراض غطاء التربة الحي لسه فرضية غير مختبرة، مش توفير مياه محسوب.'
      : this.flags.cropHypothesis === 'water_saving'
        ? 'التقويم (ب) بافتراض خفض ذروة طلب المياه لسه فرضية غير مختبرة، مش زيادة دخل مقاسة.'
        : this.flags.cropHypothesis === 'deferred_for_nasa'
          ? 'مقارنة المحاصيل في الأرض السابعة غير متاحة لحد مراجعة بيانات NASA وافتراضات التربة.'
          : '';
    const choices = [
      {
        id: 'council_proportional',
        labelAr: '1. جرّب توزيعًا منسقًا بسعة افتراضية تكفي الطلب',
        labelEn: '1. Test a coordinated proportional turn (235 m³/h simulated)',
        onSelect: () => this.executeOutcome(OUTCOMES.EQUILIBRIUM),
      },
      {
        id: 'council_bottleneck',
        labelAr: '2. جرّب سعة محدودة وشوف العجز وعدالة التوزيع',
        labelEn: this.flags.hassanStance === 'head_priority'
          ? '2. Stress-test the head-first proposal with limited supply (120 m³/h simulated)'
          : '2. Test simultaneous gates under limited supply (120 m³/h simulated)',
        onSelect: () => this.executeOutcome(OUTCOMES.BOTTLENECK),
      },
      {
        id: 'council_deferral',
        labelAr: '3. أجّل القرار لحين التحقق من التربة وطقس NASA',
        labelEn: this.flags.evidenceRequested
          ? '3. Defer pumping and check actual NASA POWER context in Crop Rotation Workspace'
          : '3. Defer until field soil and weather evidence is checked',
        onSelect: () => this.executeOutcome(OUTCOMES.DEFERRAL),
      },
    ];
    if (coverUnlocked) {
      choices.push({
        id: 'council_cover_buffered',
        labelAr: '4. جرّب دورة منسقة بغطاء التربة (احتياج مياه أقل كفرضية فقط)',
        labelEn: '4. Test cover-buffered turn (lower demand is an unverified story assumption)',
        onSelect: () => this.executeOutcome(OUTCOMES.EQUILIBRIUM, { mode: 'cover_buffered_turn' }),
      });
    }
    return {
      speakerAr: 'مجلس المسقة — قرار يخص ست عائلات',
      speakerEn: 'The Canal Council — Six Families, One Turn',
      textAr: `في محاكاة تعليمية، ستة غيطان على مسقة واحدة. سمعت ${voicesHeard} من صوتين مهمين. ${statusAr} ${hypothesisAr} النتائج افتراضية وليست وصفة ري.`,
      textEn: `Six fictional plots share one canal. You heard ${voicesHeard} of two perspectives. ${statusEn} ${hypothesisEn} This modelled community decision is not real farm advice.`,
      emotion: EMOTIONS.NEUTRAL,
      choices,
    };
  }

  _getSeventhFieldDialogue() {
    return {
      speakerAr: 'الأرض السابعة — موسم لم يحدث بعد',
      speakerEn: 'The Seventh Field — A Season Not Yet Lived',
      textAr: 'محاكاة — ليست رصدًا فضائيًا. تقويم (أ) يفترض غطاء برسيم أطول وتقويم (ب) يفترض احتياج مياه أقل ودخلًا أسرع. ولا واحد اتجرب على طقس NASA الحقيقي. اختاري سؤالًا نختبره، مش فائزًا مضمونًا.',
      textEn: 'SIMULATED — NOT SATELLITE OBSERVATION. Calendar A assumes longer living berseem cover; Calendar B assumes lower peak water demand and faster cash flow. Neither is validated with NASA weather here. Choose a hypothesis, not a guaranteed winner.',
      emotion: EMOTIONS.HOPEFUL,
      choices: [
        {
          id: 'f7_hypothesis_cover',
          labelAr: 'اختبر فرضية (أ): غطاء تربة حي وحفظ رطوبة أطول.',
          labelEn: 'Test Calendar A hypothesis: living soil cover and moisture retention.',
          onSelect: () => {
            this.flags.questionedFuture = true;
            this.flags.cropHypothesis = 'cover_first';
            this.addReceipt({
              id: 'FUTURE_ROTATION_COVER',
              titleAr: 'فرضية: تقويم يفضل غطاء التربة',
              titleEn: 'Hypothesis: Cover-First Calendar (comparison_only)',
              category: 'Story Investigation',
              dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'فرضية غير مثبتة في القصة؛ التحقق يتطلب بيانات NASA وافتراضات تربة ومحاصيل موثقة.',
              detailsEn: 'An untested fictional hypothesis, not a NASA observation or agronomic recommendation.',
            });
            sharedEvents.emit('mission_receipts_updated');
          },
        },
        {
          id: 'f7_hypothesis_water_saving',
          labelAr: 'اختبر فرضية (ب): تقليل ذروة المياه وتسريع دورة الدخل.',
          labelEn: 'Test Calendar B hypothesis: lower peak water demand and faster income.',
          onSelect: () => {
            this.flags.questionedFuture = true;
            this.flags.cropHypothesis = 'water_saving';
            this.addReceipt({
              id: 'FUTURE_ROTATION_WATER',
              titleAr: 'فرضية: تقويم أقل في ذروة طلب المياه',
              titleEn: 'Hypothesis: Low-Peak-Demand Calendar (comparison_only)',
              category: 'Story Investigation', dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'فرضية تعليمية تتطلب مقارنة محاصيل ومدخلات تربة وطقس NASA قبل أي قرار ميداني.',
              detailsEn: 'The water-demand and livelihood benefit are fictional assumptions, not measured or guaranteed.',
            });
            sharedEvents.emit('mission_receipts_updated');
          },
        },
        {
          id: 'f7_refuse_guess_nasa',
          labelAr: 'مش هنختار فائز من غير دليل؛ سجل طلب بيانات NASA POWER.',
          labelEn: 'Refuse to guess a winner: request real NASA POWER crop-rotation evidence.',
          onSelect: () => {
            this.flags.questionedFuture = true;
            this.flags.cropHypothesis = 'deferred_for_nasa';
            this.flags.evidenceRequested = true;
            this.addReceipt({
              id: 'FUTURE_ROTATION_MYSTERY',
              titleAr: 'مطلوب: بيانات NASA ومقارنة دورة المحاصيل',
              titleEn: 'Evidence Requested: NASA POWER Context',
              category: 'Story Investigation', dataClass: 'simulated',
              timestamp: new Date().toISOString(),
              detailsAr: 'لا توجد بيانات NASA موثقة داخل جلسة اللعبة؛ افتح أداة مقارنة المحاصيل المستقلة للتحقق.',
              detailsEn: 'No dated or SHA-256-receipted NASA record is loaded in the game. Open the separate Crop Rotation Workspace to inspect real context.',
            });
            sharedEvents.emit('mission_receipts_updated');
          },
        },
      ],
    };
  }

  executeOutcome(outcome, { mode } = {}) {
    // Narrative choices are about sustainable water allocation, not passing
    // equipment inspections. Every simulated outcome stays clearly fictional.
    if (![OUTCOMES.EQUILIBRIUM, OUTCOMES.BOTTLENECK, OUTCOMES.DEFERRAL].includes(outcome)) {
      throw new RangeError('Unknown fictional canal outcome');
    }
    this.activeOutcome = outcome;
    this.stage = 'executed';
    this.flags.pumpStarted = outcome !== OUTCOMES.DEFERRAL;
    // The final Council action, not an earlier NPC negotiation, determines
    // which simulated water-allocation policy is recorded and later restored.
    // Deferral performs no allocation, so it preserves the last selected policy.
    if (outcome === OUTCOMES.EQUILIBRIUM) this.flags.selectedPolicy = 'proportional';
    if (outcome === OUTCOMES.BOTTLENECK) this.flags.selectedPolicy = 'capacity_limited';
    const coverBuffered = outcome === OUTCOMES.EQUILIBRIUM &&
      mode === 'cover_buffered_turn' && this.flags.inspectedSoil &&
      this.flags.soilCoverChoice === 'living_cover';
    this.flags.councilMode = outcome === OUTCOMES.DEFERRAL
      ? 'evidence_deferral'
      : outcome === OUTCOMES.BOTTLENECK
        ? 'bottleneck_overload'
        : coverBuffered ? 'cover_buffered_turn' : 'standard_proportional';

    const demands = this._scenarioDemands(outcome, coverBuffered); // ASSUMED six-field scenario, never measured

    if (outcome === OUTCOMES.EQUILIBRIUM) {
      // Outcome 1: Proportional Fair Allocation
      this.waterEngine.setPumpState(true, false);
      const res = this.waterEngine.runSimulation(235, demands, 'proportional');
      this.waterEngine.applySimulationToWorld(res);
      if (coverBuffered) {
        this.addReceipt({
          id: 'COVER_BUFFERED_ASSUMPTION',
          titleAr: 'فرضية الغطاء الحي: تعديل احتياج المياه',
          titleEn: 'Living-Cover Trial: Assumed Lower Demand',
          category: 'Simulation Assumptions', dataClass: 'simulated',
          timestamp: new Date().toISOString(),
          detailsAr: 'المتجه 32/41/54/37/23/28 م³ اختيار قصصي غير معاير؛ لا يثبت توفير مياه أو غلة.',
          detailsEn: 'The [32,41,54,37,23,28] m³ demand vector is purely hypothetical. No soil-cover water saving or yield benefit has been measured.',
        });
      }

      this.village.setGateOpen('gate_head', true);
      this.village.setGateOpen('gate_hassan', true);
      this.village.setGateOpen('gate_maryam', true);
      this.audio.playGateTurnSFX();

      this.characters.setActorEmotion('hassan', EMOTIONS.SATISFIED);
      this.characters.setActorEmotion('maryam', EMOTIONS.SATISFIED);

      this.addReceipt({
        id: 'OUTCOME_1_EQUILIBRIUM',
        titleAr: 'النتيجة 1: توازن هيدروليكي منصف',
        titleEn: 'Outcome 1: Coordinated Hydraulic Equilibrium',
        category: 'Mission Resolution',
        dataClass: 'simulated',
        timestamp: new Date().toISOString(),
        detailsAr: `في محاكاة افتراضية وصلت ${res.deliveredTotal.toFixed(1)} م³ للحقول الستة خلال ساعة الإمداد ON، وسجل المحرك ${(res.fairness * 100).toFixed(1)}% كمؤشر عدالة. لا توجد معايرة ميدانية.`,
        detailsEn: `In this fictional 1-hour ON turn, the solver delivered ${res.deliveredTotal.toFixed(1)} m³ to six plots, Jain fairness ${(res.fairness * 100).toFixed(1)}%. Not calibrated to any farm.`,
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.EQUILIBRIUM,
        fairness: res.fairness,
        titleAr: 'توازن منصف ومستدام',
      });
    } else if (outcome === OUTCOMES.BOTTLENECK) {
      // Outcome 2: Simultaneous Max Draw - Sputtering Pump, Tail Starved
      this.waterEngine.setPumpState(true, false); // Limited supply is not proof of pump cavitation
      // Time-sliced solver handles a capacity-limited turn without invented head/tail priority
      const res = this.waterEngine.runSimulation(120, demands, 'capacity_limited');
      this.waterEngine.applySimulationToWorld(res);

      this.village.setGateOpen('gate_head', true);
      this.village.setGateOpen('gate_hassan', true);
      this.village.setGateOpen('gate_maryam', true); // all six example valves request; actual source capacity limits delivery
      this.audio.playGateTurnSFX();

      this.characters.setActorEmotion('hassan', EMOTIONS.CONCERNED);
      this.characters.setActorEmotion('maryam', EMOTIONS.CONCERNED);

      this.addReceipt({
        id: 'OUTCOME_2_BOTTLENECK',
        titleAr: 'النتيجة 2: سعة محدودة وعجز لبعض الحقول',
        titleEn: 'Outcome 2: Limited Turn Capacity',
        category: 'Mission Resolution',
        dataClass: 'simulated',
        timestamp: new Date().toISOString(),
        detailsAr: `في سيناريو افتراضي بسعة 120 م³/ساعة، وصل ${res.deliveredTotal.toFixed(1)} م³ خلال ساعة ON وبقي عجز مقداره ${res.shortfall.reduce((a,b)=>a+b,0).toFixed(1)} م³. ده قيد سعة مفترض، مش انهيار ضغط مقاس.`,
        detailsEn: `Fictional 120 m³/h ON turn delivered ${res.deliveredTotal.toFixed(1)} m³ and left ${res.shortfall.reduce((a,b)=>a+b,0).toFixed(1)} m³ unmet. Limited capacity is assumed; no cavitation was measured.`,
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.BOTTLENECK,
        fairness: res.fairness,
        titleAr: 'إمداد محدود',
      });
    } else if (outcome === OUTCOMES.DEFERRAL) {
      // Outcome 3: Conservative Soil Deferral
      this.waterEngine.setPumpState(false);
      this.waterEngine.currentSimulation = null; // no stale measured-looking ledger after deferral
      this.characters.setActorEmotion('hassan', EMOTIONS.HOPEFUL);
      this.characters.setActorEmotion('maryam', EMOTIONS.HOPEFUL);

      this.addReceipt({
        id: 'OUTCOME_3_DEFERRAL',
        titleAr: 'النتيجة 3: تأجيل القرار لحين القياس',
        titleEn: 'Outcome 3: Deferral Until Field Measurement',
        category: 'Mission Resolution',
        dataClass: 'simulated',
        timestamp: new Date().toISOString(),
        detailsAr: 'أجّل اللاعب الري في سيناريو تعليمي لحين إجراء قياس ميداني حقيقي؛ لم يتم إثبات توفير المياه أو الوقود في الحقل.',
        detailsEn: 'In this illustrative mission, irrigation was deferred pending a real field measurement; fuel and water savings have not been independently demonstrated.',
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.DEFERRAL,
        fairness: null, // No water distribution occurred in the deferral branch
        titleAr: 'تحقق علمي وتأجيل مسؤول',
      });
    }

    // The sustainability teaching card is linked to the existing solver's
    // outcome. It claims no verified field impact or UN endorsement.
    const lesson = sustainabilityLesson(
      outcome,
      outcome === OUTCOMES.DEFERRAL ? null : this.waterEngine.currentSimulation,
      { soilCoverChoice: this.flags.soilCoverChoice, livelihoodPriority: this.flags.livelihoodPriority },
    );
    this.addReceipt({
      id: 'SDG_LEARNING_' + outcome,
      titleAr: lesson.titleAr,
      titleEn: lesson.titleEn,
      category: 'SDG Learning — 2 / 6 / 12 / 13',
      dataClass: lesson.evidenceClass,
      timestamp: new Date().toISOString(),
      detailsAr: lesson.textAr,
      detailsEn: lesson.textEn,
    });
    sharedEvents.emit('mission_receipts_updated');
    return true;
  }
}
