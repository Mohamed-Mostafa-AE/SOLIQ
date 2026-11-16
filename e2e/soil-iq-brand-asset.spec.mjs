import {test, expect} from '@playwright/test';

async function expectDecoded(page, selector) {
  const brand = page.locator(selector).first();
  await expect(brand).toBeVisible();
  await expect.poll(async () => brand.evaluate(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)).toBe(true);
  await expect(brand).toHaveAttribute('alt', 'Soil-IQ');
}

test('Welcome desktop and mobile display a fully decoded shared Soil-IQ mark', async ({page}, testInfo) => {
  await page.goto('/welcome/');
  await expectDecoded(page, 'header img.brand-wordmark');
  await page.locator('header').screenshot({path:testInfo.outputPath('welcome-soil-iq-desktop.png')});
  await page.setViewportSize({width:390,height:844});
  await expectDecoded(page, 'header img.brand-wordmark');
  await page.locator('header').screenshot({path:testInfo.outputPath('welcome-soil-iq-mobile.png')});
});

test('the farmer workspace displays the same undamaged brand', async ({page}, testInfo) => {
  await page.goto('/');
  await expectDecoded(page, '.brandmark img');
  await page.locator('.sidebar').screenshot({path:testInfo.outputPath('workspace-soil-iq-logo.png')});
});
