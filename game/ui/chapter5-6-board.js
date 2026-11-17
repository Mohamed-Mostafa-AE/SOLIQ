import {
  Chapter5WaterTurns, Chapter6FutureMission, CANAL_TURNS, CANAL_ACTIONS,
  FUTURE_CHOICES, createChapter6StoryExport,
} from '../mission/chapter5-6.js';

const words = {
  en: {
    close:'Close chapter', status:'FICTIONAL DELTA · SIMULATED',
    chapter5:'05 / THREE CANAL TURNS', title5:'The canal remembers every turn.',
    intro5:'Walk with Hassan, Farida and Maryam across three playable council turns. Choose who gets attention. Your fictional pact shapes the starting point; every action has a trade-off.',
    previous:'INHERITED VILLAGE PACT', pact:'Council ending', progress:'CANAL TURN',
    continue:'Choose this action', again:'Replay the three turns',
    effects:'FICTIONAL STORY COUNTERS', tail:'Tail voice', cover:'Ground cover',
    livelihood:'Livelihood effort', questions:'Questions logged',
    hint:'Narrative counters only — not litres, yields, soil tests or measurements.',
    result5:'Three turns. A different village.',
    shared_turns:'Farida is heard more often. Hassan points out what the council still owes families.',
    covered_ground:'Maryam sees more imagined soil cover. Harvest labour is still a difficult choice.',
    questions_recorded:'Nada lists the unanswered questions. No missing NASA or canal records were obtained.',
    mixed_tradeoffs:'The council tried different approaches. No one fictional counter settles the dispute.',
    noData:'OBSERVED NASA WEATHER: UNAVAILABLE · ACTUAL CANAL FLOW: UNAVAILABLE · STORY: SIMULATED',
    continue6:'Close this chapter, then enter the future council.',
    chapter6:'06 / THE OPEN FUTURE',title6:'A better question than “Who won?”',
    intro6:'Dawn. Nada brings the village together one last time. The previous three choices still matter. There is no magic perfect farm plan — decide what the people do with their uncertainty.',
    past:'YOUR THREE RECORDED TURNS',chooseFuture:'HOW WILL THE VILLAGE CONTINUE?',
    result6:'Your ending is written — the field remains unknown.',
    measure_before_action:'Nada asks for dated NASA weather and local soil and canal records before any real farm decision. The story ends with a question, not a claim.',
    shared_rehearsal:'Hassan, Maryam and Farida share the fictional exercise to help neighbours discuss fairness and soil cover. It remains a game, not a field plan.',
    open_questions:'The council pauses to invite unheard neighbours. More voices are welcome; no missing field evidence can be assumed.',
    replay6:'Choose another ending',download:'Download fictional story decisions',
    privacy:'Downloaded only to your device; no coordinates, account or story data are uploaded.',
    scientific:'Open the NASA-backed scientific walkthrough ↗',
    error:'Local download failed. Your story is still available here; no data was uploaded.',
  },
  ar: {
    close:'اقفل الفصل',status:'دلتا خيالية · نتائج محاكاة',
    chapter5:'٠٥ / تلات نوبات للمسقة',title5:'المسقة بتفتكر كل نوبة.',
    intro5:'امشي مع حسن وفريدة ومريم في تلات نوبات تفاعلية. اختار مين محتاج اهتمام. اتفاق القرية السابق بيغير البداية، وكل فعل له مفاضلة.',
    previous:'اتفاق القرية السابق',pact:'نتيجة المجلس',progress:'نوبة المسقة',
    continue:'اختار الفعل ده',again:'جرب النوبات التلاتة تاني',
    effects:'مؤشرات للقصة الخيالية',tail:'صوت آخر المسقة',cover:'غطاء الأرض',
    livelihood:'مجهود المعيشة',questions:'أسئلة اتسجلت',
    hint:'دي مؤشرات حكاية بس، مش لترات مياه أو إنتاج أو قياسات تربة.',
    result5:'تلات نوبات، وقرية مختلفة.',
    shared_turns:'فريدة صوتها بقى مسموع أكتر، لكن حسن بيفكر المجلس بحقوق الأسر.',
    covered_ground:'مريم بتشوف غطاء تربة افتراضي أكتر، لكن مجهود الحصاد لسه مفاضلة صعبة.',
    questions_recorded:'ندى كتبت الأسئلة اللي ناقصة. مفيش بيانات ناسا أو سجلات مسقة وصلت.',
    mixed_tradeoffs:'المجلس جرّب حلول مختلفة. مفيش رقم خيالي واحد يحل الخلاف.',
    noData:'طقس ناسا المرصود: غير متاح · تدفق المسقة الحقيقي: غير متاح · القصة: محاكاة',
    continue6:'اقفل الفصل ده وادخل مجلس المستقبل.',
    chapter6:'٠٦ / المستقبل المفتوح',title6:'السؤال الأفضل مش «مين كسب؟».',
    intro6:'الفجر رجع. ندى جمعت القرية مرة أخيرة. اختيارات النوبات التلاتة لسه ليها أثر. مفيش خطة مزرعة سحرية؛ اختار هنتعامل إزاي مع اللي لسه مانعرفوش.',
    past:'اختيارات النوبات التلاتة',chooseFuture:'القرية هتكمل إزاي؟',
    result6:'النهاية اتكتبت، لكن حقيقة الحقل لسه مجهولة.',
    measure_before_action:'ندى بتطلب طقس ناسا المؤرخ وقياسات التربة وسجلات المسقة قبل أي قرار حقيقي. القصة خلصت بسؤال، مش ادعاء.',
    shared_rehearsal:'حسن ومريم وفريدة بيشاركوا اللعبة التعليمية مع الجيران عشان يتناقشوا عن العدالة والتربة. دي لعبة مش خطة للحقل.',
    open_questions:'المجلس بيقف عشان يسمع ناس ما اتكلمتش. أصوات أكتر مرحب بيها، لكن الدليل الميداني لسه ناقص.',
    replay6:'اختار نهاية تانية',download:'نزّل قرارات القصة الخيالية',
    privacy:'التنزيل على جهازك فقط؛ مفيش إحداثيات أو حساب أو بيانات بتترفع.',
    scientific:'افتح المقارنة العلمية ببيانات ناسا ↗',
    error:'التنزيل المحلي فشل. القصة لسه موجودة هنا، ومفيش بيانات اترفعت.',
  },
};

