import {slides,LINKS} from './content.js';
import {farmSVG} from './art.js';
const stage=document.querySelector('#stage'),nav=document.querySelector('#slide-nav');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const footer=(i)=>'<footer class="slide-footer"><span>SOIL-IQ / NASA SPACE APPS 6 OCTOBER</span><span>BUC: event venue · Working prototype · 15 NOV 2026</span><span>'+String(i+1).padStart(2,'0')+' / 08</span></footer>';
function scene(s){return '<div class="scene" aria-hidden="true">'+farmSVG(s.scene)+'</div><p class="scene-caption">3D CONCEPT ILLUSTRATION</p>';}
function detail(s){
 if(s.kind==='hero')return '<span class="tagline">SOIL + WATER + CROP ROTATIONS</span>';
 if(s.kind==='problem')return '<div class="need-list">'+s.items.map(([title,text])=>'<div class="need"><b>'+esc(title)+'</b><p>'+esc(text)+'</p></div>').join('')+'</div>';
 if(s.kind==='compare')return '<div class="rotation-grid">'+s.items.map(([n,title,text])=>'<article class="rotation"><small>CALENDAR '+n+'</small><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p><div class="mini-line" aria-hidden="true">'+Array.from({length:12},()=>'<i></i>').join('')+'</div></article>').join('')+'</div><p class="aside-line">Local checks determine eligibility. Unknown suitability keeps the preference order unresolved.</p>';
 if(['evidence','ai','close'].includes(s.kind))return '<div class="steps">'+s.items.map(([title,text])=>'<div class="step"><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p></div>').join('')+'</div>'+(s.kind==='ai'?'<a class="text-link" href="'+LINKS.ai+'" target="_blank" rel="noopener">Open the live AI demo ↗</a>':'')+(s.kind==='close'?'<div class="actions"><a href="'+LINKS.ai+'" target="_blank" rel="noopener">Launch AI demo ↗</a><a href="'+LINKS.benchmark+'" target="_blank" rel="noopener">Read benchmark ↗</a><a href="'+LINKS.paper+'" target="_blank" rel="noopener">Research brief · draft ↗</a></div><p class="authors">Mohamed Mostafa · Youssef Mohamed · Aya Abdelnabi · Mohamed Abdelrahman<br>NASA Space Apps 6 October team · Event venue: Badr University in Cairo</p>':'');
 if(s.kind==='benchmark')return '<div class="stats">'+s.items.map(([value,label])=>'<div class="stat"><strong>'+esc(value)+'</strong><p>'+esc(label)+'</p></div>').join('')+'</div><p class="check-line">15 scenario runs passed independent water-balance checks.<br>Soil and calendars remain assumptions; farm outcomes are unvalidated.</p><a class="text-link" href="'+LINKS.benchmark+'" target="_blank" rel="noopener">Open reproducible benchmark ↗</a>';
 if(s.kind==='honesty')return '<div class="bars" role="img" aria-label="Rainfall mean absolute error: analogs 20.32 millimeters; climatology baseline 15.29 millimeters. Lower is better.">'+s.items.map(([name,value],i)=>'<div class="bar-row"><span class="bar-label">'+esc(name)+'</span><div class="bar-track"><div class="bar-fill '+(i===0?'weak':'')+'" style="width:'+(value/25*100)+'%"></div></div><span class="bar-number">'+value.toFixed(2)+' mm</span></div>').join('')+'<div class="axis"><span>0</span><span>Rainfall MAE · lower is better</span><span>25 mm</span></div></div><p class="caption">Four chronological holdouts, 2022–2025. Every target year uses earlier years only.</p><p class="footnote">The analog method was worse than climatology in this small test. No predictive advantage is demonstrated.<br>Next: independent station, soil and irrigation measurements. No validated crop-yield or soil-health forecast.</p>';
 return '';
}
slides.forEach((s,i)=>{
 const el=document.createElement('section');el.className='slide '+s.kind;el.id='slide-'+(i+1);el.setAttribute('aria-label','Slide '+(i+1)+': '+s.title.replaceAll('\n',' '));el.setAttribute('aria-hidden','true');
 el.innerHTML='<div class="left"><p class="overline">'+esc(s.label)+'</p><h1>'+esc(s.title)+'</h1><p class="lead">'+esc(s.lead)+'</p>'+detail(s)+'</div>'+(!['compare','honesty'].includes(s.kind)?scene(s):'')+(s.kind==='ai'?'<div class="ai-stat"><strong>'+s.stat+'</strong><p>'+s.statLabel+'</p><small>Small, hand-written English retrieval test on six reviewed passages. Not general agronomic accuracy.</small></div>':'')+footer(i);
 stage.append(el);
 const b=document.createElement('button');b.textContent=i+1;b.setAttribute('aria-label','Show slide '+(i+1));b.onclick=()=>show(i);nav.append(b);
});
let current=Math.max(0,Math.min(slides.length-1,Number(location.hash.slice(1))-1||0));
function show(index){current=Math.max(0,Math.min(slides.length-1,index));stage.querySelectorAll('.slide').forEach((el,i)=>{el.classList.toggle('active',i===current);el.setAttribute('aria-hidden',String(i!==current));});nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===current)));document.querySelector('#counter').textContent=(current+1)+' / '+slides.length;document.querySelector('#previous').disabled=current===0;document.querySelector('#next').disabled=current===slides.length-1;document.querySelector('#speaker-notes p').textContent=slides[current].notes;history.replaceState(null,'','#'+(current+1));}
function fit(){const viewport=document.querySelector('#viewport'),scale=Math.min(viewport.clientWidth/1280,viewport.clientHeight/720);stage.style.transform='scale('+scale+')';}
function toggleNotes(){const notes=document.querySelector('#speaker-notes');notes.hidden=!notes.hidden;document.querySelector('#notes-toggle').setAttribute('aria-pressed',String(!notes.hidden));}
document.querySelector('#previous').onclick=()=>show(current-1);document.querySelector('#next').onclick=()=>show(current+1);document.querySelector('#notes-toggle').onclick=toggleNotes;
document.querySelector('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notice('Full screen is unavailable here. Use your browser’s presentation/full-screen command.');}};
document.querySelector('#print-deck').onclick=()=>window.print();
document.addEventListener('keydown',event=>{if(event.target.closest('button,a,input,textarea,select')&&event.key===' ')return;if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();show(current+1);}if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();show(current-1);}if(event.key==='Home')show(0);if(event.key==='End')show(slides.length-1);if(event.key.toLowerCase()==='n')toggleNotes();if(event.key.toLowerCase()==='f')document.querySelector('#fullscreen').click();});
window.addEventListener('resize',fit);new ResizeObserver(fit).observe(document.querySelector('#viewport'));show(current);fit();
function notice(text){const target=document.querySelector('#export-status');target.style.display='block';target.textContent=text;}
let libraryPromise;
function pptxLibrary(){if(window.PptxGenJS)return Promise.resolve(window.PptxGenJS);if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';script.onload=()=>resolve(window.PptxGenJS);script.onerror=()=>reject(Error('Unable to download the PowerPoint export library.'));document.head.append(script);});return libraryPromise;}
async function pngArt(mode){
 const img=new Image();img.src='data:image/svg+xml;base64,'+btoa(farmSVG(mode));await img.decode();const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=1040;canvas.getContext('2d').drawImage(img,0,0,1280,1040);return canvas.toDataURL('image/png');
}
export async function exportPowerPoint(){
 const btn=document.querySelector('#export-pptx');btn.disabled=true;notice('Preparing your eight-slide PowerPoint with speaker notes…');
 try{
  const PptxGenJS=await pptxLibrary(),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='Mohamed Mostafa; Youssef Mohamed; Aya Abdelnabi; Mohamed Abdelrahman';pptx.subject='NASA Space Apps crop-rotation decision support';pptx.title='Soil-IQ | 3D Pitch';pptx.company='NASA Space Apps 6 October project team';pptx.lang='en-US';
  const text=(slide,t,x,y,w,h,size=22,color='EFF3E4',extra={})=>slide.addText(t,{x:x/96,y:y/96,w:w/96,h:h/96,fontFace:'Arial',fontSize:size*.75,color,margin:0,breakLine:false,valign:'top',...extra});
  const imageCache={};
  for(let i=0;i<slides.length;i++){
   const s=slides[i],slide=pptx.addSlide();slide.background={color:'10271F'};
   text(slide,s.label,62,44,1100,22,13,'C0D794',{charSpacing:2});
   const wide=['compare','benchmark','honesty','close'].includes(s.kind);
   text(slide,s.title,62,s.kind==='hero'?153:90,wide?1100:580,160,s.kind==='hero'?72:62,'EFF3E4',{fontFace:'Georgia',breakLine:false});
   text(slide,s.lead,62,s.kind==='hero'?345:255,wide?1080:580,70,23,'C7D0C0');
   if(!['compare','honesty'].includes(s.kind)){
    if(!imageCache[s.scene])imageCache[s.scene]=await pngArt(s.scene);
    slide.addImage({data:imageCache[s.scene],x:s.kind==='benchmark'?7.25:s.kind==='close'?7.4:6.8,y:1.55,w:s.kind==='benchmark'||s.kind==='close'?5.25:6.2,h:s.kind==='benchmark'||s.kind==='close'?4.27:5.04,transparency:s.kind==='ai'?50:0});
   }
   if(s.kind==='hero')text(slide,'SOIL + WATER + CROP ROTATIONS',62,470,520,25,15,'D6AD64');
   if(s.kind==='problem')s.items.forEach(([title,body],j)=>{let x=62+(j%2)*270,y=350+Math.floor(j/2)*110;text(slide,title,x,y,245,25,22,'C0D794');text(slide,body,x,y+33,245,62,18,'C7D0C0');});
   if(s.kind==='compare')s.items.forEach(([n,title,body],j)=>{let x=62+j*377;slide.addShape(pptx.ShapeType.rect,{x:x/96,y:3.65,w:3.75,h:2.15,fill:{color:'193328'},line:{color:'688455',width:1}});text(slide,'CALENDAR '+n,x+22,373,320,22,13,'D6AD64');text(slide,title,x+22,415,320,36,25);text(slide,body,x+22,470,305,80,21,'C7D0C0');});
   if(['evidence','ai','close'].includes(s.kind))s.items.forEach(([title,body],j)=>{
    const horizontal=s.kind==='close',x=horizontal?62+j*253:62,y=horizontal?357:350+j*(s.kind==='ai'?83:88),w=horizontal?225:490;
    text(slide,title,x,y,w,29,21,'C0D794');text(slide,body,x,y+32,w,horizontal?90:48,17,'C7D0C0');
   });
   if(s.kind==='ai'){slide.addShape(pptx.ShapeType.rect,{x:8,y:2.5,w:3.55,h:2.7,fill:{color:'183328'},line:{color:'718D5A',width:1}});text(slide,'5 / 5',795,258,290,100,78,'C0D794',{fontFace:'Georgia'});text(slide,'Expected source in top three',795,365,290,65,23);text(slide,'Five predefined English queries.\nSix reviewed passages.\nNot general agronomic accuracy.',795,445,290,70,15,'B5C2B2');}
   if(s.kind==='benchmark'){s.items.forEach(([value,label],j)=>{let x=[62,260,560][j];text(slide,value,x,360,j===1?275:210,75,54,'EFF3E4',{fontFace:'Georgia'});text(slide,label,x,444,195,70,20,'C7D0C0');});text(slide,'15 scenario runs passed water-balance checks.\nIllustrative calendars and soil assumptions; no validated farm outcomes.',62,560,610,60,17,'C0D794');}
   if(s.kind==='honesty'){s.items.forEach(([name,value],j)=>{let y=370+j*85;text(slide,name,62,y,245,40,22);slide.addShape(pptx.ShapeType.rect,{x:3.3,y:y/96,w:value/25*5.05,h:.35,fill:{color:j===0?'D6AD64':'C0D794'},line:{color:j===0?'D6AD64':'C0D794',transparency:100}});text(slide,value.toFixed(2)+' mm',835,y-2,220,40,27);});text(slide,'Rainfall MAE · lower is better · four chronological holdouts (2022–2025).\nThe analog method was worse than climatology in this small test.',62,560,1100,65,20,'C7D0C0');}
   if(s.kind==='close'){text(slide,'Mohamed Mostafa · Youssef Mohamed · Aya Abdelnabi · Mohamed Abdelrahman',62,580,1060,27,16,'C7D0C0');text(slide,'NASA Space Apps 6 October · Event venue: Badr University in Cairo',62,615,1060,25,14,'B5C2B2');}
   const link=s.kind==='ai'?LINKS.ai:s.kind==='benchmark'||s.kind==='honesty'?LINKS.benchmark:s.kind==='close'?LINKS.app:null;
   if(link)text(slide,s.kind==='ai'?'OPEN AI DEMO ↗':'OPEN LIVE PROJECT ↗',s.kind==='close'?62:900,s.kind==='close'?540:625,s.kind==='close'?500:310,25,14,'C0D794',{hyperlink:{url:link}});
   text(slide,'SOIL-IQ · NASA SPACE APPS 6 OCTOBER | BUC: EVENT VENUE',62,681,1020,18,10,'AABB9F');
   text(slide,String(i+1).padStart(2,'0')+' / 08',1130,681,100,18,10,'AABB9F');
   slide.addNotes(s.notes+'\n\nSources and live evidence: '+LINKS.benchmark+' ; '+LINKS.github+' ; https://doi.org/10.3389/fpls.2023.1165113 . Field artwork is a conceptual illustration.');
  }
  await pptx.writeFile({fileName:'Soil-IQ_3D_Pitch.pptx'});notice('PowerPoint downloaded. Use the live deck for animated 3D transitions.');
 }catch(error){notice('Export could not complete: '+error.message+'. The live presentation and Print / PDF remain available.');}
 finally{btn.disabled=false;}
}
document.querySelector('#export-pptx').onclick=exportPowerPoint;
