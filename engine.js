/** Transparent exploratory calculations. Crop coefficients are editable assumptions. */
export const VERSION = '0.1.0';
export const DEFAULTS = {name:'My field',lat:30.05,lon:31.23,year:2024,capacity:150,initial:75,irrigation:300,runoff:0.1,heat:35,frost:0,rainScale:1,tempShift:0,waterWeight:60,coverWeight:40};
export const CROPS = {
  wheat:{name:'Wheat',kc:1.05,color:'#c19a4b',family:'Grass'},
  maize:{name:'Maize',kc:1.15,color:'#7a983d',family:'Grass'},
  legume:{name:'Grain legume',kc:0.95,color:'#55a595',family:'Legume'},
  barley:{name:'Barley',kc:0.95,color:'#b78963',family:'Grass'},
  sorghum:{name:'Sorghum',kc:1.0,color:'#a3ad6a',family:'Grass'},
  cover:{name:'Cover crop',kc:0.8,color:'#47856b',family:'Mixed'},
  fallow:{name:'Fallow',kc:0.25,color:'#e4e1d6',family:'None'},
};
export const STRATEGIES = [
 {id:'R0',name:'Existing sequence',crops:['wheat','wheat','wheat','wheat','fallow','maize','maize','maize','maize','fallow','wheat','wheat'],why:'Keep your baseline visible so every alternative has a fair comparison.',risk:'Confirm that the illustrative calendar matches your actual crop history.'},
 {id:'R1',name:'Legume diversification',crops:['wheat','wheat','wheat','wheat','fallow','legume','legume','legume','fallow','cover','wheat','wheat'],why:'Explore a different crop family and an additional planned cover window.',risk:'Local species, pest hosts, planting dates, inoculation and market access need review. Nitrogen gains are not estimated.'},
 {id:'R2',name:'Alternative cereal sequence',crops:['barley','barley','barley','barley','fallow','sorghum','sorghum','sorghum','sorghum','fallow','barley','barley'],why:'Explore a different seasonal water-demand pattern under the same weather and water budget.',risk:'Both crops are grasses. This is not evidence of pest-cycle disruption or local climate suitability.'},
];
function finite(x,name,min=-Infinity,max=Infinity){if(!Number.isFinite(x)||x<min||x>max)throw Error(`${name} must be between ${min} and ${max}`);}
export function validateConfig(c){
 finite(c.lat,'Latitude',-60,60);finite(c.lon,'Longitude',-180,180);finite(c.year,'Year',1981,new Date().getUTCFullYear()-1);
 if(!Number.isInteger(c.year))throw Error('Year must be an integer');
 finite(c.capacity,'Soil capacity',10,500);finite(c.initial,'Initial water',0,c.capacity);finite(c.irrigation,'Irrigation budget',0,3000);finite(c.runoff,'Runoff fraction',0,0.8);
 finite(c.heat,'Heat threshold',0,60);finite(c.frost,'Frost threshold',-30,20);finite(c.rainScale,'Rainfall multiplier',0.2,2);finite(c.tempShift,'Temperature change',-5,6);
 finite(c.waterWeight,'Water priority',0,100);finite(c.coverWeight,'Cover priority',0,100);
 if(c.waterWeight+c.coverWeight===0)throw Error('Choose at least one priority');return c;
}
export function datesInYear(year){const out=[];let d=new Date(Date.UTC(year,0,1));while(d.getUTCFullYear()===year){out.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}return out;}
export function demoWeather(year){return datesInYear(year).map((date,i)=>{const season=Math.sin(2*Math.PI*(i-105)/365);const mean=22+9*season;return {date,tmin:mean-7,tmax:mean+7,rain:i%19===0?8:i%11===0?3:0};});}
export function validateWeather(rows,year){
 if(!Array.isArray(rows))throw Error('Weather must be an array');const expected=datesInYear(year);
 if(rows.length!==expected.length)throw Error(`A complete ${year} requires ${expected.length} daily rows; received ${rows.length}. Gaps are not filled silently.`);
 rows.forEach((r,i)=>{if(r.date!==expected[i])throw Error(`Missing, duplicate or unordered date at row ${i+1}`);finite(r.tmin,'Minimum temperature',-80,65);finite(r.tmax,'Maximum temperature',-80,65);finite(r.rain,'Daily rain',0,2000);if(r.tmax<r.tmin)throw Error(`Maximum below minimum on ${r.date}`);});return rows;
}
export function powerUrl(c){validateConfig(c);return 'https://power.larc.nasa.gov/api/temporal/daily/point?'+new URLSearchParams({parameters:'T2M_MAX,T2M_MIN,PRECTOTCORR',community:'AG',latitude:String(c.lat),longitude:String(c.lon),start:`${c.year}0101`,end:`${c.year}1231`,format:'JSON','time-standard':'UTC'});}
export function parsePower(json,year){
 const p=json?.properties?.parameter;
 if(!p)throw Error('Not a NASA POWER JSON response');
 if(json.header?.time_standard && json.header.time_standard !== 'UTC')throw Error('POWER data must use UTC. Request time-standard=UTC.');
 if(json.parameters){
  for(const key of ['T2M_MIN','T2M_MAX']){
   if(!['C','degC','°C'].includes(json.parameters[key]?.units))throw Error(`Unsupported or missing temperature unit for ${key}`);
  }
  if(!['mm/day','mm/d'].includes(json.parameters.PRECTOTCORR?.units))throw Error('Precipitation must use mm/day');
 }
 return validateWeather(datesInYear(year).map(date=>{const key=date.replaceAll('-','');return {date,tmin:p.T2M_MIN?.[key],tmax:p.T2M_MAX?.[key],rain:p.PRECTOTCORR?.[key]};}),year);
}
export function parseCSV(text,year){const lines=text.trim().split(/\r?\n/);if(lines.shift()?.trim()!=='date,tmin,tmax,rain')throw Error('CSV header must be date,tmin,tmax,rain');return validateWeather(lines.map(line=>{const [date,a,b,c,...extra]=line.split(',');if(extra.length||[a,b,c].some(x=>x===undefined||x.trim()===''))throw Error('Each row needs four nonempty columns');return {date:date.trim(),tmin:Number(a),tmax:Number(b),rain:Number(c)};}),year);}
// FAO-56 eq. 21, 23–25 and 52. Ra in MJ/m²/day is converted to equivalent mm.
export function referenceET(date,lat,tmin,tmax){const d=new Date(date+'T00:00:00Z');const j=(d-Date.UTC(d.getUTCFullYear(),0,0))/86400000;const phi=lat*Math.PI/180;const delta=0.409*Math.sin(2*Math.PI*j/365-1.39);const ws=Math.acos(Math.max(-1,Math.min(1,-Math.tan(phi)*Math.tan(delta))));const ra=24*60/Math.PI*0.0820*(1+0.033*Math.cos(2*Math.PI*j/365))*(ws*Math.sin(phi)*Math.sin(delta)+Math.cos(phi)*Math.cos(delta)*Math.sin(ws));return Math.max(0,0.0023*((tmin+tmax)/2+17.8)*Math.sqrt(Math.max(0,tmax-tmin))*0.408*ra);}
export function simulate(rows,c,strategy){
 let storage=c.initial,remaining=c.irrigation,totalET=0,demand=0,used=0,drain=0,cover=0,maxResidual=0;const daily=[];
 for(const row of rows){const month=Number(row.date.slice(5,7))-1;const crop=CROPS[strategy.crops[month]];if(!crop)throw Error('Unknown crop in calendar');const rain=row.rain*c.rainScale;const et0=referenceET(row.date,c.lat,row.tmin+c.tempShift,row.tmax+c.tempShift);const need=et0*crop.kc;const irrigation=crop.family!=='None'&&storage<c.capacity*0.4?Math.min(remaining,Math.max(0,c.capacity*0.7-storage)):0;remaining-=irrigation;const before=storage;const runoff=rain*c.runoff;const available=storage+rain-runoff+irrigation;const drainage=Math.max(0,available-c.capacity);const afterDrain=available-drainage;const stress=crop.family==='None'?1:Math.min(1,afterDrain/(c.capacity*0.5));const et=Math.min(afterDrain,need*stress);storage=afterDrain-et;const residual=storage-before-rain+runoff-irrigation+drainage+et;maxResidual=Math.max(maxResidual,Math.abs(residual));totalET+=et;demand+=need;used+=irrigation;drain+=drainage;if(crop.family!=='None')cover++;daily.push({...row,rain,et0,demand:need,et,irrigation,storage,drainage,crop:strategy.crops[month],residual});
 }
 return {id:strategy.id,name:strategy.name,daily,et:totalET,demand,deficit:Math.max(0,demand-totalET),irrigation:used,drainage:drain,finalStorage:storage,coverDays:cover,maxResidual};
}
export function analyze(rows,config,strategies=STRATEGIES){
 validateConfig(config);validateWeather(rows,config.year);
 if(!Array.isArray(strategies)||strategies.length<1)throw Error('At least one strategy is required');
 const identifiers=new Set();
 for(const s of strategies){
  if(!s||typeof s.id!=='string'||!s.id.trim()||identifiers.has(s.id))throw Error('Strategy IDs must be nonempty and unique');
  identifiers.add(s.id);
  if(!Array.isArray(s.crops)||s.crops.length!==12||s.crops.some(x=>!Object.hasOwn(CROPS,x)))throw Error('Calendar needs 12 known crop entries');
  for(const key of s.crops)finite(CROPS[key].kc,'Crop coefficient',0,2);
 }
 const results=strategies.map(s=>simulate(rows,config,s));let hot=0,frost=0,dry=0,longest=0;const monthly=Array.from({length:12},()=>({rain:0,tmax:0,count:0}));for(const r of rows){hot+=Number(r.tmax+config.tempShift>=config.heat);frost+=Number(r.tmin+config.tempShift<=config.frost);dry=r.rain*config.rainScale<1?dry+1:0;longest=Math.max(longest,dry);const m=monthly[Number(r.date.slice(5,7))-1];m.rain+=r.rain*config.rainScale;m.tmax+=r.tmax+config.tempShift;m.count++;}monthly.forEach(m=>m.tmax/=m.count);
 const weights=config.waterWeight+config.coverWeight;results.forEach(r=>{r.score=100*((config.waterWeight/weights)*(1-Math.min(1,r.deficit/Math.max(1,r.demand)))+(config.coverWeight/weights)*r.coverDays/rows.length);});
 return {results,monthly,rain:monthly.reduce((a,m)=>a+m.rain,0),hot,frost,longest,days:rows.length,status:'comparison_only',reason:'Local crop suitability, management and model performance are not validated.'};
}
export function sensitivity(rows,c,strategies){return [0.75,1,1.25].map(multiplier=>{const scale=Math.max(0.2,Math.min(2,c.rainScale*multiplier));return {rainMultiplier:scale/c.rainScale,results:analyze(rows,{...c,rainScale:scale},strategies).results.map(({id,deficit,score})=>({id,deficit,score}))};});}
