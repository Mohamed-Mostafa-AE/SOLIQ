import { getOutlook } from '../lib/outlook-service.js';
export default async function handler(req,res) {
  if (req.method!=='GET') return res.status(405).json({error:'Use GET'});
  try {
    const data=await getOutlook(req.query);
    res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch(error) {return res.status(/Invalid/.test(error.message)?400:502).json({error:error.message,replacedWithDemo:false});}
}
