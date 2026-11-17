/**
 * Chapters 5–6: a repeated, consequential fictional canal negotiation and an
 * evidence-bound future. Scores are narrative counters only, NOT water volume,
 * weather observations, soil readings, economics or farm advice.
 * No storage, network, location or external game assets are used here.
 */
export const CANAL_TURNS = Object.freeze([
  Object.freeze({ en: 'Hassan opens the head-reach gate. Who gets a say?', ar: 'حسن فتح بوابة أول المسقة. مين له كلمة؟', speaker: 'Hassan' }),
  Object.freeze({ en: 'Farida calls from the tail reach. How will the council respond?', ar: 'فريدة بتنادي من آخر المسقة. المجلس هيرد إزاي؟', speaker: 'Farida' }),
  Object.freeze({ en: 'Maryam asks about the ground left bare after harvest.', ar: 'مريم بتسأل عن الأرض اللي فضلت من غير غطاء بعد الحصاد.', speaker: 'Maryam' }),
]);
export const CANAL_ACTIONS = Object.freeze({
  share_turn: Object.freeze({
    id: 'share_turn', en: 'Give the tail reach a voice', ar: 'ادي آخر المسقة صوت',
    detailEn: 'More fictional fairness; a harder livelihood compromise.',
    detailAr: 'عدالة افتراضية أكتر، مع مفاضلة أصعب لمعيشة الأسر.',
  }),
  protect_cover: Object.freeze({
    id: 'protect_cover', en: 'Organize a soil-cover workday', ar: 'نظّم يوم عمل لغطاء التربة',
    detailEn: 'More fictional ground cover; time is taken from harvest work.',
    detailAr: 'غطاء تربة افتراضي أكتر، لكن الوقت من شغل الحصاد.',
  }),
  ask_for_records: Object.freeze({
    id: 'ask_for_records', en: 'Ask for the missing records', ar: 'اطلب السجلات الناقصة',
    detailEn: 'A question is logged. No measurements magically appear.',
    detailAr: 'اتسجل سؤال؛ مفيش قياسات بتظهر فجأة.',
  }),
});
export const FUTURE_CHOICES = Object.freeze({
  seek_evidence: Object.freeze({id:'seek_evidence',en:'Measure first, then decide',ar:'نقيس الأول وبعدها نقرر'}),
  rehearse_together: Object.freeze({id:'rehearse_together',en:'Share the fictional pact as a learning exercise',ar:'نشارك الاتفاق الخيالي كتجربة تعليمية'}),
  pause_and_listen: Object.freeze({id:'pause_and_listen',en:'Pause and hear the people left out',ar:'نقف ونسمع الناس اللي ما شاركتش'}),
});

const MISSING = Object.freeze([
  'dated_nasa_weather', 'local_infiltration_test', 'local_soil_salinity_check', 'actual_canal_delivery_records',
]);
const CLASSIFICATION = Object.freeze({game:'SIMULATED',nasaWeather:'UNAVAILABLE',localSoil:'UNAVAILABLE',cropInputs:'ASSUMED'});
const PACT_ENDINGS = ['science_before_claims','tail_shares','roots_return','fragile_harvest','difficult_balance'];
const ACTION_IDS = Object.keys(CANAL_ACTIONS);

function validateCouncil(chapter4) {
  if (chapter4?.phase !== 'result') throw new Error('Finish Chapter 4 before the canal turns');
  const r = chapter4.result;
  const p = r?.pledges;
  if (r?.chapter !== 4 || !PACT_ENDINGS.includes(r.ending) ||
      !['evidence_first','fictional_rehearsal'].includes(r.mandate) ||
      r.evidenceClass !== 'SIMULATED' || r.realWorldRecommendation !== false ||
      r.observedWeather !== null || !Array.isArray(r.missingEvidence) ||
      !p || !['water','soil','livelihood'].every(id => Number.isInteger(p[id]) && p[id] >= 0 && p[id] <= 3) ||
      p.water + p.soil + p.livelihood < 1 || p.water + p.soil + p.livelihood > 5) {
    throw new TypeError('Received invalid Chapter 4 fictional outcome');
  }
  return Object.freeze({ending:r.ending,mandate:r.mandate,pledges:Object.freeze({...p}),
    previousPlanId:r.previousPlanId === 'B'?'B':'A',priorSoilEnding:r.priorSoilEnding});
}

export class Chapter5WaterTurns {
  constructor(chapter4) {
    this.prior = validateCouncil(chapter4);
    this.replay();
  }

  view() {
    return Object.freeze({
      phase:this.phase,
      turn:Math.min(this.choices.length + 1,CANAL_TURNS.length),
      choices:Object.freeze([...this.choices]),
      scores:Object.freeze({...this.scores}),
      evidenceClass:'SIMULATED',
      missingEvidence:MISSING,
    });
  }

