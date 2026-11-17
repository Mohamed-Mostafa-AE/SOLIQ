import { test, expect } from '@playwright/test';
import { demoWeather } from '../engine.js';

function datedPowerResponse() {
  const parameter = { T2M_MIN: {}, T2M_MAX: {}, PRECTOTCORR: {} };
  for (const day of demoWeather(2024)) {
    const date = day.date.replaceAll('-', '');
    parameter.T2M_MIN[date] = day.tmin;
    parameter.T2M_MAX[date] = day.tmax;
    parameter.PRECTOTCORR[date] = day.rain;
  }
  return {
    header: { time_standard: 'UTC' },
    parameters: {
      T2M_MIN: { units: 'C' }, T2M_MAX: { units: 'C' },
      PRECTOTCORR: { units: 'mm/day' },
    },
    properties: { parameter },
  };
}

test('premium evidence-first walkthrough exposes navigable, original responsive design without a fabricated answer', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/walkthrough/');

  await expect(page.getByRole('navigation', { name: 'Soil-IQ site navigation' })).toBeVisible();
  await expect(page.locator('.field-hero')).toBeVisible();
  await expect(page.locator('.field-hero').getByText('Concept art', { exact: false })).toBeVisible();
  await expect(page.locator('#calendars .plan-card')).toHaveCount(2);
  await expect(page.locator('#source')).toContainText('UNAVAILABLE');
  await expect(page.locator('#receipt-url')).toBeHidden();
  await expect(page.locator('#compare')).toBeDisabled();
  await expect(page.locator('#export')).toBeDisabled();
  await expect(page.locator('.evidence-legend')).toContainText('OBSERVED');
  await expect(page.locator('.evidence-legend')).toContainText('ASSUMED');
  await expect(page.locator('.evidence-legend')).toContainText('SIMULATED');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Screenshot only the 360px viewport. Whole-page rasterization can exceed
  // headless Chromium's capture budget for this long accessible form, while
  // the assertions above still exercise its actual DOM and horizontal fit.
  await page.screenshot({ path: test.info().outputPath('walkthrough-premium-mobile-before-weather.png'), animations: 'disabled' });
});

test('NASA receipt and editable plans become readable comparison without changing model or evidence', async ({ page }) => {
  await page.route('**/api/trends?**', (route) => route.fulfill({ json: datedPowerResponse() }));
  await page.goto('/walkthrough/');
  await page.locator('#consent').check();
  await page.locator('#load').click();

  await expect(page.locator('#source')).toContainText('366 valid days');
  await expect(page.locator('.weather-receipt')).toHaveAttribute('data-state', 'observed');
  await expect(page.locator('#receipt-url')).toHaveAttribute('href', /^https:\/\/power\.larc\.nasa\.gov\/api\/temporal\/daily\/point\?/);
  await page.getByLabel('Option 2 Jun').selectOption('sorghum');
  await page.locator('#compare').click();
  await expect(page.locator('#results')).toContainText('comparison_only');
  await expect(page.locator('#results .outcome-card')).toHaveCount(2);
  await expect(page.locator('#results')).toContainText('not a confidence interval');
  await expect(page.locator('#export')).toBeEnabled();
  await page.screenshot({ path: test.info().outputPath('walkthrough-premium-desktop-comparison.png'), fullPage: true });

  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  const saved = await download;
  expect(saved.suggestedFilename()).toBe('soil-iq-evidence-walkthrough.json');
  await page.getByLabel('Soil-water capacity').fill('180');
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#export')).toBeDisabled();
});
