import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
test('3D pitch navigates, preserves evidence and exports an seven-slide PowerPoint',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/pitch-3d/');
 await expect(page.locator('.slide')).toHaveCount(7);await expect(page.locator('.slide.active h1')).toContainText('The next crop.');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#counter')).toHaveText('2 / 7');
 await page.locator('#notes-toggle').click();await expect(page.locator('#speaker-notes')).toBeVisible();await page.locator('#notes-toggle').click();
 await mkdir('test-results',{recursive:true});
 for(let i=1;i<=7;i++){
  await page.locator('#slide-nav button').nth(i-1).click();await expect(page.locator('#counter')).toHaveText(i+' / 7');
  const bounds=await page.locator('.slide.active').evaluate(el=>{const footer=el.querySelector('.slide-footer').getBoundingClientRect();const content=el.querySelector('.left').getBoundingClientRect();return {contentBottom:content.bottom,footerTop:footer.top};});
  expect(bounds.contentBottom).toBeLessThanOrEqual(bounds.footerTop+1);
  await page.screenshot({path:'test-results/soil-iq-pitch-'+i+'.png',fullPage:true});
 }
 await page.locator('#slide-nav button').nth(5).click();await expect(page.locator('.slide.active')).toContainText('48.14 mm');await expect(page.locator('.slide.active')).toContainText('112');
 await expect(page.locator('.slide.active')).toContainText('20.32 mm');await expect(page.locator('.slide.active')).toContainText('15.29 mm');
 const pendingDownload=page.waitForEvent('download',{timeout:60000});await page.locator('#export-pptx').click();await expect(page.locator('#export-status')).not.toContainText('Export could not complete:',{timeout:1000});const download=await pendingDownload;
 const output='test-results/Soil-IQ_3D_Pitch.pptx';await download.saveAs(output);expect((await readFile(output)).length).toBeGreaterThan(20000);
 const result=JSON.parse(execFileSync('python3',['-c','import zipfile,re,json; z=zipfile.ZipFile("'+output+'"); print(json.dumps({"slides":len([n for n in z.namelist() if re.fullmatch(r"ppt/slides/slide[0-9]+.xml",n)]),"notes":len([n for n in z.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide[0-9]+.xml",n)])}))'],{encoding:'utf8'}));
 expect(result.slides).toBe(7);expect(result.notes).toBe(7);
 const fadeCount=Number(execFileSync('python3',['-c','import zipfile,re,xml.etree.ElementTree as E; z=zipfile.ZipFile("'+output+'"); ns={"p":"http://schemas.openxmlformats.org/presentationml/2006/main"}; roots=[E.fromstring(z.read(n)) for n in z.namelist() if re.fullmatch(r"ppt/slides/slide[0-9]+.xml",n)]; print(sum(r.find("p:transition/p:fade",ns) is not None for r in roots))'],{encoding:'utf8'}).trim());expect(fadeCount).toBe(7);
 await page.emulateMedia({media:'print',reducedMotion:'reduce'});await page.pdf({path:'test-results/Soil-IQ_3D_Pitch.pdf',printBackground:true,preferCSSPageSize:true});
 const pdfPages=Number(execFileSync('python3',['-c','import re; b=open("test-results/Soil-IQ_3D_Pitch.pdf","rb").read(); print(len(re.findall(rb"/Type\\s*/Page(?!s)",b)))'],{encoding:'utf8'}).trim());expect(pdfPages).toBe(7);
 await page.emulateMedia({media:'screen',reducedMotion:'reduce'});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.keyboard.press('Home');await expect(page.locator('#counter')).toHaveText('1 / 7');
});

test('slide motion is directional, settles after quick navigation and honors reduced motion',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/pitch-3d/');
 await page.keyboard.press('ArrowRight');
 expect(await page.locator('#stage').evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running'))).toBe(true);
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await expect(page.locator('#counter')).toHaveText('2 / 7');
 await expect(page.locator('.slide.leaving')).toHaveCount(0,{timeout:2000});
 await expect.poll(()=>page.locator('#stage').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),{timeout:2000}).toBe(0);
 await expect(page.locator('.slide.active')).toHaveCount(1);
 await page.screenshot({path:'test-results/pitch-motion-settled.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('ArrowRight');
 expect(await page.locator('#stage').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
});

test('seven-slide story sweeps the persistent field entirely off the right edge when unused',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/pitch-3d/');
 await expect(page.locator('.continuous-field')).toHaveCount(1);await expect(page.locator('.slide')).toHaveCount(7);
 for(const index of [2,4]){
  await page.locator('#slide-nav button').nth(index).click();
  await expect(page.locator('.continuous-field')).toHaveAttribute('data-state','offstage');
  await expect.poll(()=>page.locator('.continuous-field').evaluate(el=>el.getBoundingClientRect().left>=el.parentElement.getBoundingClientRect().right),{timeout:2500}).toBe(true);
  await page.screenshot({path:'test-results/seven-slide-field-off-'+(index+1)+'.png',fullPage:true});
 }
 await page.locator('#slide-nav button').nth(5).click();
 await expect(page.locator('.continuous-field')).toHaveAttribute('data-state','visible');
 await expect.poll(()=>page.locator('.continuous-field').evaluate(el=>el.getBoundingClientRect().right>el.parentElement.getBoundingClientRect().left&&el.getBoundingClientRect().left<el.parentElement.getBoundingClientRect().right),{timeout:2500}).toBe(true);
 await expect(page.locator('.slide.active')).toContainText('20.32 mm');await expect(page.locator('.slide.active')).toContainText('15.29 mm');
 await page.locator('#slide-nav button').nth(6).click();await expect(page.locator('#counter')).toHaveText('7 / 7');
});
