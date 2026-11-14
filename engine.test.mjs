import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,STRATEGIES,datesInYear,demoWeather,validateConfig,validateWeather,parseCSV,parsePower,powerUrl,referenceET,analyze,sensitivity} from './engine.js';

test('leap years and complete date coverage',()=>{
 assert.equal(datesInYear(2024).length,366);assert.equal(datesInYear(2023).length,365);
 assert.throws(()=>validateWeather(demoWeather(2024).slice(1),2024),/complete/);
 const duplicate=demoWeather(2024);duplicate[1].date=duplicate[0].date;
 assert.throws(()=>validateWeather(duplicate,2024),/date/);
});
test('reject sentinel, nonfinite, negative rain and reversed temperatures',()=>{
 for(const replacement of [{rain:-999},{tmin:NaN},{rain:-1},{tmin:40,tmax:10}]){
 const rows=demoWeather(2024);Object.assign(rows[1],replacement);assert.throws(()=>validateWeather(rows,2024));}
});
test('NASA JSON parser and request specify UTC and requested location',()=>{
 const rows=demoWeather(2024);const parameter={T2M_MIN:{},T2M_MAX:{},PRECTOTCORR:{}};
 rows.forEach(r=>{const d=r.date.replaceAll('-','');parameter.T2M_MIN[d]=r.tmin;parameter.T2M_MAX[d]=r.tmax;parameter.PRECTOTCORR[d]=r.rain;});
 assert.deepEqual(parsePower({properties:{parameter}},2024),rows);
 delete parameter.T2M_MIN['20240101'];assert.throws(()=>parsePower({properties:{parameter}},2024));
 const url=new URL(powerUrl(DEFAULTS));assert.equal(url.searchParams.get('time-standard'),'UTC');assert.equal(url.searchParams.get('latitude'),String(DEFAULTS.lat));
});
test('CSV round trip and blank cells rejected',()=>{
 const rows=demoWeather(2024);const csv='date,tmin,tmax,rain\n'+rows.map(r=>[r.date,r.tmin,r.tmax,r.rain].join(',')).join('\n');
 assert.deepEqual(parseCSV(csv,2024),rows);assert.throws(()=>parseCSV(csv.replace('2024-01-01,','2024-01-01,,'),2024));
});
test('invalid soil, coordinates, priorities and years rejected',()=>{
 for(const override of [{initial:151},{capacity:0},{lat:85},{lon:181},{year:2024.5},{waterWeight:0,coverWeight:0},{runoff:1}])assert.throws(()=>validateConfig({...DEFAULTS,...override}));
});
test('Hargreaves radiation conversion matches independent equinox calculation',()=>{
 // Approximate equatorial equinox Ra = 37.82 MJ/m²/day; temperature 20–30 °C.
 const et=referenceET('2023-03-21',0,20,30);
 assert.ok(Math.abs(et-(0.0023*(25+17.8)*Math.sqrt(10)*0.408*37.82))<0.03);
 assert.equal(referenceET('2023-03-21',0,-40,-30),0);
});
test('daily water conservation, storage and annual irrigation limits across extremes',()=>{
 for(const budget of [0,50,1000])for(const capacity of [10,150,500]){
 const c={...DEFAULTS,capacity,initial:capacity/2,irrigation:budget};const rows=demoWeather(c.year);rows[10].rain=1000;
 for(const result of analyze(rows,c).results){assert.ok(result.maxResidual<1e-9);assert.ok(result.irrigation<=budget+1e-9);assert.ok(result.et<=result.demand+1e-9);
 for(const day of result.daily){assert.ok(day.storage>=-1e-9&&day.storage<=capacity+1e-9);assert.ok(day.et>=0);}}
 }
});
test('no input water and empty store give zero modeled ET',()=>{
 const rows=demoWeather(2024).map(r=>({...r,rain:0}));const result=analyze(rows,{...DEFAULTS,initial:0,irrigation:0});
 for(const r of result.results){assert.equal(r.et,0);assert.equal(r.finalStorage,0);assert.equal(r.deficit,r.demand);}
});
test('equal calendars give equal results and priorities do not alter physical outputs',()=>{
 const rows=demoWeather(2024);const same=STRATEGIES.map(s=>({...s,crops:[...STRATEGIES[0].crops]}));
 const out=analyze(rows,DEFAULTS,same);assert.equal(out.results[0].et,out.results[1].et);
 const next=analyze(rows,{...DEFAULTS,waterWeight:0,coverWeight:100},same);assert.equal(next.results[0].et,out.results[0].et);
 assert.equal(out.status,'comparison_only');
});
test('unknown crop and incomplete calendars rejected',()=>{
 assert.throws(()=>analyze(demoWeather(2024),DEFAULTS,[{...STRATEGIES[0],crops:['unknown']}]),/Calendar/);
});
test('sensitivity runs at input bounds without invalid multipliers',()=>{
 for(const rainScale of [0.2,1,2]){const runs=sensitivity(demoWeather(2024),{...DEFAULTS,rainScale},STRATEGIES);assert.equal(runs.length,3);assert.equal(runs[1].rainMultiplier,1);}
});
