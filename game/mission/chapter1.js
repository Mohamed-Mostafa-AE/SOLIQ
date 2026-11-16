/**
 * The Seventh Field — Chapter 1: My Farm, Two Seasons.
 *
 * All quantities are explicitly INVENTED game tokens. They are not soil
 * readings, crop coefficients, rainfall, NASA observations, calibrated yield,
 * real irrigation demand, or field recommendations. The model exists to make
 * sustainability trade-offs inspectable before visiting the science product.
 */

export const CHAPTER1_CROPS = Object.freeze({
  cover: Object.freeze({
    id: 'cover', symbol: '☘', en: 'Legume cover', ar: 'غطاء بقولي',
    detailEn: 'Protect ground between harvests; lower immediate household return in this game.',
    detailAr: 'يحافظ على غطاء التربة بين المواسم؛ بعائد أسري فوري أقل في هذه اللعبة.',
    waterTokens: 26, coverTokens: 31, livelihoodTokens: 12,
  }),
  mosaic: Object.freeze({
    id: 'mosaic', symbol: '🌾', en: 'Mixed cereals', ar: 'حبوب متنوعة',
    detailEn: 'A middle road for cover, water tokens, and family income in this fictional model.',
    detailAr: 'حل وسط افتراضي بين الغطاء والمياه والدخل الأسري.',
    waterTokens: 34, coverTokens: 24, livelihoodTokens: 24,
  }),
  cash: Object.freeze({
    id: 'cash', symbol: '🌽', en: 'Market maize', ar: 'ذرة للسوق',
    detailEn: 'More household-return tokens, but higher assumed water demand and less cover.',
    detailAr: 'نقاط دخل أعلى، لكن طلب مياه مفترض أكبر وغطاء أقل.',
    waterTokens: 49, coverTokens: 11, livelihoodTokens: 39,
  }),
});

export const CHAPTER1_PLOTS = Object.freeze([
  Object.freeze({ id: 'head', en: 'Head-reach · Hassan', ar: 'أول المسقة · حسن' }),
  Object.freeze({ id: 'middle', en: 'Middle · Nada', ar: 'وسط المسقة · ندى' }),
  Object.freeze({ id: 'tail', en: 'Tail-reach · Farida', ar: 'آخر المسقة · فريدة' }),
]);

export const CHAPTER1_STRATEGIES = Object.freeze([
  Object.freeze({ id: 'balanced', en: 'Shared turns', ar: 'نوبات مشتركة', noteEn: 'Divide each season’s fictional water tokens proportionally to needs.', noteAr: 'تقسيم نقاط المياه الافتراضية حسب الاحتياج.' }),
  Object.freeze({ id: 'head_first', en: 'Headgate first', ar: 'أول المسقة أولًا', noteEn: 'Serve upstream fields first; tail-end households may go short.', noteAr: 'خدمة أول المسقة أولًا؛ قد تنقص حصة آخر المسقة.' }),
  Object.freeze({ id: 'tail_buffer', en: 'Tail reserve', ar: 'احتياطي آخر المسقة', noteEn: 'Reserve up to 30% of the fictional turn for the last field, then share the rest.', noteAr: 'تخصيص حتى ٣٠٪ من الدور الافتراضي لآخر المسقة ثم تقسيم الباقي.' }),
]);

export const CHAPTER1_PRIORITIES = Object.freeze([
  Object.freeze({ id: 'fairness', en: 'Fair access', ar: 'عدالة الوصول' }),
  Object.freeze({ id: 'soil', en: 'Soil cover', ar: 'غطاء التربة' }),
  Object.freeze({ id: 'livelihood', en: 'Family income', ar: 'دخل الأسر' }),
]);

const PLAN_TEMPLATES = Object.freeze({
  A: Object.freeze([
    Object.freeze(['cover', 'mosaic', 'cover']),
    Object.freeze(['mosaic', 'cash', 'mosaic']),
  ]),
  B: Object.freeze([
    Object.freeze(['cash', 'mosaic', 'cash']),
    Object.freeze(['cash', 'cash', 'cover']),
  ]),
});

const ALLOWED_OUTCOMES = Object.freeze(['equilibrium', 'bottleneck', 'deferral']);
const STRATEGY_IDS = CHAPTER1_STRATEGIES.map(option => option.id);
const PRIORITY_IDS = CHAPTER1_PRIORITIES.map(option => option.id);
const total = values => values.reduce((sum, value) => sum + value, 0);
const round = value => Math.round(value * 10) / 10;
const normalize = (value, max) => Math.max(0, Math.min(100, 100 * value / max));

