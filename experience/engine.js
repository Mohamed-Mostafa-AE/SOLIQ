/** SOLIQ exploratory scientific engine. Inputs are declared scenarios, not measured farm prescriptions. */
export function allocateWater(demands,supply,mode="proportional"){
 if(!Array.isArray(demands)||demands.length<2||demands.some(x=>!Number.isFinite(x)||x<0)||!Number.isFinite(supply)||supply<0)throw Error("Invalid demands or supply");
 if(!["proportional","priority"].includes(mode))throw Error("Unsupported allocation policy");
 const totalDemand=demands.reduce((a,b)=>a+b,0);
 let left=Math.min(totalDemand,supply);
 const delivered=demands.map(d=>{
  if(mode==="proportional")return totalDemand?d*Math.min(1,supply/totalDemand):0;
  const v=Math.min(d,left);left-=v;return v;
 });
 const deliveredTotal=delivered.reduce((a,b)=>a+b,0);
 const shares=demands.map((d,i)=>d?delivered[i]/d:1);
 const numerator=shares.reduce((a,b)=>a+b,0)**2,denominator=shares.length*shares.reduce((a,b)=>a+b*b,0);
 return {totalDemand,supply,delivered,deliveredTotal,shortfall:demands.map((d,i)=>d-delivered[i]),fairness:denominator?numerator/denominator:null,unit:"user-defined common water unit",mode,dataClass:"simulated"};
}
function erf(x){const sign=x<0?-1:1; x=Math.abs(x);const t=1/(1+.3275911*x);return sign*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x));}
/** Tie-corrected exploratory Mann–Kendall + actual-year Theil–Sen. Not adjusted for serial correlation. */
export function trendStats(points){
 if(!Array.isArray(points)||points.length<4||points.some(p=>!Number.isFinite(p.year)||!Number.isFinite(p.value)||!Number.isInteger(p.year))||new Set(points.map(p=>p.year)).size!==points.length)throw Error("Four distinct complete years needed");
 const rows=[...points].sort((a,b)=>a.year-b.year),n=rows.length,slopes=[];
 let S=0;const ties=new Map();
 for(const p of rows)ties.set(p.value,(ties.get(p.value)||0)+1);
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){S+=Math.sign(rows[j].value-rows[i].value);slopes.push((rows[j].value-rows[i].value)/(rows[j].year-rows[i].year));}
 slopes.sort((a,b)=>a-b);const m=slopes.length;
 const median=m%2?slopes[(m-1)/2]:(slopes[m/2-1]+slopes[m/2])/2;
 const tieTerm=[...ties.values()].filter(t=>t>1).reduce((sum,t)=>sum+t*(t-1)*(2*t+5),0);
 const variance=(n*(n-1)*(2*n+5)-tieTerm)/18,z=variance?(S>0?(S-1)/Math.sqrt(variance):S<0?(S+1)/Math.sqrt(variance):0):0;
 return {n,S,senPerYear:median,senPerDecade:median*10,p:variance?1-erf(Math.abs(z)/Math.sqrt(2)):1,z,variance,years:[rows[0].year,rows[n-1].year],serialCorrelationCorrected:false,dataClass:"derived",limitations:["No serial correlation correction","Data provenance and annual coverage must be checked"]};
}
export function nitrogenLedger({initial,fertilizer,fixation,mineralization,uptake,loss}={}){
 const values=[initial,fertilizer,fixation,mineralization,uptake,loss];
 if(values.some(x=>!Number.isFinite(x)||x<0))throw Error("Nitrogen ledger requires finite nonnegative inputs");
 const sources=initial+fertilizer+fixation+mineralization,sinks=uptake+loss,ending=sources-sinks;
 return {sources,sinks,ending,deficit:Math.max(0,-ending),closureResidual:ending-(sources-sinks),dataClass:"simulated",unit:"common input mass per declared area"};
}
