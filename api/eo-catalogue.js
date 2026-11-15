/**
 * NASA CMR read-only live granule catalogue for SOLIQ's research prototype.
 * CMR metadata is not calibrated crop/soil sensing, verified image pixels or an
 * authorized raw HLS/IMERG download. No Earthdata credentials are needed for
 * public catalogue queries, but raw downloads may still require login.
 * https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html
 */
export const CMR_API='https://cmr.earthdata.nasa.gov/search/granules.json';
export const CMR_PRODUCT=Object.freeze({
  HLSL30:{shortName:'HLSL30',version:'2.0',label:'HLS Landsat L30'},
  HLSS30:{shortName:'HLSS30',version:'2.0',label:'HLS Sentinel S30'},
  IMERG:{shortName:'GPM_3IMERGDF',version:'07',label:'GPM IMERG Daily Final v07'},
});
export function cmrQuery({product,lat,lon,start,end}={}){
 if(!Object.hasOwn(CMR_PRODUCT,product))throw new TypeError('Unknown NASA CMR product');
 const latitude=Number(lat),longitude=Number(lon);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude >90||longitude < -180||longitude>180)throw new TypeError('Invalid coordinates');
 for(const d of [start,end])if(typeof d!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(d)||Number.isNaN(new Date(d+'T00:00:00Z').getTime()))throw new TypeError('Invalid ISO date');
 const startTime=new Date(start+'T00:00:00Z').getTime();
 const endTime=new Date(end+'T00:00:00Z').getTime();
 if(endTime<startTime||endTime-startTime>120*86400000)throw new TypeError('Select a period of up to 120 days');
 const p=new URLSearchParams();
 p.set('short_name',CMR_PRODUCT[product].shortName);
 p.set('version',CMR_PRODUCT[product].version);
 p.set('point',longitude+','+latitude);
 p.set('temporal',start+'T00:00:00Z,'+end+'T23:59:59Z');
 p.set('page_size','8');
 p.set('sort_key[]','-start_date');
 return {url:CMR_API+'?'+p.toString(),product,lat:latitude,lon:longitude,range:[start,end]};
}
function nasaHref(link){
 try{
  const u=new URL(link);
  return u.protocol==='https:' && (u.hostname==='nasa.gov'||u.hostname.endsWith('.nasa.gov')||u.hostname==='earthdata.nasa.gov'||u.hostname.endsWith('.earthdata.nasa.gov'))?u.toString():null;
 }catch{return null;}
}
export function normalizeCmrEntry(entry){
 if(!entry||typeof entry!=='object')return null;
 const links=Array.isArray(entry.links)?entry.links:[];
 const official=links.map(l=>nasaHref(l.href)).find(Boolean)||null;
 return {
  id:String(entry.id||'').slice(0,100),
  title:String(entry.title||entry.producer_granule_id||entry.id||'Unlabelled granule').slice(0,220),
  start:String(entry.time_start||'').slice(0,35),
  end:String(entry.time_end||'').slice(0,35),
  collection:String(entry.collection_concept_id||'').slice(0,100),
  dataLink:official,
  coverage:'catalogue_footprint_only',
  qa:'not_processed',
  rawSha256:null,
  pixelsProcessed:false,
 };
}
export async function fetchCmrCatalog(query,{fetchImpl=globalThis.fetch}={}){
 const {url,product,lat,lon,range}=cmrQuery(query);
 const response=await fetchImpl(url,{
  method:'GET',headers:{Accept:'application/json','User-Agent':'SOLIQ-Research-Prototype/1.0'},
  signal:AbortSignal.timeout(15000),redirect:'error'
 });
 if(!response.ok)throw new Error('NASA CMR returned '+response.status);
 const type=(response.headers?.get('content-type')||'').toLowerCase();
 if(!type.includes('json'))throw new Error('NASA CMR returned an unexpected response type');
 const data=await response.json();
 if(!Array.isArray(data?.feed?.entry))throw new Error('Invalid NASA CMR catalogue response');
 const entries=data.feed.entry.slice(0,8).map(normalizeCmrEntry).filter(Boolean);
 const hits=Number(response.headers?.get('cmr-hits'));
 return {
  product,source:'NASA Earthdata Common Metadata Repository (CMR)',metadataUrl:url,
  retrievedAt:new Date().toISOString(),region:{lat,lon},range,
  entries,count:entries.length,totalHits:Number.isFinite(hits)?hits:null,
  evidenceKind:'catalogue_metadata_only',
  observationStatus:'pixels_unavailable',
  rasterAvailable:false,rawSha256:null,qa:{usable:false,reason:'Raw science granules were not downloaded, authenticated or QA screened'},
  note:'Real public catalogue metadata, NOT downloaded satellite imagery, soil chemistry, or agricultural validation',
 };
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 try{
  const data=await fetchCmrCatalog(req.query??{});
  return res.status(200).json(data);
 }catch(e){
  const invalid=e instanceof TypeError;
  return res.status(invalid?400:503).json({
   error:invalid?'Invalid CMR query':'NASA catalogue temporarily unavailable',
   reason:String(e.message).slice(0,150),
   evidenceKind:'unavailable',rasterAvailable:false,
  });
 }
}
