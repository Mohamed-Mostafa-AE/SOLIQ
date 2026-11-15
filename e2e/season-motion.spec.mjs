import {test,expect} from '@playwright/test';
test('season playback advances, scrubbing stops playback, and project links work',async({page})=>{
 await page.route('https://**',route=>route.abort());
 await page.goto('/#overview');
 const scene=page.locator('.season-theatre');await expect(scene).toBeVisible();
 const slider=scene.locator('[data-day]');const date=scene.locator('[data-date]');const initial=await date.textContent();
 await scene.locator('[data-play]').click();await expect(date).not.toHaveText(initial);await scene.locator('[data-play]').click();
 await slider.focus();await slider.press('End');await expect(scene.locator('[data-play]')).toHaveAttribute('aria-pressed','false');
 await expect(date).not.toHaveText(initial);await scene.locator('[data-reset]').click();await expect(date).toHaveText(initial);
 await scene.getByRole('link').click();await expect(page.locator('#links .link-list a')).toHaveCount(4);
 await expect(page.locator('#problem h2')).toContainText('THE NEXT CROP');
 await expect(page.locator('#method')).toContainText('NASA POWER');
});
