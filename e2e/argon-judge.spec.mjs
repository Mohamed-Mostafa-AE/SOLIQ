import {test,expect} from '@playwright/test';
test('Argon judge challenge is visible through Experience and responds to temporal irrigation decisions',async({page})=>{
 await page.goto('/experience/');await page.locator('[data-tab="argon"]').click();
 const panel=page.locator('#argon');await expect(panel).toBeVisible();
 await expect(panel).toContainText('SIMULATED');await expect(panel).toContainText('وصل 235.0 م³');
 await panel.locator('[data-argon="echo"]').click();await panel.locator('[data-argon="limited"]').click();
 await expect(panel).toContainText('عجز 115.0 م³');await expect(panel).toContainText('الأساس: 235.0');
 await panel.locator('[data-argon="off"]').click();await expect(panel).toContainText('وصل 0.0 م³');
});
