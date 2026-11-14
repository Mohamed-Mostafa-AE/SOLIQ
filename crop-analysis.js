/** Conditional crop screening with explicit local constraints and staged water demand. */
import { CROPS, referenceET, validateConfig, validateWeather } from './engine.js';

export const PROFILE_SOURCE='https://www.fao.org/4/x0490e/x0490e0b.htm';
export const PROFILES=Object.freeze([
  {id:'spring_wheat',name:'Spring wheat',ar:'قمح ربيعي',family:'grass',kc:[0.3,1.15,0.3],color:'#be9849'},
  {id:'barley',name:'Barley',ar:'شعير',family:'grass',kc:[0.3,1.15,0.25],color:'#b68d58'},
  {id:'maize',name:'Grain maize',ar:'ذرة حبوب',family:'grass',kc:[0.3,1.2,0.35],color:'#8b9e42'},
  {id:'sorghum',name:'Grain sorghum',ar:'ذرة رفيعة للحبوب',family:'grass',kc:[0.3,1.05,0.55],color:'#8f7762'},
  {id:'soybean',name:'Soybean',ar:'فول صويا',family:'legume',kc:[0.4,1.15,0.5],color:'#52a18c'},
  {id:'sunflower',name:'Sunflower',ar:'دوار الشمس',family:'oilseed',kc:[0.35,1.075,0.35],color:'#d1ae48'},
].map(profile=>Object.freeze({...profile,kc:Object.freeze(profile.kc),source:PROFILE_SOURCE})));

export function defaultScreening(year){
  return {start:`${year}-05-01`,stages:[20,30,40,30],baseline:'maize',objective:'water',soilConfirmed:false,unsupportedProcesses:false,
    checks:Object.fromEntries(PROFILES.map(p=>[p.id,{seed:'unknown',equipment:'unknown',market:'unknown',local:'unknown'}]))};
}

export function synchronizeScreeningPlan(plan,config){
  const context={lat:config.lat,lon:config.lon,year:config.year,capacity:config.capacity,initial:config.initial};
  if(!plan?.context||['lat','lon','year'].some(key=>plan.context[key]!==context[key]))return {...defaultScreening(config.year),context};
  const soilChanged=['capacity','initial'].some(key=>plan.context[key]!==context[key]);
  return {...plan,context,soilConfirmed:soilChanged?false:plan.soilConfirmed};
}

export function stageCoefficient(day,stages,coefficients){
  const [initial,development,middle,late]=stages;
  const [low,high,end]=coefficients;
  if(day<0||day>=initial+development+middle+late)return null;
  if(day<initial)return low;
  if(day<initial+development)return low+(high-low)*(day-initial)/development;
  if(day<initial+development+middle)return high;
  return high+(end-high)*(day-initial-development-middle)/late;
}

function validatePlan(plan,config,baseline){
  if(!plan||!PROFILES.some(p=>p.id===plan.baseline))throw Error('Choose a known baseline crop');
  if(!['water','family'].includes(plan.objective))throw Error('Unknown screening objective');
  if(!Array.isArray(plan.stages)||plan.stages.length!==4||plan.stages.some(d=>!Number.isInteger(d)||d<1||d>200))throw Error('Provide four positive whole-day stage lengths');
  const parsed=new Date(plan.start+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(plan.start)||!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==plan.start||parsed.getUTCFullYear()!==config.year)throw Error('Planting date must be valid and within the weather year');
  const end=new Date(+parsed+plan.stages.reduce((a,b)=>a+b,0)*86400000);
  if(end>new Date(Date.UTC(config.year+1,0,1)))throw Error('This season extends beyond the available weather year; provide a within-year window');
  if(!baseline||!Array.isArray(baseline.crops)||baseline.crops.length!==12||baseline.crops.some(id=>!Object.hasOwn(CROPS,id)))throw Error('A complete baseline calendar is required');
  for(const profile of PROFILES){
    const check=plan.checks?.[profile.id];
    if(!check||['seed','equipment','market','local'].some(key=>!['yes','no','unknown'].includes(check[key])))throw Error('Each crop needs explicit seed, equipment, market and local-review states');
  }
  return {start:parsed,end};
}

