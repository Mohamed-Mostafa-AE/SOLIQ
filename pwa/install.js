/** Optional public PWA shell; never requests location, mic or evidence access. */
const button=document.getElementById('install-soiliq');
const modal=document.getElementById('pwa-install-help');
const explanation=document.getElementById('pwa-install-explanation');
const close=document.getElementById('pwa-install-close');
let installPrompt=null;

function installed(){
 return window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
}

if(button&&modal&&explanation&&close){
 if(installed())button.hidden=true;
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  button.hidden=false;
  button.textContent='Install Soil-IQ';
 });
 window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  button.hidden=true;
  if(modal.open)modal.close();
 });
 close.addEventListener('click',()=>modal.close());
 button.addEventListener('click',async()=>{
  if(installPrompt){
   const prompt=installPrompt;
   installPrompt=null;
   await prompt.prompt();
   const result=await prompt.userChoice;
   if(result?.outcome==='accepted')button.hidden=true;
   return;
  }
  explanation.textContent=!('serviceWorker' in navigator)
   ? 'This browser does not support the Soil-IQ offline shell. You can still use the online website.'
   : /iphone|ipad|ipod/i.test(navigator.userAgent)
     ? 'On iPhone or iPad, use Share → Add to Home Screen if your browser offers it. Live NASA data still requires internet.'
     : 'Open the browser menu and choose Install app or Add to Home Screen if available. This may not be supported in your browser. Live NASA data always requires internet.';
  modal.showModal();
 });
}

if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{
   // Installation remains optional; never disturb the live scientific app.
  });
 });
}
