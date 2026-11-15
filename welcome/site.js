document.querySelectorAll('[data-game]').forEach(button=>button.addEventListener('click',()=>{
 const correct=button.dataset.correct==='true';
 document.getElementById(button.dataset.game+'-result').textContent=correct?(button.dataset.game==='water'?'Correct. 120 + 80 − 150 − 20 = +30 mm. Storage can carry into the next crop.':'Correct. Water demand alone cannot establish local feasibility.'):'Try again. Account for all water flows, or identify the missing local evidence.';
}));
document.getElementById('language').addEventListener('click',()=>{
 const ar=document.documentElement.lang!=='ar';document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';
 document.getElementById('language').textContent=ar?'English':'العربية';
 document.querySelector('h1').innerHTML=ar?'كل موسم<br>يشكّل ما يليه.':'Every season<br>shapes the next.';
 document.getElementById('intro').textContent=ar?'استكشف ما تزرعه تالياً وفق مياهك وتربتك وأولوياتك. الواجهة العربية الكاملة متاحة داخل التطبيق.':'Explore what to grow next—with your water, your soil, and your priorities in view.';
});
