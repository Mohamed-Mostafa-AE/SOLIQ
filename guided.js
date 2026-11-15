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
      <div class="plan-water"><span>Water left in soil</span><strong>${fmt(summary.storage)} <small>mm</small></strong></div>
      <small>Estimated water left at month-end. This is not a sensor reading.</small>
    </article>`;
  };

  const waterDifference = difference > 0
    ? `${fmt(difference)} mm more water may be needed than with your plan.`
    : difference < 0
      ? `${fmt(Math.abs(difference))} mm less water may be needed than with your plan.`
      : 'The estimated water need is the same as your plan.';

  const heroDescription = source.kind === 'synthetic'
    ? 'These are example weather records. Add weather for your area before using the results to explore your field.'
    : 'Weather has been added. Check the soil details and crop dates before using the results.';

  return `
    <div class="page-title">
      <div><div class="eyebrow">Soliq / ${config.year}</div><h1>Plan what to grow next.</h1><p class="sub">Compare crop plans before you decide what to plant.</p></div>
      <button class="button" data-go="settings">Edit field details</button>
    </div>
    <div class="form-actions" style="margin:0 0 20px">
      <button class="button primary" data-go="analyzer">Find crops for my field →</button>
    </div>
    <section class="guided-hero">
      <div class="guided-hero-art" aria-hidden="true">${cropFieldSVG('wheat', { kind: 'banner' })}</div>
      <div><span class="eyebrow">Your field</span><h2 data-user-content>${esc(config.name)}</h2><p>${heroDescription}</p>
        <button class="button" data-go="evidence">${source.kind === 'synthetic' ? 'Add local weather' : 'Check the data'}</button>
      </div>
    </section>
    ${progressPanel()}
    <section class="panel crop-change-panel">
      <div class="panel-head">
        <div><div class="eyebrow">Compare crop plans</div><h2>What changes if you choose another plan?</h2></div>
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
        <strong>${baseline.crops[selectedMonth] === selectedCrop ? 'The crop stays the same this month' : 'A different crop is planned this month'}</strong>
        <span>Months with a different crop: ${changes.length}</span>
        <p>${changes.map(i => months[i]).join(' · ') || 'No other months change.'}</p>
      </div>
      <div class="next-crop-note"><span>This month: ${CROPS[selectedCrop].name}</span><span aria-hidden="true">→</span><span>Next month: ${CROPS[alternative.crops[nextMonth]].name}</span></div>
      <p class="note">The pictures show which crop is planned. They do not show how the plant will grow or how much you will harvest.</p>
      <button class="button" data-go="rotations">Change the crop calendar →</button>
    </section>
    <div class="guided-metrics">
      <article class="panel">
        <div class="stat-label">Water the plan may still need</div>
        <div class="stat-value">${fmt(alternativeResult.deficit)} <small>mm</small></div>
        <div class="delta-label">${waterDifference}</div>
        <p>This is an estimate based on the weather, soil values and watering limit entered above. It does not predict crop yield.</p>
      </article>
      <article class="panel">
        <div class="stat-label">Days with a crop planned</div>
        <div class="stat-value">${alternativeResult.coverDays} <small>days</small></div>
        <p>See how many days in the year have a crop planned.</p>
        <p class="note">1 mm of water is about 1 litre over 1 square metre.</p>
      </article>
      <article class="panel next-step-card">
        <div class="eyebrow">Before you decide</div>
        <h3>Check planting dates, local seed types, water supply, tools and buyers with a local farm expert.</h3>
        <button class="text-btn" id="open-research">See more details and downloads ↗</button>
      </article>
    </div>
    <details class="panel glossary">
      <summary>How to read this comparison</summary>
      <div class="grid-two">
        <div><h3>What these numbers show</h3><p>They compare estimated water use and the number of days a crop is planned.</p></div>
        <div><h3>What they do not show</h3><p>They do not tell you the harvest, income or effect on soil. These results have not been checked on a real farm.</p></div>
      </div>
    </details>`;
}
