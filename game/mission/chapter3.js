/**
 * The Seventh Field — Chapter 3, Under Our Feet.
 *
 * This playable story puzzle deliberately uses invented, dimensionless game
 * tokens. It does NOT model physical infiltration, moisture, runoff, yield,
 * economics or soil salinity. Neither satellite weather nor local soil
 * observations are available here. No action is real-world crop guidance.
 */
export const SOIL_PRACTICES = Object.freeze({
  living_cover: Object.freeze({
    id: 'living_cover', icon: '☘', cover: 4, retention: 4, livelihood: 1, work: 3,
    en: 'Living cover', ar: 'غطاء نباتي حي',
    detailEn: 'More illustrated cover and rooting, but extra family work and a smaller short-term return in this game.',
    detailAr: 'غطاء وجذور أكثر في الرسم، لكن بمجهود أسري أعلى وعائد افتراضي فوري أقل.',
  }),
  mulch: Object.freeze({
    id: 'mulch', icon: '▰', cover: 2, retention: 3, livelihood: 2, work: 2,
    en: 'Crop-residue mulch', ar: 'مخلفات نباتية كغطاء',
    detailEn: 'Keep fictional surface cover while using fewer work tokens than establishing a living cover crop.',
    detailAr: 'غطاء سطحي افتراضي بمجهود أقل من زراعة غطاء نباتي حي.',
  }),
  bare_fallow: Object.freeze({
    id: 'bare_fallow', icon: '○', cover: 0, retention: 1, livelihood: 4, work: 0,
    en: 'Bare field', ar: 'أرض مكشوفة',
    detailEn: 'Spares work tokens and boosts fictional short-term return, but leaves less cover in our story model.',
    detailAr: 'توفّر مجهودًا وترفع نقاط العائد القصير في القصة، لكن الغطاء يصبح أقل.',
  }),
});

export const SOIL_TURNS = Object.freeze({
  gentle_pulses: Object.freeze({
    id: 'gentle_pulses', icon: '≈', runoff: 1, tailAccess: 3, work: 2,
    en: 'Shared, smaller water turns', ar: 'نوبات مياه صغيرة مشتركة',
    detailEn: 'More work and smaller fictional runoff-warning tokens; protects an imagined tail-end turn.',
    detailAr: 'مجهود أكثر ونقاط تحذير جريان افتراضية أقل، مع دعم تخيلي لآخر المسقة.',
  }),
  single_fast: Object.freeze({
    id: 'single_fast', icon: '↟', runoff: 4, tailAccess: 1, work: 0,
    en: 'One fast headgate turn', ar: 'نوبة واحدة سريعة من أول المسقة',
    detailEn: 'Saves fictional work tokens but increases the runoff warning and lowers imagined tail access.',
    detailAr: 'توفر نقاط المجهود لكنها ترفع تحذير الجريان وتقلل وصول المياه الخيالي لآخر المسقة.',
  }),
});

export const SOIL_PRIORITIES = Object.freeze({
  soil: Object.freeze({id:'soil',en:'Protect soil cover',ar:'حماية غطاء التربة'}),
  fairness: Object.freeze({id:'fairness',en:'Fair canal access',ar:'عدالة نوبات المسقة'}),
  livelihood: Object.freeze({id:'livelihood',en:'Immediate family return',ar:'العائد الأسري القريب'}),
});

export const SOIL_PLOTS = Object.freeze([
  Object.freeze({id:'head',en:'Head reach · Hassan',ar:'أول المسقة · حسن'}),
  Object.freeze({id:'tail',en:'Tail reach · Farida',ar:'آخر المسقة · فريدة'}),
]);

const MAX_WORK_TOKENS = 6;
const safeChapter2 = result => {
  if (!result || typeof result !== 'object' || !['evidence_pause','fictional_trial'].includes(result.ending) ||
      result.readyForFieldAdvice !== false || result.sourceClass !== 'SIMULATED') {
    throw new TypeError('Chapter 2 result must be a validated fictional evidence decision');
  }
  return Object.freeze({
    ending: result.ending,
    previousPlanId: result.previousPlanId === 'B' ? 'B' : 'A',
    councilTrust: Number.isFinite(result.councilTrust) ? Math.min(3, Math.max(0, result.councilTrust)) : 0,
  });
};
const requireKey = (record, id, label) => {
  if (!Object.hasOwn(record, id)) throw new RangeError(`Unknown ${label}`);
};

export class Chapter3SoilMission {
  constructor(chapter2) {
    if (chapter2?.phase !== 'result') throw new Error('Finish Chapter 2 before soil investigation');
    this.prior = safeChapter2(chapter2.result);
    this.phase = 'planning';
    this.practices = { head: 'mulch', tail: 'bare_fallow' };
    this.turn = 'gentle_pulses';
    this.priority = 'soil';
    this.result = null;
  }

  _expectPlanning() {
    if (this.phase !== 'planning') throw new Error('Choices require planning; replay to try another idea');
  }

  setPractice(plot, practice) {
    this._expectPlanning();
    requireKey(this.practices, plot, 'soil plot');
    requireKey(SOIL_PRACTICES, practice, 'soil practice');
    this.practices[plot] = practice;
    return this.compare();
  }