const escapeText = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scores = ['tail','cover','livelihood','questions'];
const endings = {science_before_claims:{en:'Evidence first',ar:'الدليل الأول'},tail_shares:{en:'Shared canal access',ar:'عدالة المياه'},roots_return:{en:'Soil cover',ar:'غطاء التربة'},fragile_harvest:{en:'Family livelihoods',ar:'معيشة الأسر'},difficult_balance:{en:'Difficult balance',ar:'مفاضلة صعبة'}};
const reactions = {
  share_turn:{en:'Farida steps closer to the council map. Hassan asks how the family work will be shared.',ar:'فريدة قربت من خريطة المجلس. حسن بيسأل إزاي هنتقاسم شغل الأسر.'},
  protect_cover:{en:'Maryam adds green strips to the imagined fields. Hassan counts the work that has been diverted.',ar:'مريم زودت شرائط خضراء على الحقول الخيالية. حسن بيحسب المجهود اللي اتحوّل.'},
  ask_for_records:{en:'Nada opens a blank evidence ledger. The missing readings stay missing.',ar:'ندى فتحت دفتر أدلة فاضي. القياسات الناقصة لسه ناقصة.'},
};

function makeChapterModal({host,id,titleId,language}) {
  const stylesheet=document.createElement('link');
  stylesheet.rel='stylesheet';stylesheet.href=new URL('./chapter5-6-board.css',import.meta.url).href;
  document.head.appendChild(stylesheet);
  const root=document.createElement('section');
  root.id=id;root.className='sf-later-modal';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby',titleId);
  host.appendChild(root);
  let lang=language==='ar'?'ar':'en';
  let savedFocus=null;let inerted=[];let paint=()=>{};
  const inertBackground=()=>{
    let node=root;
    while(node.parentElement){
      for(const sibling of node.parentElement.children){
        if(sibling===node||sibling.tagName==='SCRIPT'||sibling.tagName==='LINK')continue;
        inerted.push([sibling,sibling.inert]);sibling.inert=true;
      }
      node=node.parentElement;
    }
  };
  const restoreBackground=()=>{for(const [node,inert] of inerted)node.inert=inert;inerted=[];};
  function close(){if(root.hidden)return;root.hidden=true;restoreBackground();if(savedFocus?.isConnected)savedFocus.focus();}
  function open(){if(!root.hidden)return;savedFocus=document.activeElement;root.hidden=false;paint();inertBackground();root.scrollTop=0;root.querySelector('.sf-close')?.focus({preventScroll:true});}
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab')return;
    const focusables=[...root.querySelectorAll('button:not([disabled]),a[href]')].filter(node=>node.getClientRects().length);
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  return {
    root,open,close,
    get lang(){return lang;},
    setPainter(fn){paint=fn;paint();},
    setLanguage(next){lang=next==='ar'?'ar':'en';paint();},
    destroy(){close();root.remove();stylesheet.remove();},
  };
}

