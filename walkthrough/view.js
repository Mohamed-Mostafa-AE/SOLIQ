import {DEFAULTS,CROPS,STRATEGIES,validateConfig} from '../engine.js';
import {retrieve,compare,LIMITATIONS} from './model.js';
import {parseGameEvidenceHandoff} from '../game/core/evidence-handoff.js';
const $=s=>document.querySelector(s),form=$('#walkthrough');
let evidence=null,bundle=null,controller=null,generation=0;
const gameHandoff=parseGameEvidenceHandoff(window.location.search);
const autoDemo=new URLSearchParams(window.location.search).get('demo')==='1';
let pointRequestAuthorized=false;
function demoStatus(message,state='loading'){if(!autoDemo)return;const el=$('#demo-status');el.hidden=false;el.textContent=message;el.dataset.state=state;}
if(gameHandoff){
 const words={
  cover_first:'Calendar A: investigate crop cover first.',
  water_saving:'Calendar B: investigate lower peak water demand and livelihoods.',
  deferred_for_nasa:'You deferred the fictional crop choice until NASA and soil evidence is checked.',
 };
 $('#game-handoff-copy').textContent=(words[gameHandoff.hypothesis]||'You came from a fictional canal decision.')+' This is an UNTESTED story hypothesis, not a measured crop response.';
 $('#game-handoff').hidden=false;
}
const plans=structuredClone(STRATEGIES.slice(0,2));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
$('#calendars').innerHTML=plans.map((p,i)=>`
  <div class="plan-card" aria-label="Option ${i+1}: ${esc(p.name)}">
    <div class="plan-card-heading">
      <div><span class="plan-card-number">ROTATION OPTION / 0${i+1}</span><h3>${esc(p.name)}</h3></div>
      <span class="plan-mark">EDITABLE PLAN</span>
    </div>
    <div class="months">${p.crops.map((crop,m)=>`<label>${months[m]}
      <select aria-label="Option ${i+1} ${months[m]}" data-plan="${i}" data-month="${m}">${Object.entries(CROPS).map(([key,value])=>`<option value="${esc(key)}" ${key===crop?'selected':''}>${esc(value.name)}</option>`).join('')}</select>
    </label>`).join('')}</div>
    <p class="plan-bottom">12 months · simulated calendar · locally unvalidated crops</p>
  </div>`).join('');
