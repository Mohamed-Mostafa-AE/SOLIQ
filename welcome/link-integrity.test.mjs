import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveViewForAudience} from '../audience.js';

test('Welcome and research-brief application links open an accessible default Guided view',async()=>{
 for(const page of ['index.html','paper.html']){
  const html=await readFile(new URL(page,import.meta.url),'utf8');
  const deepLinks=[...html.matchAll(/href="\.\.\/#([a-z-]+)"/g)].map(match=>match[1]);
  assert.ok(deepLinks.length>=2,`${page} must offer visible app links`);
  for(const view of deepLinks){
   assert.equal(resolveViewForAudience('guided',view),view,`${page}: #${view} is hidden in default Guided mode`);
  }
 }
});

test('All Welcome GitHub links target the public repository that actually exists',async()=>{
 const html=await readFile(new URL('index.html',import.meta.url),'utf8');
 const links=[...html.matchAll(/href="(https:\/\/github\.com\/Mohamed-Mostafa-AE\/[^\"]+)"/g)].map(match=>match[1]);
 assert.ok(links.length>=2,'Welcome page should link to public project source in two places');
 assert.deepEqual([...new Set(links)],['https://github.com/Mohamed-Mostafa-AE/SOLIQ']);
});