function allocateWater(demand, supply, strategy) {
  const demandSum = total(demand);
  const available = Math.min(supply, demandSum);
  const allocation = [0, 0, 0];
  if (strategy === 'head_first') {
    let left = available;
    for (let i = 0; i < demand.length; i += 1) {
      allocation[i] = Math.min(left, demand[i]);
      left -= allocation[i];
    }
  } else {
    let pool = available;
    if (strategy === 'tail_buffer') {
      allocation[2] = Math.min(demand[2], available * 0.30);
      pool -= allocation[2];
    }
    // Any unused token stays in this fictional turn. No free water is created.
    const remainingDemand = demand.map((value, index) => value - allocation[index]);
    const remainingTotal = total(remainingDemand);
    if (remainingTotal > 0) {
      for (let i = 0; i < demand.length; i += 1) {
        allocation[i] += Math.min(remainingDemand[i], pool * remainingDemand[i] / remainingTotal);
      }
    }
  }
  const satisfied = demand.map((value, index) => value ? allocation[index] / value : 1);
  // Jain's fairness index is shown for *fictional demand-fulfilment ratios*.
  // No real measured canal flow or physical water is inferred here.
  const squaredSum = total(satisfied.map(value => value * value));
  const sum = total(satisfied);
  const fairness = squaredSum === 0 ? 0 : (sum * sum) / (3 * squaredSum);
  return Object.freeze({
    requested: demandSum,
    delivered: round(total(allocation)),
    shortfall: round(Math.max(0, demandSum - available)),
    allocations: allocation.map(round),
    satisfaction: satisfied.map(round),
    fairness: round(fairness),
    tailUnmet: round(Math.max(0, demand[2] - allocation[2])),
  });
}

/** A deterministic game board. No network, device location, or persistence. */
export class Chapter1Mission {
  constructor(chapter0) {
    if (!chapter0 || typeof chapter0 !== 'object' || !('activeOutcome' in chapter0)) {
      throw new TypeError('Chapter 1 requires the existing Chapter 0 mission');
    }
    this.chapter0 = chapter0;
    this.phase = 'locked';
    this.selectedPlan = chapter0.flags?.cropHypothesis === 'water_saving' ? 'B' : 'A';
    this.strategy = chapter0.flags?.hassanStance === 'head_priority' ? 'head_first' : 'balanced';
    this.priority = chapter0.flags?.soilCoverChoice === 'living_cover' ? 'soil' : 'fairness';
    this.plans = Object.fromEntries(Object.entries(PLAN_TEMPLATES).map(([key, rows]) =>
      [key, rows.map(row => [...row])]));
    this.result = null;
  }

  get canStart() { return ALLOWED_OUTCOMES.includes(this.chapter0.activeOutcome); }

  start() {
    if (!this.canStart) return false;
    if (this.phase === 'locked') this.phase = 'planning';
    return true;
  }

  _expectPlanning() {
    if (this.phase === 'locked') throw new Error('Complete Chapter 0 before entering the fictional farm');
    if (this.phase !== 'planning') throw new Error('Changes require planning; use replay to try again');
  }

  editSlot(planId, season, plot, cropId) {
    this._expectPlanning();
    if (!Object.hasOwn(this.plans, planId)) throw new RangeError('Invalid plan');
    if (!Number.isInteger(season) || season < 0 || season > 1) throw new RangeError('Invalid season');
    if (!Number.isInteger(plot) || plot < 0 || plot > 2) throw new RangeError('Invalid plot');
    if (!Object.hasOwn(CHAPTER1_CROPS, cropId)) throw new RangeError('Invalid crop');
    this.plans[planId][season][plot] = cropId;
    return this.getComparison();
  }

  choosePlan(planId) {
    this._expectPlanning();
    if (!Object.hasOwn(this.plans, planId)) throw new RangeError('Invalid plan');
    this.selectedPlan = planId;
    return this.getComparison();
  }

  chooseStrategy(strategy) {
    this._expectPlanning();
    if (!STRATEGY_IDS.includes(strategy)) throw new RangeError('Invalid strategy');
    this.strategy = strategy;
    return this.getComparison();
  }

  choosePriority(priority) {
    this._expectPlanning();
    if (!PRIORITY_IDS.includes(priority)) throw new RangeError('Invalid priority');
    this.priority = priority;
    return this.getComparison();
  }

