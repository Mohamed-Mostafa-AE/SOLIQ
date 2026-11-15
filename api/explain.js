import { adviserPrompt } from '../lib/adviser-prompt.js';
import { evidenceReport } from '../lib/evidence-report.js';
import { getOutlook } from '../lib/outlook-service.js';
const models={kimi:'moonshotai/kimi-k3.1-pro',deepseek:'deepseek/deepseek-v4.1-flash'};
export function explanationEvidence(data) {
 return {evidenceId:data.evidenceId,coverage:data.coverage,assumptions:{capacityMm:data.config.capacity,initialMm:data.config.initial,irrigationBudgetMm:data.config.irrigation},observed:data.observed,decisionCards:data.decisionCards,conditionalComparison:data.conditionalComparison,projection:{method:data.projection.method,years:data.projection.analogueYears,results:data.projection.results.map(({daily,...r})=>r)},hindcast:data.hindcast,limitations:data.limitations};
}
export function createExplanationHandler({outlook=getOutlook,providerFetch=fetch,credential=()=>process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN}={}) {
 const requests=new Map();let providerBlockedUntil=0;
 return async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Use POST'});
  const origin=req.headers?.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Same-origin requests required'});}catch{return res.status(400).json({error:'Invalid origin'});}}
  if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||JSON.stringify(req.body).length>16000)return res.status(400).json({error:'Invalid request size'});
  const choice=req.body.model||'evidence';
  if(choice!=='evidence'&&!models[choice])return res.status(400).json({error:'Select evidence, Kimi or DeepSeek'});
  const language=req.body.language==='ar'?'Arabic':'English';
  let data;
  try{data=await outlook(req.body);}catch(error){return res.status(/Invalid|must|required|capacity|Provide|calendars/.test(error.message)?400:502).json({error:'Evidence could not be loaded: '+error.message,replacedWithDemo:false});}
  const fallback=reason=>res.status(200).json(evidenceReport(data,language,reason));
  if(choice==='evidence')return fallback('requested');
  const key=credential();if(!key)return fallback('not_configured');
  const now=Date.now();if(now<providerBlockedUntil)return fallback('provider_temporarily_unavailable');
  const ip=String(req.headers?.['x-forwarded-for']||'unknown').split(',')[0];
  const recent=(requests.get(ip)||[]).filter(t=>now-t<60000);
  if(recent.length>=3)return fallback('provider_rate_limited');
  requests.set(ip,[...recent,now]);if(requests.size>2000)requests.clear();
  try{
   const response=await providerFetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:models[choice],max_tokens:1400,messages:[{role:'system',content:adviserPrompt(language)},{role:'user',content:JSON.stringify(explanationEvidence(data))}]})});
   if(!response.ok){if([401,402,403].includes(response.status))providerBlockedUntil=now+300000;return fallback('provider_'+response.status);}
   const result=await response.json(),text=result.choices?.[0]?.message?.content;
   if(typeof text!=='string'||!text.trim()||result.choices[0].finish_reason==='length')return fallback('provider_incomplete');
   return res.status(200).json({text,mode:'language_model',model:result.model||models[choice],requestedModel:models[choice],evidenceId:data.evidenceId,generatedAt:new Date().toISOString(),scope:'AI interpretation; verify against the evidence. Crop outcomes need local validation.'});
  }catch{return fallback('provider_unavailable');}
 };
}
export default createExplanationHandler();
