import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNasaGibsBrowse,NASA_GIBS_ENDPOINT} from './eo-browse.js';

const base={lat:30.5806,lon:31.4333,date:'2026-11-01'};
test('actual NASA GIBS WMS image uses official HTTPS endpoint with explicit time, footprint and RGB layer',()=>{
 const data=buildNasaGibsBrowse(base);
 const url=new URL(data.imageUrl);
 assert.equal(url.origin,'https://gibs.earthdata.nasa.gov');
 assert.equal(url.pathname,new URL(NASA_GIBS_ENDPOINT).pathname);
 assert.equal(url.searchParams.get('SERVICE'),'WMS');
 assert.equal(url.searchParams.get('REQUEST'),'GetMap');
 assert.equal(url.searchParams.get('VERSION'),'1.1.1');
 assert.equal(url.searchParams.get('TIME'),'2026-11-01');
 assert.equal(url.searchParams.get('LAYERS'),'MODIS_Terra_CorrectedReflectance_TrueColor');
 assert.equal(url.searchParams.get('SRS'),'EPSG:4326');
 assert.equal(data.scientificUse,'visual_context_only');
 assert.equal(data.ndviComputed,false);
 assert.equal(data.sarProcessed,false);
 assert.equal(data.rawSciencePixels,false);
 assert.equal(data.delivery,'client_requested_not_yet_verified');
});
test('no arbitrary remote source, bounding or historical/future date can be used',()=>{
 assert.throws(()=>buildNasaGibsBrowse({...base,lat:123}),/mapped/);
 assert.throws(()=>buildNasaGibsBrowse({...base,date:'2010-02-31'}),/Invalid/);
 assert.throws(()=>buildNasaGibsBrowse({...base,date:'2099-01-01'}),/coverage/);
 assert.throws(()=>buildNasaGibsBrowse({...base,layer:'https://attacker.example'}),/Unsupported/);
});
test('real NASA browse image is NOT NASA HLS pixel evidence or crop diagnosis',()=>{
 const r=buildNasaGibsBrowse({...base,layer:'VIIRS_SNPP_CorrectedReflectance_TrueColor'});
 assert.ok(r.disclaimer.includes('NOT native HLS'));
 assert.equal(r.rasterQA,'not_screened');
 assert.match(r.footprint,/regional/);
 assert.equal(r.rawSciencePixels,false);
});
