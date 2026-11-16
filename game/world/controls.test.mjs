import test from 'node:test';
import assert from 'node:assert/strict';
import {isGameplayKeyTarget} from './controls.js';

test('game shortcut guard accepts keys from canvas only', () => {
  const canvas={id:'renderCanvas'};
  const button={id:'btn-camera'};
  assert.equal(isGameplayKeyTarget({target:canvas},canvas),true);
  assert.equal(isGameplayKeyTarget({target:button},canvas),false);
  assert.equal(isGameplayKeyTarget({target:null},canvas),false);
  assert.equal(isGameplayKeyTarget({target:canvas,defaultPrevented:true},canvas),false);
});

test('OS / assistive shortcuts stay outside gameplay handler', () => {
  const canvas={id:'renderCanvas'};
  for(const key of ['ctrlKey','metaKey','altKey']){
    assert.equal(isGameplayKeyTarget({target:canvas,[key]:true},canvas),false,key);
  }
});
