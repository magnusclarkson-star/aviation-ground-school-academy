/* Private Academy WebRTC voice call orchestration.
 * Unified server-to-provider SDP exchange: the browser never receives the
 * long-lived OpenAI key or a reusable ephemeral provider token.
 * All sessions are fictional staging only until consent/financial gates pass.
 */
import {randomBytes} from "node:crypto";
import {ClientError} from "./validation.mjs";
import {hashSha256} from "./crypto.mjs";
import {tutorInstructions} from "./ai-tutor.mjs";

export const REALTIME_LIMITS=Object.freeze({dailyCalls:2,maxSeconds:120});
const topics=new Set(["forces","instruments","controls","flaps","weather","radio"]);
const styles=new Set(["mentor","scouts","exam"]);
const voices=new Set(["coral","marin","cedar","sage"]);
const MODEL="gpt-realtime-2.1-mini";
function bad(message){throw new ClientError(400,"invalid_realtime_request",message)}
export function realtimeEnabled(env={}){
 return env.AGSA_AI_ENABLED==="1"&&env.AGSA_AI_REALTIME_ENABLED==="1"&&
  env.AGSA_AI_REALTIME_STAGING_APPROVED==="1"&&
  typeof env.OPENAI_API_KEY==="string"&&env.OPENAI_API_KEY.length>=20;
}
export function validateRealtimeRequest(data){
 if(!data||typeof data!=="object"||Array.isArray(data))bad("Voice session configuration required");
 const keys=Object.keys(data);
 if(keys.some(k=>!["topic","style","voice","consent","sdp"].includes(k)))
  bad("Unrecognised voice session field");
 if(data.consent!==true)bad("Explicit microphone and AI processing consent is required");
 const topic=data.topic||"forces",style=data.style||"mentor",voice=data.voice||"coral";
 if(!topics.has(topic)||!styles.has(style)||!voices.has(voice))
  bad("Choose a supported lesson, teaching style and voice");
 const sdp=data.sdp;
 if(typeof sdp!=="string"||sdp.length<80||sdp.length>16000||
   !sdp.startsWith("v=0")||!sdp.includes("m=audio ")||!sdp.includes("a=")||
   /\u0000/.test(sdp))bad("Valid bounded WebRTC audio SDP is required");
 return {topic,style,voice,sdp,consent:true};
}
export function makeRealtimeSession({topic,style,voice}){
 return {
  type:"realtime",model:MODEL,output_modalities:["audio"],
  instructions:tutorInstructions({topic,style})+"\nSpeak one or two short sentences at a time. Clearly identify yourself as an AI instructor. Do not give live-flight control guidance.",
  audio:{
   input:{turn_detection:{type:"server_vad",create_response:true,interrupt_response:true,
    threshold:0.5,prefix_padding_ms:300,silence_duration_ms:650}},
   output:{voice}
  },
  max_output_tokens:360,tools:[],tool_choice:"none"
 };
}
function callIdFromLocation(location){
 if(typeof location!=="string")return null;
 const match=location.match(/\/realtime\/calls\/([A-Za-z0-9_-]{8,150})(?:[?#]|$)/);
 return match?match[1]:null;
}
export class RealtimeCallRegistry{
 constructor({request=fetch,env=process.env,maxSeconds=REALTIME_LIMITS.maxSeconds}={}){
  this.request=request;this.env=env;this.maxSeconds=maxSeconds;this.active=new Map();
  this.byActor=new Map();
 }
 actorKey(actor){return actor.organizationId+":"+actor.userId}
 reserve(actor){
  const key=this.actorKey(actor);
  if(this.byActor.has(key))throw new ClientError(409,"voice_already_active","Close the existing voice session before starting another");
  const handle=randomBytes(24).toString("base64url");
  const record={actorKey:key,callId:null,timer:null};
  this.active.set(handle,record);this.byActor.set(key,handle);
  record.timer=setTimeout(()=>{void this.stop(handle).catch(()=>{})},35000);
  record.timer.unref?.();
  return handle;
 }
 activate(handle,callId){
  const record=this.active.get(handle);
  if(!record||! /^[A-Za-z0-9_-]{8,150}$/.test(callId))throw Error("Untracked realtime call");
  record.callId=callId;
  clearTimeout(record.timer);
  record.timer=setTimeout(()=>{void this.stop(handle).catch(()=>{})},this.maxSeconds*1000);
  record.timer.unref?.();
 }
 async stop(handle,actor){
  const record=this.active.get(handle);
  if(!record)return false;
  if(actor&&record.actorKey!==this.actorKey(actor))
   throw new ClientError(403,"forbidden","This voice session is not assigned to your account");
  clearTimeout(record.timer);
  this.active.delete(handle);
  this.byActor.delete(record.actorKey);
  if(record.callId){
   try{
    await this.request("https://api.openai.com/v1/realtime/calls/"+record.callId+"/hangup",{
     method:"POST",headers:{Authorization:"Bearer "+this.env.OPENAI_API_KEY},
     signal:AbortSignal.timeout(6500)
    });
   }catch{/* Fail closed locally; provider budget policies still required. */}
  }
  return true;
 }
 async stopForActor(actor){
  const handle=this.byActor.get(this.actorKey(actor));
  return handle?this.stop(handle,actor):false;
 }
 async shutdown(){
  await Promise.allSettled([...this.active.keys()].map(h=>this.stop(h)));
 }
}
export async function createRealtimeCall(input,actor,{env=process.env,request=fetch}={}){
 if(!realtimeEnabled(env))
  throw new ClientError(503,"realtime_unavailable","Two-way AI voice is not enabled on this staging service");
 const chosen=validateRealtimeRequest(input);
 const form=new FormData();
 form.set("sdp",chosen.sdp);
 form.set("session",JSON.stringify(makeRealtimeSession(chosen)));
 let response;
 try{
  response=await request("https://api.openai.com/v1/realtime/calls",{
   method:"POST",
   headers:{
    Authorization:"Bearer "+env.OPENAI_API_KEY,
    "OpenAI-Safety-Identifier":hashSha256("agsa-staging:"+actor.organizationId+":"+actor.userId)
   },
   body:form,signal:AbortSignal.timeout(25000)
  });
 }catch{
  throw new ClientError(502,"realtime_provider_failed","Could not establish a protected voice connection");
 }
 if(!response?.ok)throw new ClientError(502,"realtime_provider_failed","Could not establish a protected voice connection");
 const callId=callIdFromLocation(response.headers?.get?.("location"));
 if(!callId)throw new ClientError(502,"realtime_provider_failed","Voice provider returned no controllable call identifier");
 let sdp;
 try{sdp=await response.text()}catch{throw new ClientError(502,"realtime_provider_failed","Could not read voice connection answer")}
 if(typeof sdp!=="string"||sdp.length<70||sdp.length>100000||!sdp.startsWith("v=0")){
  // Caller should hang up the created call if the SDP is malformed.
  try{await request("https://api.openai.com/v1/realtime/calls/"+callId+"/hangup",{
   method:"POST",headers:{Authorization:"Bearer "+env.OPENAI_API_KEY},
   signal:AbortSignal.timeout(4000)
  })}catch{}
  throw new ClientError(502,"realtime_provider_failed","Voice provider sent an unusable connection answer");
 }
 return {callId,sdp,voice:chosen.voice,maxSeconds:REALTIME_LIMITS.maxSeconds};
}
