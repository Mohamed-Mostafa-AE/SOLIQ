// Consolidate related evidence endpoints into one Vercel Function without
// changing the external API contract. Validate the rewrite target before
// handing the request to the existing authenticated evidence router.
const knownRoute=/^\/api\/(?:sessions|farms|evidence\/jobs(?:\/[^/?]+)?|runs(?:\/[^/?]+(?:\/replay)?)?|receipts\/[^/?]+)$/;

export function normalizeEvidenceRequestUrl(requestUrl){
 let url;
 try{url=new URL(requestUrl,'http://localhost');}catch{return null;}
 let pathname=url.pathname;
 if(pathname==='/api/evidence'){
  pathname=url.searchParams.get('__evidenceRoute')??'';
  url.searchParams.delete('__evidenceRoute');
 }
 if(!knownRoute.test(pathname))return null;
 return pathname+url.search;
}
