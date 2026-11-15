import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {GUIDANCE,MODEL} from '../adviser/knowledge.js';
test('real open model inference plus real NASA evidence, English and Arabic',async({page})=>{
 test.setTimeout(240000);
 page.on('console',message=>{if(message.type()==='error')console.log('Browser error:',message.text());});
 page.on('requestfailed',request=>console.log('Request failed:',request.url(),request.failure()?.errorText));
 await page.goto('/adviser/');
 await page.locator('[name="lat"]').fill(String(31+5/60));
 await page.locator('[name="lon"]').fill(String(30+56/60));
 await page.locator('#run').click();
 await expect(page.locator('#status')).toContainText(/Complete:|Demo could not complete:/,{timeout:180000});
 await expect(page.locator('#status')).toHaveText('Complete: real model inference, cited guidance and NASA-backed evidence.');
 await expect(page.locator('#proof')).toContainText('384 dimensions');
 await expect(page.locator('#guidance article')).toHaveCount(3);
 await expect(page.locator('#report')).toContainText('NASA POWER weather');
 await expect(page.locator('#report')).toContainText('Evidence SHA-256:');
 const retrieval=[];
 const cases=[['water','What determines crop evapotranspiration, crop coefficients and growth stage?'],['cover','How do cover crops and residues protect the soil during fallow and when should they be terminated?'],['soil','How do field capacity and wilting point determine soil water storage?'],['diversity','How should crop family diversity, equipment, seed and market feasibility affect a rotation?'],['weather','What do NASA POWER gridded weather estimates mean compared with field measurements?']];
 await page.locator('[name="topic"]').selectOption('custom');
 for(const [expected,question] of cases){
  await page.locator('[name="question"]').fill(question);await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText('Complete: real model inference, cited guidance and NASA-backed evidence.',{timeout:90000});
  await expect(page.locator('#run')).toBeEnabled();
  const links=await page.locator('#guidance article a').evaluateAll(elements=>elements.map(a=>a.getAttribute('href')));
  const expectedUrl=GUIDANCE.find(p=>p.id===expected).url;
  retrieval.push({expected,question,links,hitAt3:links.includes(expectedUrl)});
 }
 await mkdir('test-results',{recursive:true});
 await writeFile('test-results/egypt-ai-retrieval.json',JSON.stringify({model:MODEL,lat:31+5/60,lon:30+56/60,scope:'Five hand-written English questions on the six-document reviewed corpus; not independent agronomic accuracy.',recallAt3:retrieval.filter(x=>x.hitAt3).length/retrieval.length,cases:retrieval},null,2));
 console.log('EGYPT_AI_RETRIEVAL '+JSON.stringify({model:MODEL,recallAt3:retrieval.filter(x=>x.hitAt3).length/retrieval.length,cases:retrieval}));
 await page.locator('#language').click();
 await page.locator('#run').click();
 await expect(page.locator('#status')).toContainText('اكتمل:',{timeout:90000});
 await expect(page.locator('#report')).toContainText('تقرير الأدلة');
 await page.screenshot({path:'test-results/adviser-real-inference.png',fullPage:true});
});
