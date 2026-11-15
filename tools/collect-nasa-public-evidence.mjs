// NASA PUBLIC scientific source receipts. No credentials, no synthesized observations.
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
const root='demo/nasa-public-evidence';
await fs.mkdir(root,{recursive:true});
const files=[],blocked=[];
async function get(name,url,expected){
 try{
  const u=new URL(url);
  if(u.protocol!=='https:'||!u.hostname.endsWith('.nasa.gov'))throw Error('NASA HTTPS host required');
  const resp=await fetch(u,{signal:AbortSignal.timeout(60000)});
  if(!resp.ok)throw Error('NASA HTTP '+resp.status);
  const mime=(resp.headers.get('content-type')||'').toLowerCase();
  if(expected==='json'&&!mime.includes('json'))throw Error('Response not JSON');
  if(expected==='image'&&!mime.includes('image/'))throw Error('Response not image');
  const data=Buffer.from(await resp.arrayBuffer());
  if(data.length>5500000||data.length<150)throw Error('Invalid response size');
  if(expected==='json')JSON.parse(data.toString('utf8'));
  if(expected==='image'&&!(data[0]===0xff&&data[1]===0xd8))throw Error('Response not JPEG');
  await fs.writeFile(root+'/'+name,data);
  const entry={filename:name,originalNASAurl:url,sha256:createHash('sha256').update(data).digest('hex'),
   sizeBytes:data.length,downloadedAt:new Date().toISOString(),
   sourceClassification:name.includes('POWER')?'REAL_REGIONAL_NASA_POWER_WEATHER':
    name.includes('CMR')?'REAL_NASA_HLS_CATALOGUE_NOT_RASTER_PIXELS':'REAL_NASA_GIBS_RGB_BROWSE_NOT_SCIENCE_PIXELS'};
  files.push(entry);
  console.log('NASA ACTUAL SOURCE '+name+' '+data.length+' bytes');
 }catch(e){blocked.push({file:name,reason:String(e.message)});console.error('NASA UNAVAILABLE '+name+' '+e.message);}
}
const power=new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
for(const [k,v] of Object.entries({parameters:'T2M,T2M_MAX,PRECTOTCORR',community:'AG',
 longitude:'31.4333',latitude:'30.5806',start:'20261001',end:'20261112',format:'JSON','time-standard':'UTC'}))power.searchParams.set(k,v);
await get('NASA_POWER_original_daily_2026.json',power.toString(),'json');
const cmr=new URL('https://cmr.earthdata.nasa.gov/search/granules.json');
for(const [k,v] of Object.entries({short_name:'HLSL30',version:'2.0',point:'31.4333,30.5806',
 temporal:'2026-10-01T00:00:00Z,2026-11-12T23:59:59Z',page_size:'10'}))cmr.searchParams.set(k,v);
await get('NASA_HLS_original_CMR_catalogue.json',cmr.toString(),'json');
const gibs=new URL('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi');
for(const [k,v] of Object.entries({SERVICE:'WMS',REQUEST:'GetMap',VERSION:'1.1.1',SRS:'EPSG:4326',
 LAYERS:'MODIS_Terra_CorrectedReflectance_TrueColor',BBOX:'31.1833,30.3306,31.6833,30.8306',
 WIDTH:'768',HEIGHT:'512',FORMAT:'image/jpeg',STYLES:'',TIME:'2026-11-01'}))gibs.searchParams.set(k,v);
await get('NASA_GIBS_original_MODIS_RGB.jpg',gibs.toString(),'image');
await fs.writeFile(root+'/SOURCE_MANIFEST.json',JSON.stringify({
 studyPoint:{lat:30.5806,lon:31.4333,kind:'ILLUSTRATIVE_POINT_NOT_FARM_BOUNDARY'},
 files,blocked,
 verifiedRawHLSPixels:false,verifiedRawIMERGNetcdf:false,verifiedSARScenePair:false,
 fieldCalibratedCropParameters:false,
 notes:'POWER is regional observation. CMR is source metadata. GIBS is browse RGB, not native HLS or calibrated agronomy.'
},null,2));
if(!files.length)process.exitCode=1;