function shell(t,lang,chapter,body) {
  return `<div class="sf-landscape" aria-hidden="true"><div class="sf-sun"></div><div class="sf-reeds"></div><div class="sf-boat"></div><div class="sf-canal"></div></div>
    <div class="sf-content"><button type="button" class="sf-close" data-action="close" aria-label="${t.close}">×</button>
    <header class="sf-header"><span class="sf-kicker">${chapter===5?t.chapter5:t.chapter6}</span><span class="sf-badge">${t.status}</span>
      <h1 id="sf-chapter${chapter}-title">${chapter===5?t.title5:t.title6}</h1>
      <p>${chapter===5?t.intro5:t.intro6}</p></header>${body}
    <footer class="sf-evidence"><strong>${t.noData}</strong><a href="../../walkthrough/?demo=1" target="_blank" rel="noopener noreferrer">${t.scientific}</a></footer></div>`;
}

function renderScores(t,mission){return `<aside class="sf-tokens" aria-label="${t.effects}"><h2>${t.effects}</h2>
  <div class="sf-score-grid">${scores.map(id=>`<div><span>${t[id]}</span><strong>${mission.scores[id]}</strong></div>`).join('')}</div><p>${t.hint}</p></aside>`;}

export function attachChapter5Game({host=document.body,chapter4,language='en',onStateChange}={}) {
  if(!host)throw new TypeError('Chapter 5 requires a DOM host');
  const mission=new Chapter5WaterTurns(chapter4);
  const ui=makeChapterModal({host,id:'chapter5-canal-turns',titleId:'sf-chapter5-title',language});
  function paint(){
    const t=words[ui.lang],view=mission.view(),isDone=mission.phase==='result';
    const turn=CANAL_TURNS[view.turn-1];
    const outcome=isDone?mission.result.ending:null;
    ui.root.lang=ui.lang;ui.root.dir=ui.lang==='ar'?'rtl':'ltr';ui.root.dataset.phase=mission.phase;
    ui.root.dataset.lastChoice=view.choices.at(-1)||'none';
    const body=`<div class="sf-layout"><main class="sf-gameplay">
      <div class="sf-history"><span>${t.previous}</span><strong>${endings[mission.prior.ending][ui.lang]}</strong><small>${t.pact}: ${mission.prior.mandate==='evidence_first'?(ui.lang==='ar'?'الدليل أولًا':'Evidence first'):(ui.lang==='ar'?'تعليم خيالي':'Fictional rehearsal')}</small></div>
      ${!isDone?`${view.choices.length?`<p class="sf-reaction" role="status">${reactions[view.choices.at(-1)][ui.lang]}</p>`:''}
        <div class="sf-turn-heading"><span>${t.progress} ${view.turn} / 3</span><div aria-hidden="true">${[1,2,3].map((n)=>`<i class="${n<=view.choices.length?'active':''}"></i>`).join('')}</div></div>
        <div class="sf-speaker" aria-hidden="true">${escapeText(turn.speaker)}</div><h2 class="sf-question">${turn[ui.lang]}</h2>
        <div class="sf-action-cards">${Object.values(CANAL_ACTIONS).map(action=>`<button type="button" class="sf-action" data-choice="${action.id}"><strong>${action[ui.lang]}</strong><small>${action[ui.lang==='ar'?'detailAr':'detailEn']}</small></button>`).join('')}</div>`
      :`<section class="sf-result" role="status" aria-live="polite"><span class="sf-kicker">SIMULATED / ${view.choices.length} TURNS</span><h2 tabindex="-1">${t.result5}</h2><p>${t[outcome]}</p>
         <p>${t.continue6}</p><button class="sf-primary" type="button" data-action="replay">${t.again}</button></section>`}
      <ol class="sf-recorded" aria-label="${t.past||t.progress}">${view.choices.map((id,i)=>`<li><span>${i+1}</span>${CANAL_ACTIONS[id][ui.lang]}</li>`).join('')}</ol>
    </main>${renderScores(t,view)}</div>`;
    ui.root.innerHTML=shell(t,ui.lang,5,body);
    ui.root.querySelector('[data-action="close"]').addEventListener('click',ui.close);
    ui.root.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
      mission.choose(button.dataset.choice);paint();onStateChange?.(mission);
    }));
    ui.root.querySelector('[data-action="replay"]')?.addEventListener('click',()=>{
      mission.replay();paint();onStateChange?.(mission);ui.root.querySelector('[data-choice]')?.focus();
    });
    if(isDone&&!ui.root.hidden)ui.root.querySelector('.sf-result h2')?.focus({preventScroll:true});
  }
  ui.setPainter(paint);
  return {mission,...ui,open:ui.open,close:ui.close,setLanguage:ui.setLanguage,destroy:ui.destroy};
}

