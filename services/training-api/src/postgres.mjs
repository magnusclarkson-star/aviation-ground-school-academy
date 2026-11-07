import pg from "pg";
import {ClientError} from "./validation.mjs";

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
   WHERE u.email=$1 AND o.slug=$2 AND u.status='active' AND m.status='active'`,
   [email,orgSlug]);
  return r.rows[0]||null;
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
 async createSession({tokenHash,csrfHash,userId,organizationId,expiresAt}){
  await this.pool.query(`
   INSERT INTO sessions(token_hash,csrf_hash,user_id,organization_id,expires_at)
   VALUES($1,$2,$3,$4,$5)`,[tokenHash,csrfHash,userId,organizationId,expiresAt]);
 }
 async getSession(tokenHash){
  const r=await this.pool.query(`
   SELECT s.user_id AS "userId",s.organization_id AS "organizationId",
    s.csrf_hash AS "csrfHash",u.email,m.role
   FROM sessions s JOIN users u ON u.id=s.user_id
    JOIN memberships m ON m.user_id=s.user_id AND m.organization_id=s.organization_id
   WHERE s.token_hash=$1 AND s.revoked_at IS NULL
    AND s.expires_at>now() AND u.status='active' AND m.status='active'`,[tokenHash]);
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
