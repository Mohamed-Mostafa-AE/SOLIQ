/**
 * Conservative interval regret certificate (FieldShift manuscript eqs. 10-15).
 * Each interval is an enclosure in a pre-declared, consistent utility scale.
 * Samples alone are NOT mathematical enclosures.
 */
export function intervalRegret({
 candidates,scenarios,tolerance=0,missingCriticals=[],epsilon=1e-12
}={}){
 if(!Array.isArray(candidates)||!Array.isArray(scenarios)||!Array.isArray(missingCriticals))throw Error("Invalid candidate/scenario inputs");
 if(!Number.isFinite(tolerance)||tolerance<0||!Number.isFinite(epsilon)||epsilon<0||epsilon>1e-6)throw Error("Invalid tolerance");
 if(scenarios.length===0||new Set(scenarios).size!==scenarios.length||scenarios.some(s=>typeof s!=="string"||!s))throw Error("Scenarios must be nonempty, unique names");
 if(candidates.length===0||new Set(candidates.map(c=>c?.id)).size!==candidates.length||candidates.some(c=>typeof c?.id!=="string"||!c.id))throw Error("Candidates must have unique nonempty IDs");
 const eligible=candidates.filter(c=>c.feasibility==="eligible");
 const unavailable=candidates.filter(c=>!["eligible","infeasible","requires_review"].includes(c.feasibility));
 if(unavailable.length)throw Error("Candidate feasibility must be explicit");
 if(eligible.length<2)return {status:"comparison_only",reason:"fewer_than_two_eligible",eligible:eligible.map(c=>c.id),missingCriticals,regret:[],winner:null};
 const normalized=eligible.map(c=>{
  if(!c.utilities||typeof c.utilities!=="object")throw Error("Missing declared utility intervals for "+c.id);
  const utilities={};
  for(const scenario of scenarios){
   const i=c.utilities[scenario];
   if(!i||!Number.isFinite(i.lower)||!Number.isFinite(i.upper)||i.lower<0||i.upper>1||i.lower>i.upper)throw Error("Invalid interval for "+c.id+"/"+scenario);
   utilities[scenario]={lower:i.lower,upper:i.upper};
  }
  return {id:c.id,utilities};
 });
 const regret=normalized.map(r=>{
  let lower=0,upper=0;
  for(const scenario of scenarios){
   let bestCompetitorLower=-Infinity,bestCompetitorUpper=-Infinity;
   for(const other of normalized){
    if(other.id===r.id)continue;
    bestCompetitorLower=Math.max(bestCompetitorLower,other.utilities[scenario].lower);
    bestCompetitorUpper=Math.max(bestCompetitorUpper,other.utilities[scenario].upper);
   }
   lower=Math.max(lower,0,bestCompetitorLower-r.utilities[scenario].upper);
   upper=Math.max(upper,0,bestCompetitorUpper-r.utilities[scenario].lower);
  }
  return {id:r.id,lower,upper};
 });
 const proof=regret.filter(r=>regret.every(other=>other.id===r.id||r.upper+tolerance+epsilon<other.lower));
 const outcome=proof.length===1&&missingCriticals.length===0?
  {status:"distinguished",reason:"strict_interval_regret_separation",winner:proof[0].id}:
  {status:"comparison_only",reason:missingCriticals.length?"missing_critical_inputs":"uncertainty_overlap",winner:null};
 return {...outcome,eligible:eligible.map(c=>c.id),regret,tolerance,missingCriticals,
  provenance:"conditional_on_declared_enclosing_intervals",statisticalConfidence:null,
  limitations:["No guarantee the input intervals enclose real agricultural outcomes","Input utility normalization and candidate feasibility must be independently justified","Not a calibrated probability or farm outcome prediction"]};
}