export function attachChapter6Game({host=document.body,chapter5,language='en',onStateChange}={}) {
  if(!host)throw new TypeError('Chapter 6 requires a DOM host');
  const mission=new Chapter6FutureMission(chapter5);
  const ui=makeChapterModal({host,id:'chapter6-open-future',titleId:'sf-chapter6-title',language});
  function paint(){
    const t=words[ui.lang],done=mission.phase==='result';
    ui.root.lang=ui.lang;ui.root.dir=ui.lang==='ar'?'rtl':'ltr';ui.root.dataset.phase=mission.phase;
    const body=`<div class="sf-layout"><main class="sf-gameplay">
      <h2 class="sf-section-title">${t.past}</h2><ol class="sf-recorded">${mission.prior.choices.map((id,i)=>`<li><span>${i+1}</span>${CANAL_ACTIONS[id][ui.lang]}</li>`).join('')}</ol>
      <h2 class="sf-section-title">${t.chooseFuture}</h2>
      ${!done?`<div class="sf-action-cards">${Object.values(FUTURE_CHOICES).map(choice=>`<button class="sf-action" type="button" data-choice="${choice.id}"><strong>${choice[ui.lang]}</strong></button>`).join('')}</div>`
      :`<section class="sf-result" role="status" aria-live="polite"><span class="sf-kicker">SIMULATED · THE END</span><h2 tabindex="-1">${t.result6}</h2><p>${t[mission.result.ending]}</p>
       <div class="sf-final-actions"><button type="button" class="sf-primary" data-action="download">${t.download}</button>
       <button type="button" class="sf-secondary" data-action="replay">${t.replay6}</button></div>
       <p>${t.privacy}</p><p class="sf-error" role="alert" hidden>${t.error}</p></section>`}
    </main>${renderScores(t,{scores:mission.prior.scores})}</div>`;
    ui.root.innerHTML=shell(t,ui.lang,6,body);
    ui.root.querySelector('[data-action="close"]').addEventListener('click',ui.close);
    ui.root.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
      mission.choose(button.dataset.choice);paint();onStateChange?.(mission);
    }));
    ui.root.querySelector('[data-action="replay"]')?.addEventListener('click',()=>{
      mission.replay();paint();onStateChange?.(mission);ui.root.querySelector('[data-choice]')?.focus();
    });
    ui.root.querySelector('[data-action="download"]')?.addEventListener('click',()=>{
      let url;
      try{
        url=URL.createObjectURL(new Blob([JSON.stringify(createChapter6StoryExport(mission),null,2)],{type:'application/json;charset=utf-8'}));
        const anchor=document.createElement('a');anchor.href=url;anchor.download='soil-iq-fictional-six-chapter-story.json';
        document.body.appendChild(anchor);anchor.click();anchor.remove();
      }catch(_){const error=ui.root.querySelector('.sf-error');if(error)error.hidden=false;}
      finally{if(url)setTimeout(()=>URL.revokeObjectURL(url),2000);}
    });
    if(done&&!ui.root.hidden)ui.root.querySelector('.sf-result h2')?.focus({preventScroll:true});
  }
  ui.setPainter(paint);
  return {mission,...ui,open:ui.open,close:ui.close,setLanguage:ui.setLanguage,destroy:ui.destroy};
}
