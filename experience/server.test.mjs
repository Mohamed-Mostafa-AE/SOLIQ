import test from "node:test";
import assert from "node:assert/strict";
import {createLocalServer,resolvePublicPath} from "../dev-server.mjs";

test("Only approved public pages/assets are exposed",()=>{
 for(const path of ["/","/welcome/","/outlook/","/adviser/","/experience/","/experience/app.js"])assert.ok(resolvePublicPath(path),path);
 for(const path of ["/.gitignore","/package.json","/README.md","/dev-server.mjs","/lib/trend-service.js","/api/outlook.js","/data/team-review-summary.json","/experience/engine.test.mjs"])assert.equal(resolvePublicPath(path),null,path);
});
test("Local preview returns 404 for source files and 200 for new experience",async()=>{
 const server=createLocalServer();
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 const url="http://127.0.0.1:"+server.address().port;
 try{
  const page=await fetch(url+"/experience/");
  assert.equal(page.status,200);
  assert.match(await page.text(),/Trend Detective/);
  for(const path of ["/.gitignore","/dev-server.mjs","/lib/trend-service.js"])assert.equal((await fetch(url+path)).status,404,path);
  assert.equal((await fetch(url+"/api/trends?parameter=BAD")).status,400);
  assert.equal((await fetch(url+"/api/radar-scenes?dataset=BAD")).status,400);
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
