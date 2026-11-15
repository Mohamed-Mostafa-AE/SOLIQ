/**
 * SOLIQ: The Seventh Field - Mission Chapter 0: "المية وصلت!"
 * Authored interactive quest graph with player agency within 10 seconds,
 * branching dialogues, pump/gate actions, and three distinct outcomes.
 */

import { sharedEvents, EMOTIONS, GESTURES, OUTCOMES } from '../core/events.js';

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
      dataClass: 'observed',
      timestamp: new Date().toISOString(),
      detailsAr: 'فُتحت نوبة الري في مسقة القرية. يجب التنسيق مع عم حسن ومريم قبل تشغيل طلمبة الديزل لتفادي عجز الأحواض الأخيرة.',
      detailsEn: 'Canal irrigation window opened. Coordinate with Hassan and Maryam before pump operation to avoid tail-end shortages.',
    });
  }

  addReceipt(receipt) {
    this.notebookReceipts.unshift({
      ...receipt,
      hash: Math.random().toString(16).substring(2, 10).toUpperCase(),
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
        textAr: 'يا أهلاً يا باشمهندسة ندى! المية وصلت أخيرًا في المسقة بعد غياب تلات أيام. القمح بتاعي في طور النمو وعطشان، بس لو شغلنا الطلمبة بأقصى سحب ومريم فتحت بوابتها في نفس الدقيقة، الضغط هيسقط والأحواض اللي في الديل هتعطش!',
        textEn: 'Welcome Eng. Nada! The canal water arrived at dawn after 3 days. My wheat needs irrigation, but if we pull max water simultaneously with Maryam, pressure will collapse and tail fields will starve!',
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
                dataClass: 'observed',
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
                dataClass: 'observed',
                timestamp: new Date().toISOString(),
                detailsAr: 'رطوبة الطبقة السطحية 24%، مما يتيح تأجيل الري لساعات إضافية دون إجهاد المحصول.',
                detailsEn: 'Root-zone moisture measured at 24%, enabling safe irrigation deferral without crop stress.',
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
      textAr: 'صباح الخير يا ندى. البرسيم عندي محتاج رية خفيفة وسريعة، مش غمر كامل. الدفاتر اللي معايا بتقول إن سحب الطلمبة محدود بـ 180 متر مكعب. لو قسمناها بالنسبة والتناسب، كل الغيطان هترتوي بالعدل.',
      textEn: 'Good morning Nada. My berseem needs light, controlled water, not heavy flooding. The pump capacity is capped at 180 m³. If we use proportional allocation, all six plots receive water fairly.',
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
              dataClass: 'observed',
              timestamp: new Date().toISOString(),
              detailsAr: 'تأكيد السعة القصوى لطلمبة الديزل بـ 180 م³ والاتفاق على معادلة العدالة النسبية.',
              detailsEn: 'Confirmed pump throughput ceiling of 180 m³ and agreed on proportional sharing.',
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

  _getPumpDialogue() {
    return {
      speakerAr: 'طلمبة الديزل وبوابات المسقة',
      speakerEn: 'Diesel Pump & Canal Regulator',
      textAr: 'الطلمبة جاهزة للتشغيل. المورد المائي المتاح حاليًا في المسقة: 180 وحدة. اختر سياسة توزيع المياه ثم شغّل الموتور:',
      textEn: 'Diesel pump is primed. Available canal water supply: 180 units. Select allocation policy then engage starter:',
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
          labelAr: '2. سحب متزامن كامل بأقصى ضخ (Outcome 2: Hydraulic Bottleneck)',
          labelEn: '2. Simultaneous Full Draw (Outcome 2: Bottleneck Overload)',
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
      textAr: 'هذه الأرض لم تُزرع بعد. "صدى الزمن" يعرض محاكاة مستقبلية قائمة على الدورة الزراعية المقترحة مقارنة بالزراعة الأحادية التقليدية. لاحظ أن النظام يرفض إعطاء توصية جازمة بسبب تداخل هوامش عدم اليقين (comparison_only).',
      textEn: 'This field has not been planted yet. "Time Echo" projects future crop rotation versus traditional monoculture. Notice that the system conservatively refrains from declaring a winner due to uncertainty overlap (comparison_only).',
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
    this.activeOutcome = outcome;
    this.flags.pumpStarted = true;

    const demands = [35, 45, 60, 40, 25, 30]; // 6 fields

    if (outcome === OUTCOMES.EQUILIBRIUM) {
      // Outcome 1: Proportional Fair Allocation
      this.waterEngine.setPumpState(true, false);
      const res = this.waterEngine.runSimulation(180, demands, 'proportional');
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
        detailsAr: `تم توزيع 180 م³ على الـ 6 غيطان بنسبة عدالة Jain بلغت ${(res.fairness * 100).toFixed(1)}%. وصلت المياه لجميع الحقول دون اختناق في الطلمبة.`,
        detailsEn: `Distributed 180 m³ across 6 fields with Jain fairness index of ${(res.fairness * 100).toFixed(1)}%. All plots received water without pump cavitation.`,
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.EQUILIBRIUM,
        fairness: res.fairness,
        titleAr: 'توازن منصف ومستدام',
      });
    } else if (outcome === OUTCOMES.BOTTLENECK) {
      // Outcome 2: Simultaneous Max Draw - Sputtering Pump, Tail Starved
      this.waterEngine.setPumpState(true, true); // Overload smoke & sound
      // Priority allocation simulates head fields grabbing water first
      const res = this.waterEngine.runSimulation(120, demands, 'priority');
      this.waterEngine.applySimulationToWorld(res);

      this.village.setGateOpen('gate_head', true);
      this.village.setGateOpen('gate_hassan', true);
      this.village.setGateOpen('gate_maryam', false);
      this.audio.playGateTurnSFX();

      this.characters.setActorEmotion('hassan', EMOTIONS.CONCERNED);
      this.characters.setActorEmotion('maryam', EMOTIONS.CONCERNED);

      this.addReceipt({
        id: 'OUTCOME_2_BOTTLENECK',
        titleAr: 'النتيجة 2: اختناق هيدروليكي وعجز الأحواض الأخيرة',
        titleEn: 'Outcome 2: Hydraulic Bottleneck & Tail Starvation',
        category: 'Mission Resolution',
        dataClass: 'simulated',
        timestamp: new Date().toISOString(),
        detailsAr: 'تسبب السحب غير المنسق في انخفاض ضغط الطلمبة وجفاف أحواض نهاية المسقة. تجربة تثبت أهمية الإدارة التعاونية للمياه.',
        detailsEn: 'Uncoordinated simultaneous draw caused pump cavitation and dried out tail plots. Demonstrates necessity of cooperative mesqa management.',
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.BOTTLENECK,
        fairness: res.fairness,
        titleAr: 'اختناق هيدروليكي',
      });
    } else if (outcome === OUTCOMES.DEFERRAL) {
      // Outcome 3: Conservative Soil Deferral
      this.waterEngine.setPumpState(false);
      this.characters.setActorEmotion('hassan', EMOTIONS.HOPEFUL);
      this.characters.setActorEmotion('maryam', EMOTIONS.HOPEFUL);

      this.addReceipt({
        id: 'OUTCOME_3_DEFERRAL',
        titleAr: 'النتيجة 3: التحقق الميداني وتأجيل الري غير الضروري',
        titleEn: 'Outcome 3: Evidence-First Verification & Prudent Deferral',
        category: 'Mission Resolution',
        dataClass: 'observed',
        timestamp: new Date().toISOString(),
        detailsAr: 'أثبتت عينات التربة احتفاظ الجذور بالرطوبة الكافية. تم توفير وقود الديزل وحفظ مياه النوبة للأيام الأكثر حرارة.',
        detailsEn: 'Soil cores confirmed adequate root-zone water. Conserved diesel fuel and preserved canal water for peak heat period.',
      });

      sharedEvents.emit('outcome_achieved', {
        outcome: OUTCOMES.DEFERRAL,
        fairness: 1.0,
        titleAr: 'تحقق علمي وتأجيل مسؤول',
      });
    }
  }
}
