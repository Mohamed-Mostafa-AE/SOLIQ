/** NASA GIBS regional RGB browse overlay, distinct from the fictional 3D map.
 * Actual image comes from NASA when loaded. No HLS pixel QA, crop diagnosis, NDVI or SAR.
 */
export function createNasaBrowseOverlay(host,{fetchImpl=globalThis.fetch}={}){
 if(!host||typeof document==='undefined')throw new TypeError('HUD DOM required');
 const panel=document.createElement('aside');
 panel.id='nasa-gibs-browse-overlay';
 panel.hidden=true;
 panel.setAttribute('aria-label','NASA Earth satellite RGB browse imagery');
 panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:300;width:min(450px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#102c28f7;border:1px solid #8cbbab;border-radius:14px;color:#fff;padding:14px;box-shadow:0 15px 45px #0009;pointer-events:auto;direction:rtl';
 panel.innerHTML=[
 '<div style="display:flex;justify-content:space-between;align-items:center"><strong>🛰 NASA GIBS · صورة فضائية حقيقية</strong>',
 '<button type="button" data-nasa-close aria-label="Close NASA imagery">✕</button></div>',
 '<p style="font-size:12px;color:#e0d3a3">صورة RGB إقليمية من NASA. قرية اللعبة افتراضية وليست صورًا مرصودة.</p>',
 '<label>تاريخ الصورة <input data-nasa-date type="date" value="2026-11-01"></label>',
 '<button data-nasa-refresh type="button">تحديث صورة ناسا</button>',
 '<p data-nasa-status role="status" aria-live="polite">لم تُحمَّل الصورة بعد.</p>',
 '<div data-nasa-image></div>',
 '<small style="display:block;color:#e0d3a3">BROWSE RGB ONLY · No HLS reflectance, NDVI, SAR pixel QA, soil tests or crop-yield measurement</small>'
 ].join('');
 host.append(panel);
 const status=panel.querySelector('[data-nasa-status]');
 const holder=panel.querySelector('[data-nasa-image]');
 let requestId=0;
 function hide(){requestId++;panel.hidden=true;holder.replaceChildren();}
 async function load(){
  const requested=++requestId;
  status.textContent='جاري طلب الصورة من NASA GIBS…';holder.replaceChildren();
  const params=new URLSearchParams({lat:'30.5806',lon:'31.4333',
   date:panel.querySelector('[data-nasa-date]').value,
   layer:'MODIS_Terra_CorrectedReflectance_TrueColor'});
  try{
   const res=await fetchImpl('/api/eo-browse?'+params.toString(),{signal:AbortSignal.timeout(16000)});
   if(!res.ok)throw Error('NASA browse service: '+res.status);
   const data=await res.json(),url=new URL(data.imageUrl);
   if(url.origin!=='https://gibs.earthdata.nasa.gov'||data.scientificUse!=='visual_context_only')throw Error('Untrusted imagery source');
   if(requested!==requestId)return;
   const image=document.createElement('img');
   image.width=768;image.height=512;image.decoding='async';
   image.style.cssText='display:block;width:100%;height:auto;border-radius:8px';
   image.alt='NASA GIBS regional RGB imagery, '+data.date+'; not field imagery or NDVI.';
   const cap=document.createElement('p');
   cap.textContent='NASA GIBS · '+data.date+' · '+data.footprint+' · visual context only';
   holder.append(image,cap);
   image.onload=()=>{if(requested===requestId)status.textContent='تم تحميل صورة NASA؛ البكسلات العلمية للمزرعة غير معالجة.';};
   image.onerror=()=>{if(requested===requestId){holder.replaceChildren();status.textContent='صورة NASA غير متاحة لهذا التاريخ؛ لا توجد صورة بديلة صناعية.';}};
   image.src=url.href;
  }catch(err){if(requested===requestId){holder.replaceChildren();status.textContent='الصورة غير متاحة: '+String(err.message).slice(0,130);}}
 }
 function show(){panel.hidden=false;return load();}
 panel.querySelector('[data-nasa-close]').addEventListener('click',hide);
 panel.querySelector('[data-nasa-refresh]').addEventListener('click',load);
 return Object.freeze({show,hide,isVisible:()=>!panel.hidden,panel});
}
