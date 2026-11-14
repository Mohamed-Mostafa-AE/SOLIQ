/** Presentation helpers. Setup completion is never an agronomic confidence score. */
export const PHOTOS = {
  landscape: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=85',
  farming: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  grain: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
};

export function setupProgress(flags, sourceKind) {
  const steps = [
    { id: 'field', title: 'Set your field', detail: 'Save your location and water assumptions', done: Boolean(flags.fieldSaved), view: 'settings' },
    { id: 'weather', title: 'Bring in weather', detail: 'Load NASA data or import a complete year', done: sourceKind !== 'synthetic', view: 'evidence' },
    { id: 'calendar', title: 'Review calendars', detail: 'Check the three exploratory crop sequences', done: Boolean(flags.calendarReviewed), view: 'rotations' },
    { id: 'export', title: 'Keep your evidence', detail: 'Download a research bundle', done: Boolean(flags.exported), view: 'research' },
  ];
  const completed = steps.filter(step => step.done).length;
  return { steps, completed, percent: completed / steps.length * 100 };
}

export function monthSummary(result, month, capacity) {
  const rows = result.daily.filter(row => Number(row.date.slice(5, 7)) - 1 === month);
  if (!rows.length) throw Error('No model records for the selected month');
  const last = rows[rows.length - 1];
  return {
    crop: last.crop,
    storage: last.storage,
    storagePercent: Math.max(0, Math.min(100, last.storage / capacity * 100)),
    rain: rows.reduce((sum, row) => sum + row.rain, 0),
    irrigation: rows.reduce((sum, row) => sum + row.irrigation, 0),
  };
}
