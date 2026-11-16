import {DEFAULTS,CROPS,STRATEGIES,validateConfig} from '../engine.js';
import {retrieve,compare,LIMITATIONS} from './model.js';
const $=s=>document.querySelector(s),form=$('#walkthrough');
let evidence=null,bundle=null,controller=null,generation=0;
const plans=structuredClone(STRATEGIES.slice(0,2));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
$('#calendars').innerHTML=plans.map((p,i)=>'<h3>'+esc(p.name)+'</h3><div class="months">'+p.crops.map((crop,m)=>'<label>'+months[m]+'<select aria-label="Option '+(i+1)+' '+months[m]+'" data-plan="'+i+'" data-month="'+m+'">'+Object.entries(CROPS).map(([k,v])=>'<option value="'+k+'" '+(k===crop?'selected':'')+'>'+esc(v.name)+'</option>').join('')+'</select></label>').join('')+'</div>').join('');
$('#limits').innerHTML=LIMITATIONS.map(x=>'<li>'+esc(x)+'</li>').join('');
form.elements.year.max=new Date().getUTCFullYear()-1;
function inputs(){const c={...DEFAULTS};for(const name of ['lat','lon','year','capacity','initial','irrigation','runoff','waterWeight','coverWeight'])c[name]=Number(form.elements[name].value);return validateConfig(c);}
function invalidate(){bundle=null;$('#export').disabled=true;$('#results').hidden=true;$('#error').textContent='';}
form.addEventListener('input',e=>{invalidate();if(['lat','lon','year'].includes(e.target.name)||e.target.id==='consent'){generation++;controller?.abort();evidence=null;$('#compare').disabled=true;$('#source').textContent='UNAVAILABLE — query changed; confirm and retrieve again.';$('#load').disabled=false;}});
form.addEventListener('change',e=>{if(e.target.dataset.plan!==undefined)plans[Number(e.target.dataset.plan)].crops[Number(e.target.dataset.month)]=e.target.value;});
$('#load').onclick=async()=>{
 invalidate();evidence=null;$('#compare').disabled=true;
 if(!form.reportValidity())return;
 if(!$('#consent').checked){$('#error').textContent='Confirm the query point before contacting NASA.';return;}
 const token=++generation;controller?.abort();controller=new AbortController();
 $('#load').disabled=true;$('#source').textContent='Loading NASA POWER; no results available yet.';
 const timer=setTimeout(()=>controller.abort(),30000);
 try{const config=inputs();const result=await retrieve(config,{signal:controller.signal,fetcher:(_url,options)=>fetch('/api/trends?'+new URLSearchParams({mode:'power-year',lat:config.lat,lon:config.lon,year:config.year}),options)});if(token!==generation)return;evidence=result;$('#source').textContent='OBSERVED — NASA POWER regional weather, '+result.period.start+' to '+result.period.end+'. Retrieved '+result.retrievedAt+'. '+result.coverage.validDays+' valid days. UTC; temperature °C, rain mm/day. DERIVED SHA-256: '+result.rawSha256;$('#compare').disabled=false;}
 catch(e){if(token!==generation)return;$('#source').textContent='UNAVAILABLE — NASA request failed. No synthetic substitute or cached result is used.';$('#error').textContent=e.name==='AbortError'?'Request timed out; retry when connected.':e.message;}
 finally{clearTimeout(timer);if(token===generation)$('#load').disabled=false;}
};
form.onsubmit=e=>{
 e.preventDefault();invalidate();
 try{bundle=compare(evidence,inputs(),plans);const f=x=>x.toFixed(1);
 $('#results').innerHTML='<h2>4. SIMULATED comparison — comparison_only</h2><p>Same dated weather, horizon and initial conditions. No recommended winner.</p><div class="table-wrap"><table><thead><tr><th>Plan</th><th>Unmet ET (mm)</th><th>Irrigation (mm)</th><th>Planned crop days</th><th>Preference score</th></tr></thead><tbody>'+bundle.outputs.results.map(r=>'<tr><th>'+esc(r.name)+'</th><td>'+f(r.deficit)+'</td><td>'+f(r.irrigation)+'</td><td>'+r.coverDays+'</td><td>'+f(r.score)+'</td></tr>').join('')+'</tbody></table></div><h3>Sensitivity and uncertainty</h3><p>Rainfall is perturbed to 75%, 100% and 125% of the retrieved record for both plans. These are SIMULATED scenarios, not observations or a forecast. The range is not a confidence interval; unquantified soil/crop uncertainty remains.</p>'+bundle.sensitivity.envelopes.map(r=>'<p>'+esc(plans.find(p=>p.id===r.id).name)+': unmet ET '+f(r.minDeficit)+'–'+f(r.maxDeficit)+' mm.</p>').join('')+'<p>Discuss local crop feasibility, soil capacity, equipment and market access with an adviser before acting.</p>';$('#results').hidden=false;$('#export').disabled=false;
 }catch(error){$('#error').textContent=error.message;}
};
$('#export').onclick=()=>{if(!bundle)return;const url=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='soil-iq-evidence-walkthrough.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};