  setTurn(turn) {
    this._expectPlanning();
    requireKey(SOIL_TURNS, turn, 'water turn');
    this.turn = turn;
    return this.compare();
  }

  setPriority(priority) {
    this._expectPlanning();
    requireKey(SOIL_PRIORITIES, priority, 'farmer priority');
    this.priority = priority;
    return this.compare();
  }

  compare() {
    const head = SOIL_PRACTICES[this.practices.head];
    const tail = SOIL_PRACTICES[this.practices.tail];
    const water = SOIL_TURNS[this.turn];
    const workTokens = head.work + tail.work + water.work;
    const coverTokens = head.cover + tail.cover;
    const livelihoodTokens = head.livelihood + tail.livelihood;
    const retentionIllustration = head.retention + tail.retention;
    const bareFields = [head,tail].filter(p => p.id === 'bare_fallow').length;
    const runoffRiskTokens = Math.max(0, water.runoff + 2 * bareFields - Math.floor(coverTokens / 2));
    const tailAccessTokens = water.tailAccess + (this.practices.tail !== 'bare_fallow' ? 1 : 0);
    const canCommit = workTokens <= MAX_WORK_TOKENS;
    const priorities = {
      soil: [4,1,1], fairness: [1,4,1], livelihood: [1,1,4],
    }[this.priority];
    const narrativeScore = priorities[0] * coverTokens + priorities[1] * tailAccessTokens +
      priorities[2] * livelihoodTokens - runoffRiskTokens;
    return Object.freeze({
      phase: this.phase, practices: Object.freeze({...this.practices}),
      turn: this.turn, priority: this.priority,
      workTokens, workBudget: MAX_WORK_TOKENS, canCommit,
      coverTokens, livelihoodTokens, retentionIllustration,
      runoffRiskTokens, tailAccessTokens, narrativeScore,
      evidenceClass: 'SIMULATED', salinityEvidence: 'UNAVAILABLE',
      soilMeasurement: null, realWorldRecommendation: false,
      disclaimer: 'All values are invented, dimensionless game tokens. This diagram is not a soil test, hydrologic model, or field recommendation.',
    });
  }

  commit() {
    this._expectPlanning();
    const comparison = this.compare();
    if (!comparison.canCommit) throw new Error('This fictional choice exceeds the family work-token budget');
    this.phase = 'result';
    const ending = comparison.runoffRiskTokens >= 5 ? 'runoff_warning'
      : this.prior.ending === 'evidence_pause'
        ? 'prepared_for_measurement'
        : comparison.coverTokens >= 4 && comparison.tailAccessTokens >= 3 ? 'shared_soil_cover'
          : 'hard_tradeoff';
    const summaries = {
      prepared_for_measurement: {
        en: 'Nada records the soil-cover options but refuses to present invented infiltration or salinity numbers as local measurements. The council pauses for actual field evidence.',
        ar: 'ندى تسجل خيارات الغطاء، وترفض عرض أرقام الترشح أو الملوحة الخيالية كقياسات محلية. المجلس ينتظر دليلًا من الأرض.',
      },
      runoff_warning: {
        en: 'The fictional canal turn saves work, but the bare ground raises warning tokens for runoff and tail-end access. Farida asks the council to rethink the bargain.',
        ar: 'نوبة المسقة الخيالية وفرت المجهود، لكن الأرض المكشوفة رفعت تحذير الجريان والوصول لآخر المسقة. فريدة تطلب مراجعة القرار.',
      },
      shared_soil_cover: {
        en: 'Nada’s fictional plan combines soil cover with a shared water turn. It consumes family work tokens; no real soil outcome is predicted.',
        ar: 'خطة ندى الافتراضية تجمع غطاء التربة مع نوبة مياه مشتركة، لكن بمجهود أسري أعلى. لا توجد توقعات حقيقية لنتائج التربة.',
      },
      hard_tradeoff: {
        en: 'The village sees the compromise: work, short-term livelihood, soil cover and canal fairness pull in different directions. Nothing is proven for a real field.',
        ar: 'القرية تشوف المفاضلة: المجهود والعائد القريب وغطاء التربة وعدالة المسقة كلها اتجاهات مختلفة. لا شيء مثبت لحقل حقيقي.',
      },
    };
    this.result = Object.freeze({
      chapter: 3, ending, evidenceClass: 'SIMULATED',
      realWorldRecommendation: false,
      salinityEvidence: 'UNAVAILABLE', soilMeasurement: null,
      previousPlanId: this.prior.previousPlanId,
      previousChapterEnding: this.prior.ending,
      coverTokens: comparison.coverTokens,
      runoffRiskTokens: comparison.runoffRiskTokens,
      tailAccessTokens: comparison.tailAccessTokens,
      livelihoodTokens: comparison.livelihoodTokens,
      workTokens: comparison.workTokens,
      narrativeScore: comparison.narrativeScore,
      priority: comparison.priority,
      practices: comparison.practices,
      waterTurn: comparison.turn,
      missingEvidence: Object.freeze(['local_infiltration_test','local_soil_salinity_check','dated_nasa_weather']),
      summary: Object.freeze(summaries[ending]),
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
    this.practices = { head: 'mulch', tail: 'bare_fallow' };
    this.turn = 'gentle_pulses';
    this.priority = 'soil';
    this.result = null;
    return this.compare();
  }
}
