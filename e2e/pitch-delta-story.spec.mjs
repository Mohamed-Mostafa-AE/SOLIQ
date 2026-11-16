import { test, expect } from '@playwright/test';

test('judge pitch uses an original Delta canal illustration and an honest slide-progress meter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pitch-3d/');

  await expect(page.locator('.slide')).toHaveCount(7);
  await expect(page.locator('.wordmark .brand-name')).toBeVisible();
  await expect(page.locator('.wordmark .brand-name')).toHaveText('Soil-IQ');
  await expect(page.locator('.wordmark img')).toHaveCount(0);
  // Desktop has one cinematic field shared across all slides. The slide-local
  // SVG is deliberately hidden there and shown only in mobile reading mode.
  const heroArt = page.locator('.continuous-field svg');
  await expect(heroArt).toBeVisible();
  await expect(heroArt.locator('[data-art="delta-canal"]')).toHaveCount(1);
  await expect(heroArt.locator('[data-art="mesqa-bridge"]')).toHaveCount(1);
  await expect(heroArt.locator('[data-art="sakia-wheel"]')).toHaveCount(1);
  await expect(page.locator('.continuous-field .field-caption')).toBeVisible();

  const progress = page.locator('#deck-progress');
  await expect(progress).toHaveAttribute('max', '7');
  await expect(progress).toHaveAttribute('value', '1');
  await page.locator('#slide-nav button').nth(3).click();
  await expect(progress).toHaveAttribute('value', '4');
  await expect(page.locator('.slide.active')).toContainText('Every result has');
  await expect(page.locator('.slide.active')).toContainText('NASA POWER');
  await page.screenshot({ path: 'test-results/soil-iq-pitch-judge-desktop.png', fullPage: true });
  await page.locator('#slide-nav button').last().click();
  await expect(progress).toHaveAttribute('value', '7');
});

test('360px pitch preserves full-size typography, touch controls, accessible notes and Delta artwork', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pitch-3d/');

  const brand = page.locator('.wordmark .brand-name');
  await expect(brand).toBeVisible();
  await expect(page.locator('.wordmark img')).toHaveCount(0);
  const brandStyle = await brand.evaluate((el) => ({
    size: Number.parseFloat(getComputedStyle(el).fontSize),
    color: getComputedStyle(el).color,
    width: el.getBoundingClientRect().width,
  }));
  expect(brandStyle.size).toBeGreaterThanOrEqual(20);
  expect(brandStyle.width).toBeGreaterThan(60);
  expect(brandStyle.color).toBe('rgb(244, 200, 121)');

  const art = page.locator('.slide.active .scene svg');
  await expect(art).toBeVisible();
  await expect(art.locator('[data-art="delta-canal"]')).toHaveCount(1);
  await expect(page.locator('#deck-progress')).toHaveAttribute('value', '1');
  const layout = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
    heading: Number.parseFloat(getComputedStyle(document.querySelector('.slide.active h1')).fontSize),
    nav: [...document.querySelectorAll('#slide-nav button')].map((button) => button.getBoundingClientRect().width),
  }));
  expect(layout.document).toBeLessThanOrEqual(layout.viewport);
  expect(layout.heading).toBeGreaterThanOrEqual(30);
  expect(Math.min(...layout.nav)).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'test-results/soil-iq-pitch-judge-mobile-360.png', fullPage: true });

  await page.locator('#notes-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#speaker-notes')).toBeVisible();
  await expect(page.locator('#close-notes')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#speaker-notes')).toBeHidden();
  await expect(page.locator('#notes-toggle')).toBeFocused();
  await page.locator('#next').click();
  await expect(page.locator('#counter')).toHaveText('2 / 7');
  await expect(page.locator('#deck-progress')).toHaveAttribute('value', '2');
});
