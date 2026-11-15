import test from 'node:test';import assert from 'node:assert/strict';import {withFadeTransition} from './pitch-3d/transitions.js';
test('PowerPoint fade preserves source content and creates one correctly ordered, click-driven transition',()=>{
 const original='<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld name="Content"/><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'.replace('<p:cSld name="Content"/>','<p:cSld name="Content"></p:cSld>');
 const once=withFadeTransition(original),twice=withFadeTransition(once);
 assert.equal((twice.match(/<p:transition /g)||[]).length,1);assert.match(twice,/p14:dur="600"/);assert.match(twice,/advClick="1"/);assert.doesNotMatch(twice,/advTm=/);assert.match(twice,/name="Content"/);assert.ok(twice.indexOf('<p:transition ')>twice.indexOf('</p:clrMapOvr>'));assert.ok(twice.indexOf('<p:transition ')<twice.indexOf('</p:sld>'));assert.throws(()=>withFadeTransition('invalid'),/PresentationML/);
});