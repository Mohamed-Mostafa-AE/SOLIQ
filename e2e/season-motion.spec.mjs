import {test,expect} from '@playwright/test';
test('season playback advances, scrubbing stops playback, and project links work',async({page})=>{
 await page.route('https://**',route=>route.abort());
 await page.goto('/#overview');
 const scene=page.locator('.season-theatre');await expect(scene).toBeVisible();
 const slider=scene.locator('[data-day]');const date=scene.locator('[data-date]');const initial=await date.textContent();
 await scene.locator('[data-play]').click();await expect(date).not.toHaveText(initial);await scene.locator('[data-play]').click();
 await slider.focus();await slider.press('End');await expect(scene.locator('[data-play]')).toHaveAttribute('aria-pressed','false');
 await expect(date).not.toHaveText(initial);await scene.locator('[data-reset]').click();await expect(date).toHaveText(initial);
 await scene.getByRole('link').click();await expect(page.locator('#links .hub-grid a')).toHaveCount(6);
 await page.locator('[data-game="water"][data-correct="true"]').click();await expect(page.locator('#water-result')).toContainText('+30 mm');
});
