import test from 'node:test';
import assert from 'node:assert/strict';
import {plantTransforms,seededJitter,CROP_VISUALS,VISUAL_ART_STATUS} from './visual-polish.js';
import {CHARACTER_ART_STATUS} from './character-detail.js';

const FIELD={crop:'wheat',center:{x:5,y:.02,z:22},width:18,depth:20};
test('farmland upgraded foliage is reproducible and independent from real NASA imagery',()=>{
 const one=plantTransforms(FIELD,'balanced');
 const two=plantTransforms({...FIELD},'balanced');
 assert.deepEqual(one,two);
 assert.equal(one.length,7*CROP_VISUALS.wheat.density);
 assert.ok(one.every(p=>p.x>=-4.3&&p.x<=14.3&&p.z>=12&&p.z<=32&&p.height>0));
 assert.match(VISUAL_ART_STATUS,/fictional/);
 assert.match(CHARACTER_ART_STATUS,/Procedural/);
});
test('mobile LOD draws fewer crop plants without removing six farm rows',()=>{
 const low=plantTransforms(FIELD,'low'),ultra=plantTransforms(FIELD,'ultra');
 assert.ok(low.length<ultra.length);
 assert.equal(low.length%7,0);
 assert.equal(ultra.length%7,0);
});
test('seventh echo field is an alternate-future space and has no observed crop geometry',()=>{
 assert.deepEqual(plantTransforms({...FIELD,crop:'future_echo'},'balanced'),[]);
});
test('procedural random generator has stable values from known seeds',()=>{
 const a=seededJitter(123),b=seededJitter(123);
 assert.deepEqual([a(),a(),a()],[b(),b(),b()]);
});
