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
 const palmReduced=await page.evaluate(()=>getComputedStyle(document.querySelector('.delta-palm'),'::before').animationName);
 expect(palmReduced).toBe('none');
 await page.emulateMedia({reducedMotion:'no-preference'});
 const palmAnimated=await page.evaluate(()=>getComputedStyle(document.querySelector('.delta-palm'),'::before').animationName);
 expect(palmAnimated).toBe('delta-palm-sway');
 await page.emulateMedia({reducedMotion:'reduce'});
 const mobileGeometry=await page.evaluate(()=>{
  const width=innerWidth,buttons=[...document.querySelectorAll('#decision-preview .decision-choices button')];
  return {pageOverflow:document.documentElement.scrollWidth-width,buttonsFit:buttons.every(button=>{
   const b=button.getBoundingClientRect();return b.left>=-1&&b.right<=width+1&&b.width>=44;
  })};
 });
 expect(mobileGeometry.pageOverflow).toBeLessThanOrEqual(1);
 expect(mobileGeometry.buttonsFit).toBe(true);
 await preview.screenshot({path:'test-results/p1-09-mobile.png',animations:'disabled'});
 await page.setViewportSize({width:1440,height:900});
 await preview.scrollIntoViewIfNeeded();
 await preview.screenshot({path:'test-results/p1-09-desktop.png',animations:'disabled'});
 await expect(preview.getByRole('link',{name:/Enter The Seventh Field/})).toHaveAttribute('href','../experience/play/');
 await expect(preview.getByRole('link',{name:/Compare crop rotation scenarios/})).toHaveAttribute('href','../walkthrough/');
 await expect(preview.locator('.decision-preview-actions .decision-primary')).toHaveAttribute('href','../walkthrough/');
 await expect(preview.locator('.decision-preview-actions .decision-secondary')).toHaveAttribute('href','../experience/play/');
 await preview.getByRole('link',{name:/Compare crop rotation scenarios/}).click();
 await expect(page.getByRole('heading',{name:'Compare two crop plans, evidence first'})).toBeVisible();
});
