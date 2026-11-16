import {test,expect} from '@playwright/test';

test('P1-09 cinematic Welcome preview: accessible choices, routes and mobile reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:360,height:800});
 await page.goto('/welcome/');
 await expect(page.getByRole('heading',{name:'ONE CANAL. SIX FAMILIES.'})).toBeVisible();
 const preview=page.locator('#decision-preview');
 await preview.scrollIntoViewIfNeeded();
 const soil=page.getByRole('button',{name:'02 / Protect soil'});
 await soil.focus();
 await page.keyboard.press('Enter');
 await expect(soil).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#decision-result')).toContainText('No soil moisture is measured');
 const evidence=page.getByRole('button',{name:'03 / Ask for evidence'});
 await evidence.click();
 await expect(evidence).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#decision-result')).toContainText('NASA DATA UNAVAILABLE IN THIS PREVIEW');
 await expect(page.locator('#delta-art')).toHaveAttribute('data-mode','evidence');
 const motion=await page.evaluate(()=>getComputedStyle(document.querySelector('.delta-canal'),'::after').animationName);
 expect(motion).toBe('none');
 expect(await preview.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await expect(preview.getByRole('link',{name:/Enter The Seventh Field/})).toHaveAttribute('href','../experience/play/');
 await expect(preview.getByRole('link',{name:/Compare real crop rotations/})).toHaveAttribute('href','../#rotations');
});
