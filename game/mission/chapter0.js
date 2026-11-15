/**
 * SOLIQ: The Seventh Field - Mission Chapter 0: "المية وصلت!"
 * Authored interactive quest graph with player agency within 10 seconds,
 * branching dialogues, pump/gate actions, and three distinct outcomes.
 */

import { sharedEvents, EMOTIONS, GESTURES, OUTCOMES } from '../core/events.js';
import { SAFETY_CHECKS, assessPumpReadiness, completeSafetyCheck, sustainabilityLesson } from '../core/safety-sustainability.js';

export class Chapter0Mission {
  constructor(village, characters, waterEngine, audio) {
    this.village = village;
    this.characters = characters;
    this.waterEngine = waterEngine;
    this.audio = audio;

    this.stage = 'intro'; // 'intro' | 'meet_hassan' | 'meet_maryam' | 'pump_ready' | 'executed'
    this.activeOutcome = OUTCOMES.NONE;

    this.flags = {
      talkedToHassan: false,
      talkedToMaryam: false,
      inspectedSoil: false,
      pumpInspected: false,
      canalAccessSecured: false,
      heatPrecautionsReviewed: false,
      pumpStarted: false,
      selectedPolicy: 'proportional',
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
      titleAr: 'نداء الفجر: المية وصلت!',
      titleEn: 'Dawn Call: The Water Has Arrived!',
      category: 'Mission Briefing',
      dataClass: 'simulated',
      timestamp: new Date().toISOString(),
      detailsAr: 'بدأت نوبة ري افتراضية. عند توفر المياه والسعة الكافية يستطيع أصحاب الغيطان الستة الري معًا؛ افحص الظروف قبل تشغيل الطلمبة.',
      detailsEn: 'A fictional canal turn has begun. With adequate water and capacity, all six farms can irrigate; inspect the scenario before pumping.',
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
      return {
        speakerAr: 'عم حسن (مزارع قمح)',
        speakerEn: 'Uncle Hassan (Wheat Farmer)',
        textAr: 'يا أهلاً يا باشمهندسة ندى! المية وصلت. لو التصرف والسعة كافيين كلنا ممكن نروي. خلينا نفحص الطلمبة ووقت النوبة؛ العطل أو ضعف الضغط احتمال مش قاعدة ثابتة.',
        textEn: 'Welcome, Nada! The turn has begun. If canal and pump capacity are sufficient we can all irrigate. Let us inspect this turn rather than assume a fault or tail shortage.',
        emotion: EMOTIONS.EXPLAINING,
        choices: [
          {
            labelAr: 'هننظم دورات ري متناوبة ومنصفة يا عم حسن.',
            labelEn: 'We will coordinate balanced, turn-based irrigation, Uncle Hassan.',
            onSelect: () => {
              this.flags.talkedToHassan = true;
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
            labelAr: 'خلينا نقيس رطوبة التربة الأول قبل ما نفتح البوابة.',
            labelEn: 'Let us check soil moisture first before opening the gate.',
            onSelect: () => {
              this.flags.talkedToHassan = true;
              this.flags.inspectedSoil = true;
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
        ],
      };
    } else {
      return {
        speakerAr: 'عم حسن',
        speakerEn: 'Uncle Hassan',
        textAr: 'ربنا يوفقك يا بنتي. شوفي مريم عند البوابة التانية، وربنا يجعل فيها البركة.',
        textEn: 'God bless your work, Nada. Check in with Maryam at Gate 2 so we keep our schedule intact.',
        emotion: EMOTIONS.SATISFIED,
        choices: [{ labelAr: 'تمام يا عم حسن.', labelEn: 'Understood, Uncle Hassan.', onSelect: () => {} }],
      };
    }
  }

  _getMaryamDialogue() {
    return {
      speakerAr: 'مريم (مزارعة برسيم)',
      speakerEn: 'Maryam (Clover Farmer)',
      textAr: 'صباح الخير يا ندى. البرسيم عندي محتاج رية محسوبة. قدامنا مثالين افتراضيين: سعة تكفي الستة، أو سعة أقل من الطلب. لازم نحسب النتيجة من نافذة الري نفسها.',
      textEn: 'Good morning, Nada. The lesson compares a sufficient-supply turn with a limited-capacity turn; we should calculate the actual water delivered in each window.',
      emotion: EMOTIONS.EXPLAINING,
      choices: [
        {
          labelAr: 'معاكِ يا مريم، هنطبق التوزيع النسبي العادل (Jain Fairness).',
          labelEn: 'Agreed Maryam, we will apply proportional fair allocation (Jain Fairness).',
          onSelect: () => {
            this.flags.talkedToMaryam = true;
            this.flags.selectedPolicy = 'proportional';
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
          labelAr: 'إيه اللي هيحصل لو الكل فتح بوابته في نفس الوقت؟',
          labelEn: 'What happens if everyone opens their gates simultaneously?',
          onSelect: () => {
            this.flags.talkedToMaryam = true;
            this.characters.setActorEmotion('maryam', EMOTIONS.CONCERNED);
          },
        },
      ],
    };
  }

  completeSafetyTraining(stepId) {
    const step = SAFETY_CHECKS.find((item) => item.id === stepId);
    if (!step) throw new RangeError('Unknown safety training step');
    if (this.flags[stepId] === true) return assessPumpReadiness(this.flags);
    this.flags = completeSafetyCheck(this.flags, stepId);
    this.addReceipt({
      id: 'SAFETY_' + stepId,
      titleAr: step.titleAr,
      titleEn: step.titleEn,
      category: 'Safety Awareness (Fictional Training)',
      dataClass: 'simulated',
      timestamp: new Date().toISOString(),
      detailsAr: step.lessonAr + ' — هذه خطوة تعليمية داخل اللعبة وليست تصريح تشغيل حقيقي.',
      detailsEn: step.lessonEn + ' This is a game learning step, NOT real-world operational clearance.',
    });
    const assessment = assessPumpReadiness(this.flags);
    sharedEvents.emit('safety_checked', { completed: assessment.completed, total: assessment.total });
    return assessment;
  }

  _getPumpDialogue() {
    const safety = assessPumpReadiness(this.flags);
    if (!safety.readyForFictionalMission) {
      const next = safety.missing[0];
      return {
        speakerAr: 'مراجعة السلامة قبل تشغيل الطلمبة',
        speakerEn: 'Safety Check — Before the Pump',
        textAr: `قبل تجربة تشغيل الطلمبة، راجع السلامة (${safety.completed}/${safety.total}). لا يعني إكمال المهمة تصريحًا لتشغيل معدات حقيقية.`,
        textEn: `Before the simulated pump turn, review the safety steps (${safety.completed}/${safety.total}). This is training, not permission to operate real equipment.`,
        emotion: EMOTIONS.NEUTRAL,
        choices: [
          {
            labelAr: next.titleAr,
            labelEn: next.titleEn,
            onSelect: () => this.completeSafetyTraining(next.id),
          },
          {
            labelAr: 'أجّل التشغيل واطلب فحصًا ميدانيًا',
            labelEn: 'Defer the turn and request a qualified inspection',
            onSelect: () => this.executeOutcome(OUTCOMES.DEFERRAL),
          },
        ],
      };
    }
    return {
      speakerAr: 'طلمبة الديزل وبوابات المسقة',
      speakerEn: 'Diesel Pump & Canal Regulator',
      textAr: 'الطلمبة جاهزة. اختر حالة افتراضية (سعة كافية أو محدودة أو تأجيل للفحص)، والنتيجة ستأتي من محرك الري الزمني:',
      textEn: 'The pump is ready. Choose a fictional adequate-capacity turn, a limited-capacity turn, or evidence deferral; the time-window solver computes the outcome.',
      emotion: EMOTIONS.NEUTRAL,
      choices: [
        {
          labelAr: '1. التوزيع المنصف المتناسب (Outcome 1: Coordinated Equilibrium)',
          labelEn: '1. Proportional Fair Allocation (Outcome 1: Equilibrium)',
          onSelect: () => {
            this.executeOutcome(OUTCOMES.EQUILIBRIUM);
          },
        },
        {
          labelAr: '2. نافذة بسعة ضخ محدودة (Outcome 2: Capacity-limited turn)',
          labelEn: '2. Capacity-limited canal turn (Outcome 2: Bottleneck)',
          onSelect: () => {
            this.executeOutcome(OUTCOMES.BOTTLENECK);
          },
        },
        {
          labelAr: '3. ترشيد المياه وتأجيل الري بناءً على رطوبة التربة (Outcome 3: Soil Deferral)',
          labelEn: '3. Evidence-First Soil Deferral (Outcome 3: Conservative Science)',
          onSelect: () => {
            this.executeOutcome(OUTCOMES.DEFERRAL);
          },
        },
      ],
    };
  }

  _getSeventhFieldDialogue() {
    return {
      speakerAr: 'الأرض السابعة (صدى الزمن)',
      speakerEn: 'The Seventh Field (Time Echo)',
      textAr: 'الأرض السابعة مساحة تخيلية للمقارنة. لا توجد حتى الآن نتائج محاكاة محصولين موثقتين لحساب توفير مياه أو نيتروجين، ولذلك النظام يعرض comparison_only بدل اختراع فائز.',
      textEn: 'The seventh field is an illustrative future. No paired crop-model runs or verified uncertainty intervals are loaded; the system reports comparison_only instead of inventing benefits.',
      emotion: EMOTIONS.HOPEFUL,
      choices: [
        {
          labelAr: 'فهمت: العلم الحقيقي يعترف بعدم اليقين بدل الوعود الوهمية.',
          labelEn: 'Understood: True science discloses uncertainty instead of false promises.',
          onSelect: () => {},
        },
      ],
    };
  }

  executeOutcome(outcome) {
    // The fictional mission cannot run a powered pump until all educational
    // safety checks are complete. Deferral remains possible at any time.
    if (outcome !== OUTCOMES.DEFERRAL && !assessPumpReadiness(this.flags).readyForFictionalMission) {
      this.addReceipt({
        id: 'SAFETY_GATE_BLOCKED',
        titleAr: 'تم منع تشغيل الطلمبة قبل مراجعة السلامة',
        titleEn: 'Pump operation blocked pending safety checks',
        category: 'Safety Awareness (Fictional Training)',
        dataClass: 'simulated',
        timestamp: new Date().toISOString(),
        detailsAr: 'أكمل مراجعة الطلمبة والقناة والحر أولًا. لا تعد محاكاة اللعبة تصريحًا تشغيليًا حقيقيًا.',
        detailsEn: 'Review pump, canal and heat precautions first. No game action certifies real equipment safety.',
      });
      sharedEvents.emit('safety_checked', {
        completed: assessPumpReadiness(this.flags).completed,
        total: SAFETY_CHECKS.length,
      });
      return false;
    }
    this.activeOutcome = outcome;
    this.flags.pumpStarted = outcome !== OUTCOMES.DEFERRAL;

    const demands = [35, 45, 60, 40, 25, 30]; // 6 fields

    if (outcome === OUTCOMES.EQUILIBRIUM) {
      // Outcome 1: Proportional Fair Allocation
      this.waterEngine.setPumpState(true, false);
      const res = this.waterEngine.runSimulation(235, demands, 'proportional');
      this.waterEngine.applySimulationToWorld(res);

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
      outcome === OUTCOMES.DEFERRAL ? null : this.waterEngine.currentSimulation
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
