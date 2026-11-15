import test from 'node:test';
import assert from 'node:assert/strict';
import {cmrQuery,fetchCmrCatalog,normalizeCmrEntry,CMR_API} from './eo-catalogue.js';
const valid={product:'HLSL30',lat:30.5806,lon:31.4333,start:'2026-09-15',end:'2026-11-01'};
test('CMR request targets NASA only and uses product, temporal and point bounding',()=>{
 const query=cmrQuery(valid);
 const u=new URL(query.url);
 assert.equal(u.origin,'https://cmr.earthdata.nasa.gov');
 assert.equal(u.searchParams.get('short_name'),'HLSL30');
 assert.equal(u.searchParams.get('point'),'31.4333,30.5806');
 assert.equal(u.searchParams.get('version'),'2.0');
 assert.ok(u.searchParams.get('temporal').includes('2026-09-15'));
 assert.equal(CMR_API,u.origin+'/search/granules.json');
});
test('CMR validation refuses unbounded queries, invalid dates and non-whitelisted products',()=>{
 assert.throws(()=>cmrQuery({...valid,product:'https://evil.com'}),/Unknown/);
 assert.throws(()=>cmrQuery({...valid,lat:999}),/coordinates/);
 assert.throws(()=>cmrQuery({...valid,start:'2023-01-01',end:'2026-11-01'}),/120 days/);
 assert.throws(()=>cmrQuery({...valid,start:'2010-02-31'}),/Invalid/);
});
test('NASA CMR response normalizes titles but never certifies unprocessed imagery',async()=>{
 const mock=async()=>new Response(JSON.stringify({feed:{entry:[{
  id:'G123-LPCLOUD',title:'HLS.L30.T36RUV.2026...',time_start:'2026-10-01T10:00:00Z',
  collection_concept_id:'C123-LPCLOUD',
  links:[{href:'https://data.lpdaac.earthdatacloud.nasa.gov/protected/file.tif'}]
 } ]}}),{status:200,headers:{'Content-Type':'application/json','CMR-Hits':'1'}});
 const out=await fetchCmrCatalog(valid,{fetchImpl:mock});
 assert.equal(out.count,1);assert.equal(out.totalHits,1);
 assert.equal(out.evidenceKind,'catalogue_metadata_only');
 assert.equal(out.rasterAvailable,false);
 assert.equal(out.rawSha256,null);
 assert.equal(out.qa.usable,false);
 assert.equal(out.entries[0].pixelsProcessed,false);
 assert.equal(out.entries[0].qa,'not_processed');
});
test('non-NASA untrusted URLs are not presented as official scene links',()=>{
 const a=normalizeCmrEntry({id:'1',links:[{href:'javascript:alert(1)'},{href:'https://evil.example/raw.tif'}]});
 assert.equal(a.dataLink,null);
});
test('service failures must be unavailable, never synthetic HLS or IMERG scenes',async()=>{
 await assert.rejects(()=>fetchCmrCatalog(valid,{fetchImpl:async()=>new Response('Offline',{status:503})}),/503/);
});
