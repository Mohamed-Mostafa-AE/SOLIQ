import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./refinement.css',import.meta.url),'utf8');
const site=readFileSync(new URL('./site.js',import.meta.url),'utf8');
const source=site.split('/* P1-09:BEGIN_CINEMATIC_PREVIEW */')[1]?.split('/* P1-09:END_CINEMATIC_PREVIEW */')[0];
assert.ok(source,'cinematic preview must be bundled into the public site module');

test('P1-09: story preview is supplemental to the scientific product and keeps distinct routes',()=>{
 assert.match(html,/ONE CANAL/);
 for(const path of ['../#overview','../walkthrough/','../experience/play/','../pitch-3d/']){
  assert.ok(html.includes('href="'+path+'"'),path);
 }
 assert.match(html,/SIMULATED STORY/);
 assert.match(html,/Illustrative story preview, not an Earth observation/);
 assert.match(html,/class="decision-primary" href="\.\.\/walkthrough\/"/,'evidence-first science CTA must be primary');
 assert.match(html,/class="decision-secondary" href="\.\.\/experience\/play\/"/,'game must remain supplemental');
 assert.match(html,/href="refinement.css"/);
 assert.match(html,/src="site.js"/);
 assert.doesNotMatch(html,/cinematic\\.(css|js)/);
 assert.equal((html.match(/data-preview-choice="/g)||[]).length,3);
});

test('P1-09: keyboard-native choices update pressed state, readable result and decorative scene',()=>{
 const values={};
 const buttons=['water','soil','evidence'].map(topic=>({
  dataset:{previewChoice:topic},
  setAttribute(name,value){this[name]=value;},
  addEventListener(name,fn){this[name]=fn;},
 }));
 const scene={dataset:{mode:'water'}};
 const status={querySelector(key){return values[key]||(values[key]={textContent:''});}};
 const document={
  querySelectorAll(selector){assert.equal(selector,'[data-preview-choice]');return buttons;},
  querySelector(selector){return selector==='#delta-art'?scene:selector==='#decision-result'?status:null;},
 };
 runInNewContext(source,{document});
 assert.equal(buttons[0]['aria-pressed'],'true');
 buttons[1].click();
 assert.equal(scene.dataset.mode,'soil');
 assert.equal(buttons[1]['aria-pressed'],'true');
 assert.equal(buttons[0]['aria-pressed'],'false');
 assert.match(values['[data-preview-text]'].textContent,/No soil moisture is measured/);
 buttons[2].click();
 assert.equal(scene.dataset.mode,'evidence');
 assert.match(values['[data-preview-label]'].textContent,/NASA DATA UNAVAILABLE/);
 assert.match(values['[data-preview-text]'].textContent,/dated NASA POWER/);
});

test('P1-09: motion is optional and buttons expose keyboard focus',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.decision-preview \*::after\{animation:none!important/);
 assert.match(css,/button:focus-visible/);
 assert.match(html,/role="status" aria-live="polite"/);
 for(const name of ['delta-village','delta-palm--left','delta-palm--right','delta-sluice']){
  assert.match(html,new RegExp(name),'delta scene needs original local '+name+' art');
 }
 assert.match(css,/@keyframes delta-palm-sway/,'canal landscape should animate without WebGL');
 assert.match(css,/\.delta-house::before\{[\s\S]*?border-top:/,'Egyptian village buildings use flat roofs');
});


test('P1-09: every local Welcome script and stylesheet resolves through production-like preview allowlist',async()=>{
 const {resolvePublicPath}=await import('../dev-server.mjs');
 const urls=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(x=>x[1]);
 urls.push(...[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]));
 for(const path of urls){
  if(/^https?:/.test(path))continue;
  const normalized=new URL(path,'http://localhost/welcome/').pathname;
  assert.ok(resolvePublicPath(normalized),normalized+' must be served by the app preview');
 }
 assert.equal(resolvePublicPath('/welcome/cinematic.js'),null,'no dead unserved module');
 assert.equal(resolvePublicPath('/welcome/cinematic.css'),null,'no dead unserved stylesheet');
});
