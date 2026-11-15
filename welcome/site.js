document.querySelectorAll('[data-game]').forEach(button=>button.addEventListener('click',()=>{
 const correct=button.dataset.correct==='true';
 document.getElementById(button.dataset.game+'-result').textContent=correct?(button.dataset.game==='water'?'Correct. 120 + 80 − 150 − 20 = +30 mm. Storage can carry into the next crop.':'Correct. Water demand alone cannot establish local feasibility.'):'Try again. Account for all water flows, or identify the missing local evidence.';
}));
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('reveal-arrive');observer.unobserve(entry.target);}}),{threshold:.12});
 document.querySelectorAll('.hub-grid>a,.steps article,.games article').forEach(element=>observer.observe(element));
}
document.getElementById('language').addEventListener('click',()=>{
 const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';
 document.getElementById('language').textContent=ar?'English':'العربية';
 document.querySelector('h1').innerHTML=ar?'حقل واحد.<br>مستقبل متعدد.':'One field.<br>Many futures.';
 document.getElementById('intro').textContent=ar?'استكشف ما تزرعه تالياً وفق مياهك وتربتك وأولوياتك. الواجهة العربية الكاملة متاحة داخل التطبيق.':'Explore what to grow next—with your water, your soil, and your priorities in view.';
});
