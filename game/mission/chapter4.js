/**
 * The Seventh Field — Chapter 4: The Harvest Council.
 *
 * Deliberately fictional, dimensionless commitments. This is a storytelling
 * resource-allocation puzzle, NOT a NASA-derived, measured or calibrated farm
 * recommendation. Chapter 3 values are carried as narrative context only.
 */
export const COUNCIL_PLEDGES = Object.freeze({
  water: Object.freeze({ id: 'water', en: 'A fair water turn', ar: 'نوبة مياه عادلة', icon: '≈' }),
  soil: Object.freeze({ id: 'soil', en: 'Keep the soil covered', ar: 'الحفاظ على غطاء التربة', icon: '☘' }),
  livelihood: Object.freeze({ id: 'livelihood', en: 'Protect family livelihoods', ar: 'حماية معيشة الأسر', icon: '☼' }),
});
export const COUNCIL_MANDATES = Object.freeze({
  evidence_first: Object.freeze({
    id: 'evidence_first',
    en: 'Record the questions. Seek real evidence before a field decision.',
    ar: 'نسجل الأسئلة ونطلب أدلة حقيقية قبل أي قرار حقلي.',
  }),
  fictional_rehearsal: Object.freeze({
    id: 'fictional_rehearsal',
    en: 'Rehearse the village pact as a fictional learning exercise only.',
    ar: 'نجرب اتفاق القرية داخل قصة تعليمية افتراضية فقط.',
  }),
});

export const PACT_CAPACITY = 5;
const SOURCE_CLASSES = Object.freeze({
  game: 'SIMULATED',
  nasaWeather: 'UNAVAILABLE',
  localSoil: 'UNAVAILABLE',
  cropAssumptions: 'ASSUMED',
});
const MISSING = Object.freeze([
  'dated_nasa_weather', 'local_infiltration_test',
  'local_soil_salinity_check', 'actual_canal_delivery_records',
]);
const PRIOR_ENDINGS = Object.freeze([
  'prepared_for_measurement', 'runoff_warning', 'shared_soil_cover', 'hard_tradeoff',
]);

function validatedPrior(chapter3) {
  if (chapter3?.phase !== 'result') throw new Error('Finish Chapter 3 before the Harvest Council');
  const result = chapter3.result;
  if (!result || result.chapter !== 3 || !PRIOR_ENDINGS.includes(result.ending) ||
      result.evidenceClass !== 'SIMULATED' || result.realWorldRecommendation !== false ||
      result.salinityEvidence !== 'UNAVAILABLE') {
    throw new TypeError('Received invalid Chapter 3 fictional outcome');
  }
  return Object.freeze({
    ending: result.ending,
    previousPlanId: result.previousPlanId === 'B' ? 'B' : 'A',
    evidenceDecision: result.previousChapterEnding === 'evidence_pause' ? 'evidence_pause' : 'fictional_trial',
    coverTokens: Number.isFinite(result.coverTokens) ? Math.max(0, Math.min(8, result.coverTokens)) : null,
    tailAccessTokens: Number.isFinite(result.tailAccessTokens) ? Math.max(0, Math.min(4, result.tailAccessTokens)) : null,
    runoffRiskTokens: Number.isFinite(result.runoffRiskTokens) ? Math.max(0, Math.min(8, result.runoffRiskTokens)) : null,
    priority: ['soil','fairness','livelihood'].includes(result.priority) ? result.priority : 'fairness',
  });
}

/** Pure, deterministic finale. Does not call networks, browser storage or geolocation. */
export class Chapter4CouncilMission {
  constructor(chapter3) {
    this.prior = validatedPrior(chapter3);
    this.reset();
  }

  _planning() {
    if (this.phase !== 'planning') throw new Error('Council decision is final; replay to choose again');
  }

  allocate(pledge, tokens) {
    this._planning();
    if (!Object.hasOwn(COUNCIL_PLEDGES, pledge) ||
        !Number.isInteger(tokens) || tokens < 0 || tokens > 3) {
      throw new RangeError('Invalid pledge or allocation; select 0–3 fictional tokens');
    }
    this.pledges[pledge] = tokens;
    return this.compare();
  }

  setMandate(mandate) {
    this._planning();
    if (!Object.hasOwn(COUNCIL_MANDATES, mandate)) throw new RangeError('Invalid council mandate');
    this.mandate = mandate;
    return this.compare();
  }

  compare() {
    const spent = Object.values(this.pledges).reduce((sum, n) => sum + n, 0);
    const influence = {
      fairness: this.pledges.water + (this.prior.tailAccessTokens ?? 0),
      soil: this.pledges.soil + (this.prior.coverTokens ?? 0) / 2,
      livelihood: this.pledges.livelihood,
    };
    return Object.freeze({
      phase: this.phase,
      pledges: Object.freeze({ ...this.pledges }),
      spent, remainingTokens: PACT_CAPACITY - spent,
      budget: PACT_CAPACITY,
      canCommit: spent <= PACT_CAPACITY && spent > 0,
      mandate: this.mandate,
      influence: Object.freeze(influence),
      evidenceClass: 'SIMULATED',
      missingEvidence: MISSING,
      disclaimer: 'All tokens are fictional. No NASA weather or local soil data were loaded in this chapter.',
    });
  }

