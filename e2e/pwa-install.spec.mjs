import {test,expect} from '@playwright/test';

test('Soil-IQ offers an honest install path and keyboard-accessible fallback',async({page})=>{
 await page.addInitScript(()=>window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  event.stopImmediatePropagation();
 },true));
 await page.goto('/');
 await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','/manifest.webmanifest');
 const install=page.getByRole('button',{name:'Install Soil-IQ app'});
 await expect(install).toBeVisible();
 await install.focus();
 await page.keyboard.press('Enter');
 const help=page.getByRole('dialog',{name:'Install Soil-IQ'});
 await expect(help).toBeVisible();
 await expect(help).toContainText('not a native Android/iOS app');
 await expect(help).toContainText('NASA evidence');
 await help.getByRole('button',{name:'Got it'}).click();
 await expect(help).not.toBeVisible();
});

test('an installed offline route shows unavailable evidence instead of a stale simulation',async({page,context})=>{
 await page.goto('/');
 await page.waitForFunction(()=>navigator.serviceWorker?.controller!==null,undefined,{timeout:15000});
 await context.setOffline(true);
 try{
  await page.goto('/walkthrough/',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:/You are offline/i})).toBeVisible();
  await expect(page.getByText('NASA POWER')).toBeVisible();
  await expect(page.getByText(/not an observation/)).toBeVisible();
 }finally{
  await context.setOffline(false);
 }
});
