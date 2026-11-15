/**
 * NASA GIBS real satellite browse visualization (not native science pixels).
 * Public OGC WMS 1.1.1, direct official NASA URL, no Earthdata login.
 * RGB browse imagery cannot be used to estimate NDVI, salinity, soil nutrients
 * or crop water demand. Date/layer/footprint and upstream load status are explicit.
 * Source: https://nasa-gibs.github.io/gibs-api-docs/access-basics/
 */
export const NASA_GIBS_ENDPOINT='https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
export const NASA_GIBS_LAYERS=Object.freeze({
 MODIS_Terra_CorrectedReflectance_TrueColor:'Terra MODIS · corrected reflectance true-color',
 MODIS_Aqua_CorrectedReflectance_TrueColor:'Aqua MODIS · corrected reflectance true-color',
 VIIRS_SNPP_CorrectedReflectance_TrueColor:'Suomi NPP VIIRS · corrected reflectance true-color',
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function buildNasaGibsBrowse({lat,lon,date,layer='MODIS_Terra_CorrectedReflectance_TrueColor'}={}){
 if(!Object.hasOwn(NASA_GIBS_LAYERS,layer))throw new TypeError('Unsupported NASA imagery layer');
 if(!finite(lat)||!finite(lon)||lat<-80||lat>80||lon<-170||lon>170)throw new TypeError('Invalid mapped point');
 if(typeof date!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new TypeError('Invalid observation date');
 const obs=Date.parse(date+'T00:00:00Z');
 if(obs>Date.now()+86400000||obs<Date.parse('2002-01-01T00:00:00Z'))throw new TypeError('Date outside GIBS browse coverage');
 const radius=0.25; // 0.5° × 0.5°, study-area view, NOT a mapped farm boundary
 const bbox=[lon-radius,lat-radius,lon+radius,lat+radius].map(x=>x.toFixed(5)).join(',');
 const q=new URLSearchParams({
  SERVICE:'WMS',REQUEST:'GetMap',VERSION:'1.1.1',
  SRS:'EPSG:4326',BBOX:bbox,LAYERS:layer,STYLES:'',
  FORMAT:'image/jpeg',WIDTH:'768',HEIGHT:'512',TIME:date,TRANSPARENT:'FALSE'
 });
 return {
  imageUrl:NASA_GIBS_ENDPOINT+'?'+q.toString(),
  service:'NASA Global Imagery Browse Services (GIBS)',
  layer,label:NASA_GIBS_LAYERS[layer],date,
  sourceUrl:'https://gibs.earthdata.nasa.gov',
  bbox,projection:'EPSG:4326',footprint:'0.5° × 0.5° regional browse scene',
  kind:'NASA browse image request',
  delivery:'client_requested_not_yet_verified',
  rasterQA:'not_screened',
  geolocation:'study point only, not real field boundary',
  rawSciencePixels:false,
  ndviComputed:false,sarProcessed:false,
  scientificUse:'visual_context_only',
  disclaimer:'A NASA GIBS RGB browse visualization; NOT native HLS reflectance, NDVI, SAR or independently validated crop/soil measurements',
 };
}
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 try{
  const data=buildNasaGibsBrowse({
    lat:Number(req.query?.lat),lon:Number(req.query?.lon),
    date:req.query?.date,layer:req.query?.layer||'MODIS_Terra_CorrectedReflectance_TrueColor',
  });
  return res.status(200).json(data);
 }catch(e){
  return res.status(400).json({error:String(e.message),kind:'unavailable',ndviComputed:false});
 }
}