  choose(actionId) {
    if (this.phase !== 'turns') throw new Error('The canal season is final; replay to choose again');
    if (!Object.hasOwn(CANAL_ACTIONS,actionId)) throw new RangeError('Invalid canal choice');
    this.choices.push(actionId);
    if (actionId === 'share_turn') {
      this.scores.tail += 2;
      this.scores.livelihood = Math.max(0,this.scores.livelihood-1);
    } else if (actionId === 'protect_cover') {
      this.scores.cover += 2;
      this.scores.livelihood = Math.max(0,this.scores.livelihood-1);
    } else this.scores.questions += 1;
    if (this.choices.length < CANAL_TURNS.length) return this.view();
    this.phase='result';
    const shares=this.choices.filter(a=>a==='share_turn').length;
    const covers=this.choices.filter(a=>a==='protect_cover').length;
    const questions=this.choices.filter(a=>a==='ask_for_records').length;
    const ending=shares>=2?'shared_turns':covers>=2?'covered_ground':questions>=2?'questions_recorded':'mixed_tradeoffs';
    this.result=Object.freeze({
      chapter:5,ending,choices:Object.freeze([...this.choices]),scores:Object.freeze({...this.scores}),
      priorPactEnding:this.prior.ending,priorCouncilMandate:this.prior.mandate,
      previousPlanId:this.prior.previousPlanId,
      evidenceClass:'SIMULATED',observedWeather:null,realWorldRecommendation:false,
      missingEvidence:MISSING,
    });
    return this.result;
  }

  replay() {
    this.phase='turns';
    this.choices=[];
    this.result=null;
    this.scores={tail:this.prior.pledges.water,cover:this.prior.pledges.soil,
      livelihood:this.prior.pledges.livelihood,questions:0};
    return this.view();
  }
}

const CH5_ENDINGS = ['shared_turns','covered_ground','questions_recorded','mixed_tradeoffs'];
function validateWaterTurns(chapter5) {
  if (chapter5?.phase !== 'result') throw new Error('Finish Chapter 5 before the future council');
  const r=chapter5.result;
  if (r?.chapter !== 5 || !CH5_ENDINGS.includes(r.ending) ||
      r.evidenceClass !== 'SIMULATED' || r.realWorldRecommendation !== false ||
      r.observedWeather !== null || !Array.isArray(r.missingEvidence) ||
      !Array.isArray(r.choices) || r.choices.length !== 3 ||
      !r.choices.every(id=>ACTION_IDS.includes(id)) ||
      !PACT_ENDINGS.includes(r.priorPactEnding) ||
      !['evidence_first','fictional_rehearsal'].includes(r.priorCouncilMandate) ||
      !r.scores || !['tail','cover','livelihood','questions'].every(id=>
        Number.isInteger(r.scores[id]) && r.scores[id]>=0 && r.scores[id]<=10)) {
    throw new TypeError('Received invalid Chapter 5 fictional outcome');
  }
  return Object.freeze({ending:r.ending,choices:Object.freeze([...r.choices]),
    scores:Object.freeze({...r.scores}),pactEnding:r.priorPactEnding,
    mandate:r.priorCouncilMandate,previousPlanId:r.previousPlanId === 'B'?'B':'A'});
}

export class Chapter6FutureMission {
  constructor(chapter5) {
    this.prior=validateWaterTurns(chapter5);
    this.replay();
  }

  choose(choice) {
    if (this.phase !== 'planning') throw new Error('The future is final; replay to choose again');
    if (!Object.hasOwn(FUTURE_CHOICES,choice)) throw new RangeError('Invalid future choice');
    const ending={seek_evidence:'measure_before_action',rehearse_together:'shared_rehearsal',
      pause_and_listen:'open_questions'}[choice];
    this.phase='result';
    this.result=Object.freeze({
      chapter:6,ending,choice,previousChapterEnding:this.prior.ending,
      priorPactEnding:this.prior.pactEnding,priorCouncilMandate:this.prior.mandate,
      previousPlanId:this.prior.previousPlanId,canalChoices:this.prior.choices,
      fictionalScores:this.prior.scores,dataClassification:CLASSIFICATION,
      evidenceClass:'SIMULATED',observedWeather:null,realWorldRecommendation:false,
      missingEvidence:MISSING,
    });
    return this.result;
  }

  replay() {this.phase='planning';this.result=null;return this.prior;}
}

/** A local game-story download; never a scientific evidence receipt. */
export function createChapter6StoryExport(mission) {
  if (!(mission instanceof Chapter6FutureMission) || mission.phase !== 'result' || !mission.result) {
    throw new Error('Finish Chapter 6 before exporting the fictional story');
  }
  return {
    schema:'soil-iq.seventh-field.local-story.v2',createdAtUtc:new Date().toISOString(),
    title:'The Seventh Field — My Fictional Six-Chapter Journey',
    purpose:'Education and fictional narrative; no field measurement, verified weather or agricultural recommendation.',
    dataClassification:{...CLASSIFICATION},
    result:JSON.parse(JSON.stringify(mission.result)),sourceReceipts:[],
    sourceLimitation:'No NASA POWER request, sensor reading, soil sample, canal record or geolocation was loaded during these game chapters.',
    nextStep:'Use Soil-IQ scientific walkthrough to obtain a dated NASA weather receipt and compare assumptions.',
  };
}
