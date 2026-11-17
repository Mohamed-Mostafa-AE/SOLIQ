/**
 * Chapter 2: The Evidence Gap.
 *
 * All material in this puzzle is authored fiction. The NASA POWER card means
 * the external service *could* be queried; it does not perform a request and
 * no weather observation is loaded. Chapter 1's crop/water result is a
 * fictional game outcome, not field advice or a numerical Earth observation.
 */
export const EVIDENCE_CLASSES = Object.freeze({
  OBSERVED: 'OBSERVED', DERIVED: 'DERIVED', ASSUMED: 'ASSUMED',
  SIMULATED: 'SIMULATED', UNAVAILABLE: 'UNAVAILABLE',
});

export const EVIDENCE_CARDS = Object.freeze([
  Object.freeze({
    id: 'power', answer: EVIDENCE_CLASSES.UNAVAILABLE,
    title: Object.freeze({ en: 'The NASA weather record', ar: 'سجل طقس ناسا' }),
    clue: Object.freeze({
      en: 'NASA POWER can provide dated grid-scale weather, but no NASA request or source receipt has been loaded into this fictional game scene.',
      ar: 'تتيح NASA POWER بيانات طقس شبكية مؤرخة، لكن هذا المشهد الخيالي لم يحمّل أي طلب أو إيصال مصدر من ناسا.',
    }),
    why: Object.freeze({
      en: 'No fetched response, dates, units or source receipt: the status here is UNAVAILABLE, not OBSERVED.',
      ar: 'لا توجد استجابة محمّلة أو تواريخ أو وحدات أو إيصال مصدر؛ الحالة غير متاحة وليست مرصودة.',
    }),
  }),
  Object.freeze({
    id: 'soil', answer: EVIDENCE_CLASSES.ASSUMED,
    title: Object.freeze({ en: 'Maryam’s soil-water estimate', ar: 'تقدير مريم لمياه التربة' }),
    clue: Object.freeze({
      en: 'Maryam used a working estimate for how much water the soil may hold. No sample, sensor or local soil-survey record is available.',
      ar: 'مريم استخدمت تقديرًا مبدئيًا لسعة حفظ المياه في التربة. لا توجد عينة أو حساس أو مسح تربة محلي.',
    }),
    why: Object.freeze({
      en: 'A declared unverified value is ASSUMED; it cannot become a field measurement by appearing on a screen.',
      ar: 'القيمة التقديرية غير المتحققة تصنَّف مفترضة ولا تتحول إلى قياس حقلي لمجرد عرضها على الشاشة.',
    }),
  }),
  Object.freeze({
    id: 'trial', answer: EVIDENCE_CLASSES.SIMULATED,
    title: Object.freeze({ en: 'The two-season village trial', ar: 'تجربة القرية لموسمين' }),
    clue: Object.freeze({
      en: 'The animated crop and canal outcomes from your Chapter 1 choices were generated with fictional game tokens and simplified rules.',
      ar: 'نتائج المحاصيل والمسقة المعروضة بعد قرارات الفصل الأول ناتجة عن رصيد خيالي وقواعد لعبة مبسطة.',
    }),
    why: Object.freeze({
      en: 'A game outcome is SIMULATED, not a crop yield observation, validated forecast or NASA-derived prediction.',
      ar: 'نتيجة اللعبة محاكاة وليست رصدًا للمحصول أو توقعًا متحققًا أو تنبؤًا مستنتجًا من بيانات ناسا.',
    }),
  }),
]);

