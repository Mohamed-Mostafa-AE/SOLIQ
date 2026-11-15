// Paired comparisons use the same perturbation for every candidate.
// These finite scenarios have no assigned probabilities.
export function auditDecision(results, tolerance=1e-6){
  if(!Number.isFinite(tolerance)||tolerance<0)throw Error('Invalid tie tolerance');
  const rows=results.filter(r=>r.status==='conditional'&&r.scenarioDeficits);
  const keys=['reference','drier','lowerKc','higherKc'];
  if(rows.some(r=>keys.some(k=>!Number.isFinite(r.scenarioDeficits[k])||r.scenarioDeficits[k]<0)))throw Error('Invalid scenario losses');
  const scenarios=keys.map(key=>{
    const best=rows.length?Math.min(...rows.map(r=>r.scenarioDeficits[key])):null;
    return {key,best,winners:rows.filter(r=>r.scenarioDeficits[key]<=best+tolerance).map(r=>r.id)};
  });
  const candidates=rows.map(r=>({id:r.id,wins:scenarios.filter(s=>s.winners.includes(r.id)).length,
    worstRegret:Math.max(...scenarios.map(s=>r.scenarioDeficits[s.key]-s.best))}));
  const reversals=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const differences=keys.map(k=>rows[i].scenarioDeficits[k]-rows[j].scenarioDeficits[k]);
    if(differences.some(d=>d>tolerance)&&differences.some(d=>d< -tolerance))reversals.push([rows[i].id,rows[j].id]);
  }
  return {scenarios,candidates,reversals,scope:'Water deficit only; four finite scenarios, not probabilities or global robustness',status:rows.length>=2?'comparison':'insufficient_candidates'};
}
export function auditPanel(report,language,esc,fmt){
  const a=auditDecision(report.results),ar=language==='ar';
  const name=id=>{const p=report.results.find(r=>r.id===id).profile;return esc(ar?p.ar:p.name);};
  return `<section class="panel"><h2>${ar?'هل يتغير القرار إذا تغيرت الافتراضات؟':'Would changing assumptions change your choice?'}</h2><p>${ar?'نقارن نفس المحاصيل في أربعة سيناريوهات مائية مشتركة. ليست احتمالات أو ضماناً للنتائج.':'Compare the same eligible crops across four shared water scenarios. These are sensitivity checks, with no assigned probabilities.'}</p>${a.status==='comparison'?`<div class="table-wrap"><table><thead><tr><th>${ar?'المحصول':'Crop'}</th><th>${ar?'مرات التعادل أو الأفضل':'Best or tied / 4'}</th><th>${ar?'أقصى ندم مائي (مم)':'Maximum water regret (mm)'}</th></tr></thead><tbody>${a.candidates.map(r=>`<tr><td>${name(r.id)}</td><td>${r.wins}</td><td>${fmt(r.worstRegret)}</td></tr>`).join('')}</tbody></table></div><p>${ar?'أزواج انعكس ترتيبها':'Pairs whose ordering reverses'}: ${a.reversals.length}</p>`:`<p>${ar?'أكمل مراجعة التربة والقيود وحمّل طقساً حقيقياً لمقارنة محصولين مؤهلين على الأقل.':'Confirm soil and local constraints and load observed weather to compare at least two eligible crops.'}</p>`}<p class="note">${ar?'الندم المائي هو الفرق عن أقل عجز في نفس السيناريو. لا يقيس الربح أو صحة التربة.':'Water regret is the additional modeled deficit relative to the lowest deficit in each scenario. It does not measure profit or soil health.'}</p><a href="welcome/">${ar?'عن المشروع والبحث والألعاب':'Project, research & learning games'} →</a></section>`;
}
