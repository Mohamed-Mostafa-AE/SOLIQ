/** NASA/ASF SAR scene discovery. Catalogue only — not a radar pixel analysis. */
const DATASETS=new Set(["NISAR","SENTINEL-1"]);
const cache=new Map();
export function readRadarQuery(q={}){
 const lat=Number(q.lat??30.5806),lon=Number(q.lon??31.4333),dataset=q.dataset??"NISAR",start=q.start??"2026-01-01",end=q.end??"2026-11-15";
 if(!Number.isFinite(lat)||Math.abs(lat)>85||!Number.isFinite(lon)||Math.abs(lon)>180)throw Error("Invalid coordinates");
 if(!DATASETS.has(dataset))throw Error("Unsupported radar dataset");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))throw Error("Invalid SAR dates");
 const first=Date.parse(start+"T00:00:00Z"),last=Date.parse(end+"T00:00:00Z");
 if(!Number.isFinite(first)||!Number.isFinite(last)||last<first||last-first>366*86400000)throw Error("SAR date range must not exceed 366 days");
 return {lat,lon,dataset,start,end};
}
export function radarUrl(q){
 const x=readRadarQuery(q);
 return "https://api.daac.asf.alaska.edu/services/search/param?"+new URLSearchParams({dataset:x.dataset,intersectsWith:"POINT("+x.lon+" "+x.lat+")",start:x.start+"T00:00:00Z",end:x.end+"T23:59:59Z",output:"geojson",maxResults:"12"});
}
export function parseRadar(data,q){
 const x=readRadarQuery(q);
 if(data?.type!=="FeatureCollection"||!Array.isArray(data.features))throw Error("ASF catalogue response is not GeoJSON");
 const scenes=data.features.slice(0,12).map(f=>{
  const p=f?.properties??{};
  return {id:String(p.sceneName??p.fileID??f.id??"unknown").slice(0,250),startTime:p.startTime??null,platform:p.platform??null,processingLevel:p.processingLevel??null,polarization:p.polarization??null,flightDirection:p.flightDirection??null};
 });
 return {count:scenes.length,scenes,status:"catalogue_only",dataset:x.dataset,limitations:["Metadata only — no actual image downloaded","Scene pair and masks require separate processing","SAR alone cannot prove salinity or groundwater depth"]};
}
export async function fetchRadar(q={},fetchFn=fetch){
 const x=readRadarQuery(q),url=radarUrl(x),saved=cache.get(url);
 if(saved&&Date.now()-saved.at<900000)return {...saved.result,transport:"cached"};
 const response=await fetchFn(url,{signal:AbortSignal.timeout(30000),headers:{Accept:"application/json"}});
 if(!response.ok)throw Error("ASF radar catalogue unavailable: HTTP "+response.status);
 const result={...parseRadar(await response.json(),x),transport:"live",source:{provider:"Alaska Satellite Facility / NASA Earthdata",catalogueUrl:url,retrievedAt:new Date().toISOString(),rasterDownloaded:false,qaPassed:false}};
 cache.set(url,{at:Date.now(),result});if(cache.size>50)cache.clear();return result;
}