const answers = Object.freeze(Object.fromEntries(EVIDENCE_CARDS.map(card => [card.id, card.answer])));
const allowedClasses = new Set(Object.values(EVIDENCE_CLASSES));
const safeChapter1Result = result => {
  if (!result || typeof result !== 'object' || typeof result.planId !== 'string') {
    throw new TypeError('A completed Chapter 1 result is required');
  }
  return Object.freeze({
    planId: result.planId === 'B' ? 'B' : 'A',
    strategy: ['balanced', 'head_first', 'tail_buffer'].includes(result.strategy) ? result.strategy : 'balanced',
    ending: typeof result.ending === 'string' ? result.ending.slice(0, 60) : 'unknown',
    tailUnmet: Number.isFinite(result.tailUnmet) ? Math.max(0, Math.min(99, result.tailUnmet)) : 0,
    soilCoverScore: Number.isFinite(result.soilCoverScore) ? Math.max(0, Math.min(99, result.soilCoverScore)) : 0,
  });
};

export class Chapter2EvidenceMission {
  constructor(chapter1) {
    if (chapter1?.phase !== 'result') throw new Error('Complete Chapter 1 before Chapter 2');
    this.previous = safeChapter1Result(chapter1.result);
    this.replay();
  }

  classify(cardId, category) {
    if (this.phase !== 'classify') throw new Error('Evidence sorting is already finished');
    if (!Object.hasOwn(answers, cardId) || !allowedClasses.has(category)) {
      throw new TypeError('Invalid evidence card or provenance class');
    }
    const correct = answers[cardId] === category;
    this.attempts += 1;
    this.assignments[cardId] = correct ? category : null;
    const allCorrect = EVIDENCE_CARDS.every(card => this.assignments[card.id] === card.answer);
    if (allCorrect) this.phase = 'council';
    return Object.freeze({
      cardId, correct, expected: correct ? category : null,
      allCorrect, progress: this.getProgress(),
    });
  }

  getProgress() {
    return Object.freeze({
      correct: EVIDENCE_CARDS.filter(card => this.assignments[card.id] === card.answer).length,
      total: EVIDENCE_CARDS.length,
      attempts: this.attempts,
    });
  }

  getProvenance() {
    return { ...answers };
  }

  decide(action) {
    if (this.phase !== 'council') throw new Error('You must classify all evidence before a council decision');
    if (!['defer', 'fictional_trial'].includes(action)) throw new TypeError('Invalid council action');
    this.action = action;
    this.phase = 'result';
    const tailPressure = this.previous.tailUnmet > 0;
    const isDeferred = action === 'defer';
    const summary = isDeferred
      ? {
          en: `Nada pauses the village decision and requests dated weather evidence and a local soil measurement before making a real recommendation. The fictional plan ${this.previous.planId} remains a question, not an answer.`,
          ar: `ندى تؤجل قرار القرية وتطلب أدلة طقس مؤرخة وقياسًا محليًا للتربة قبل أي توصية حقيقية. تظل الخطة الخيالية ${this.previous.planId} سؤالًا لا إجابة.`,
        }
      : {
          en: `Nada labels plan ${this.previous.planId} a fictional learning trial, not field advice. The council keeps the ${tailPressure ? 'tail-end shortage' : 'shared-water balance'} visible while seeking the missing evidence.`,
          ar: `ندى تصنف الخطة ${this.previous.planId} كتجربة تعلم خيالية وليست نصيحة حقلية، ويظل ${tailPressure ? 'عجز آخر المسقة' : 'توازن المياه المشتركة'} ظاهرًا لحين جلب الأدلة الناقصة.`,
        };
    this.result = Object.freeze({
      chapter: 2,
      ending: isDeferred ? 'evidence_pause' : 'fictional_trial',
      sourceClass: 'SIMULATED',
      readyForFieldAdvice: false,
      councilTrust: isDeferred ? 3 : tailPressure ? 1 : 2,
      missingEvidence: Object.freeze(['dated_nasa_power_receipt', 'local_soil_measurement']),
      previousPlanId: this.previous.planId,
      summary: Object.freeze(summary),
    });
    return this.result;
  }

  replay() {
    this.phase = 'classify';
    this.assignments = Object.fromEntries(EVIDENCE_CARDS.map(card => [card.id, null]));
    this.attempts = 0;
    this.action = null;
    this.result = null;
  }
}
