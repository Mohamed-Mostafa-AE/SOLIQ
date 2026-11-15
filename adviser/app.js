import {GUIDANCE,MODEL} from './knowledge.js';
const form=document.querySelector('form'),status=document.querySelector('#status'),button=document.querySelector('#run');
let language='en',worker,pending,report=null,last=null,running=false;
const isAr=()=>language==='ar';
const text=(en,ar)=>isAr()?ar:en;
function add(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function renderGuidance(result){
 const proof=document.querySelector('#proof');proof.hidden=false;proof.replaceChildren();
 add('strong',text('AI inference completed on this device','اكتمل تشغيل نموذج الذكاء الاصطناعي على هذا الجهاز'),proof);
 add('p',`${MODEL.id} · ${result.dimensions} dimensions · ${Math.round(result.ms)} ms · revision ${MODEL.revision}`,proof);
 add('p',text('Similarity ranks source relevance, not crop suitability or factual confidence. The report below is computed from evidence.','يرتب التشابه صلة المصادر بالسؤال، ولا يمثل ملاءمة المحصول أو الثقة العلمية. التقرير أدناه مبني على الحسابات والأدلة.'),proof);
 const parent=document.querySelector('#guidance');parent.replaceChildren();
 for(const hit of result.ranked){const p=GUIDANCE[hit.index],card=document.createElement('article');add('h2',isAr()?p.arTitle:p.title,card);add('p',isAr()?p.ar:p.text,card);const link=add('a',p.source,card);link.href=p.url;link.target='_blank';link.rel='noopener';add('p',text('Semantic similarity: ','التشابه الدلالي: ')+hit.similarity.toFixed(3),card);parent.append(card);}
}
form.elements.topic.addEventListener('change',()=>document.querySelector('#custom').hidden=form.elements.topic.value!=='custom');
document.querySelector('#language').onclick=()=>{language=isAr()?'en':'ar';document.documentElement.lang=language;document.documentElement.dir=isAr()?'rtl':'ltr';document.querySelector('#language').textContent=isAr()?'English':'العربية';button.textContent=text('Run AI research demo','تشغيل تجربة الذكاء الاصطناعي');document.querySelector('#title').textContent=text('Research your next rotation.','ابحث عن دورتك الزراعية القادمة.');if(last)renderGuidance(last);document.querySelector('#report').textContent=text('Run the demo again to obtain the report in this language.','شغّل التجربة مجددًا للحصول على التقرير بالعربية.');};
function inference(question){
 if(!worker){worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});worker.onerror=()=>pending?.reject(Error('Model runtime failed. Check internet access and retry.'));worker.onmessage=({data})=>{if(!running)return;if(data.status==='result')pending?.resolve(data);else if(data.status==='error')pending?.reject(Error(data.message));else status.textContent=data.status==='download'?text('Downloading model: ','تحميل النموذج: ')+(data.progress||0).toFixed(0)+'%':text('Loading the open model. First use may take a few minutes.','جارٍ تحميل النموذج المفتوح. قد يستغرق التشغيل الأول بضع دقائق.');};}
 return new Promise((resolve,reject)=>{pending={resolve,reject};worker.postMessage({question});});
}
form.onsubmit=async event=>{
 event.preventDefault();const question=form.elements.topic.value==='custom'?form.elements.question.value.trim():form.elements.topic.value;
 if(!question){status.textContent='Enter a question.';return;}
 running=true;button.disabled=true;document.querySelector('#language').disabled=true;status.textContent=text('Loading NASA evidence and the open model…','تحميل بيانات ناسا والنموذج المفتوح…');
 document.querySelector('#guidance').replaceChildren();document.querySelector('#proof').hidden=true;document.querySelector('#report').textContent='';
 try{
  const evidence=fetch('/api/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'evidence',language,lat:Number(form.elements.lat.value),lon:Number(form.elements.lon.value)}),signal:AbortSignal.timeout(110000)}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d;});
  const results=await Promise.all([inference(question),evidence]);last=results[0];report=results[1];renderGuidance(last);
  document.querySelector('#report').textContent=report.text+'\n\n'+report.scope+'\nEvidence SHA-256: '+report.evidenceId;
  status.textContent=text('Complete: real model inference, cited guidance and NASA-backed evidence.','اكتمل: تشغيل فعلي للنموذج وإرشادات بمصادر وأدلة مبنية على ناسا.');
 }catch(error){worker?.terminate();worker=null;pending=null;status.textContent=text('Demo could not complete: ','تعذر إكمال التجربة: ')+error.message;}
 finally{running=false;button.disabled=false;document.querySelector('#language').disabled=false;}
};
