import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./cinematic.css',import.meta.url),'utf8');
const source=readFileSync(new URL('./cinematic.js',import.meta.url),'utf8');

test('P1-09: story preview is supplemental to the scientific product and keeps distinct routes',()=>{
 assert.match(html,/ONE CANAL/);
 for(const path of ['../#overview','../#rotations','../experience/play/','../pitch-3d/']){
  assert.ok(html.includes('href="'+path+'"'),path);
 }
 assert.match(html,/SIMULATED STORY/);
 assert.match(html,/Illustrative story preview, not an Earth observation/);
 assert.match(html,/href="cinematic.css"/);
 assert.match(html,/src="cinematic.js"/);
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
});
