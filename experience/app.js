import {allocateWater,trendStats,nitrogenLedger} from "./engine.js";

const $=id=>document.getElementById(id);
const REGIONS=[
 {id:"zankalon",name:"الزنكلون — الشرقية",lat:30.5806,lon:31.4333,role:"تجربة مقارنة المحاصيل ومياه المسقة"},
 {id:"sidi-ghazi",name:"سيدي غازي — كفر الشيخ",lat:31.2014,lon:31.0286,role:"التربة والصرف ومراجعة خطر الغدق"},
 {id:"mallawi",name:"ملوي — المنيا",lat:27.7314,lon:30.8417,role:"التعرض الحراري والموسمي"},
 {id:"diamond-valley",name:"Diamond Valley — Nevada",lat:39.6914,lon:-115.9611,role:"مرجع مقارن لتصريف المياه والمساحات الجافة"}
];
let currentTab="farm";
function tab(id){
 currentTab=id;
 for(const button of document.querySelectorAll("[data-tab]")){
  const selected=button.dataset.tab===id;
  button.classList.toggle("active",selected);
  button.setAttribute("aria-selected",String(selected));
 }
 for(const p of document.querySelectorAll("main .panel"))p.hidden=p.id!==id;
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
tab("farm");
for(const id of ["trend-region","sar-region"]){
 const select=$(id);
 for(const r of REGIONS){const opt=document.createElement("option");opt.value=r.id;opt.textContent=r.name;select.append(opt);}
}
for(const r of REGIONS){
 const el=document.createElement("article"),h=document.createElement("h3"),p=document.createElement("p"),tag=document.createElement("small");
 h.textContent=r.name;p.textContent=r.role;tag.textContent="Research location: point only, unverified field geometry";
 el.append(h,p,tag);$("regions").append(el);
}
function regionFrom(id){return REGIONS.find(r=>r.id===$(id).value)??REGIONS[0];}
function number(id){return Number($(id).value);}
function showError(id,e){$(id).textContent="غير متاح: "+(e?.message??String(e))+". لا توجد بيانات مصطنعة بديلة.";}
function paragraph(text){const p=document.createElement("p");p.textContent=text;return p;}
async function callApi(path,params,button,out){
 out.replaceChildren(paragraph("جاري طلب البيانات من المصدر..."));
 button.disabled=true;
 try{
  const query=new URLSearchParams(params);
  const response=await fetch(path+"?"+query.toString(),{signal:AbortSignal.timeout(60000)});
  const data=await response.json();
  if(!response.ok)throw Error(data.error??"Source unavailable");
  return data;
 }finally{button.disabled=false;}
}
$("trend-fetch").onclick=async()=>{
 const r=regionFrom("trend-region"),out=$("trend-result");
 try{
  const data=await callApi("/api/trends",{lat:r.lat,lon:r.lon,startYear:$("trend-start").value,endYear:$("trend-end").value,parameter:$("trend-var").value},$("trend-fetch"),out);
  out.replaceChildren(paragraph("المصدر: NASA POWER، شبكة أرصاد إقليمية؛ النقل: "+data.transport+". سنوات مكتملة: "+data.completeYears+"/"+data.annual.length));
  if(data.statistics){
   const s=data.statistics;
   out.append(paragraph("Mann–Kendall: S="+s.S+"، p="+s.p.toFixed(4)+" | Theil–Sen: "+s.senPerDecade.toFixed(3)+" "+data.unit+"/عقد. غير مصحح للارتباط الزمني."));
  }else out.append(paragraph("السنوات المكتملة غير كافية لإجراء الاختبار."));
  const table=document.createElement("table"),head=document.createElement("tr");
  for(const h of ["السنة","المتغير","التغطية"]){const c=document.createElement("th");c.textContent=h;head.append(c);}table.append(head);
  for(const a of data.annual){const tr=document.createElement("tr");for(const val of [a.year,a.value===null?"غير متاح":a.value.toFixed(2)+" "+data.unit,Math.round(a.coverage*100)+"%"]){const td=document.createElement("td");td.textContent=val;tr.append(td);}table.append(tr);}
  out.append(table);
 }catch(e){showError("trend-result",e);$("trend-fetch").disabled=false;}
};
$("sar-fetch").onclick=async()=>{
 const r=regionFrom("sar-region"),out=$("sar-result");
 try{
  const data=await callApi("/api/radar-scenes",{lat:r.lat,lon:r.lon,dataset:$("sar-mission").value,start:$("sar-start").value,end:$("sar-end").value},$("sar-fetch"),out);
  out.replaceChildren(paragraph("كتالوج ASF: "+data.count+" مشاهد. "+data.transport+". لا يوجد تحليل SAR pixel-to-pixel أو قياس ملوحة."));
  for(const s of data.scenes){
   const a=document.createElement("article"),h=document.createElement("h3"),p=document.createElement("p");
   h.textContent=s.id;p.textContent=[s.startTime,s.platform,s.processingLevel,s.polarization,s.flightDirection].filter(Boolean).join(" · ");
   a.append(h,p);out.append(a);
  }
  if(!data.count)out.append(paragraph("لا توجد نتائج للفترة. جرّب فترة أو منتجًا آخر."));
 }catch(e){showError("sar-result",e);$("sar-fetch").disabled=false;}
};
$("water-demands").replaceChildren(...[20,30,40,35,45,55].map((val,i)=>{
 const label=document.createElement("label"),inp=document.createElement("input");inp.type="number";inp.min="0";inp.value=String(val);inp.dataset.demand=String(i);label.textContent="المزرعة F"+(i+1);label.append(inp);return label;
}));
function waterInput(){return {demands:[...document.querySelectorAll("[data-demand]")].map(n=>Number(n.value)),supply:number("water-supply"),policy:$("water-policy").value};}
function waterCompute(target="water-result"){
 const input=waterInput(),result=allocateWater(input.demands,input.supply,input.policy),out=$(target);
 out.replaceChildren(paragraph("الموزّع "+result.deliveredTotal.toFixed(2)+" من "+result.supply+" | العجز "+(result.totalDemand-result.deliveredTotal).toFixed(2)+" | Jain fairness = "+(result.fairness===null?"غير محدد":result.fairness.toFixed(3))));
 for(let i=0;i<input.demands.length;i++){
  const wrapper=document.createElement("div"),p=paragraph("F"+(i+1)+" · "+result.delivered[i].toFixed(2)+" / "+input.demands[i]),bar=document.createElement("div"),fill=document.createElement("span");
  wrapper.className="waterrow";bar.className="bar";fill.style.width=(input.demands[i]?100*result.delivered[i]/input.demands[i]:100)+"%";bar.append(fill);wrapper.append(p,bar);out.append(wrapper);
 }
 return result;
}
$("water-calc").onclick=()=>{try{waterCompute();}catch(e){showError("water-result",e);}};
$("water-calc").click();
$("n-calc").onclick=()=>{try{
 const v=nitrogenLedger({initial:number("n-initial"),fertilizer:number("n-fertilizer"),fixation:number("n-fixation"),mineralization:number("n-mineralization"),uptake:number("n-uptake"),loss:number("n-loss")});
 $("n-result").textContent="الرصيد الختامي: "+v.ending.toFixed(1)+" | العجز: "+v.deficit.toFixed(1)+" | فرق الميزان: "+v.closureResidual.toFixed(6)+". جميع المدخلات افتراضية.";
 }catch(e){showError("n-result",e);}};
$("n-calc").click();
const months=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
$("month").oninput=()=>{$("month-label").textContent=months[number("month")-1];};$("month").oninput();
$("time-replay").onclick=()=>{try{
 const r=allocateWater(...[waterInput().demands,waterInput().supply,waterInput().policy]);
 $("time-result").textContent=months[number("month")-1]+": إعادة حساب سيناريو المياه نفسه؛ الموزّع "+r.deliveredTotal.toFixed(2)+" والعجز "+(r.totalDemand-r.deliveredTotal).toFixed(2)+". هذا ليس تنبؤ محصول موسمي.";
 }catch(e){showError("time-result",e);}};
const cases=[
 ["حرارة أو نقص ماء","راجع بيانات الهواء وسجل توقيت الري وقياس الرطوبة الميداني."],
 ["ملوحة محتملة","قِس ECe بعينة تربة؛ الرادار لا يقيس الملوحة مباشرة."],
 ["صودية التربة","افحص ESP وpH ومياه الري؛ لا تصدر جرعة جبس من صور الأقمار."],
 ["ضعف الصرف","راجع عمق المياه الجوفية والصرف قبل اقتراح الغسيل."],
 ["نقص تغذية","راجع تحليل التربة والأوراق وعمر النبات والإدارة."],
 ["آفة أو مرض","افحص الحقل ونوع الآفة؛ مؤشر اللون ليس تشخيصًا."]
];
for(const [title,detail] of cases){const el=document.createElement("article"),h=document.createElement("h3");h.textContent=title;el.append(h,paragraph(detail));$("detective-cards").append(el);}
const safety=[
 ["حرارة العمل","خفف التعرض للشمس واتبع تعليمات الوقاية المحلية."],
 ["نقص السوائل","توعية عامة؛ لا جرعات طبية مخصصة."],
 ["المبيدات","التزم ملصق المنتج ومعدات الحماية المعتمدة."],
 ["قنوات الري","تحقق من سلامة الممرات والمعدات الكهربائية."],
 ["آلات الحقل","تدريب وفحص المعدات قبل تشغيلها."],
 ["الدخان والغبار","قلل التعرض وراجع إرشادات الصحة العامة."]
];
for(const [title,detail] of safety){const el=document.createElement("article"),h=document.createElement("h3");h.textContent=title;el.append(h,paragraph(detail));$("safety-cards").append(el);}
const answers={
 water:"العجز في اللعبة = إجمالي الطلب الافتراضي ناقص إجمالي المياه الموزعة. ليس قياسًا فعليًا لفقد المحصول.",
 radar:"لا. التشتت الراداري يتأثر بالرطوبة والغطاء والخشونة، ولا يثبت الملوحة أو عمق الماء الأرضي من غير قياسات مستقلة.",
 trend:"سنوات قليلة أو سلسلة غير مكتملة لا تثبت تغير المناخ؛ نحتاج مصدرًا موثّقًا، تغطية، واختبارات تشرح القيود."
};
$("ask").onclick=()=>{$("answer").textContent=answers[$("question").value]+" — Template response only / not live AI."};$("ask").click();
$("send").onclick=()=>{const d=document.createElement("div");d.textContent="[SIMULATED — NOT SENT] "+$("message").value+" — SOLIQ: راجع أدلة الحقل واستشر مرشدًا محليًا قبل تغيير الري.";$("thread").prepend(d);};
$("download").onclick=()=>{try{
 const r=waterCompute(),payload={schema:"soliq-prototype-v1",createdAt:new Date().toISOString(),dataClass:"simulated",inputs:waterInput(),result:r,limitations:["Not a NASA observation","Not an agronomic prescription","Not a durable scientific run"]};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="soliq-mesqa-simulated.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){window.alert("تعذر تصدير السيناريو: "+e.message);}};