function runCandidate(weather,config,plan,profile,baseline,kcMultiplier=1){
  const first=new Date(plan.start+'T00:00:00Z');
  const length=plan.stages.reduce((a,b)=>a+b,0);
  let storage=config.initial,budget=config.irrigation;
  let demand=0,actual=0,irrigation=0,drainage=0,rainTotal=0,runoffTotal=0,maxResidual=0;
  let targetDemand=0,targetActual=0,heatDays=0,frostDays=0;
  const daily=[];
  for(const row of weather){
    const day=(new Date(row.date+'T00:00:00Z')-first)/86400000;
    const inWindow=day>=0&&day<length;
    const background=CROPS[baseline.crops[Number(row.date.slice(5,7))-1]];
    const coefficient=inWindow?stageCoefficient(day,plan.stages,profile.kc)*kcMultiplier:background.kc;
    const cropped=inWindow||background.family!=='None';
    const rain=row.rain*config.rainScale;
    const runoff=rain*config.runoff;
    const et0=referenceET(row.date,config.lat,row.tmin+config.tempShift,row.tmax+config.tempShift);
    const potential=et0*coefficient;
    const applied=cropped&&storage<0.4*config.capacity?Math.min(budget,Math.max(0,0.7*config.capacity-storage)):0;
    budget-=applied;
    const before=storage;
    const inflow=storage+rain-runoff+applied;
    const drained=Math.max(0,inflow-config.capacity);
    const available=inflow-drained;
    const stress=cropped?Math.min(1,available/(0.5*config.capacity)):1;
    const et=Math.min(available,potential*stress);
    storage=available-et;
    const residual=storage-before-rain+runoff-applied+drained+et;
    if(!Number.isFinite(storage)||Math.abs(residual)>1e-8||storage<0||storage>config.capacity+1e-9)throw Error('Water-accounting check failed');
    demand+=potential;actual+=et;irrigation+=applied;drainage+=drained;rainTotal+=rain;runoffTotal+=runoff;maxResidual=Math.max(maxResidual,Math.abs(residual));
    if(inWindow){targetDemand+=potential;targetActual+=et;heatDays+=Number(row.tmax+config.tempShift>=config.heat);frostDays+=Number(row.tmin+config.tempShift<=config.frost);}
    daily.push({date:row.date,inWindow,crop:inWindow?profile.id:baseline.crops[Number(row.date.slice(5,7))-1],kc:coefficient,et0,demand:potential,et,storage,irrigation:applied,rain,runoff,drainage:drained,residual});
  }
  return {demand,actual,deficit:Math.max(0,demand-actual),targetDemand,targetActual,targetDeficit:Math.max(0,targetDemand-targetActual),irrigation,drainage,rain:rainTotal,runoff:runoffTotal,finalStorage:storage,maxResidual,heatDays,frostDays,daily};
}

export function screenCrops(weather,config,plan,baseline,sourceKind='synthetic'){
  validateConfig(config);validateWeather(weather,config.year);
  if(!['synthetic','nasa','import'].includes(sourceKind))throw Error('Unknown weather provenance');
  if(typeof plan?.soilConfirmed!=='boolean'||typeof plan?.unsupportedProcesses!=='boolean')throw Error('Soil and model-domain declarations must be explicit booleans');
  const window=validatePlan(plan,config,baseline);
  const baselineProfile=PROFILES.find(p=>p.id===plan.baseline);
  const windowRows=weather.filter(row=>row.date>=plan.start&&row.date<window.end.toISOString().slice(0,10));
  const baselineResult=plan.unsupportedProcesses?{
    modeled:false,
    heatDays:windowRows.filter(row=>row.tmax+config.tempShift>=config.heat).length,
    frostDays:windowRows.filter(row=>row.tmin+config.tempShift<=config.frost).length,
  }:runCandidate(weather,config,plan,baselineProfile,baseline);
  const results=PROFILES.map(profile=>{
    const checks=plan.checks[profile.id];
    const excluded=Object.entries(checks).filter(([,value])=>value==='no').map(([key])=>key);
    const missing=Object.entries(checks).filter(([,value])=>value==='unknown').map(([key])=>key);
    if(!plan.soilConfirmed)missing.push('soil');
    if(sourceKind==='synthetic')missing.push('observed_weather');
    if(plan.unsupportedProcesses)excluded.push('unsupported_processes');
    const status=excluded.length?'excluded':missing.length?'needs_review':'conditional';
    // Hard-excluded crops are never simulated or ranked.
    if(status==='excluded')return {id:profile.id,status,excluded,missing,profile};
    const metrics=runCandidate(weather,config,plan,profile,baseline);
    const dry=runCandidate(weather,{...config,rainScale:Math.max(0.2,config.rainScale*0.75)},plan,profile,baseline);
    const low=runCandidate(weather,config,plan,profile,baseline,0.85);
    const high=runCandidate(weather,config,plan,profile,baseline,1.15);
    const familyChange=profile.family!==baselineProfile.family;
    return {id:profile.id,status,excluded,missing,profile,metrics,familyChange,
      baselineDifference:metrics.deficit-baselineResult.deficit,
      sensitivity:{dryRainMultiplier:Math.max(0.2,config.rainScale*0.75)/config.rainScale,dryDeficit:dry.deficit,coefficientDeficitMin:Math.min(low.deficit,high.deficit),coefficientDeficitMax:Math.max(low.deficit,high.deficit)}};
  });
  const shortlist=results.filter(result=>result.status==='conditional').sort((a,b)=>
    (plan.objective==='family'?Number(b.familyChange)-Number(a.familyChange):0)||a.metrics.deficit-b.metrics.deficit||a.id.localeCompare(b.id)).map(result=>result.id);
  return {version:'crop-screening-1',sourceKind,weatherYear:config.year,start:plan.start,endExclusive:window.end.toISOString().slice(0,10),stages:[...plan.stages],baselineProfile:plan.baseline,baselineResult,results,shortlist,
    status:shortlist.length?'conditional_comparison':'comparison_only',
    scope:'Historical weather analogue; not a seasonal forecast, yield prediction or validated farm recommendation',
    assumptions:{stageLengths:'User-declared; defaults illustrative, not inferred phenology',coefficients:'FAO-56 Table 12 starting values; mid/end range selections, climate and wetting adjustments not applied',soil:'Fixed-depth available-water bucket; stress depletion fraction 0.5 assumed',outsideWindow:'Existing baseline monthly coefficients retained; no storage reset',sensitivity:'Three deterministic perturbations; not probability intervals or a robustness certificate'},source:PROFILE_SOURCE};
}
