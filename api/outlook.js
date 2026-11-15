import { getOutlook } from '../lib/outlook-service.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Use GET or POST'});
  const input=req.method==='POST'?req.body:req.query;
  if(!input||typeof input!=='object'||JSON.stringify(input).length>16000)return res.status(400).json({error:'Invalid outlook request'});
  try {
    const data=await getOutlook(input);
    return res.status(200).json(data);
  } catch(error) {return res.status(/Invalid|must|required|capacity|Provide|calendars/.test(error.message)?400:502).json({error:error.message,replacedWithDemo:false});}
}
