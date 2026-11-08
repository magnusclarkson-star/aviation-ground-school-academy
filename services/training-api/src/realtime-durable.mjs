/* Recoverable staging voice call ledger and provider hangup retry worker.
 * Only handles, actor UUIDs, provider call IDs and bounded operational states
 * are persisted. No SDP, microphone audio or student transcript is stored.
 * Not a hard spending ceiling: provider failures can outlive our timers.
 */
import {randomBytes,randomUUID} from "node:crypto";
import {ClientError} from "./validation.mjs";
import {REALTIME_LIMITS} from "./realtime-voice.mjs";

const validCallId=/^[A-Za-z0-9_-]{8,150}$/;
const validHandle=/^[A-Za-z0-9_-]{32}$/;
const TABLE="realtime_voice_calls";

export class DurableRealtimeCallRegistry{
 constructor({pool,request=fetch,env=process.env,maxSeconds=REALTIME_LIMITS.maxSeconds,
              pollMs=5000,instanceId=randomUUID(),onWorkerError=()=>{}}={}){
  if(!pool||typeof pool.query!=="function")throw Error("A durable PostgreSQL pool is mandatory");
  if(!Number.isInteger(maxSeconds)||maxSeconds<1||maxSeconds>120)throw Error("Invalid voice expiry limit");
  this.pool=pool;this.request=request;this.env=env;this.maxSeconds=maxSeconds;
  this.pollMs=pollMs;this.instanceId=instanceId;
  this.onWorkerError=onWorkerError;
  this.timer=null;this.running=null;
 }
 async start(){
  // Fail at boot when the mandatory migration is missing rather than silently
  // falling back to memory-only accounting.
  await this.pool.query("SELECT handle FROM "+TABLE+" LIMIT 0");
  await this.sweep();
  if(!this.timer){
   this.timer=setInterval(()=>{void this.sweep().catch(this.onWorkerError)},this.pollMs);
   this.timer.unref?.();
  }
 }
 async reserve(actor){
  const handle=randomBytes(24).toString("base64url");
  try{
   await this.pool.query(`
    INSERT INTO realtime_voice_calls(handle,organization_id,user_id,owner_instance,state,expires_at)
    VALUES($1,$2,$3,$4,'reserved',now()+interval '35 seconds')`,
    [handle,actor.organizationId,actor.userId,this.instanceId]);
  }catch(e){
   if(e?.code==="23505")throw new ClientError(409,"voice_already_active",
    "A prior voice session is not yet confirmed ended; contact a staging operator if necessary");
   throw e;
  }
  return handle;
 }
 async abandon(handle){
  if(!validHandle.test(handle))return false;
  const r=await this.pool.query(`
   UPDATE realtime_voice_calls SET state='closed',resolved_at=now(),updated_at=now()
   WHERE handle=$1 AND state='reserved' AND provider_call_id IS NULL
   RETURNING handle`,[handle]);
  return r.rowCount===1;
 }
 async associate(handle,callId){
  if(!validHandle.test(handle)||!validCallId.test(callId))throw Error("Invalid provider call reference");
  const r=await this.pool.query(`
   UPDATE realtime_voice_calls SET
     provider_call_id=$2,
     state=CASE WHEN state='uncertain' THEN 'ending' ELSE state END,
     next_attempt_at=now(),updated_at=now()
   WHERE handle=$1 AND provider_call_id IS NULL
     AND state IN ('reserved','ending','uncertain')
   RETURNING state`,[handle,callId]);
  if(!r.rowCount)throw Error("Provider voice call could not be recorded durably");
  if(r.rows[0].state!=="reserved")
   throw Error("Voice negotiation was cancelled or expired; call queued for hangup");
 }
 async activate(handle,callId){
  if(!validHandle.test(handle)||!validCallId.test(callId))throw Error("Invalid provider call reference");
  const r=await this.pool.query(`
   UPDATE realtime_voice_calls SET state='active',
    expires_at=now()+($3::integer*interval '1 second'),updated_at=now()
   WHERE handle=$1 AND provider_call_id=$2
     AND state='reserved' AND expires_at>now()
   RETURNING handle`,[handle,callId,this.maxSeconds]);
  if(!r.rowCount){
   await this.pool.query(`
    UPDATE realtime_voice_calls SET state='ending',next_attempt_at=now(),updated_at=now()
    WHERE handle=$1 AND state<>'closed' AND provider_call_id=$2`,[handle,callId]);
   await this.sweep();
   throw Error("Voice reservation expired before it could be activated");
  }
 }
 async requestEnd(handle,actor){
  if(!validHandle.test(handle))return false;
  const q=await this.pool.query(`
   SELECT organization_id::text AS org,user_id::text AS user_id,state
   FROM realtime_voice_calls WHERE handle=$1`,[handle]);
  if(!q.rowCount)return false;
  const record=q.rows[0];
  if(actor&&(record.org!==actor.organizationId||record.user_id!==actor.userId))
   throw new ClientError(403,"forbidden","This voice session is not assigned to your account");
  if(record.state==="closed")return false;
  await this.pool.query(`
   UPDATE realtime_voice_calls SET state='ending',next_attempt_at=now(),
     claim_until=NULL,updated_at=now()
   WHERE handle=$1 AND state IN ('reserved','active','uncertain')`,[handle]);
  return true;
 }
 async stop(handle,actor){
  const requested=await this.requestEnd(handle,actor);
  if(requested)await this.sweep();
  return requested;
 }
 async stopForActor(actor){
  const r=await this.pool.query(`
   UPDATE realtime_voice_calls SET state='ending',next_attempt_at=now(),updated_at=now()
   WHERE organization_id=$1 AND user_id=$2 AND state IN ('reserved','active','uncertain')
   RETURNING handle`,[actor.organizationId,actor.userId]);
  if(r.rowCount)await this.sweep();
  return r.rowCount>0;
 }
 async hangupCall(callId){
  if(!validCallId.test(callId))return false;
  try{
   const response=await this.request("https://api.openai.com/v1/realtime/calls/"+callId+"/hangup",{
    method:"POST",headers:{Authorization:"Bearer "+this.env.OPENAI_API_KEY},
    signal:AbortSignal.timeout(6500)
   });
   return response?.ok===true||[404,410].includes(response?.status);
  }catch{return false}
 }
 async sweep(){
  if(this.running)return this.running;
  this.running=this.runSweep().finally(()=>{this.running=null});
  return this.running;
 }
 async runSweep(){
  // Expired negotiations without a provider ID cannot safely be marked closed.
  // Preserve an explicit UNCERTAIN record for manual reconciliation.
  await this.pool.query(`
   UPDATE realtime_voice_calls SET
    state=CASE WHEN provider_call_id IS NULL THEN 'uncertain' ELSE 'ending' END,
    next_attempt_at=now(),updated_at=now()
   WHERE state='reserved' AND expires_at<=now()`);
  await this.pool.query(`
   UPDATE realtime_voice_calls SET state='ending',next_attempt_at=now(),updated_at=now()
   WHERE state='active' AND expires_at<=now()`);
  await this.pool.query(`
   UPDATE realtime_voice_calls SET state='uncertain',updated_at=now(),
     last_error_code='provider_id_unknown'
   WHERE state='ending' AND provider_call_id IS NULL AND expires_at<=now()`);
  // Claim one batch atomically across independent API replicas. A crashed
  // worker's lease expires, making its failed provider hangup retryable.
  const claimed=await this.pool.query(`
   WITH candidate AS (
    SELECT handle FROM realtime_voice_calls
     WHERE state='ending' AND provider_call_id IS NOT NULL
      AND next_attempt_at<=now()
      AND (claim_until IS NULL OR claim_until<now())
     ORDER BY next_attempt_at,created_at
     LIMIT 16 FOR UPDATE SKIP LOCKED
   )
   UPDATE realtime_voice_calls AS r SET
     claim_until=now()+interval '25 seconds',
     attempt_count=r.attempt_count+1,updated_at=now()
   FROM candidate WHERE r.handle=candidate.handle
   RETURNING r.handle,r.provider_call_id AS call_id,r.attempt_count`);
  await Promise.all(claimed.rows.map(async row=>{
   const success=await this.hangupCall(row.call_id);
   if(success){
    await this.pool.query(`
     UPDATE realtime_voice_calls SET state='closed',resolved_at=now(),
      claim_until=NULL,last_error_code=NULL,updated_at=now()
     WHERE handle=$1 AND state='ending' AND provider_call_id=$2`,[row.handle,row.call_id]);
   }else{
    const retrySeconds=Math.min(300,5*Math.pow(2,Math.min(6,Number(row.attempt_count)-1)));
    await this.pool.query(`
     UPDATE realtime_voice_calls SET claim_until=NULL,
      next_attempt_at=now()+($3::integer*interval '1 second'),
      last_error_code='provider_hangup_unconfirmed',updated_at=now()
     WHERE handle=$1 AND state='ending' AND provider_call_id=$2`,
     [row.handle,row.call_id,retrySeconds]);
   }
  }));
  return claimed.rowCount;
 }
 async shutdown(){
  if(this.timer){clearInterval(this.timer);this.timer=null}
  // End only calls owned by this process, never calls from a healthy replica.
  await this.pool.query(`
   UPDATE realtime_voice_calls SET state='ending',next_attempt_at=now(),updated_at=now()
   WHERE owner_instance=$1 AND state IN ('reserved','active','uncertain')`,[this.instanceId]);
  await this.sweep();
 }
}
