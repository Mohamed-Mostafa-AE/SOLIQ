import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchGpmImergV07,normalizeGpmImergV07Dataset} from '../adapters/gpm-imerg.js';
import {fetchHlsOpticalSeries} from '../adapters/hls-optical.js';
import {runEoSciencePipeline} from '../science/eo-pipeline.js';

test('supplied rainfall fixture must NOT authenticate itself as NASA',async()=>{
 const x=await fetchGpmImergV07({latitude:30.5833,longitude:31.4333,startDate:'2025-01-01',endDate:'2025-01-01',verifiedGranulePayload:{version:'07',records:[]}});
 assert.equal(x.status,'unverified_payload');assert.equal(x.authenticated,false);assert.equal(x.evidenceKind,'assumed');
});
test('supplied HLS fixture must NOT authenticate itself as NASA',async()=>{
 const x=await fetchHlsOpticalSeries({latitude:30.5833,longitude:31.4333,startDate:'2025-01-01',endDate:'2025-01-01',verifiedHlsPayload:{records:[]}});
 assert.equal(x.status,'unverified_payload');assert.equal(x.authenticated,false);
});
test('rain record with unknown unit is rejected instead of silently assuming mm/day',()=>{
 const x=normalizeGpmImergV07Dataset({version:'07',records:[{date:'2025-01-01',precipitation:12}]},{latitude:30.58,longitude:31.43,startDate:'2025-01-01',endDate:'2025-01-01'});
 assert.equal(x.records[0].valid,false);
});
test('binary IMERG granule is not parsed as JSON',async()=>{
 const f=async(url)=>url.includes('cmr.earthdata.nasa.gov')?{ok:true,json:async()=>({feed:{entry:[{links:[{href:'https://gesdisc.eosdis.nasa.gov/file.nc4'}]}]}})}:{ok:true,status:200,headers:{get:()=> 'application/x-netcdf'},json:async()=>{throw Error('Must not parse binary as JSON')}};
 const x=await fetchGpmImergV07({latitude:30.58,longitude:31.43,startDate:'2025-01-01',endDate:'2025-01-01',earthdataToken:'mock',fetchImpl:f});
 assert.equal(x.status,'binary_decoder_required');assert.equal(x.syntheticFallbackUsed,false);
});
test('binary HLS COG is not parsed as JSON',async()=>{
 const f=async(url)=>url.includes('cmr.earthdata.nasa.gov')?{ok:true,json:async()=>({feed:{entry:[{links:[{href:'https://earthdata.nasa.gov/scene.B04.tif'}]}]}})}:{ok:true,status:200,headers:{get:()=> 'image/tiff'},json:async()=>{throw Error('Must not parse binary as JSON')}};
 const x=await fetchHlsOpticalSeries({latitude:30.58,longitude:31.43,startDate:'2025-01-01',endDate:'2025-01-01',earthdataToken:'mock',fetchImpl:f});
 assert.equal(x.status,'binary_decoder_required');assert.equal(x.syntheticFallbackUsed,false);
});
