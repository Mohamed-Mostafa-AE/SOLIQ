import {test, expect} from '@playwright/test';

test('judge pitch now opens both live NASA comparison and interactive 3D story', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 900});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/pitch-3d/');

  await expect(page.locator('.slide')).toHaveCount(7);
  await expect(page.locator('.slide.active .hero-links a')).toHaveCount(2);
  await expect(page.locator('.slide.active .hero-links a').first()).toHaveAttribute('href', '../walkthrough/?demo=1');
  await expect(page.locator('.slide.active .hero-links a').last()).toHaveAttribute('href', '../experience/play/');

  await page.locator('#slide-nav button').nth(4).click();
  await expect(page.locator('.slide.active')).toContainText('THE SEVENTH FIELD');
  await expect(page.locator('.slide.active')).toContainText('THE FIELD WORKSPACE');
  await expect(page.locator('.slide.active')).toContainText('THE EVIDENCE ADVISER');
  await expect(page.locator('.slide.active .ai-stat')).toContainText('5 / 5');
  await expect(page.locator('.slide.active .demo-links a')).toHaveCount(2);
  await page.screenshot({path: 'test-results/soil-iq-pitch-dual-experience.png'});

  await page.locator('#slide-nav button').last().click();
  await expect(page.locator('.slide.active .actions a')).toHaveCount(4);
  await expect(page.locator('.slide.active .actions a').first()).toHaveAttribute('href', '../walkthrough/?demo=1');
  await expect(page.locator('.slide.active .actions a').nth(1)).toHaveAttribute('href', '../experience/play/');
  await expect(page.locator('.slide.active')).toContainText('Then question every assumption');
});
