/**
 * One-way, explicit handoff from the fictional Seventh Field to Soil-IQ's
 * independent evidence-first rotation tool. Never serializes farm/GPS data,
 * receipts, the canal-water solver, or any claimed NASA observation.
 */
const HYPOTHESES = new Set(['cover_first', 'water_saving', 'deferred_for_nasa']);
const SOURCE = 'seventh-field';

export function buildGameEvidenceHandoff(hypothesis) {
  const params = new URLSearchParams({ from: SOURCE });
  if (HYPOTHESES.has(hypothesis)) params.set('hypothesis', hypothesis);
  return `../../walkthrough/?${params}`;
}

/** Invalid/extra or repeated parameters are rejected in full, not ignored. */
export function parseGameEvidenceHandoff(search) {
  const params = new URLSearchParams(search);
  const keys = [...params.keys()];
  if (params.getAll('from').length !== 1 || params.get('from') !== SOURCE ||
      keys.some(key => key !== 'from' && key !== 'hypothesis') ||
      params.getAll('hypothesis').length > 1) return null;
  const hypothesis = params.get('hypothesis');
  if (hypothesis !== null && !HYPOTHESES.has(hypothesis)) return null;
  return { source: 'the-seventh-field', hypothesis, dataClass: 'SIMULATED' };
}
