import test from "node:test";
import assert from "node:assert/strict";
import {
 REALTIME_LIMITS,realtimeEnabled,validateRealtimeRequest,makeRealtimeSession,
 createRealtimeCall,RealtimeCallRegistry,realtimeAllowed
} from "../src/realtime-voice.mjs";
const env={
 AGSA_AI_ENABLED:"1",AGSA_AI_REALTIME_ENABLED:"1",AGSA_AI_REALTIME_STAGING_APPROVED:"1",
 OPENAI_API_KEY:"TEST_KEY_DO_NOT_USE_IN_REAL_APP_2026",
 AGSA_AI_REALTIME_ALLOWED_USER_IDS:"22222222-2222-4222-a222-222222222222"
};
const actor={organizationId:"11111111-1111-4111-a111-111111111111",userId:"22222222-2222-4222-a222-222222222222"};
const other={organizationId:"33333333-3333-4333-a333-333333333333",userId:"44444444-4444-4444-a444-444444444444"};
const sdp="v=0\r\no=- 1234567 2 IN IP4 127.0.0.1\r\ns=AGSA\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=sendrecv\r\na=rtpmap:111 opus/48000/2\r\n";
const resSdp=sdp+"a=fingerprint:sha-256 "+"a".repeat(60)+"\r\n";
test("live voice disabled by default; separate operator and provider gates required",()=>{
 assert.equal(realtimeEnabled({}),false);
 assert.equal(realtimeEnabled({...env,AGSA_AI_REALTIME_ENABLED:"0"}),false);
 assert.equal(realtimeEnabled({...env,AGSA_AI_REALTIME_STAGING_APPROVED:"0"}),false);
 assert.equal(realtimeEnabled({...env,OPENAI_API_KEY:""}),false);
 assert.equal(realtimeEnabled(env),true);
 assert.equal(realtimeEnabled({...env,AGSA_AI_REALTIME_ALLOWED_USER_IDS:""}),false);
 assert.equal(realtimeEnabled({...env,AGSA_AI_REALTIME_ALLOWED_USER_IDS:"invalid"}),false);
 assert.equal(realtimeEnabled({...env,AGSA_AI_REALTIME_ALLOWED_USER_IDS:env.AGSA_AI_REALTIME_ALLOWED_USER_IDS+","+env.AGSA_AI_REALTIME_ALLOWED_USER_IDS}),false);
 assert.equal(realtimeAllowed({...actor,role:"student"},env),true);
 assert.equal(realtimeAllowed({...actor,role:"instructor"},env),true);
 assert.equal(realtimeAllowed({...actor,role:"anonymous"},env),false);
 assert.equal(realtimeAllowed({...other,role:"student"},env),false);
 assert.equal(realtimeAllowed({...actor,role:"student"},{...env,AGSA_AI_REALTIME_ALLOWED_USER_IDS:""}),false);
 assert.deepEqual(REALTIME_LIMITS,{dailyCalls:2,maxSeconds:120});
});
test("validate consent and bounded audio-only SDP; reject browser session/model overrides",()=>{
 const parsed=validateRealtimeRequest({sdp,consent:true,voice:"cedar",topic:"instruments",style:"scouts"});
 assert.equal(parsed.voice,"cedar");
 assert.equal(parsed.style,"scouts");
 assert.throws(()=>validateRealtimeRequest({sdp,consent:false}),/consent/);
 assert.throws(()=>validateRealtimeRequest({sdp,consent:true,voice:"anyone"}),/supported/);
 assert.throws(()=>validateRealtimeRequest({sdp,consent:true,topic:"unknown"}),/supported/);
 assert.throws(()=>validateRealtimeRequest({sdp,consent:true,model:"injected"}),/Unrecognised/);
 assert.throws(()=>validateRealtimeRequest({sdp:"v=0",consent:true}),/SDP/);
 assert.throws(()=>validateRealtimeRequest({sdp:sdp+"x".repeat(16000),consent:true}),/SDP/);
 assert.throws(()=>validateRealtimeRequest({sdp:sdp+"\u0000",consent:true}),/SDP/);
 const cfg=makeRealtimeSession(parsed);
 assert.equal(cfg.model,"gpt-realtime-2.1-mini");
 assert.deepEqual(cfg.output_modalities,["audio"]);
 assert.equal(cfg.audio.output.voice,"cedar");
 assert.equal(cfg.audio.input.turn_detection.type,"server_vad");
 assert.equal(cfg.max_output_tokens,360);
 assert.deepEqual(cfg.tools,[]);
 assert.match(cfg.instructions,/NON-ACCREDITED/);
 assert.match(cfg.instructions,/Air Scouts/);
});
test("unified provider SDP exchange keeps API credentials and controls on backend",async()=>{
 const calls=[];
 const answer=await createRealtimeCall({sdp,consent:true,voice:"coral",topic:"forces",style:"mentor"},actor,{
  env,request:async(url,opts)=>{
   calls.push({url,opts});
   return new Response(resSdp,{status:201,headers:{
    Location:"https://api.openai.com/v1/realtime/calls/rtc_testcall_001abcdef"
   }});
  }
 });
 assert.equal(answer.callId,"rtc_testcall_001abcdef");
 assert.equal(answer.sdp,resSdp);
 assert.equal(answer.maxSeconds,120);
 assert.equal(calls.length,1);
 assert.equal(calls[0].url,"https://api.openai.com/v1/realtime/calls");
 assert.equal(calls[0].opts.headers.Authorization,"Bearer "+env.OPENAI_API_KEY);
 assert.match(calls[0].opts.headers["OpenAI-Safety-Identifier"],/^[a-f0-9]{64}$/);
 const sdps=calls[0].opts.body;
 assert.equal(sdps.get("sdp"),sdp);
 const config=JSON.parse(sdps.get("session"));
 assert.equal(config.model,"gpt-realtime-2.1-mini");
 assert.equal(config.audio.output.voice,"coral");
 assert.equal(JSON.stringify(config).includes(env.OPENAI_API_KEY),false);
 assert.equal(JSON.stringify(answer).includes(env.OPENAI_API_KEY),false);
});
test("unapproved account must not reach the voice provider",async()=>{
 let calls=0;
 await assert.rejects(createRealtimeCall({sdp,consent:true},other,{env,request:async()=>{calls++;throw Error("not expected")}}),
  e=>e.status===403&&e.code==="realtime_not_approved");
 assert.equal(calls,0);
});
test("realtime provider and malformed SDP failures never reveal upstream secrets",async()=>{
 await assert.rejects(createRealtimeCall({sdp,consent:true},actor,{env:{},request:async()=>{throw Error("should not call")}}),e=>e.status===503);
 await assert.rejects(createRealtimeCall({sdp,consent:true},actor,{env,request:async()=>{throw Error(env.OPENAI_API_KEY)}}),
  e=>e.status===502&&!e.message.includes(env.OPENAI_API_KEY));
 await assert.rejects(createRealtimeCall({sdp,consent:true},actor,{env,
  request:async()=>new Response("provider secret", {status:403})}),e=>e.status===502);
 const providerUrls=[];
 await assert.rejects(createRealtimeCall({sdp,consent:true},actor,{env,
  request:async(url)=>{
   providerUrls.push(url);
   if(url.endsWith("/hangup"))return new Response("",{status:200});
   return new Response("bad answer",{status:201,headers:{location:"/v1/realtime/calls/rtc_malformed_001"}});
  }
 }),e=>e.status===502);
 assert.ok(providerUrls.some(x=>x.endsWith("/hangup")),"invalid provider answer triggers server hangup");
});
test("one in-progress call per user; only owner may stop; end sends server-side hangup",async()=>{
 let ended=[];
 const registry=new RealtimeCallRegistry({
  env,request:async(url,opts)=>{ended.push(url);assert.equal(opts.method,"POST");return new Response("",{status:200})},
  maxSeconds:2
 });
 const handle=registry.reserve(actor);
 assert.match(handle,/^[A-Za-z0-9_-]{32}$/);
 assert.throws(()=>registry.reserve(actor),e=>e.status===409);
 await registry.activate(handle,"rtc_valid_001abc");
 await assert.rejects(registry.stop(handle,other),e=>e.status===403);
 assert.equal(await registry.stop(handle,actor),true);
 assert.equal(ended.length,1);
 assert.ok(ended[0].endsWith("/rtc_valid_001abc/hangup"));
 assert.equal(await registry.stop(handle,actor),false);
 const again=registry.reserve(actor);
 await registry.shutdown();
 assert.equal(registry.active.size,0);
 assert.notEqual(handle,again);
});
test("late provider handshake is terminated if account reservation closed",async()=>{
 const calls=[];
 const registry=new RealtimeCallRegistry({
  env,request:async url=>{calls.push(url);return new Response("",{status:200})}
 });
 const handle=registry.reserve(actor);
 await registry.stop(handle,actor);
 await assert.rejects(registry.activate(handle,"rtc_orphaned_001abc"),/Untracked/);
 assert.equal(calls.length,1,"late call must be hung up");
 assert.ok(calls[0].endsWith("/rtc_orphaned_001abc/hangup"));
 await registry.shutdown();
});
test("orphaned calls are force-ended by server timer",async()=>{
 const requests=[];
 const registry=new RealtimeCallRegistry({
  env,request:async url=>{requests.push(url);return new Response("",{status:200})},
  maxSeconds:0.06
 });
 const handle=registry.reserve(actor);
 await registry.activate(handle,"rtc_timer_001abc");
 await new Promise(resolve=>setTimeout(resolve,140));
 assert.equal(registry.active.size,0);
 assert.equal(requests.length,1);
 assert.ok(requests[0].endsWith("/rtc_timer_001abc/hangup"));
 await registry.shutdown();
});
