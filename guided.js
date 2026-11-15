/** Plain-language presentation of the same results used in Research view. */
import { CROPS } from './engine.js';
import { monthSummary } from './visuals.js';
import { cropBotanicalSVG, cropFieldSVG } from './crop-art.js';

export function changedMonths(baseline, alternative) {
  return baseline.crops.flatMap((crop, index) => crop === alternative.crops[index] ? [] : [index]);
}

function cropDrawing(cropKey) {
  return cropBotanicalSVG(cropKey, CROPS[cropKey].name + ' plant illustration');
}

export function guidedOverview(state, helpers) {
  const { config, source, output, strategies, selectedMonth, selectedStrategy, months } = state;
  const { esc, fmt, progressPanel } = helpers;
  const baseline = strategies[0];
  const alternative = strategies[selectedStrategy];
  const baselineResult = output.results[0];
  const alternativeResult = output.results[selectedStrategy];
  const changes = changedMonths(baseline, alternative);
  const selectedCrop = alternative.crops[selectedMonth];
  const nextMonth = (selectedMonth + 1) % 12;
  const difference = alternativeResult.deficit - baselineResult.deficit;

  const cropCard = (strategy, result, isBaseline) => {
    const crop = strategy.crops[selectedMonth];
    const summary = monthSummary(result, selectedMonth, config.capacity);
    return `<article class="plan-card ${isBaseline ? 'baseline-plan' : 'alternative-plan'}">
      <div class="plan-card-heading"><span>${isBaseline ? 'Your plan' : 'Another plan'}</span><b>${isBaseline ? 'CURRENT' : 'OPTION'}</b></div>
      <div class="planned-crop-illustration">${cropDrawing(crop)}</div>
      <h3>${CROPS[crop].name}</h3>
      <p>${months[selectedMonth]} ${config.year}</p>
      <div class="plan-year-strip">${strategy.crops.map((key, i) => `<span style="background:${CROPS[key].color}" class="${i === selectedMonth ? 'current' : ''}" title="${months[i]}: ${CROPS[key].name}"></span>`).join('')}</div>
      <div class="plan-water"><span>Water left in the soil</span><strong>${fmt(summary.storage)} <small>mm</small></strong></div>
      <small>Estimated water left at the end of the month. It is not a real measurement.</small>
    </article>`;
  };

  const waterDifference = difference > 0
    ? `The other plan may need ${fmt(difference)} mm more water.`
    : difference < 0
      ? `The other plan may need ${fmt(Math.abs(difference))} mm less water.`
      : 'Both plans may need the same amount of water.';

  const heroDescription = source.kind === 'synthetic'
    ? 'This is sample weather. Add weather from your area to see results for your field.'
    : 'Weather is loaded. Check your soil details and planting dates before using these results.';

  return `
    <div class="page-title">
      <div><div class="eyebrow">Soliq / ${config.year}</div><h1>Plan what to grow next.</h1><p class="sub">Compare plans to help choose what to plant.</p></div>
      <button class="button" data-go="settings">Edit field details</button>
    </div>
    <div class="form-actions" style="margin:0 0 20px">
      <button class="button primary" data-go="rotations">Edit crop plans →</button>
    </div>
    <section class="guided-hero">
      <div class="guided-hero-art" aria-hidden="true">${cropFieldSVG('wheat', { kind: 'banner' })}</div>
      <div><span class="eyebrow">Your field</span><h2 data-user-content>${esc(config.name)}</h2><p>${heroDescription}</p>
        <button class="button" data-go="settings">${source.kind === 'synthetic' ? 'Add local weather' : 'Change weather data'}</button>
      </div>
    </section>
    ${progressPanel()}
    <section class="panel crop-change-panel">
      <div class="panel-head">
        <div><div class="eyebrow">Compare crop plans</div><h2>What changes in the other plan?</h2></div>
        <label class="strategy-selector">Compare with
          <select id="compare-strategy">${strategies.slice(1).map((strategy, i) => `<option value="${i + 1}" ${selectedStrategy === i + 1 ? 'selected' : ''}>${esc(strategy.name || `Option ${i + 1}`)}</option>`).join('')}</select>
        </label>
      </div>
      <div class="month-picker" aria-label="Choose a month">
        ${months.map((month, i) => `<button data-month="${i}" aria-pressed="${i === selectedMonth}" class="${i === selectedMonth ? 'selected' : ''}"><span>${month}</span><i></i></button>`).join('')}
      </div>
      <div class="crop-change-comparison">
        ${cropCard(baseline, baselineResult, true)}
        <div class="change-connector" aria-hidden="true">→</div>
        ${cropCard(alternative, alternativeResult, false)}
      </div>
      <div class="change-caption">
        <strong>${baseline.crops[selectedMonth] === selectedCrop ? 'The crop is the same this month' : 'The other plan has a different crop this month'}</strong>
        <span>${changes.length} months change</span>
        <p>${changes.map(i => months[i]).join(' · ') || 'No other months change.'}</p>
      </div>
      <div class="next-crop-note"><span>Now: ${CROPS[selectedCrop].name}</span><span aria-hidden="true">→</span><span>Next: ${CROPS[alternative.crops[nextMonth]].name}</span></div>
      <p class="note">The pictures show the crop in the plan. They do not show how big the plant will grow or how much you will harvest.</p>
      <button class="button" data-go="rotations">Change the crop calendar →</button>
    </section>
    <div class="guided-metrics">
      <article class="panel">
        <div class="stat-label">Extra water the plan may need</div>
        <div class="stat-value">${fmt(alternativeResult.deficit)} <small>mm</small></div>
        <div class="delta-label">${waterDifference}</div>
        <p>This estimate uses the weather, soil details and water limit you entered. It does not tell you how much you will harvest.</p>
      </article>
      <article class="panel">
        <div class="stat-label">Days with crops in the plan</div>
        <div class="stat-value">${alternativeResult.coverDays} <small>days</small></div>
        <p>This is how many days of the year have a crop in the plan.</p>
        <p class="note">1 mm of water is about 1 litre on each square metre of land.</p>
      </article>
      <article class="panel next-step-card">
        <div class="eyebrow">Before you decide</div>
        <h3>Ask a local farm expert about planting dates, seed types, water and equipment.</h3>
        <button class="text-btn" data-go="rotations">Change your crop plans ↗</button>
      </article>
    </div>
    <details class="panel glossary">
      <summary>How to understand these results</summary>
      <div class="grid-two">
        <div><h3>What the numbers show</h3><p>They show how much water each plan may use and how many days crops are planned.</p></div>
        <div><h3>What the numbers do not show</h3><p>They do not tell you how much you will harvest, how much money you will make or how the soil will change. The results have not been tested on a real farm.</p></div>
      </div>
    </details>`;
}
