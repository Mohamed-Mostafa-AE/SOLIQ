import { CROPS } from './engine.js';
import { PROFILES } from './crop-analysis.js';

export function seasonFrame(result,index,capacity){
 if(!result?.daily?.length||!Number.isFinite(capacity)||capacity<=0)throw Error('A daily series and positive capacity are required');
 const day=result.daily[Math.max(0,Math.min(result.daily.length-1,Math.trunc(index)))];
 return {...day,waterPercent:Math.max(0,Math.min(100,day.storage/capacity*100))};
}

export function mountSeasonMotion(host,{results,capacity,language='en',sourceKind='synthetic'}){
 const rows=results.filter(r=>r.daily?.length);
 if(!rows.length)return ()=>{};
 const ar=language==='ar',text=(en,arabic)=>ar?arabic:en;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=value=>Number(value).toLocaleString(ar?'ar-EG':'en',{maximumFractionDigits:1});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const section=document.createElement('section');section.className='season-theatre panel';section.setAttribute('aria-label',text('Animated season comparison','مقارنة الموسم المتحركة'));
 section.innerHTML=`<div class="theatre-heading"><div><div class="eyebrow">${text('THE LIVING CALENDAR','التقويم المتحرك')}</div><h2>${text('Watch your choices move through the season.','شاهد خياراتك عبر الموسم.')}</h2><p>${text('The same day. The same weather. Different crop calendars.','اليوم نفسه. الطقس نفسه. تقاويم محاصيل مختلفة.')}</p></div><a class="button" href="welcome/">${text('Project hub ↗','روابط المشروع ↗')}</a></div><div class="theatre-controls"><button type="button" class="button primary" data-play aria-pressed="false">▶ ${text('Play season','تشغيل الموسم')}</button><button type="button" class="button" data-reset>${text('Restart','إعادة')}</button><output data-date></output></div><label class="theatre-slider">${text('Move through the historical year','تصفّح السنة التاريخية')}<input data-day type="range" min="0" max="${rows[0].daily.length-1}" value="0" aria-label="${text('Day in historical year','اليوم في السنة التاريخية')}"></label><div class="theatre-grid">${rows.map((r,i)=>`<article class="field-scene"><div class="scene-label"><b>${esc(r.name||r.id)}</b><span data-crop="${i}"></span></div><div class="field-window"><div class="scene-sun"></div><div class="rain-streaks" data-rain="${i}"></div><div class="field-surface"><div class="plant-row" data-plants="${i}"></div></div><div class="soil-section"><div class="soil-water" data-water="${i}"></div><span>${text('Modeled available soil water','مياه التربة المتاحة المقدّرة')}</span></div><div class="scene-readout" data-storage="${i}"></div></div><div class="scene-metrics" data-metrics="${i}"></div></article>`).join('')}</div><p class="note">${text('Plant illustrations identify the planned crop; plant size does not predict growth or yield. Water height follows daily modeled storage. Rain streaks indicate days with rain, not measured rainfall intensity.','رسوم النباتات تبيّن المحصول المخطّط ولا يتنبأ حجمها بالنمو أو الإنتاجية. ارتفاع المياه يتبع مخزون التربة المحسوب يومياً. خطوط المطر تشير إلى أيام ممطرة وليست قياساً لشدة المطر.')}</p><p class="note">${sourceKind==='synthetic'?text('Illustrative synthetic weather.','طقس اصطناعي توضيحي.'):text('Historical weather replay; not a forecast.','إعادة عرض طقس تاريخي وليست توقعاً.')}</p>`;
 host.prepend(section);
 const slider=section.querySelector('[data-day]'),play=section.querySelector('[data-play]');let timer=null;
 function draw(){
  const index=Number(slider.value);
  section.querySelector('[data-date]').textContent=rows[0].daily[index].date;
  rows.forEach((r,i)=>{
   const day=seasonFrame(r,index,capacity),profile=PROFILES.find(p=>p.id===day.crop),crop=CROPS[day.crop]||profile;
   section.querySelector(`[data-crop="${i}"]`).textContent=ar?(profile?.ar||crop?.name||day.crop):(crop?.name||day.crop);
   const bare=crop?.family==='None';
   const plants=section.querySelector(`[data-plants="${i}"]`);
   if(plants.dataset.crop!==day.crop){plants.dataset.crop=day.crop;plants.style.setProperty('--crop-color',crop?.color||'#749651');plants.innerHTML=bare?'<span class="bare-ground">'+text('Planned bare period','فترة تربة مكشوفة مخطّطة')+'</span>':Array.from({length:9},(_,j)=>`<span class="scene-plant" style="--n:${j}"><i></i><i></i><i></i></span>`).join('');}
   section.querySelector(`[data-water="${i}"]`).style.height=day.waterPercent+'%';
   section.querySelector(`[data-storage="${i}"]`).textContent=number(day.storage)+' '+text('mm','مم');
   section.querySelector(`[data-rain="${i}"]`).classList.toggle('raining',day.rain>0);
   section.querySelector(`[data-metrics="${i}"]`).innerHTML=`<span>${text('Rain','مطر')}<b>${number(day.rain)} ${text('mm','مم')}</b></span><span>${text('Modeled ET','البخر والنتح المقدّر')}<b>${number(day.et)} ${text('mm','مم')}</b></span><span>${text('Irrigation','الري')}<b>${number(day.irrigation)} ${text('mm','مم')}</b></span>`;
  });
 }
 function pause(){clearInterval(timer);timer=null;play.setAttribute('aria-pressed','false');play.textContent='▶ '+text('Play season','تشغيل الموسم');section.classList.remove('playing');}
 play.addEventListener('click',()=>{if(timer){pause();return;}if(Number(slider.value)>=Number(slider.max))slider.value=0;play.setAttribute('aria-pressed','true');play.textContent='Ⅱ '+text('Pause','إيقاف');section.classList.add('playing');timer=setInterval(()=>{if(!section.isConnected||document.hidden){pause();return;}slider.value=Math.min(Number(slider.max),Number(slider.value)+3);draw();if(slider.value===slider.max)pause();},reduced.matches?900:180);});
 slider.addEventListener('input',()=>{pause();draw();});section.querySelector('[data-reset]').addEventListener('click',()=>{pause();slider.value=0;draw();});
 const hide=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',hide);draw();
 return ()=>{pause();document.removeEventListener('visibilitychange',hide);section.remove();};
}
