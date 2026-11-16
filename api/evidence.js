import {backendHandler} from '../lib/session-runtime.js';
import {normalizeEvidenceRequestUrl} from '../lib/evidence-rewrite.js';

export default function evidenceGateway(req,res){
 const url=normalizeEvidenceRequestUrl(req.url);
 if(!url){
  res.statusCode=404;
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({error:{code:'not_found',message:'Unknown API route'}}));
  return;
 }
 req.url=url;
 return backendHandler(req,res);
}