  getSupply() {
    // No Chapter 0 m3/h is carried into Chapter 1; these invented tokens are a
    // storytelling boundary and *cannot* be converted to a real water volume.
    return ({ equilibrium: 115, bottleneck: 82, deferral: 95 })[this.chapter0.activeOutcome] ?? 95;
  }

  _projectPlan(planId) {
    const seasons = this.plans[planId].map((row, index) => {
      const crops = row.map(id => CHAPTER1_CROPS[id]);
      const water = allocateWater(crops.map(crop => crop.waterTokens), this.getSupply(), this.strategy);
      return Object.freeze({
        season: index + 1,
        cropIds: [...row],
        demand: water.requested,
        delivered: water.delivered,
        shortfall: water.shortfall,
        water,
        coverTokens: total(crops.map(crop => crop.coverTokens)),
        livelihoodTokens: total(crops.map(crop => crop.livelihoodTokens)),
      });
    });
    const totalDemand = total(seasons.map(season => season.demand));
    const shortfall = round(total(seasons.map(season => season.shortfall)));
    const fairness = round(total(seasons.map(season => season.water.fairness)) / 2);
    const tailUnmet = round(total(seasons.map(season => season.water.tailUnmet)));
    const coverScore = Math.round(normalize(total(seasons.map(season => season.coverTokens)), 6 * 31));
    const livelihoodScore = Math.round(normalize(total(seasons.map(season => season.livelihoodTokens)), 6 * 39));
    const waterScore = Math.round(normalize(totalDemand - shortfall, totalDemand));
    const weights = {
      fairness: { fairness: .48, soil: .22, livelihood: .15, water: .15 },
      soil: { fairness: .18, soil: .47, livelihood: .16, water: .19 },
      livelihood: { fairness: .18, soil: .13, livelihood: .49, water: .20 },
    }[this.priority];
    const gameScore = Math.round(
      fairness * 100 * weights.fairness + coverScore * weights.soil +
      livelihoodScore * weights.livelihood + waterScore * weights.water);
    return Object.freeze({
      id: planId,
      seasons,
      totalDemand,
      shortfall,
      fairness,
      tailUnmet,
      coverScore,
      livelihoodScore,
      waterScore,
      gameScore,
    });
  }

  getComparison() {
    return Object.freeze({
      evidenceClass: 'SIMULATED',
      weatherSource: 'UNAVAILABLE',
      fieldMeasurement: null,
      hasRealWorldRecommendation: false,
      previousOutcome: this.chapter0.activeOutcome,
      supplyPerSeason: this.getSupply(),
      supplyUnit: 'invented game tokens / season',
      selectedPlan: this.selectedPlan,
      strategy: this.strategy,
      priority: this.priority,
      plans: [this._projectPlan('A'), this._projectPlan('B')],
      disclaimer: 'Not a NASA observation or farmer recommendation. Crop values, water supply, income points and soil-cover points are all invented for this fictional game.',
    });
  }

  commit() {
    this._expectPlanning();
    const comparison = this.getComparison();
    const selected = comparison.plans.find(plan => plan.id === this.selectedPlan);
    const compared = comparison.plans.find(plan => plan.id !== this.selectedPlan);
    const ending = this.chapter0.activeOutcome === 'deferral'
      ? 'evidence_first'
      : selected.tailUnmet > 25
        ? 'tail_at_risk'
        : selected.coverScore >= 65 && selected.waterScore >= 85
          ? 'living_land'
          : 'shared_work';
    this.result = Object.freeze({
      evidenceClass: 'SIMULATED',
      weatherSource: 'UNAVAILABLE',
      fieldMeasurement: null,
      hasRealWorldRecommendation: false,
      previousOutcome: comparison.previousOutcome,
      planId: selected.id,
      strategy: this.strategy,
      priority: this.priority,
      ending,
      chosenGameScore: selected.gameScore,
      alternativeGameScore: compared.gameScore,
      tailUnmet: selected.tailUnmet,
      soilCoverScore: selected.coverScore,
      livelihoodScore: selected.livelihoodScore,
      disclaimer: 'Fictional illustration, not a NASA observation, measured canal result, crop recommendation, or forecast.',
    });
    this.phase = 'result';
    return this.result;
  }

  replay() {
    if (this.phase === 'locked') throw new Error('Complete Chapter 0 before replay');
    this.phase = 'planning';
    this.result = null;
    return this.getComparison();
  }
}
