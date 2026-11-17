/**
 * A tiny, deterministic in-memory world activity. No location, accounts, or persistence.
 * Scientific labels are part of the contract: the plot is fictional, not a soil sensor.
 */
export const FIELDWORK_STAGES = Object.freeze(['tool', 'sample', 'cover', 'done']);
export const FIELDWORK_TARGETS = Object.freeze({
  tool: 'fieldwork_tool',
  sample: 'fieldwork_sample',
  cover: 'fieldwork_cover',
});
export const FIELDWORK_CHOICES = Object.freeze(['straw', 'bare']);

export function freshFieldworkState() {
  return {stage: 'tool', hasProbe: false, sampled: false, coverChoice: null};
}

export function fieldworkTarget(state) {
  return FIELDWORK_TARGETS[state?.stage] || null;
}

export function advanceFieldwork(state, targetId) {
  if (!FIELDWORK_STAGES.includes(state?.stage) || targetId !== fieldworkTarget(state)) {
    return {state, handled: false, event: 'invalid'};
  }
  if (state.stage === 'tool') {
    return {state: {...state, stage: 'sample', hasProbe: true}, handled: true, event: 'probe_collected'};
  }
  if (state.stage === 'sample' && state.hasProbe) {
    return {state: {...state, stage: 'cover', sampled: true}, handled: true, event: 'soil_compared'};
  }
  if (state.stage === 'cover' && state.sampled) {
    return {state, handled: true, event: 'choose_cover'};
  }
  return {state, handled: false, event: 'invalid'};
}

export function chooseFieldworkCover(state, choice) {
  if (state?.stage !== 'cover' || !state.sampled || !FIELDWORK_CHOICES.includes(choice)) {
    return {state, handled: false, event: 'invalid'};
  }
  return {
    state: {...state, stage: 'done', coverChoice: choice},
    handled: true,
    event: choice === 'straw' ? 'straw_applied' : 'bare_kept',
  };
}
