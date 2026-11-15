import {createHmac,timingSafeEqual} from 'node:crypto';
import {ApiError,check,objectId} from './evidence-store.js';
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createSessionAuth({store,secret,origin,secure=false}){
 check(typeof secret==='string'&&Buffer.byteLength(secret)>=32,'signing_secret_required',503);
 check(typeof origin==='string'&&new URL(origin).origin===origin,'invalid_origin',503);
 const sign=(scope,id)=>createHmac('sha256',secret).update(scope+':'+id).digest('base64url');
 const cookie=(value,maxAge)=>`soliq_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`;
 return {
  origin,
  verifyOrigin(req){check(req.headers.origin===origin,'origin_rejected',403);},
  async create(){const s=await store.createSession();return {body:{csrfToken:sign('csrf',s.id),expiresAt:new Date(s.expiresAt).toISOString()},cookie:cookie(s.id+'.'+sign('session',s.id),Math.floor((s.expiresAt-store.now())/1000))};},
  async authenticate(req,mutation=false){
   const cookies=(req.headers.cookie??'').split(';').map(c=>c.trim()).filter(c=>c.startsWith('soliq_session='));
   check(cookies.length===1,'session_required',401);
   const [id,sig,...rest]=cookies[0].slice(14).split('.');
   try{objectId(id);}catch{throw new ApiError(401,'session_required');}
   check(!rest.length&&equal(sig,sign('session',id)),'session_required',401);
   await store.session(id);
   if(mutation){this.verifyOrigin(req);check(equal(req.headers['x-csrf-token'],sign('csrf',id)),'csrf_rejected',403);}
   return id;
  },
  async describe(id){const s=await store.session(id);return {csrfToken:sign('csrf',id),expiresAt:new Date(s.expiresAt).toISOString()};},
  clearCookie(){return cookie('',0);}
 };
}
