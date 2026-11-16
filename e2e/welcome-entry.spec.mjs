import {test,expect} from '@playwright/test';

test('Welcome primary CTA opens the actual Guided workflow',async({page})=>{
 await page.goto('/welcome/');
 await page.getByRole('link',{name:/Explore the app/i}).click();
 await expect(page).toHaveURL(/\/#overview$/);
 await expect(page.locator('#guided-mode')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.page-title h1')).toContainText('A little perspective.');
 await page.locator('#research-mode').click();
 await page.locator('[data-view="analyzer"]').click();
 await expect(page).toHaveURL(/\/#analyzer$/);
});
