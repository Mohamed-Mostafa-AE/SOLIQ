/**
 * The villagers' reactions to the playable canal puzzle. Pure, local-only and
 * entirely FICTIONAL: no weather, hydraulic or farm measurements are read.
 * Keep this derived from the same six water volumes as the solver-ledger UI.
 */
import {CANAL_TURN_DEMANDS, CANAL_TURN_COUNT} from './canal-turns.js';

export const COMMUNITY_TOTAL_TARGET = 0.90;
export const COMMUNITY_BRANCH_TARGET = 0.80;

const GROUPS = Object.freeze([
  {id: 'hassan', start: 0, end: 3, en: 'Hassan', ar: 'حسن'},
  {id: 'maryam', start: 3, end: 6, en: 'Maryam', ar: 'مريم'},
]);

function sum(values) { return values.reduce((total, value) => total + value, 0); }

export function summarizeCanalCommunity(state) {
  if (!state || !Array.isArray(state.delivered) ||
      state.delivered.length !== CANAL_TURN_DEMANDS.length ||
      !state.delivered.every((value, i) => Number.isFinite(value) && value >= 0 &&
        value <= CANAL_TURN_DEMANDS[i] + 1e-6) ||
      !Number.isInteger(state.round) || state.round < 0 ||
      state.round > CANAL_TURN_COUNT || typeof state.complete !== 'boolean' ||
      state.complete !== (state.round === CANAL_TURN_COUNT)) {
    throw new TypeError('Expected two-turn state and six fictional fields with bounded deliveries');
  }
  const delivered = sum(state.delivered);
  const needed = sum(CANAL_TURN_DEMANDS);
  const branches = GROUPS.map(group => {
    const branchDelivered = sum(state.delivered.slice(group.start, group.end));
    const branchNeed = sum(CANAL_TURN_DEMANDS.slice(group.start, group.end));
    const coverage = branchDelivered / branchNeed;
    return {
      id: group.id, nameEn: group.en, nameAr: group.ar,
      delivered: branchDelivered, need: branchNeed, coverage,
      emotion: state.round === 0 ? 'neutral' :
        coverage >= COMMUNITY_BRANCH_TARGET ? 'relieved' : 'concerned',
    };
  });
  const coverage = delivered / needed;
  const goalMet = state.complete && coverage >= COMMUNITY_TOTAL_TARGET - 1e-9 &&
    branches.every(branch => branch.coverage >= COMMUNITY_BRANCH_TARGET - 1e-9);
  return {
    status: state.round === 0 ? 'not_started' :
      !state.complete ? 'in_progress' : goalMet ? 'shared_success' : 'needs_review',
    round: state.round, branches, coverage, delivered, needed, goalMet,
    // All numbers are authored scenario inputs or their simulated derivatives.
    provenance: 'simulated',
  };
}

/** Optional dynamic preface; original Chapter 0 dialogue and choices remain intact. */
export function canalNpcFeedback(state, actorId) {
  if (!GROUPS.some(group => group.id === actorId) || !state?.round) return null;
  const summary = summarizeCanalCommunity(state);
  const branch = summary.branches.find(item => item.id === actorId);
  if (!branch) return null;
  const percentage = Math.round(branch.coverage * 100);
  const missing = branch.delivered <= 1e-9;
  const result = summary.status === 'shared_success'
    ? ' Together we met the shared fictional objective.' : '';
  const resultAr = summary.status === 'shared_success'
    ? ' قدرنا مع بعض نحقق الهدف الافتراضي المشترك.' : '';
  return {
    speakerEn: actorId === 'hassan' ? 'Uncle Hassan' : 'Maryam',
    speakerAr: actorId === 'hassan' ? 'عم حسن' : 'مريم',
    textEn: missing
      ? `My branch received no water in this fictional canal turn. Try a different gate choice; no farm measurement was made.${result}`
      : `Our fictional branch has received ${percentage}% of its assumed water need in this training game. It is not a real farm reading.${result}`,
    textAr: missing
      ? `فرعنا ما وصلوش مية في دور المسقاة الافتراضي. جرّب تغيّر البوابات؛ دي مش قراءة من غيط حقيقي.${resultAr}`
      : `فرعنا وصله ${percentage}% من احتياجه المفترض في التدريب الافتراضي. النتيجة مش قياس من أرض حقيقية.${resultAr}`,
    emotion: branch.emotion,
  };
}
