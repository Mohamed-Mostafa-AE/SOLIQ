import { getOutlook } from '../lib/outlook-service.js';
const models={kimi:'moonshotai/kimi-k3.1-pro',deepseek:'deepseek/deepseek-v4.1-flash'};
const memo=new Map(),requests=new Map();
export function explanationEvidence(data) {
  return {evidenceId:data.evidenceId,coverage:data.coverage,location:{lat:data.config.lat,lon:data.config.lon},assumptions:{capacityMm:data.config.capacity,initialMm:data.config.initial,irrigationBudgetMm:data.config.irrigation},observed:data.observed,projection:{method:data.projection.method,years:data.projection.analogueYears,rangeMeaning:data.projection.rangeMeaning,results:data.projection.results.map(({daily,...r})=>r)},hindcast:data.hindcast,limitations:data.limitations};
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method!=='POST') return res.status(405).json({error:'Use POST'});
  const origin=req.headers.origin;
  if(origin) {try {if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Same-origin requests required'});}catch{return res.status(400).json({error:'Invalid origin'});}}
  if (!req.body||JSON.stringify(req.body).length>4000) return res.status(400).json({error:'Invalid request size'});
  const model=models[req.body.model];
  if (!model) return res.status(400).json({error:'Select Kimi or DeepSeek'});
  const language=req.body.language==='ar'?'Arabic':'English';
  const credential=process.env.AI_GATEWAY_API_KEY||req.headers['x-vercel-oidc-token']||process.env.VERCEL_OIDC_TOKEN;
  if (!credential) return res.status(503).json({error:'AI access is not configured. Numerical scenarios are available without AI.',code:'ai_not_configured'});
  const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0],now=Date.now();
  const recent=(requests.get(ip)||[]).filter(t=>now-t<60000);
  if(recent.length>=3)return res.status(429).json({error:'Please wait one minute before requesting another explanation.'});
  requests.set(ip,[...recent,now]);if(requests.size>2000)requests.clear();
  try {
    const data=await getOutlook(req.body),key=data.evidenceId+model+language;
    const cached=memo.get(key);
    if(cached&&now-cached.created<3600000)return res.status(200).json(cached.value);
    const response=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(45000),headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},body:JSON.stringify({model,max_tokens:2000,messages:[{role:'system',content:`You explain a crop-rotation research demonstrator in ${language}. Use only the supplied evidence. Write no more than 220 words in four short paragraphs: observed conditions; conditional rotation trade-offs; uncertainty and hindcast performance; local checks needed. Call scenario ranges historical scenarios, never calibrated confidence or forecast probabilities. Do not predict yield, profit, pests, nitrogen, or soil carbon. Do not invent facts, references, crop suitability or numerical values. Do not claim NASA endorsement. Do not rank crops as best when suitability is unknown. If the analogue MAE exceeds the climatology baseline, state this weakness. All quantitative evidence comes from a deterministic water model, not from you. Avoid instructions about irrigation application rates.`},{role:'user',content:JSON.stringify(explanationEvidence(data))}]})});
    if(!response.ok) {const code=response.status;return res.status(code===429?429:503).json({error:code===402||code===403?'AI Gateway needs account activation or credits. The numerical outlook remains available.':'The AI provider is unavailable. Try the other model; numerical results are unchanged.',code:'provider_'+code});}
    const result=await response.json(),text=result.choices?.[0]?.message?.content;
    if(typeof text!=='string'||!text.trim())throw Error('The provider returned no explanation');
    const value={text,model:result.model||model,requestedModel:model,evidenceId:data.evidenceId,generatedAt:new Date().toISOString(),scope:'AI explanation of conditional numerical scenarios; not an independent crop prediction',usage:result.usage};
    if(memo.size>100)memo.clear();memo.set(key,{value,created:now});
    return res.status(200).json(value);
  } catch(error) {return res.status(/Invalid/.test(error.message)?400:502).json({error:error.message});}
}
