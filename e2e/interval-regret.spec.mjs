import {test,expect} from "@playwright/test";
test("paper-derived interval regret distinguishes only when uncertainty bounds separate",async({page})=>{
 await page.goto("/experience/");
 await page.locator('[data-tab="decision"]').click();
 await expect(page.locator("#regret-result")).toContainText("R2");
 await expect(page.locator("#regret-result")).toContainText("فصل مشروط");
 await page.locator("#regret-width").fill("0.02");
 await expect(page.locator("#regret-result")).toContainText("comparison_only");
 await expect(page.locator("#regret-result")).not.toContainText("فصل مشروط");
});