  commit() {
    this._planning();
    const c = this.compare();
    if (!c.canCommit) throw new Error('The fictional pact exceeds the council token budget or has no commitments');
    this.phase = 'result';
    const ending = this.mandate === 'evidence_first' ? 'science_before_claims'
      : this.pledges.water >= 3 && this.pledges.water > this.pledges.soil ? 'tail_shares'
        : this.pledges.soil >= 3 && this.pledges.soil > this.pledges.water ? 'roots_return'
          : this.pledges.livelihood >= 3 ? 'fragile_harvest'
            : 'difficult_balance';
    const captions = {
      science_before_claims: {
        en: 'Nada does not call a story result a real harvest. Farida will help record the tail-end canal turns; Maryam asks for soil samples. The council agrees to seek evidence first.',
        ar: 'ندى ترفض اعتبار نتيجة القصة حصادًا حقيقيًا. فريدة هتسجل نوبات آخر المسقة ومريم تطلب عينات تربة. المجلس يقرر يجيب الدليل الأول.',
      },
      tail_shares: {
        en: 'Hassan gives the first water turn back to the canal council. Farida finally has a voice at the tail reach. The fictional pact improves fairness, but leaves less work for soil and income.',
        ar: 'حسن يسيب قرار أول نوبة لمجلس المسقة. فريدة بقى ليها صوت في آخرها. الاتفاق الخيالي يهتم بالعدالة، لكنه يقلل المجهود المتاح للتربة والدخل.',
      },
      roots_return: {
        en: 'Maryam places living cover on the council map. The imagined fields grow greener; Hassan asks who can afford the extra work, and Farida asks about her water turn.',
        ar: 'مريم ترسم غطاء نباتي على خريطة المجلس. الحقول الخيالية تخضر، لكن حسن يسأل عن مجهود الأسر وفريدة عن دور المياه.',
      },
      fragile_harvest: {
        en: 'The village protects an imagined harvest income for this season. Farida warns that the next water turn and soil cover cannot be erased from the ledger.',
        ar: 'القرية اختارت حماية دخل حصاد افتراضي للموسم ده. فريدة تفكرهم إن دور المياه وغطاء التربة لازم يفضلوا في الحساب.',
      },
      difficult_balance: {
        en: 'There is no perfect winner. Nada writes every compromise in the village ledger: shared water, covered soil, family livelihoods—and everything they still do not know.',
        ar: 'مافيش فايز مثالي. ندى تكتب كل مفاضلة في دفتر القرية: المياه، وغطاء التربة، ومعيشة الأسر، وكل حاجة لسه مش معروفة.',
      },
    };
    this.result = Object.freeze({
      chapter: 4,
      ending,
      mandate: this.mandate,
      pledges: Object.freeze({ ...this.pledges }),
      priorSoilEnding: this.prior.ending,
      priorEvidenceDecision: this.prior.evidenceDecision,
      previousPlanId: this.prior.previousPlanId,
      communityPriority: this.prior.priority,
      evidenceClass: 'SIMULATED',
      observedWeather: null,
      hasFieldAdvice: false,
      realWorldRecommendation: false,
      missingEvidence: MISSING,
      summary: Object.freeze(captions[ending]),
    });
    return this.result;
  }

  replay() {
    this.phase = 'planning';
    this.result = null;
    return this.compare();
  }

  reset() {
    this.phase = 'planning';
    this.pledges = { water: 1, soil: 1, livelihood: 1 };
    this.mandate = this.prior.evidenceDecision === 'evidence_pause' ? 'evidence_first' : 'fictional_rehearsal';
    this.result = null;
    return this.compare();
  }
}

/** A local, opt-in and non-identifying story export, never an evidence receipt. */
export function createChapter4Export(mission) {
  if (!(mission instanceof Chapter4CouncilMission) || mission.phase !== 'result' || !mission.result) {
    throw new Error('Finish Chapter 4 before exporting your fictional village ledger');
  }
  return {
    schema: 'soil-iq.seventh-field.local-finale.v1',
    createdAtUtc: new Date().toISOString(),
    title: 'The Seventh Field — My Fictional Village Decisions',
    purpose: 'Educational game narrative only. Not a scientific data export or agronomic prescription.',
    dataClassification: { ...SOURCE_CLASSES },
    prior: { ...mission.prior },
    result: JSON.parse(JSON.stringify(mission.result)),
    sourceReceipts: [],
    sourceLimitation: 'No NASA POWER request, sensor reading, field soil sample or location data loaded in the game.',
    nextStep: 'Compare actual dated NASA weather and declared soil/crop assumptions in Soil-IQ scientific walkthrough.',
  };
}
