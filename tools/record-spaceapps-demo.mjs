/**
 * Capture a REAL browser recording of the already-public SOLIQ game.
 * The production URL, gameplay, actions, and evidence-status states are genuine.
 * Text captions describe mechanics; no synthetic NASA readings or invented achievements.
 * Output: silent 29-second MP4 for NASA Space Apps Global Demo.
 */
import {chromium} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
const site=process.env.DEMO_BASE_URL||'https://soliq-delta.vercel.app';
const dir=path.resolve('demo'),videoDir=path.join(dir,'_raw');
await fs.mkdir(videoDir,{recursive:true});
let browser,context,page;
const log=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function step(name){log.push({name,at:new Date().toISOString()});console.log('[spaceapps]',name);}
async function caption(line,sub){
 await page.evaluate(({line,sub})=>{
   let box=document.getElementById('spaceapps-capture-caption');
   if(!box){
    box=document.createElement('div');
    box.id='spaceapps-capture-caption';
    box.style.cssText=[
      'position:fixed','left:48px','bottom:42px','z-index:999999','pointer-events:none',
      'width:830px','max-width:calc(100vw - 110px)',
      'background:linear-gradient(115deg,rgba(7,34,28,.94),rgba(12,45,40,.71))',
      'color:white','border-left:5px solid #9bd1a0','border-radius:8px',
      'box-shadow:0 10px 40px rgba(0,0,0,.38)','padding:14px 22px',
      'font-family:Arial, sans-serif','text-align:left','direction:ltr'
    ].join(';');
    document.body.append(box);
   }
   box.replaceChildren();
   const main=document.createElement('div');
   main.style.cssText='font-size:25px;font-weight:800;line-height:1.1;letter-spacing:.2px';
   main.textContent=line;
   const secondary=document.createElement('div');
   secondary.style.cssText='font-size:15px;opacity:.91;margin-top:7px;line-height:1.3';
   secondary.textContent=sub;
   box.append(main,secondary);
 },{line,sub});
}
try{
  step('Launch Chromium real-screen capture');
  browser=await chromium.launch({headless:true,args:[
   '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
   '--ignore-gpu-blocklist','--disable-dev-shm-usage','--disable-features=UseSkiaRenderer'
  ]});
  context=await browser.newContext({
   viewport:{width:1280,height:720},
   deviceScaleFactor:1,recordVideo:{dir:videoDir,size:{width:1280,height:720}},
   locale:'en-US',reducedMotion:'reduce',
  });
  page=await context.newPage();
  const recordingStart=Date.now();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message).slice(0,200)));
  step('Open the actual publicly deployed game '+site);
  const response=await page.goto(site+'/experience/play/',{waitUntil:'domcontentloaded',timeout:45000});
  if(response?.status()!==200)throw Error('Public game returned '+response?.status());
  await page.waitForFunction(()=>Boolean(window.__seventhFieldGame?.isInitialized),null,{timeout:35000});
  await page.evaluate(()=>window.__seventhFieldGame.start());
  await page.waitForTimeout(800);
  const trimStart=(Date.now()-recordingStart)/1000;
  step('Start useful gameplay footage '+trimStart.toFixed(2)+'s into raw recording');
  // 0-3s: wide shot; title reflects the software actually running.
  await caption('SOLIQ — THE SEVENTH FIELD','A playable 3D Nile Delta farming prototype');
  await delay(3200);
  // 3-10s: real keyboard movement, no animation fake.
  await caption('WALK THE FIELDS','Meet farmers and inspect a shared canal system');
  await page.keyboard.down('KeyW');await delay(3600);await page.keyboard.up('KeyW');
  await page.keyboard.press('Tab');await delay(2000);
  // 9-14s: real mission UI with original farmers dialogue.
  await caption('HUMAN DECISIONS','A real interactive story — fictional village scenario');
  await page.evaluate(()=>{
    const g=window.__seventhFieldGame;
    g.hud.showDialogue(g.mission.getDialogueForTarget({id:'hassan'}));
  });
  await delay(3900);
  // 14-19s: actual water-engine outcome, not a rendered number.
  await page.evaluate(()=>{
    const g=window.__seventhFieldGame;
    document.querySelectorAll('.dialogue-modal').forEach(n=>n.setAttribute('hidden',''));
    g.mission.executeOutcome('equilibrium');
  });
  await caption('SIX FARMS · ONE WATER WINDOW','Run the actual time-sliced mesqa simulation');
  await delay(1000);
  await page.locator('#btn-notebook').click();
  await page.locator('[data-nbtab="water"]').click();
  await delay(3600);
  // 19-24s: show both choices, source provenance and limitations.
  await page.locator('#btn-close-notebook').click();
  await caption('REAL DATA, CLEAR LIMITS','NASA context is separated from modeled scenarios');
  await page.locator('#btn-earth-lens').click();
  await page.locator('[data-lens="nasa"]').click();
  await delay(3600);
  // 24-28.7s: future is explicitly modeled, not observed.
  await page.locator('[data-lens="future"]').click();
  await caption('EVIDENCE BEFORE RECOMMENDATIONS','Time Echo: compare options without inventing certainty');
  await delay(4600);
  await page.screenshot({path:path.join(dir,'thumbnail.png')});
  const contentDuration=(Date.now()-recordingStart)/1000-trimStart;
  log.push({name:'capture',site,trimStart,contentDuration,pageErrors});
  step('Capture completed: '+contentDuration.toFixed(1)+'s content');
  await context.close();
  await browser.close();
  const filenames=(await fs.readdir(videoDir)).filter(x=>x.endsWith('.webm'));
  if(!filenames.length)throw Error('Playwright did not create the video');
  const raw=path.join(videoDir,filenames[0]),mp4=path.join(dir,'global-30s.mp4');
  // 29 seconds of ACTUAL browser footage, with no sped-up generated scene.
  const ff=spawnSync('ffmpeg',[
   '-hide_banner','-loglevel','error','-y',
   '-ss',String(trimStart.toFixed(3)),'-i',raw,
   '-t','29.0','-vf','fps=24,scale=1280:720:flags=lanczos',
   '-c:v','libx264','-preset','veryfast','-crf','23',
   '-pix_fmt','yuv420p','-an','-movflags','+faststart',mp4
  ],{encoding:'utf8',timeout:180000});
  if(ff.status!==0)throw Error('ffmpeg failed: '+ff.stderr);
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',mp4],{encoding:'utf8'});
  const seconds=Number(probe.stdout?.trim());
  if(!(seconds>=25&&seconds<=30))throw Error('Video duration not within 25-30s: '+seconds);
  const metadata={site,recordedAt:new Date().toISOString(),durationSeconds:seconds,realBrowserFootage:true,fictionalScenario:true,
   NASAObservedPixelsClaimed:false,description:'Real footage captured from the public SOLIQ game using scripted mouse/keyboard and genuine game engine methods',
   chapters:['village walk','farmer dialogue','calculated water ledger','NASA evidence boundary','modeled future']};
  await fs.writeFile(path.join(dir,'recording-log.json'),JSON.stringify({...metadata,log},null,2));
  step('OUTPUT '+mp4+' '+seconds.toFixed(1)+' seconds');
}catch(error){
  console.error('DEMO_RECORD_FAILED:',error?.stack||error);
  await fs.writeFile(path.join(dir,'recording-failure.txt'),String(error?.stack||error));
  try{if(page)await page.screenshot({path:path.join(dir,'failure.png')});}catch{}
  try{if(context)await context.close();}catch{}
  try{if(browser)await browser.close();}catch{}
  process.exitCode=1;
}
