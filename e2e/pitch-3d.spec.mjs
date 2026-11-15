import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
test('3D pitch navigates, preserves evidence and exports an eight-slide PowerPoint',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/pitch-3d/');
 await expect(page.locator('.slide')).toHaveCount(8);await expect(page.locator('.slide.active h1')).toContainText('The next crop.');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#counter')).toHaveText('2 / 8');
 await page.locator('#notes-toggle').click();await expect(page.locator('#speaker-notes')).toBeVisible();await page.locator('#notes-toggle').click();
 await mkdir('test-results',{recursive:true});
 for(let i=1;i<=8;i++){
  await page.locator('#slide-nav button').nth(i-1).click();await expect(page.locator('#counter')).toHaveText(i+' / 8');
  const bounds=await page.locator('.slide.active').evaluate(el=>{const footer=el.querySelector('.slide-footer').getBoundingClientRect();const content=el.querySelector('.left').getBoundingClientRect();return {contentBottom:content.bottom,footerTop:footer.top};});
  expect(bounds.contentBottom).toBeLessThanOrEqual(bounds.footerTop+1);
  await page.screenshot({path:'test-results/soil-iq-pitch-'+i+'.png',fullPage:true});
 }
 await page.locator('#slide-nav button').nth(5).click();await expect(page.locator('.slide.active')).toContainText('48.14 mm');await expect(page.locator('.slide.active')).toContainText('112');
 await page.locator('#slide-nav button').nth(6).click();await expect(page.locator('.slide.active')).toContainText('20.32 mm');await expect(page.locator('.slide.active')).toContainText('15.29 mm');
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.locator('#export-pptx').click()]);
 const output='test-results/Soil-IQ_3D_Pitch.pptx';await download.saveAs(output);expect((await readFile(output)).length).toBeGreaterThan(20000);
 const result=JSON.parse(execFileSync('python3',['-c','import zipfile,re,json; z=zipfile.ZipFile("'+output+'"); print(json.dumps({"slides":len([n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide[0-9]+.xml",n)]),"notes":len([n for n in z.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide[0-9]+.xml",n)])}))'],{encoding:'utf8'}));
 expect(result.slides).toBe(8);expect(result.notes).toBe(8);
 await page.emulateMedia({media:'print',reducedMotion:'reduce'});await page.pdf({path:'test-results/Soil-IQ_3D_Pitch.pdf',printBackground:true,preferCSSPageSize:true});
 const pdfPages=Number(execFileSync('python3',['-c','import re; b=open("test-results/Soil-IQ_3D_Pitch.pdf","rb").read(); print(len(re.findall(rb"/Type\\s*/Page(?!s)",b)))'],{encoding:'utf8'}).trim());expect(pdfPages).toBe(8);
 await page.emulateMedia({media:'screen',reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.keyboard.press('Home');await expect(page.locator('#counter')).toHaveText('1 / 8');
});
