import {test} from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
const origin="http://127.0.0.1:8893";
test("closed private portal exposes only liveness; no static portal or records API",async t=>{
 const child=spawn(process.execPath,[new URL("../server.mjs",import.meta.url).pathname],{
  cwd:new URL("..",import.meta.url).pathname,
  env:{...process.env,NODE_ENV:"test",ACADEMY_ACCESS_STATE:"closed",
   ACADEMY_ORIGIN:origin,HOST:"127.0.0.1",PORT:"8893",
   DATABASE_URL:"postgresql://unused:unused@127.0.0.1:54329/unreachable"},
  stdio:["ignore","pipe","pipe"]
 });
 let stderr="";child.stderr.on("data",b=>{stderr+=b.toString().slice(0,500)});
 t.after(()=>{if(child.exitCode===null)child.kill("SIGTERM")});
 let live=false;
 for(let i=0;i<100;i++){
  if(child.exitCode!==null)break;
  try{const response=await fetch(origin+"/api/health");if(response.status===200){live=true;break}}catch{}
  await new Promise(resolve=>setTimeout(resolve,60));
 }
 assert.ok(live,"closed server should start without querying DB: "+stderr);
 const health=await fetch(origin+"/api/health");
 assert.equal(health.status,200);
 assert.equal((await health.json()).status,"ok");
 const ready=await fetch(origin+"/api/ready");
 assert.equal(ready.status,503);
 assert.deepEqual(await ready.json(),{ready:false,reason:"PRIVATE_PORTAL_CLOSED"});
 for(const path of ["/","/portal.js","/api/me","/api/public/approval","/api/admin/fees"]){
  const response=await fetch(origin+path);
  assert.equal(response.status,503,"Closed mode must protect "+path);
  assert.match((await response.json()).error,/closed pending security review/);
 }
 const login=await fetch(origin+"/api/login",{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},
  body:JSON.stringify({email:"test@academy.invalid",password:"UnknownPassphrase2026!"})});
 assert.equal(login.status,503,"Closed mode must disable login even with an otherwise valid request");
 assert.equal(login.headers.get("cache-control"),"no-store");
});
