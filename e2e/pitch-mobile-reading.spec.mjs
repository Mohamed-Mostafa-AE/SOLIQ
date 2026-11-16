import { test, expect } from '@playwright/test';

test('P0-08: every pitch slide is readable without scaling or horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pitch-3d/');
  await expect(page.locator('.slide')).toHaveCount(7);

  for (let index = 0; index < 7; index += 1) {
    await page.locator('#slide-nav button').nth(index).click();
    const layout = await page.locator('.slide.active').evaluate((slide) => {
      const heading = slide.querySelector('h1').getBoundingClientRect();
      const footer = slide.querySelector('.slide-footer').getBoundingClientRect();
      const main = slide.querySelector('.left').getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        stageScale: getComputedStyle(document.querySelector('#stage')).transform,
        headingSize: Number.parseFloat(getComputedStyle(slide.querySelector('h1')).fontSize),
        headingWidth: heading.width,
        headingLeft: heading.left,
        contentBottom: main.bottom,
        footerTop: footer.top,
        slideHeight: slide.getBoundingClientRect().height,
      };
    });
    expect(layout.documentWidth, `slide ${index + 1} must not overflow`).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.stageScale).toBe('none');
    expect(layout.headingSize).toBeGreaterThanOrEqual(30);
    expect(layout.headingLeft).toBeGreaterThanOrEqual(0);
    expect(layout.headingWidth).toBeLessThanOrEqual(360);
    expect(layout.contentBottom).toBeLessThanOrEqual(layout.footerTop + 2);
    expect(layout.slideHeight).toBeGreaterThan(320);
  }

  await page.locator('#slide-nav button').nth(2).click();
  const navigationTargets = await page.locator('#slide-nav button').evaluateAll((buttons) =>
    buttons.map((button) => ({
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    })));
  expect(navigationTargets).toHaveLength(7);
  for (const target of navigationTargets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('.rotation')).toHaveCount(3);
  const positions = await page.locator('.rotation').evaluateAll((cards) => cards.map((card) => ({
    top: card.getBoundingClientRect().top, width: card.getBoundingClientRect().width,
  })));
  expect(positions[1].top).toBeGreaterThan(positions[0].top);
  expect(positions[2].top).toBeGreaterThan(positions[1].top);
  expect(Math.max(...positions.map((p) => p.width))).toBeLessThanOrEqual(340);
});

test('P0-08: keyboard navigation announces slides, notes and reduced motion without trapping focus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/pitch-3d/');

  await expect(page.locator('#slide-announcement')).toContainText('Slide 1 of 7');
  await page.locator('body').click({ position: { x: 20, y: 320 } });
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#counter')).toHaveText('2 / 7');
  await expect(page.locator('#slide-announcement')).toContainText('Slide 2 of 7');
  await page.keyboard.press('End');
  await expect(page.locator('#counter')).toHaveText('7 / 7');
  await expect(page.locator('#next')).toBeDisabled();
  await page.keyboard.press('Home');
  await expect(page.locator('#counter')).toHaveText('1 / 7');
  await page.locator('#notes-toggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#speaker-notes')).toBeVisible();
  await expect(page.locator('#notes-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#close-notes').press('Enter');
  await expect(page.locator('#speaker-notes')).toBeHidden();
  await expect(page.locator('#notes-toggle')).toBeFocused();
  await expect(page.locator('#export-pptx')).toBeVisible();
  await expect(page.locator('#print-deck')).toBeVisible();
  const activeAnimations = await page.locator('#stage').evaluate((stage) =>
    stage.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length);
  expect(activeAnimations).toBe(0);
});
