import {generateSecret,hashSha256,normalizeEmail,verifyPassword,consumePasswordCost,secureEquals} from "./crypto.mjs";
import {ClientError,validateAttempt,validateDraft,validateIdempotencyKey} from "./validation.mjs";
import {isPortalPath,servePortal} from "./portal.mjs";
import {verifyTokenFormat} from "./invites.mjs";
import {REALTIME_LIMITS,realtimeEnabled,realtimeAllowed,validateRealtimeRequest,createRealtimeCall,RealtimeCallRegistry} from "./realtime-voice.mjs";
import {validateTutorRequest,validateVoiceRequest,askTutor,synthesizeTutorSpeech,aiFlags,AI_LIMITS} from "./ai-tutor.mjs";
const MAX_JSON_BYTES=32*1024;
const SESSION_MS=6*60*60*1000;
function requestError(status,code,message){return new ClientError(status,code,message);}
function parseCookies(header){
 const cookies={};
 for(const piece of String(header||"").split(";")){
  const pos=piece.indexOf("=");
  if(pos<0)continue;
  const name=piece.slice(0,pos).trim(),value=piece.slice(pos+1).trim();
  if(!name||Object.hasOwn(cookies,name))return null;
  cookies[name]=value;
 }
 return cookies;
}
function json(res,status,payload,extra={}){
 const raw=JSON.stringify(payload);
 res.writeHead(status,{
  "Content-Type":"application/json; charset=utf-8",
  "Content-Length":Buffer.byteLength(raw),
  "Cache-Control":"no-store",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=()",
  ...extra
 });
 res.end(raw);
}
async function bodyJson(req){
 const contentType=String(req.headers["content-type"]||"").toLowerCase();
 if(!/^application\/json(?:\s*;|$)/.test(contentType))throw requestError(415,"json_required","Content-Type must be application/json");
 const declared=Number(req.headers["content-length"]||0);
 if(declared>MAX_JSON_BYTES)throw requestError(413,"too_large","JSON body exceeds 32 KB");
 let size=0;
 const parts=[];
 for await(const chunk of req){
  size+=chunk.length;
  if(size>MAX_JSON_BYTES)throw requestError(413,"too_large","JSON body exceeds 32 KB");
  parts.push(chunk);
 }
 if(!size)throw requestError(400,"empty_body","JSON body required");
 let value;
 try{value=JSON.parse(Buffer.concat(parts).toString("utf8"));}catch{throw requestError(400,"bad_json","Invalid JSON body");}
 if(!value||typeof value!=="object"||Array.isArray(value))throw requestError(400,"bad_json","Expected JSON object");
 return value;
}
function allowedOrigin(req,publicOrigin){
 const origin=req.headers.origin;
 if(origin&&origin!==publicOrigin)throw requestError(403,"origin_denied","Request origin not allowed");
 const site=req.headers["sec-fetch-site"];
 if(site&& !["same-origin","none"].includes(site))throw requestError(403,"origin_denied","Cross-site requests denied");
}
function cookie(name,value,secure,httpOnly,maxAge){
 return name+"="+value+"; Path=/; SameSite=Strict; Max-Age="+maxAge+
  (secure?"; Secure":"")+(httpOnly?"; HttpOnly":"");
}
function getLimit(search){
 const raw=search.searchParams.get("limit");
 if(raw===null)return 20;
 if(!/^\d{1,2}$/.test(raw))throw requestError(400,"invalid_limit","Limit must be 1–50");
 const n=Number(raw);
 if(n<1||n>50)throw requestError(400,"invalid_limit","Limit must be 1–50");
 return n;
}
export function createHandler(store,config={}){
 const localMode=config.allowInsecureLocal===true&&config.nodeEnv!=="production";
 const publicOrigin=config.publicOrigin;
 if(typeof publicOrigin!=="string"||! /^https:\/\//.test(publicOrigin)&&!localMode)
  throw Error("AGSA_PUBLIC_ORIGIN must be HTTPS except isolated local development");
 if(localMode&&! /^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(publicOrigin))
  throw Error("Insecure local development must use an explicit 127.0.0.1 origin");
 const name=localMode?"agsa_local_session":"__Host-AGSA";
 const csrfName=localMode?"agsa_local_csrf":"__Host-AGSA-CSRF";
 const secure=!localMode;
 const realtimeRegistry=config.realtimeRegistry||new RealtimeCallRegistry({
  env:config.aiEnv||{},request:config.aiRequest||fetch
 });
 async function authenticate(req){
  const cookies=parseCookies(req.headers.cookie);
  const token=cookies&&cookies[name];
  if(typeof token!=="string"||! /^[A-Za-z0-9_-]{43}$/.test(token))
   throw requestError(401,"unauthenticated","Sign in is required");
  const actor=await store.getSession(hashSha256(token));
  if(!actor)throw requestError(401,"session_expired","Session expired or was revoked");
  return {actor,tokenHash:hashSha256(token),cookies};
 }
 function requireCsrf(req,session){
  const header=req.headers["x-agsa-csrf"],cookieValue=session.cookies[csrfName];
  if(typeof header!=="string"||! /^[A-Za-z0-9_-]{43}$/.test(header)||
     !secureEquals(header,cookieValue)||hashSha256(header)!==session.actor.csrfHash)
   throw requestError(403,"csrf_denied","Valid CSRF header and cookie are required");
 }
 function requireRole(actor,role){
  if(actor.role!==role)throw requestError(403,"forbidden","This role is not permitted");
 }
 return async function handler(req,res){
  try{
   const url=new URL(req.url,publicOrigin);
   const pathname=url.pathname;
   const method=req.method;
   if(!["GET","POST"].includes(method))throw requestError(405,"method_not_allowed","Method not allowed");
   if(method==="POST")allowedOrigin(req,publicOrigin);
   if(method==="GET"&&isPortalPath(pathname)){
    await servePortal(pathname,res,{secure});return;
   }
   if(method==="GET"&&pathname==="/api/v1/health"){
    json(res,200,{status:"ok",component:"training-api",scope:"private-staging"});return;
   }
   if(method==="GET"&&pathname==="/api/v1/ready"){
    try{await store.ping();json(res,200,{status:"ready"});}
    catch{json(res,503,{status:"not_ready"});}
    return;
   }
   if(method==="POST"&&pathname==="/api/v1/auth/verify-email"){
    const raw=await bodyJson(req);
    const token=raw.token;
    if(!verifyTokenFormat(token))throw requestError(400,"invalid_verification","Invalid or expired verification invitation");
    const ip=String(req.socket.remoteAddress||"unknown");
    const allowed=await store.recordLoginAttempt([
     hashSha256("verify-email-ip:"+ip),
     hashSha256("verify-email-address-probe:"+ip)
    ]);
    if(!allowed)throw requestError(429,"rate_limited","Too many verification attempts");
    const verified=await store.consumeEmailVerification(hashSha256(token));
    if(!verified)throw requestError(400,"invalid_verification","Invalid or expired verification invitation");
    json(res,200,{status:"email_verified",notice:"Email ownership verified for a staging account. This does not verify identity, instructor qualifications or training accreditation."});
    return;
   }
   if(method==="POST"&&pathname==="/api/v1/auth/login"){
    const data=await bodyJson(req);
    let email;
    try{email=normalizeEmail(data.email);}catch{throw requestError(400,"invalid_request","Valid email required");}
    const password=data.password;
    const organization=typeof data.organization==="string"?data.organization:"";
    if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(organization)||
       typeof password!=="string"||password.length>128)
      throw requestError(400,"invalid_request","Organization and password required");
    const ip=String(req.socket.remoteAddress||"unknown");
    const allowed=await store.recordLoginAttempt([
      hashSha256("ip:"+ip),hashSha256("account:"+ip+":"+organization+":"+email)
    ]);
    if(!allowed)throw requestError(429,"rate_limited","Too many sign-in attempts");
    const candidate=await store.lookupLogin(email,organization);
    const valid=candidate?await verifyPassword(password,candidate.passwordHash):
      (await consumePasswordCost(password),false);
    if(!candidate||!valid)throw requestError(401,"invalid_credentials","Invalid credentials");
    if(candidate.role==="instructor"){
     // An enrolled TOTP is mandatory, including for older instructors.
     // No password-only fallback or insecure, browser-side verification.
     if(!Buffer.isBuffer(config.mfaKey)||config.mfaKey.length!==32)
      throw requestError(503,"mfa_unavailable","Instructor sign-in is temporarily unavailable");
     const code=data.verificationCode;
     if(typeof code!=="string"||! /^\d{6}$/.test(code))
      throw requestError(401,"invalid_credentials","Invalid credentials");
     const verified=await store.consumeInstructorOtp({
      userId:candidate.userId,organizationId:candidate.organizationId,
      code,encryptionKey:config.mfaKey
     });
     if(!verified)throw requestError(401,"invalid_credentials","Invalid credentials");
    }
    const token=generateSecret(),csrf=generateSecret();
    const expiresAt=new Date(Date.now()+SESSION_MS).toISOString();
    await store.createSession({
     tokenHash:hashSha256(token),csrfHash:hashSha256(csrf),
     userId:candidate.userId,organizationId:candidate.organizationId,expiresAt,
     mfaVerified:candidate.role==="instructor"
    });
    json(res,200,{
     status:"signed_in",
     user:{id:candidate.userId,email:candidate.email,role:candidate.role,organizationId:candidate.organizationId},
     expiresAt,
     notice:"No accredited assessment, official training or flight-hour credit is provided."
    },{"Set-Cookie":[cookie(name,token,secure,true,21600),cookie(csrfName,csrf,secure,false,21600)]});
    return;
   }
   const session=await authenticate(req),actor=session.actor;
   if(method==="GET"&&pathname==="/api/v1/ai/status"){
    json(res,200,{
     ...aiFlags(config.aiEnv||{}),
     realtimeEnabled:realtimeAllowed(actor,config.aiEnv||{}),
     realtimeMaxSeconds:REALTIME_LIMITS.maxSeconds,
     limits:{...AI_LIMITS,realtime:REALTIME_LIMITS.dailyCalls},
     availableTo:"operator-approved adult fictional staging pilot accounts only",
     voiceDisclosure:"Synthetic AI voice; not a human instructor.",
     note:"No accredited flight training or operational advice. No public AI service is active until privately configured."
    });return;
   }
   if(method==="POST"&&pathname==="/api/v1/ai/ask"){
    requireCsrf(req,session);
    const input=validateTutorRequest(await bodyJson(req));
    if(!aiFlags(config.aiEnv||{}).enabled)
     throw requestError(503,"ai_unavailable","The connected AI instructor is not enabled on this staging service");
    if(!await store.reserveAiUsage(actor,"text",AI_LIMITS.text))
     throw requestError(429,"ai_daily_limit","Daily AI study question limit reached");
    const output=await askTutor(input,{env:config.aiEnv,request:config.aiRequest||fetch});
    json(res,200,output);return;
   }
   if(method==="POST"&&pathname==="/api/v1/ai/voice"){
    requireCsrf(req,session);
    const input=validateVoiceRequest(await bodyJson(req));
    if(!aiFlags(config.aiEnv||{}).voiceEnabled)
     throw requestError(503,"voice_unavailable","Natural generated voice is not enabled; use device narration");
    if(!await store.reserveAiUsage(actor,"voice",AI_LIMITS.voice))
     throw requestError(429,"voice_daily_limit","Daily natural voice limit reached");
    const audio=await synthesizeTutorSpeech(input,{env:config.aiEnv,request:config.aiRequest||fetch});
    res.writeHead(200,{
     "Content-Type":"audio/mpeg",
     "Content-Length":audio.byteLength,
     "Cache-Control":"private, no-store",
     "Content-Security-Policy":"default-src 'none'",
     "X-Content-Type-Options":"nosniff",
     "X-Frame-Options":"DENY",
     "Referrer-Policy":"no-referrer"
    });
    res.end(audio);return;
   }
   if(method==="POST"&&pathname==="/api/v1/ai/realtime-connect"){
    requireCsrf(req,session);
    const input=validateRealtimeRequest(await bodyJson(req));
    if(!realtimeEnabled(config.aiEnv||{}))
     throw requestError(503,"realtime_unavailable","Two-way AI voice is not enabled for this private staging service");
    if(!realtimeAllowed(actor,config.aiEnv||{}))
     throw requestError(403,"realtime_not_approved","This account is not approved for the private adult-only voice pilot");
    const handle=realtimeRegistry.reserve(actor);
    try{
     if(!await store.reserveAiUsage(actor,"realtime",REALTIME_LIMITS.dailyCalls))
      throw requestError(429,"realtime_daily_limit","Daily two-way AI voice session limit reached");
     const created=await createRealtimeCall(input,actor,{
      env:config.aiEnv,request:config.aiRequest||fetch
     });
     await realtimeRegistry.activate(handle,created.callId);
     json(res,200,{
      sdp:created.sdp,handle,maxSeconds:created.maxSeconds,
      mode:"REALTIME_AI_VOICE",voice:created.voice,
      notice:"Audio is transmitted to an external AI provider. The voice is synthetic, not a human instructor. No accredited training credit."
     });
    }catch(e){
     await realtimeRegistry.stop(handle);
     throw e;
    }
    return;
   }
   if(method==="POST"&&pathname==="/api/v1/ai/realtime-end"){
    requireCsrf(req,session);
    const data=await bodyJson(req);
    if(typeof data.handle!=="string"||! /^[A-Za-z0-9_-]{32}$/.test(data.handle))
     throw requestError(400,"invalid_realtime_handle","Invalid voice session reference");
    const stopped=await realtimeRegistry.stop(data.handle,actor);
    json(res,200,{status:stopped?"ended":"already_ended"});return;
   }
   if(method==="GET"&&pathname==="/api/v1/me"){
    json(res,200,{user:{id:actor.userId,email:actor.email,role:actor.role,organizationId:actor.organizationId},
     trainingStatus:"UNACCREDITED_STAGING_DEMO"});return;
   }
   if(method==="POST"&&pathname==="/api/v1/auth/logout"){
    requireCsrf(req,session);
    await realtimeRegistry.stopForActor(actor);
    await store.revokeSession(session.tokenHash,actor);
    json(res,200,{status:"signed_out"},{"Set-Cookie":[
     cookie(name,"",secure,true,0),cookie(csrfName,"",secure,false,0)
    ]});return;
   }
   if(method==="POST"&&pathname==="/api/v1/practice-attempts"){
    requireRole(actor,"student");requireCsrf(req,session);
    const raw=await bodyJson(req),report=validateAttempt(raw);
    const key=validateIdempotencyKey(req.headers["idempotency-key"]);
    const digest=hashSha256(JSON.stringify(report));
    const outcome=await store.createAttempt(actor,key,digest,report);
    if(outcome.conflict)throw requestError(409,"idempotency_conflict","This key was already used with another practice report");
    json(res,outcome.created?201:200,{
     id:outcome.id,submittedAt:outcome.submittedAt,
     created:outcome.created,status:"UNVERIFIED_BROWSER_REPORT",flightCredit:false
    });return;
   }
   if(method==="GET"&&pathname==="/api/v1/practice-attempts"){
    requireRole(actor,"student");
    const attempts=await store.listOwnAttempts(actor,getLimit(url));
    json(res,200,{items:attempts,sourceStatus:"UNVERIFIED_BROWSER_REPORT"});return;
   }
   if(method==="GET"&&pathname==="/api/v1/instructor/assigned-attempts"){
    requireRole(actor,"instructor");
    const attempts=await store.listAssignedAttempts(actor,getLimit(url));
    json(res,200,{items:attempts,sourceStatus:"UNVERIFIED_BROWSER_REPORT"});return;
   }
   if(method==="POST"&&pathname==="/api/v1/instructor/feedback-drafts"){
    requireRole(actor,"instructor");requireCsrf(req,session);
    const draft=validateDraft(await bodyJson(req));
    const created=await store.createFeedbackDraft(actor,draft);
    json(res,201,{...created,assessment:false,
     notice:"Unverified draft only. No instructor sign-off or formal training credit."});return;
   }
   if(method==="GET"&&pathname==="/api/v1/instructor/feedback-drafts"){
    requireRole(actor,"instructor");
    const items=await store.listOwnFeedback(actor,getLimit(url));
    json(res,200,{items,officialRecords:false});return;
   }
   throw requestError(404,"not_found","Resource not found");
  }catch(error){
   const status=error instanceof ClientError?error.status:500;
   const code=error instanceof ClientError?error.code:"server_error";
   const message=error instanceof ClientError?error.message:"Request could not be completed";
   if(status>=500&&typeof config.logError==="function")config.logError(error);
   if(!res.headersSent)json(res,status,{error:code,message});
   else res.end();
  }
 };
}
