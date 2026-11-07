export class ClientError extends Error{
 constructor(status,code,message){
  super(message);this.status=status;this.code=code;
 }
}
const isObj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const allowedTasks=new Set(["level","climb","turn","descent","flap"]);
const outcomes=new Set(["PRACTICE_TARGET_MET","INCOMPLETE","PRACTICE_AGAIN"]);
const rubrics=new Set(["not-reviewed","needs-discussion","practice-recommended"]);
const fail=(message)=>{throw new ClientError(400,"invalid_request",message)};
export function validateAttempt(input){
 if(!isObj(input)||input.schema!=="agsa.practice-observation.v1")fail("Unsupported practice report schema");
 const task=input.task,obs=input.observation;
 if(!isObj(task)||!allowedTasks.has(task.id)||!isObj(obs))fail("Missing or unsupported task or observation");
 const int=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
 if(!int(obs.samples,0,120)||!int(obs.matchedSamples,0,obs.samples)||!int(obs.matchedPercent,0,100)||
    !outcomes.has(obs.outcome)||typeof obs.observedSeconds!=="number"||
    !Number.isFinite(obs.observedSeconds)||obs.observedSeconds<0||obs.observedSeconds>12.2)fail("Invalid observation figures");
 const expected=obs.samples?100*obs.matchedSamples/obs.samples:0;
 if(Math.abs(expected-obs.matchedPercent)>1.1)fail("Score does not match sample counts");
 if(obs.outcome==="PRACTICE_TARGET_MET"&&obs.matchedPercent<65)fail("Inconsistent practice outcome");
 if(obs.outcome==="PRACTICE_AGAIN"&&obs.matchedPercent>=65&&obs.observedSeconds>=12)fail("Inconsistent practice outcome");
 if(typeof input.createdAt!=="string"||input.createdAt.length>40||
   !/^\d{4}-\d\d-\d\dT/.test(input.createdAt)||!Number.isFinite(Date.parse(input.createdAt)))fail("Invalid report timestamp");
 // Persist ONLY these allowlisted values. Client-defined student identities,
 // instructor names, notes, qualifications or free-form JSON are discarded.
 return {
  schema:"agsa.api.unverified-practice.v1",
  taskId:task.id,
  claimedCreatedAt:input.createdAt,
  outcome:obs.outcome,
  observations:{
   observedSeconds:obs.observedSeconds,
   samples:obs.samples,matchedSamples:obs.matchedSamples,matchedPercent:obs.matchedPercent
  },
  provenance:"USER_EDITABLE_BROWSER_REPORT_NOT_INDEPENDENTLY_VERIFIED",
  flightCredit:false,
  certificateEligible:false
 };
}
export function validateDraft(input){
 if(!isObj(input)||!isObj(input.rubric)||typeof input.attemptId!=="string"||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.attemptId))
   fail("Invalid attempt reference or discussion rubric");
 const rubric={};
 for(const key of ["instrumentScan","controlCoordination","riskAwareness"]){
  if(!rubrics.has(input.rubric[key]))fail("Unsupported rubric value");
  rubric[key]=input.rubric[key];
 }
 const comments=typeof input.comments==="string"?input.comments.trim():null;
 const nextAction=typeof input.proposedNextAction==="string"?input.proposedNextAction.trim():null;
 if(comments===null||nextAction===null||comments.length>1200||nextAction.length>600||(!comments&&!nextAction))
  fail("Provide valid review notes or a proposed next action");
 return {attemptId:input.attemptId,rubric,comments,proposedNextAction:nextAction};
}
export function validateIdempotencyKey(key){
 if(typeof key!=="string"||! /^[a-zA-Z0-9_-]{12,80}$/.test(key))
  fail("A unique Idempotency-Key header of 12–80 safe characters is required");
 return key;
}
