import test from "node:test";
import assert from "node:assert/strict";
import {readTrendQuery,trendUrl,parseTrend,fetchTrend} from "./lib/trend-service.js";
import {readRadarQuery,radarUrl,parseRadar,fetchRadar} from "./lib/radar-service.js";

function powerFixture(){
 const daily={};
 for(let year=2020;year<=2023;year++){
  for(let d=new Date(Date.UTC(year,0,1));d.getUTCFullYear()===year;d.setUTCDate(d.getUTCDate()+1)){
   daily[d.toISOString().slice(0,10).replaceAll("-","")]=20+year-2020;
  }
 }
 return {header:{time_standard:"UTC",fill_value:-999},parameters:{T2M:{units:"C"}},properties:{parameter:{T2M:daily}}};
}
const q={lat:30.58,lon:31.43,startYear:2020,endYear:2023,parameter:"T2M"};
test("NASA trend requests are bounded and explicitly UTC",()=>{
 assert.match(trendUrl(q),/time-standard=UTC/);
 assert.throws(()=>readTrendQuery({...q,lat:91}));
 assert.throws(()=>readTrendQuery({...q,parameter:"INVALID"}));
 assert.throws(()=>readTrendQuery({...q,startYear:2020,endYear:2022}));
});
test("NASA trend uses complete-year series, including leap year",()=>{
 const out=parseTrend(powerFixture(),q);
 assert.equal(out.completeYears,4);
 assert.equal(out.annual[0].expectedDays,366);
 assert.equal(out.statistics.senPerDecade,10);
});
test("NASA trend never turns incomplete year into a zero",()=>{
 const d=powerFixture();delete d.properties.parameter.T2M["20210101"];
 const r=parseTrend(d,q);
 assert.equal(r.annual[1].value,null);
 assert.equal(r.annual[1].missingReason,"incomplete_year");
 assert.equal(r.completeYears,3);
 assert.equal(r.statistics,null);
});
test("NASA trend rejects unverified input units",()=>{
 const d=powerFixture();d.parameters.T2M.units="K";
 assert.throws(()=>parseTrend(d,q),/Unexpected/);
});
test("NASA trend preserves source checksum in mocked connector test",async()=>{
 const payload=JSON.stringify(powerFixture());
 const result=await fetchTrend(q,async()=>({ok:true,text:async()=>payload}));
 assert.equal(result.transport,"live");
 assert.equal(result.source.rawSha256.length,64);
 assert.equal(result.source.rawPersisted,false);
});
const radar={lat:30.58,lon:31.43,dataset:"NISAR",start:"2026-01-01",end:"2026-04-01"};
test("ASF discovery is bounded to approved mission names and ranges",()=>{
 assert.match(radarUrl(radar),/dataset=NISAR/);
 assert.throws(()=>readRadarQuery({...radar,dataset:"FAKE"}));
 assert.throws(()=>readRadarQuery({...radar,end:"2028-04-01"}));
});
test("ASF metadata cannot be presented as verified imagery",()=>{
 const data={type:"FeatureCollection",features:[{id:"scene-1",properties:{sceneName:"TEST_SCENE",startTime:"2026-03-01T00:00:00Z",platform:"NISAR"}}]};
 const r=parseRadar(data,radar);
 assert.equal(r.count,1);
 assert.equal(r.status,"catalogue_only");
 assert.equal(r.scenes[0].id,"TEST_SCENE");
});
test("ASF HTTP failure does not create synthetic scenes",async()=>{
 await assert.rejects(fetchRadar(radar,async()=>({ok:false,status:503})),/unavailable/);
});
