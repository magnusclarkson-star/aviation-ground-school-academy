import pg from "pg";
import {ClientError} from "./validation.mjs";
import {decryptTotpSecret,checkTotp} from "./mfa.mjs";

export function createPool(env=process.env){
 const url=env.DATABASE_URL;
 if(!url)throw Error("DATABASE_URL must be supplied through private environment settings");
 const sslMode=env.PGSSL_MODE||"disable";
 if(!["disable","verify-full"].includes(sslMode))throw Error("PGSSL_MODE must be disable or verify-full");
 if(env.NODE_ENV==="production"&&sslMode!=="verify-full")
  throw Error("Production database requires verified TLS: PGSSL_MODE=verify-full");
 return new pg.Pool({
  connectionString:url,
  ssl:sslMode==="verify-full"?{rejectUnauthorized:true}:undefined,
  max:8,connectionTimeoutMillis:5000,idleTimeoutMillis:15000
 });
}
export class PgStore{
 constructor(pool){this.pool=pool}
 async ping(){await this.pool.query("SELECT 1");return true}
 async lookupLogin(email,orgSlug){
  const r=await this.pool.query(`
   SELECT u.id AS "userId",u.email,u.password_hash AS "passwordHash",
          o.id AS "organizationId",m.role
   FROM users u JOIN memberships m ON m.user_id=u.id
    JOIN organizations o ON o.id=m.organization_id
   WHERE u.email=$1 AND o.slug=$2 AND u.status='active'
    AND u.email_verified_at IS NOT NULL AND m.status='active'`,
   [email,orgSlug]);
  return r.rows[0]||null;
 }
 async consumeEmailVerification(tokenHash){
  const result=await this.pool.query(
   "SELECT public.consume_email_challenge($1::char(64)) AS verified",[tokenHash]);
  return result.rows[0]?.verified===true;
 }
 async recordLoginAttempt(keyHashes){
  const thresholds=[30,8];
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   const counts=[];
   for(const hash of keyHashes){
    const r=await client.query(`
     INSERT INTO login_throttles(key_hash,window_start,attempt_count)
     VALUES($1,now(),1)
     ON CONFLICT(key_hash) DO UPDATE SET
       attempt_count=CASE WHEN login_throttles.window_start<now()-interval '15 minutes'
                        THEN 1 ELSE login_throttles.attempt_count+1 END,
       window_start=CASE WHEN login_throttles.window_start<now()-interval '15 minutes'
                        THEN now() ELSE login_throttles.window_start END
     RETURNING attempt_count`,[hash]);
    counts.push(r.rows[0].attempt_count);
   }
   await client.query("COMMIT");
   return counts.every((n,i)=>n<=thresholds[i]);
  }catch(e){await client.query("ROLLBACK");throw e}
  finally{client.release()}
 }
 async consumeInstructorOtp({userId,organizationId,code,encryptionKey,nowMs=Date.now()}){
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   const found=await client.query(`
    SELECT encrypted_secret AS "encryptedSecret",last_used_step AS "lastUsedStep"
    FROM instructor_mfa WHERE organization_id=$1 AND instructor_id=$2 FOR UPDATE`,
    [organizationId,userId]);
   if(!found.rowCount){await client.query("COMMIT");return false}
   const row=found.rows[0];
   const secret=decryptTotpSecret(row.encryptedSecret,encryptionKey);
   const matched=checkTotp(secret,code,nowMs,Number(row.lastUsedStep));
   if(matched===null){await client.query("COMMIT");return false}
   const updated=await client.query(`
    UPDATE instructor_mfa SET last_used_step=$3
    WHERE organization_id=$1 AND instructor_id=$2 AND last_used_step<$3`,
    [organizationId,userId,matched]);
   if(!updated.rowCount)throw Error("Instructor MFA counter conflict");
   await client.query(`
    INSERT INTO audit_events(actor_user_id,organization_id,action,target_type)
    VALUES($1,$2,'auth.mfa.verify','instructor_mfa')`,[userId,organizationId]);
   await client.query("COMMIT");
   return true;
  }catch(error){await client.query("ROLLBACK").catch(()=>{});throw error}
  finally{client.release()}
 }
 async createSession({tokenHash,csrfHash,userId,organizationId,expiresAt,mfaVerified=false}){
  await this.pool.query(`
   INSERT INTO sessions(token_hash,csrf_hash,user_id,organization_id,expires_at,mfa_verified_at)
   VALUES($1,$2,$3,$4,$5,$6)`,
   [tokenHash,csrfHash,userId,organizationId,expiresAt,mfaVerified?new Date():null]);
 }
 async getSession(tokenHash){
  const r=await this.pool.query(`
   SELECT s.user_id AS "userId",s.organization_id AS "organizationId",
    s.csrf_hash AS "csrfHash",u.email,m.role
   FROM sessions s JOIN users u ON u.id=s.user_id
    JOIN memberships m ON m.user_id=s.user_id AND m.organization_id=s.organization_id
   WHERE s.token_hash=$1 AND s.revoked_at IS NULL
    AND s.expires_at>now() AND u.status='active' AND u.email_verified_at IS NOT NULL
    AND s.created_at>=u.email_verified_at AND m.status='active'
    AND (m.role='student' OR (m.role='instructor' AND s.mfa_verified_at IS NOT NULL))`,[tokenHash]);
  return r.rows[0]||null;
 }
 async revokeSession(tokenHash,actor){
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   const r=await client.query(`
    UPDATE sessions SET revoked_at=now()
     WHERE token_hash=$1 AND revoked_at IS NULL
     RETURNING token_hash`,[tokenHash]);
   if(r.rowCount)await client.query(`
    INSERT INTO audit_events(actor_user_id,organization_id,action,target_type)
    VALUES($1,$2,'session.logout','session')`,[actor.userId,actor.organizationId]);
   await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");throw e}
  finally{client.release()}
 }
 async createAttempt(actor,key,digest,report){
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   const inserted=await client.query(`
    INSERT INTO practice_attempts(organization_id,student_id,idempotency_key,payload_sha256,report_json)
    VALUES($1,$2,$3,$4,$5::jsonb)
    ON CONFLICT(organization_id,student_id,idempotency_key) DO NOTHING
    RETURNING id,submitted_at AS "submittedAt"`,
    [actor.organizationId,actor.userId,key,digest,JSON.stringify(report)]);
   if(inserted.rowCount){
    const row=inserted.rows[0];
    await client.query(`
     INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id,metadata)
     VALUES($1,$2,'practice.submit','practice_attempt',$3,$4::jsonb)`,
     [actor.userId,actor.organizationId,row.id,JSON.stringify({taskId:report.taskId,unverified:true})]);
    await client.query("COMMIT");
    return {created:true,conflict:false,id:row.id,submittedAt:row.submittedAt};
   }
   const prior=await client.query(`
    SELECT id,payload_sha256,submitted_at AS "submittedAt"
     FROM practice_attempts
     WHERE organization_id=$1 AND student_id=$2 AND idempotency_key=$3`,
    [actor.organizationId,actor.userId,key]);
   await client.query("COMMIT");
   if(!prior.rowCount)throw Error("Conflict without existing practice attempt");
   const row=prior.rows[0];
   return {created:false,conflict:row.payload_sha256!==digest,id:row.id,submittedAt:row.submittedAt};
  }catch(e){await client.query("ROLLBACK").catch(()=>{});throw e}
  finally{client.release()}
 }
 async createModuleClaim(actor,key,digest,claim){
  // Serialise a student's module self-check submissions so multiple concurrent
  // requests cannot bypass the small UTC-day limit or duplicate an audit event.
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
    [actor.organizationId+":"+actor.userId+":module-self-check"]);
   const member=await client.query(`
    SELECT 1 FROM memberships WHERE user_id=$1 AND organization_id=$2
      AND role='student' AND status='active' FOR SHARE`,
    [actor.userId,actor.organizationId]);
   if(!member.rowCount)throw new ClientError(403,"forbidden","Active student membership is required");
   const prior=await client.query(`
    SELECT id,payload_sha256,received_at AS "receivedAt"
    FROM module_practice_claims WHERE organization_id=$1 AND student_id=$2 AND idempotency_key=$3`,
    [actor.organizationId,actor.userId,key]);
   if(prior.rowCount){
    await client.query("COMMIT");
    const row=prior.rows[0];
    return {created:false,conflict:row.payload_sha256!==digest,
     id:row.id,receivedAt:row.receivedAt};
   }
   const total=await client.query(`
    SELECT COUNT(*)::integer AS count FROM module_practice_claims
    WHERE organization_id=$1 AND student_id=$2
      AND received_at >= (date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')`,
    [actor.organizationId,actor.userId]);
   if(total.rows[0].count>=24)
    throw new ClientError(429,"module_daily_limit","Daily private module import limit reached");
   const inserted=await client.query(`
    INSERT INTO module_practice_claims
      (organization_id,student_id,idempotency_key,payload_sha256,
       module_id,assessment_revision,claimed_correct,question_count)
    VALUES($1,$2,$3,$4,$5,$6,$7,6)
    RETURNING id,received_at AS "receivedAt"`,
    [actor.organizationId,actor.userId,key,digest,claim.moduleId,claim.revision,claim.correct]);
   const row=inserted.rows[0];
   await client.query(`
    INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id,metadata)
    VALUES($1,$2,'module.self_check.import','module_practice_claim',$3,$4::jsonb)`,
    [actor.userId,actor.organizationId,row.id,
     JSON.stringify({moduleId:claim.moduleId,sourceStatus:"UNVERIFIED_CLIENT_SELF_CHECK"})]);
   await client.query("COMMIT");
   return {created:true,conflict:false,id:row.id,receivedAt:row.receivedAt};
  }catch(error){
   await client.query("ROLLBACK").catch(()=>{});
   throw error;
  }finally{client.release()}
 }
 async listOwnModuleClaims(actor,limit){
  const r=await this.pool.query(`
   SELECT id,module_id AS "moduleId",assessment_revision AS revision,
     claimed_correct AS "claimedCorrect",question_count AS total,
     source_status AS "sourceStatus",received_at AS "receivedAt"
   FROM module_practice_claims WHERE organization_id=$1 AND student_id=$2
   ORDER BY received_at DESC,id DESC LIMIT $3`,
   [actor.organizationId,actor.userId,limit]);
  return r.rows;
 }
 async listAssignedModuleClaims(actor,limit){
  const r=await this.pool.query(`
   SELECT c.id,c.student_id AS "studentId",c.module_id AS "moduleId",
     c.assessment_revision AS revision,c.claimed_correct AS "claimedCorrect",
     c.question_count AS total,c.source_status AS "sourceStatus",
     c.received_at AS "receivedAt"
   FROM module_practice_claims c
   JOIN instructor_assignments ia ON ia.organization_id=c.organization_id
     AND ia.student_id=c.student_id AND ia.instructor_id=$2 AND ia.active=true
   JOIN memberships sm ON sm.organization_id=ia.organization_id
     AND sm.user_id=ia.student_id AND sm.role='student' AND sm.status='active'
   WHERE c.organization_id=$1
   ORDER BY c.received_at DESC,c.id DESC LIMIT $3`,
   [actor.organizationId,actor.userId,limit]);
  return r.rows;
 }
 async reserveAiUsage(actor,kind,maxCount){
  if(!["text","voice","realtime"].includes(kind)||!Number.isInteger(maxCount)||maxCount<1||maxCount>100)
   throw Error("Invalid AI usage reservation");
  const result=await this.pool.query(`
   INSERT INTO ai_daily_usage(organization_id,user_id,usage_day,kind,request_count)
   VALUES($1,$2,(now() AT TIME ZONE 'UTC')::date,$3,1)
   ON CONFLICT(organization_id,user_id,usage_day,kind)
   DO UPDATE SET request_count=ai_daily_usage.request_count+1
   WHERE ai_daily_usage.request_count<$4
   RETURNING request_count`,[actor.organizationId,actor.userId,kind,maxCount]);
  return result.rowCount===1;
 }
 async listOwnAttempts(actor,limit){
  const r=await this.pool.query(`
   SELECT id,source_status AS "sourceStatus",report_json AS report,
          submitted_at AS "submittedAt"
    FROM practice_attempts
    WHERE organization_id=$1 AND student_id=$2
    ORDER BY submitted_at DESC,id DESC LIMIT $3`,
    [actor.organizationId,actor.userId,limit]);
  return r.rows;
 }
 async listAssignedAttempts(actor,limit){
  const r=await this.pool.query(`
   SELECT a.id,a.student_id AS "studentId",a.source_status AS "sourceStatus",
          a.report_json AS report,a.submitted_at AS "submittedAt"
   FROM practice_attempts a
    JOIN instructor_assignments ia ON ia.organization_id=a.organization_id
      AND ia.student_id=a.student_id AND ia.instructor_id=$2 AND ia.active=true
    JOIN memberships sm ON sm.organization_id=ia.organization_id
      AND sm.user_id=ia.student_id AND sm.role='student' AND sm.status='active'
   WHERE a.organization_id=$1
   ORDER BY a.submitted_at DESC,a.id DESC LIMIT $3`,
   [actor.organizationId,actor.userId,limit]);
  return r.rows;
 }
 async createFeedbackDraft(actor,draft){
  const client=await this.pool.connect();
  try{
   await client.query("BEGIN");
   const inserted=await client.query(`
    INSERT INTO feedback_drafts(
     organization_id,attempt_id,instructor_id,rubric_json,comments,proposed_next_action)
    SELECT a.organization_id,a.id,$2,$3::jsonb,$4,$5
    FROM practice_attempts a
    JOIN instructor_assignments ia ON ia.organization_id=a.organization_id
     AND ia.student_id=a.student_id AND ia.instructor_id=$2 AND ia.active=true
    JOIN memberships sm ON sm.organization_id=ia.organization_id
     AND sm.user_id=ia.student_id AND sm.role='student' AND sm.status='active'
    WHERE a.id=$1 AND a.organization_id=$6
    RETURNING id,created_at AS "createdAt"`,
    [draft.attemptId,actor.userId,JSON.stringify(draft.rubric),draft.comments,
     draft.proposedNextAction,actor.organizationId]);
   if(!inserted.rowCount)throw new ClientError(403,"not_assigned","Attempt is not assigned to this instructor");
   const row=inserted.rows[0];
   await client.query(`
    INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id)
    VALUES($1,$2,'feedback.draft.create','feedback_draft',$3)`,
    [actor.userId,actor.organizationId,row.id]);
   await client.query("COMMIT");
   return {id:row.id,createdAt:row.createdAt,status:"UNVERIFIED_DRAFT"};
  }catch(e){await client.query("ROLLBACK").catch(()=>{});throw e}
  finally{client.release()}
 }
 async listOwnFeedback(actor,limit){
  const r=await this.pool.query(`
   SELECT f.id,f.attempt_id AS "attemptId",f.status,f.rubric_json AS rubric,
    f.comments,f.proposed_next_action AS "proposedNextAction",
    f.created_at AS "createdAt"
   FROM feedback_drafts f
   WHERE f.organization_id=$1 AND f.instructor_id=$2
   ORDER BY f.created_at DESC,f.id DESC LIMIT $3`,
   [actor.organizationId,actor.userId,limit]);
  return r.rows;
 }
}
