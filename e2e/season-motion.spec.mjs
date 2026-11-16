import {test,expect} from '@playwright/test';
test('season playback advances, scrubbing stops playback, and project links work',async({page})=>{
 await page.route('https://**',route=>route.abort());
 await page.goto('/');
 await page.locator('#research-mode').click();
 const scene=page.locator('.season-theatre');await expect(scene).toBeVisible();
 const slider=scene.locator('[data-day]');const date=scene.locator('[data-date]');const initial=await date.textContent();
 await scene.locator('[data-play]').click();await expect(date).not.toHaveText(initial);await scene.locator('[data-play]').click();
 await slider.focus();await slider.press('End');await expect(scene.locator('[data-play]')).toHaveAttribute('aria-pressed','false');
 await expect(date).not.toHaveText(initial);await scene.locator('[data-reset]').click();await expect(date).toHaveText(initial);
 await scene.getByRole('link').click();await expect(page).toHaveURL(/\/welcome\/$/);
 const projects=page.locator('a.project-card');await expect(projects).toHaveCount(4);
 await expect(page.locator('#method-details')).toContainText('NASA POWER');
 // The link opens the accessible overview and preserves the user's explicit
 // Research choice across same-origin navigation; Guided is always selectable.
 await expect(page.locator('a.project-app')).toHaveAttribute('href','../#overview');
 await page.locator('a.project-app').click();await expect(page).toHaveURL(/\/#overview$/);
 await expect(page.locator('#research-mode')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#crumb')).toHaveText('Research dashboard');
 await page.locator('#guided-mode').click();
 await expect(page.locator('#guided-mode')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#crumb')).toHaveText('Field overview');
 await page.locator('#research-mode').click();
 await page.locator('[data-view="analyzer"]').click();
 await expect(page).toHaveURL(/\/#analyzer$/);
 await expect(page.locator('#crumb')).toHaveText('Crop analyzer');
});

