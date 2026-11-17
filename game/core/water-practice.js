/**
 * Optional fictional hands-on activity. Nothing here calculates irrigation
 * volumes, changes Chapter 0's water solver, or reads/stores player location.
 */
export function newWaterPractice() {
  return {stage: 'pickup', hasCan: false, action: null};
}

export function waterPracticeTarget(state) {
  if (state?.stage === 'pickup') return 'practice_can';
  if (state?.stage === 'bed') return 'practice_bed';
  return null;
}

export function interactWaterPractice(state, targetId) {
  if (!state || targetId !== waterPracticeTarget(state)) return {handled: false, state};
  if (state.stage === 'pickup') {
    return {handled: true, event: 'can_collected', state: {stage: 'bed', hasCan: true, action: null}};
  }
  return {handled: true, event: 'choose_action', state: {stage: 'decision', hasCan: true, action: null}};
}

export function chooseWaterPractice(state, action) {
  if (state?.stage !== 'decision' || !['illustrate_watering', 'defer'].includes(action)) {
    return {handled: false, state};
  }
  return {handled: true, event: 'practice_completed', state: {stage: 'done', hasCan: true, action}};
}
