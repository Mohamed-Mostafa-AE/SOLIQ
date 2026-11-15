import {test,expect} from "@playwright/test";

test("OMNI-EARTH lab opens and its six-farm game recalculates",async({page})=>{
 await page.goto("/experience/");
 await expect(page.getByRole("heading",{name:"الأرض بتحكي. والقرار بإيدك."})).toBeVisible();
 await page.locator('[data-tab="water"]').click();
 await expect(page.getByRole("heading",{name:/لعبة المسقة/})).toBeVisible();
 await page.locator("#water-supply").fill("100");
 await page.locator("#water-calc").click();
 await expect(page.locator("#water-result")).toContainText("الموزّع 100.00");
 await page.locator("#water-policy").selectOption("priority");
 await page.locator("#water-calc").click();
 await expect(page.locator("#water-result")).toContainText("F6");
 await page.setViewportSize({width:360,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test("NASA POWER trend error is visible and not replaced with invented data",async({page})=>{
 await page.route("**/api/trends**",route=>route.fulfill({status:502,json:{error:"NASA POWER temporarily unavailable"}}));
 await page.goto("/experience/");
 await page.locator('[data-tab="trend"]').click();
 await page.locator("#trend-fetch").click();
 await expect(page.locator("#trend-result")).toContainText("NASA POWER temporarily unavailable");
 await expect(page.locator("#trend-result")).not.toContainText("Mann–Kendall: S=");
});
test("SAR preview distinguishes discovery metadata from processed radar imagery",async({page})=>{
 await page.route("**/api/radar-scenes**",route=>route.fulfill({json:{count:1,transport:"live",scenes:[{id:"TEST-NISAR-01",startTime:"2026-07-01T00:00:00Z",platform:"NISAR",processingLevel:"GCOV",polarization:"HH",flightDirection:"ASCENDING"}]}}));
 await page.goto("/experience/");
 await page.locator('[data-tab="sar"]').click();
 await page.locator("#sar-fetch").click();
 await expect(page.locator("#sar-result")).toContainText("TEST-NISAR-01");
 await expect(page.locator("#sar-result")).toContainText("لا يوجد تحليل SAR pixel-to-pixel");
});
test("private source files remain inaccessible through local preview",async({page})=>{
 await page.goto("/");
 for(const path of ["/dev-server.mjs","/lib/trend-service.js","/.gitignore"]){
  const response=await page.request.get(path);
  expect(response.status()).toBe(404);
 }
});
