/**
 * Argon × Antigravity interactive judge exercise.
 * Crops, soil samples, and water supply are explicitly fictional inputs.
 * Water totals are calculated by the EXISTING time-sliced mesqa engine.
 */
import {runGameWaterWindow} from './core/water-window-adapter.js';
export const ARGON_EVENTS=Object.freeze({
  crop:'soliq:game:plant-crop',water:'soliq:engine:water-window-computed',
  policy:'soliq:game:canal-policy',drain:'soliq:game:drainage-gate',
  echo:'soliq:game:season-step',
});
export const CROP_OPTIONS=Object.freeze({
  wheat:{label:'قمح',scale:1,icon:'🌾'},berseem:{label:'برسيم',scale:.8,icon:'🍀'},
  maize:{label:'ذرة شامية',scale:1.2,icon:'🌽'},sorghum:{label:'ذرة رفيعة',scale:1.05,icon:'🌱'},
  faba:{label:'فول',scale:.85,icon:'🫘'},barley:{label:'شعير',scale:.92,icon:'🌾'},
});
const BASE=[35,45,60,40,25,30];
const clone=o=>JSON.parse(JSON.stringify(o));
export function createArgonChallenge(onEvent=()=>{}){
 const state={supplyM3h:235,canalOn:true,pumpOn:true,crops:Array(6).fill('wheat'),
  waterTableCm:null,espPct:null,baseline:null};
 const calc=()=>{
  const demands=state.crops.map((c,i)=>+(BASE[i]*CROP_OPTIONS[c].scale).toFixed(2));
  const water=runGameWaterWindow({supplyM3h:state.supplyM3h,demandsM3:demands,
   turnOn:state.canalOn,pumpOn:state.pumpOn,seed:'argon-judge-exercise-v1'});
  const drainage=state.waterTableCm===null||state.espPct===null?'measurement_missing':
   state.waterTableCm<60||state.espPct>15?'request_professional_review':'screening_only';
  return {water,demands,drainage,source:'illustrative_not_observed',status:'comparison_only',
   assumptions:{farmAreaM2:1000,canalWindowHours:1,cropDemandFactors:'illustrative_not_calibrated',
   drainageThresholds:'teaching_screen_not_field_diagnosis'}};
 };
 let result=calc();
 const changed=(event)=>{result=calc();onEvent(event,{source:'simulated',status:'comparison_only',
  totalM3:result.water.deliveredTotal,shortfallM3:result.water.shortfall.reduce((a,b)=>a+b,0)});return clone(result)};
 return Object.freeze({
  result:()=>clone(result),state:()=>clone(state),
  supply:v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>2000)throw new TypeError('invalid_supply');state.supplyM3h=v;return changed(ARGON_EVENTS.policy)},
  canal:on=>{state.canalOn=!!on;return changed(ARGON_EVENTS.water)},
  pump:on=>{state.pumpOn=!!on;return changed(ARGON_EVENTS.water)},
  crop:(i,c)=>{if(!Number.isInteger(i)||i<0||i>=6||!CROP_OPTIONS[c])throw new TypeError('invalid_crop');state.crops[i]=c;return changed(ARGON_EVENTS.crop)},
  soil:(wt,esp)=>{if([wt,esp].some(n=>n!==null&&(!Number.isFinite(n)||n<0)))throw new TypeError('invalid_soil');state.waterTableCm=wt;state.espPct=esp;return changed(ARGON_EVENTS.drain)},
  saveBaseline:()=>{state.baseline=clone(result);return changed(ARGON_EVENTS.echo)},
  compare:()=>state.baseline?{baseline:clone(state.baseline),current:clone(result),status:'comparison_only'}:null,
 });
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountArgonChallenge(root){
 if(!root)throw Error('missing_challenge_container');
 const game=createArgonChallenge((event,detail)=>{
  if(typeof window.CustomEvent==='function')window.dispatchEvent(new CustomEvent(event,{detail}));
 });
 let selected='berseem';
 const style='background:#15372f;border:1px solid #476f60;padding:14px;color:#f2fff7;border-radius:12px;';
 function render(){
  const s=game.state(),r=game.result(),w=r.water,echo=game.compare();
  const unmet=w.shortfall.reduce((a,b)=>a+b,0);
  root.innerHTML=`<div style="${style}">
   <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><div>
    <p style="color:#b8f4c9;font-size:12px">ARGON × ANTIGRAVITY · INTERACTIVE JUDGE LAB</p>
    <h3 style="color:#fff;margin:8px 0">المسقة التفاعلية · ٦ حقول</h3></div>
    <span style="background:#e2b861;color:#152b20;padding:7px 10px;border-radius:8px;font-weight:bold">SIMULATED · comparison_only</span></div>
   <p style="color:#f8db98;font-size:13px">كل المدخلات مثال تعليمي افتراضي، وليست صور NASA أو قياسات تربة أو توقع محصول. معاملات الطلب النسبية تقريبية.</p>
   <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">
    <button type="button" data-argon="enough">💧 إمداد كافٍ</button><button type="button" data-argon="limited">⚠️ إمداد محدود</button>
    <button type="button" data-argon="off">🚫 OFF</button><button type="button" data-argon="echo">⏳ احفظ أساس المقارنة</button>
    <button type="button" data-argon="export">↓ تنزيل JSON</button></div>
   <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
    <label>التصرف الافتراضي (م³/ساعة) <input data-supply min="0" max="2000" type="number" value="${s.supplyM3h}" style="max-width:110px"></label>
    <label>اختار المحصول <select data-seed>${Object.entries(CROP_OPTIONS).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${v.icon} ${esc(v.label)}</option>`).join('')}</select></label>
    <label><input data-canal type="checkbox" ${s.canalOn?'checked':''}> نوبة ON</label>
    <label><input data-pump type="checkbox" ${s.pumpOn?'checked':''}> الطلمبة تعمل</label></div>
   <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:15px 0">
    ${s.crops.map((crop,i)=>`<button type="button" data-field="${i}" style="background:#234c40;color:white;border:1px solid #5c9781;border-radius:10px;padding:12px;text-align:start">
     <strong>${CROP_OPTIONS[crop].icon} غيط ${i+1} · ${esc(CROP_OPTIONS[crop].label)}</strong>
     <span style="display:block;font-size:12px">الطلب ${r.demands[i]} · وصل ${w.delivered[i].toFixed(1)} · عجز ${w.shortfall[i].toFixed(1)} م³</span></button>`).join('')}
   </div>
   <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:14px"><b>وصل ${w.deliveredTotal.toFixed(1)} م³</b><b>عجز ${unmet.toFixed(1)} م³</b>
    <b>عدالة جاين ${w.fairness===null?'N/A':(100*w.fairness).toFixed(1)+'%'}</b>
    <b>ميزان المياه ${w.ledger.residualM3.toExponential(1)} م³</b></div>
   <details style="margin:14px 0"><summary>🌱 دفتر التربة والصرف — مدخلات يحددها المستخدم</summary>
    <p>تقييم تعليمي فقط، وليس تصريح ري أو تشخيصًا من الرادار.</p>
    <label>عمق المياه الجوفية بالسم <input data-wt placeholder="غير مقاس" type="number" min="0" value="${s.waterTableCm??''}"></label>
    <label>ESP % <input data-esp placeholder="غير مقاس" type="number" min="0" value="${s.espPct??''}"></label>
    <button type="button" data-argon="soil">فحص افتراضات الصرف</button><p>الحالة: ${r.drainage}</p></details>
   <div style="background:#0d2820;padding:12px;border-radius:8px" role="status" aria-live="polite"><strong>TIME ECHO — نفس النموذج</strong>
    ${echo?`<p>الأساس: ${echo.baseline.water.deliveredTotal.toFixed(1)} م³ · السيناريو الحالي: ${w.deliveredTotal.toFixed(1)} م³</p>`:
      '<p>احفظ الأساس، ثم غيّر المياه أو المحصول لمقارنة سيناريوهين افتراضيين.</p>'}</div>
   </div>`;
  const bind=(a,fn)=>root.querySelector(`[data-argon="${a}"]`)?.addEventListener('click',()=>{fn();render()});
  bind('enough',()=>{game.supply(400);game.canal(true);game.pump(true)});
  bind('limited',()=>{game.supply(120);game.canal(true);game.pump(true)});
  bind('off',()=>game.canal(false));bind('echo',()=>game.saveBaseline());
  bind('soil',()=>{const wt=root.querySelector('[data-wt]').value,esp=root.querySelector('[data-esp]').value;
    game.soil(wt===''?null:Number(wt),esp===''?null:Number(esp))});
  bind('export',()=>{const data={status:'comparison_only',source:'simulated_not_observed',result:game.result(),comparison:game.compare()};
    const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=u;a.download='soliq-argon-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)});
  root.querySelector('[data-supply]').addEventListener('change',e=>{game.supply(Number(e.target.value));render()});
  root.querySelector('[data-canal]').addEventListener('change',e=>{game.canal(e.target.checked);render()});
  root.querySelector('[data-pump]').addEventListener('change',e=>{game.pump(e.target.checked);render()});
  root.querySelector('[data-seed]').addEventListener('change',e=>{selected=e.target.value});
  root.querySelectorAll('[data-field]').forEach(b=>b.addEventListener('click',()=>{game.crop(Number(b.dataset.field),selected);render()}));
 }
 render();return game;
}
