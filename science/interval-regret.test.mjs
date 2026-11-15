import test from "node:test";
import assert from "node:assert/strict";
import {intervalRegret} from "./interval-regret.js";

/* Synthetic manuscript Table III — NOT measured NASA or crop-model outcomes. */
const data={
 R0:{normal:.625,dry:.520,hot:.390,wet:.580},
 R1:{normal:.740,dry:.550,hot:.445,wet:.755},
 R2:{normal:.700,dry:.665,hot:.605,wet:.640}
};
const scenarios=["normal","dry","hot","wet"];
function fixture(h=0){
 return {scenarios,candidates:Object.entries(data).map(([id,v])=>({
  id,feasibility:"eligible",utilities:Object.fromEntries(Object.entries(v).map(([s,x])=>[s,{lower:x-h,upper:x+h}]))
 }))};
}
test("point-utility maximum regrets agree with paper Table III",()=>{
 const out=intervalRegret(fixture());
 const regrets=Object.fromEntries(out.regret.map(r=>[r.id,r]));
 assert.ok(Math.abs(regrets.R0.upper-.215)<1e-10);
 assert.ok(Math.abs(regrets.R1.upper-.160)<1e-10);
 assert.ok(Math.abs(regrets.R2.upper-.115)<1e-10);
 assert.equal(out.status,"distinguished");
 assert.equal(out.winner,"R2");
});
test("small vs wide interval obeys separation threshold and abstention",()=>{
 const narrow=intervalRegret(fixture(.005));
 assert.equal(narrow.winner,"R2");
 assert.ok(Math.abs(narrow.regret.find(r=>r.id==="R2").upper-.125)<1e-10);
 assert.equal(intervalRegret(fixture(.011)).status,"distinguished");
 assert.equal(intervalRegret(fixture(.012)).status,"comparison_only");
 assert.equal(intervalRegret(fixture(.10)).status,"comparison_only");
});
test("missing critical field evidence blocks winner even if separation holds",()=>{
 const out=intervalRegret({...fixture(.005),missingCriticals:["farm_area","actual_soil_storage"]});
 assert.equal(out.status,"comparison_only");
 assert.equal(out.reason,"missing_critical_inputs");
 assert.equal(out.winner,null);
});
test("infeasible candidate cannot win despite apparent numeric advantage",()=>{
 const input=fixture(0);
 input.candidates[2].feasibility="infeasible";
 const out=intervalRegret(input);
 assert.equal(out.eligible.includes("R2"),false);
 assert.equal(out.winner,"R1");
});
test("uncertainty widening cannot create distinction under the same set",()=>{
 let hadGap=false;
 for(let h=.001;h<=.039;h+=.001){
  const out=intervalRegret(fixture(h));
  if(out.status!=="distinguished")hadGap=true;
  if(hadGap)assert.equal(out.status,"comparison_only");
 }
});
test("invalid scenarios/intervals/weights rejected, never silently clipped",()=>{
 const q=fixture(0);
 q.candidates[0].utilities.normal.lower=2;
 assert.throws(()=>intervalRegret(q),/Invalid interval/);
 assert.throws(()=>intervalRegret({...fixture(),tolerance:-1}));
 assert.throws(()=>intervalRegret({...fixture(),scenarios:["normal","normal"]}));
 const singleton=intervalRegret({...fixture(),candidates:[fixture().candidates[0]]});
 assert.equal(singleton.status,"comparison_only");
});