$('#limits').innerHTML=LIMITATIONS.map(x=>'<li>'+esc(x)+'</li>').join('');
form.elements.year.max=new Date().getUTCFullYear()-1;
function receipt(state,message){
  $('#source').textContent=message;
  $('.weather-receipt').dataset.state=state;
  $('#receipt-state').textContent={unavailable:'NOT LOADED',loading:'REQUESTING',observed:'RETRIEVED'}[state];
  $('#load').setAttribute('aria-busy',state==='loading'?'true':'false');
  const link=$('#receipt-url');
  const verified=state==='observed'&&evidence?.requestUrl?.startsWith('https://power.larc.nasa.gov/api/');
  link.hidden=!verified;
  if(verified)link.href=evidence.requestUrl;
  else link.removeAttribute('href');
}
function inputs(){const c={...DEFAULTS};for(const name of ['lat','lon','year','capacity','initial','irrigation','runoff','waterWeight','coverWeight'])c[name]=Number(form.elements[name].value);return validateConfig(c);}
function invalidate(){bundle=null;$('#export').disabled=true;$('#results').hidden=true;$('#error').textContent='';}
form.addEventListener('input',e=>{invalidate();if(['lat','lon','year'].includes(e.target.name)||e.target.id==='consent'){generation++;controller?.abort();evidence=null;$('#compare').disabled=true;receipt('unavailable','UNAVAILABLE — query changed; confirm and retrieve again.');$('#load').disabled=false;}});
form.addEventListener('change',e=>{if(e.target.dataset.plan!==undefined)plans[Number(e.target.dataset.plan)].crops[Number(e.target.dataset.month)]=e.target.value;});
$('#load').onclick=async()=>{
 invalidate();evidence=null;$('#compare').disabled=true;
 if(!form.reportValidity())return;
 const publicSample=autoDemo&&Number(form.elements.lat.value)===31.09&&Number(form.elements.lon.value)===30.94;
 if(!$('#consent').checked&&!publicSample&&!pointRequestAuthorized){$('#error').textContent='Confirm the query point before contacting NASA.';return;}
 pointRequestAuthorized=false;
 const token=++generation;controller?.abort();controller=new AbortController();
 $('#load').disabled=true;receipt('loading','Loading NASA POWER; no results available yet.');
 demoStatus('Connecting to NASA POWER for historical weather. No results are shown until the response is verified.','loading');
 const timer=setTimeout(()=>controller.abort(),30000);
 try{const config=inputs();const result=await retrieve(config,{signal:controller.signal,fetcher:(_url,options)=>fetch('/api/trends?'+new URLSearchParams({mode:'power-year',lat:config.lat,lon:config.lon,year:config.year}),options)});if(token!==generation)return;evidence=result;receipt('observed','OBSERVED — NASA POWER regional weather, '+result.period.start+' to '+result.period.end+'. Retrieved '+result.retrievedAt+'. '+result.coverage.validDays+' valid days. UTC; temperature °C, rain mm/day. DERIVED SHA-256: '+result.rawSha256);$('#compare').disabled=false;
 demoStatus('NASA POWER · OBSERVED '+result.coverage.validDays+' verified daily records from '+result.period.start+' to '+result.period.end+'. DERIVED SHA-256 '+result.rawSha256+'. Rotation estimates use ASSUMED soil and crop values, not field measurements.','ready');
 if(autoDemo)form.requestSubmit();}
 catch(e){if(token!==generation)return;receipt('unavailable','UNAVAILABLE — NASA request failed. No synthetic substitute or cached result is used.');$('#error').textContent=e.name==='AbortError'?'Request timed out; retry when connected.':e.message;
 demoStatus('DATA UNAVAILABLE — NASA could not be reached. No fabricated weather or comparison was substituted.','unavailable');}
 finally{clearTimeout(timer);if(token===generation)$('#load').disabled=false;}
};
form.onsubmit=e=>{
 e.preventDefault();invalidate();
 try{
  bundle=compare(evidence,inputs(),plans);
  if(gameHandoff)bundle.gameHandoff={...gameHandoff,meaning:'Fictional investigation prompt only; no effect on inputs, calculations, or NASA receipt.'};
  const f=x=>Number(x).toFixed(1);
  const outcomes=bundle.outputs.results;
  $('#results').innerHTML=`
    <div class="result-head"><div><p class="section-kicker">04 / SCENARIO COMPARISON</p><h2>Read the trade-offs.</h2></div><span class="simulated-badge">SIMULATED / comparison_only</span></div>
    <p class="result-lede">Both plans use the same dated NASA weather, horizon and declared initial conditions. There is no recommended winner.</p>
    <div class="outcome-grid">${outcomes.map((r,i)=>`
      <article class="outcome-card"><p class="outcome-label">OPTION 0${i+1} / SIMULATED</p><h3>${esc(r.name)}</h3>
        <div class="outcome-metrics"><div class="outcome-metric"><strong>${f(r.deficit)}</strong><span>Unmet evapotranspiration (mm)</span></div><div class="outcome-metric"><strong>${f(r.irrigation)}</strong><span>Irrigation (mm)</span></div><div class="outcome-metric"><strong>${r.coverDays}</strong><span>Planned crop days</span></div><div class="outcome-metric"><strong>${f(r.score)}</strong><span>Preference score, not suitability</span></div></div>
      </article>`).join('')}</div>
    <div class="table-wrap"><table><caption class="sr-only">Exact numerical comparison of both simulated crop rotations</caption><thead><tr><th scope="col">Plan</th><th scope="col">Unmet ET (mm)</th><th scope="col">Irrigation (mm)</th><th scope="col">Planned crop days</th><th scope="col">Preference score</th></tr></thead><tbody>${outcomes.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${f(r.deficit)}</td><td>${f(r.irrigation)}</td><td>${r.coverDays}</td><td>${f(r.score)}</td></tr>`).join('')}</tbody></table></div>
    <div class="sensitivity-panel"><h3>Sensitivity and uncertainty</h3><p>Rainfall is perturbed to 75%, 100% and 125% of the retrieved record for both plans. These are SIMULATED scenarios, not observations or a forecast. The range is not a confidence interval; unquantified soil/crop uncertainty remains.</p><div class="sensitivity-rows">${bundle.sensitivity.envelopes.map(r=>`<div class="sensitivity-row">${esc(plans.find(p=>p.id===r.id).name)}:<br><strong>${f(r.minDeficit)}–${f(r.maxDeficit)} mm</strong> unmet ET</div>`).join('')}</div></div>
    <p class="result-warning">UNAVAILABLE: field soil calibration, verified suitability and local market conditions. Discuss real feasibility with a qualified local adviser before acting.</p>`;
  $('#results').hidden=false;
  $('#export').disabled=false;
  renderDemoSummary();
 }catch(error){$('#error').textContent=error.message;}
};
$('#export').onclick=()=>{if(!bundle)return;const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='soil-iq-evidence-walkthrough.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};



function renderDemoSummary(){
 if(!autoDemo||!bundle)return;
 const [a,b]=bundle.outputs.results,year=bundle.assumptions.config.year,precip=bundle.outputs.rain;
 const metric=(label,value,note,kind)=>'<article class="demo-metric"><span class="metric-kind">'+kind+'</span><h3>'+label+'</h3><strong>'+value+'</strong><p>'+note+'</p></article>';
 $('#auto-summary').innerHTML=metric('NASA annual rain',precip.toFixed(1)+' mm','Sum of retrieved daily gridded precipitation · '+year,'DERIVED FROM OBSERVED')
 +metric('Plan A unmet water demand',a.deficit.toFixed(1)+' mm','Exploratory bucket-model result','SIMULATED')
 +metric('Plan B unmet water demand',b.deficit.toFixed(1)+' mm','Same historical NASA weather and declared assumptions','SIMULATED')
 +metric('Planned crop cover',a.coverDays+' / '+b.coverDays+' days','Calendar A / B · planned, not observed vegetation','ASSUMED');
 $('#auto-summary').hidden=false;
 const state=$('#priority-state');if(state)state.textContent='Preference scores only: Plan A '+a.score.toFixed(1)+' / Plan B '+b.score.toFixed(1)+'. No validated winner.';
}
if(autoDemo){
 document.body.classList.add('auto-demo');
 $('#advanced').open=false;
 $('#demo-controls').hidden=false;
 demoStatus('Loading the public Sakha-area demo point from NASA POWER. Your device location is not accessed.','loading');
 for(const button of document.querySelectorAll('[data-demo-priority]')){
  button.addEventListener('click',()=>{
   const weights={water:[80,20],balanced:[60,40],cover:[20,80]}[button.dataset.demoPriority];
   form.elements.waterWeight.value=weights[0];form.elements.coverWeight.value=weights[1];
   for(const candidate of document.querySelectorAll('[data-demo-priority]'))candidate.setAttribute('aria-pressed',String(candidate===button));
   invalidate();if(evidence)form.requestSubmit();
  });
 }
 $('#retry-demo').addEventListener('click',()=>{
  form.elements.lat.value='31.09';form.elements.lon.value='30.94';form.elements.year.value='2024';
  $('#consent').checked=false;pointRequestAuthorized=false;$('#load').click();
 });
 $('#use-location').addEventListener('click',()=>{
  if(!navigator.geolocation){demoStatus('Location is unavailable in this browser; the public example remains available.','unavailable');return;}
  demoStatus('Waiting for location permission. Coordinates are used only for this NASA request, never saved by Soil-IQ.','loading');
  navigator.geolocation.getCurrentPosition(({coords})=>{
   if(!Number.isFinite(coords.latitude)||Math.abs(coords.latitude)>60||!Number.isFinite(coords.longitude)){demoStatus('The current analysis supports latitudes from -60° to 60°. Please use the public example.','unavailable');return;}
   form.elements.lat.value=coords.latitude.toFixed(4);form.elements.lon.value=coords.longitude.toFixed(4);
   pointRequestAuthorized=true;$('#load').click();
  },()=>demoStatus('Location permission was declined or unavailable. The public demo can still run.','unavailable'),{enableHighAccuracy:false,timeout:12000,maximumAge:0});
 });
 queueMicrotask(()=>$('#load').click());
}
