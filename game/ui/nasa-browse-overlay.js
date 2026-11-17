/** NASA GIBS regional RGB browse overlay, distinct from the fictional 3D map.
 * Actual image comes from NASA when loaded. No HLS pixel QA, crop diagnosis, NDVI or SAR.
 */
const COPY={
 en:{title:'🛰 NASA GIBS · Regional RGB imagery',description:'Real regional NASA RGB browse imagery. The village is fictional, not an observed satellite scene.',date:'Image date',refresh:'Refresh NASA image',idle:'Image not loaded yet.',loading:'Requesting NASA GIBS imagery…',loaded:'NASA image loaded. No scientific field pixels have been processed.',missing:'NASA imagery unavailable for this date. No artificial replacement image is used.',error:'Image unavailable: ',alt:'NASA GIBS regional RGB image, ',caption:'visual context only'},
 ar:{title:'🛰 NASA GIBS · صورة فضائية حقيقية',description:'صورة RGB إقليمية من NASA. قرية اللعبة افتراضية وليست صورًا مرصودة.',date:'تاريخ الصورة',refresh:'تحديث صورة ناسا',idle:'لم تُحمَّل الصورة بعد.',loading:'جاري طلب الصورة من NASA GIBS…',loaded:'تم تحميل صورة NASA؛ البكسلات العلمية للمزرعة غير معالجة.',missing:'صورة NASA غير متاحة لهذا التاريخ؛ لا توجد صورة بديلة صناعية.',error:'الصورة غير متاحة: ',alt:'صورة NASA GIBS الإقليمية الملونة بتاريخ ',caption:'للاستعراض البصري فقط'},
};

export function createNasaBrowseOverlay(host,{fetchImpl=globalThis.fetch}={}){
 if(!host||typeof document==='undefined')throw new TypeError('HUD DOM required');
 const panel=document.createElement('aside');
 panel.id='nasa-gibs-browse-overlay';
 panel.hidden=true;
 panel.setAttribute('aria-label','NASA Earth satellite RGB browse imagery');
 panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:300;width:min(450px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#102c28f7;border:1px solid #8cbbab;border-radius:14px;color:#fff;padding:14px;box-shadow:0 15px 45px #0009;pointer-events:auto;direction:ltr';
 panel.innerHTML=[
 '<div style="display:flex;justify-content:space-between;align-items:center"><strong data-nasa-title>🛰 NASA GIBS · Regional RGB imagery</strong>',
 '<button type="button" data-nasa-close aria-label="Close NASA imagery">✕</button></div>',
 '<p data-nasa-description style="font-size:12px;color:#e0d3a3">Real regional NASA RGB browse imagery. The village is fictional, not an observed satellite scene.</p>',
 '<label><span data-nasa-date-label>Image date</span> <input data-nasa-date type="date" value="2026-11-01"></label>',
 '<button data-nasa-refresh type="button">Refresh NASA image</button>',
 '<p data-nasa-status role="status" aria-live="polite">Image not loaded yet.</p>',
 '<div data-nasa-image></div>',
 '<small style="display:block;color:#e0d3a3">BROWSE RGB ONLY · No HLS reflectance, NDVI, SAR pixel QA, soil tests or crop-yield measurement</small>'
 ].join('');
 host.append(panel);
 const status=panel.querySelector('[data-nasa-status]');
 const holder=panel.querySelector('[data-nasa-image]');
 let requestId=0,language='en',statusKind='idle',errorDetail='',loadedData=null;
 function updateStatus(){status.textContent=COPY[language][statusKind]+(statusKind==='error'?errorDetail:'');}
 function setLanguage(nextLanguage){
  language=nextLanguage==='ar'?'ar':'en';
  const words=COPY[language];
  panel.setAttribute('lang',language);
  panel.setAttribute('dir',language==='ar'?'rtl':'ltr');
  panel.style.direction=language==='ar'?'rtl':'ltr';
  panel.querySelector('[data-nasa-title]').textContent=words.title;
  panel.querySelector('[data-nasa-description]').textContent=words.description;
  panel.querySelector('[data-nasa-date-label]').textContent=words.date;
  panel.querySelector('[data-nasa-refresh]').textContent=words.refresh;
  updateStatus();
  if(loadedData){
   const image=holder.querySelector('img'),caption=holder.querySelector('p');
   if(image)image.alt=words.alt+loadedData.date+'; not field measurements or NDVI.';
   if(caption)caption.textContent='NASA GIBS · '+loadedData.date+' · '+loadedData.footprint+' · '+words.caption;
  }
 }
 function setStatus(kind,detail=''){statusKind=kind;errorDetail=detail;updateStatus();}
 function hide(){requestId++;panel.hidden=true;holder.replaceChildren();}
 async function load(){
  const requested=++requestId;
  loadedData=null;setStatus('loading');holder.replaceChildren();
  const params=new URLSearchParams({lat:'30.5806',lon:'31.4333',
   date:panel.querySelector('[data-nasa-date]').value,
   layer:'MODIS_Terra_CorrectedReflectance_TrueColor'});
  try{
   const res=await fetchImpl('/api/eo-browse?'+params.toString(),{signal:AbortSignal.timeout(16000)});
   if(!res.ok)throw Error('NASA browse service: '+res.status);
   const data=await res.json(),url=new URL(data.imageUrl);
   if(url.origin!=='https://gibs.earthdata.nasa.gov'||data.scientificUse!=='visual_context_only')throw Error('Untrusted imagery source');
   if(requested!==requestId)return;
   loadedData=data;
   const image=document.createElement('img');
   image.width=768;image.height=512;image.decoding='async';
   image.style.cssText='display:block;width:100%;height:auto;border-radius:8px';
   image.alt=COPY[language].alt+data.date+'; not field measurements or NDVI.';
   const cap=document.createElement('p');
   cap.textContent='NASA GIBS · '+data.date+' · '+data.footprint+' · '+COPY[language].caption;
   holder.append(image,cap);
   image.onload=()=>{if(requested===requestId)setStatus('loaded');};
   image.onerror=()=>{if(requested===requestId){loadedData=null;holder.replaceChildren();setStatus('missing');}};
   image.src=url.href;
  }catch(err){if(requested===requestId){loadedData=null;holder.replaceChildren();setStatus('error',String(err.message).slice(0,130));}}
 }
 function show(){panel.hidden=false;return load();}
 panel.querySelector('[data-nasa-close]').addEventListener('click',hide);
 panel.querySelector('[data-nasa-refresh]').addEventListener('click',load);
 setLanguage('en');
 return Object.freeze({show,hide,setLanguage,isVisible:()=>!panel.hidden,panel});
}
