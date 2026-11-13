// Private ATO operations API. Requires separately hosted HTTPS + PostgreSQL.
// No regulator approval is inferred from public self-study marks.
import http from "node:http";
import {readFile} from "node:fs/promises";
import pg from "pg";
const {Pool}=pg;
import {randomUUID,randomBytes} from "node:crypto";
import {sha256,newToken,hashPassword,verifyPassword,validatePassword,validateEmail,cookieToken,sessionCookie,clearSessionCookie,checkOrigin,SESSION_HOURS} from "./auth.mjs";
import {permission,authorizedRole,EVIDENCE_TYPES,schoolApproved,courseApproved,canRecordApprovedTraining,canRecordOfficialExam,canIssueApprovedCourseCompletion} from "./policy.mjs";
import {handleFeesRoute} from "./fees-routes.mjs";
import {handleSignatureRoute} from "./signature-routes.mjs";

const httpPort=Number(process.env.PORT||8787);
const baseOrigin=process.env.ACADEMY_ORIGIN;
const databaseUrl=process.env.DATABASE_URL;
if(!baseOrigin||!databaseUrl)throw Error("ACADEMY_ORIGIN and DATABASE_URL are required");
const parsed=new URL(baseOrigin);
if(parsed.pathname!=="/"||parsed.search||parsed.hash||!["http:","https:"].includes(parsed.protocol))throw Error("Invalid origin");
const https=parsed.protocol==="https:";
if(!https&&!["localhost","127.0.0.1"].includes(parsed.hostname))throw Error("Remote deployment requires HTTPS origin");
const dbUrl=new URL(databaseUrl);
if(dbUrl.protocol!=="postgres:"&&dbUrl.protocol!=="postgresql:")throw Error("A PostgreSQL DATABASE_URL is required");
const localDb=["localhost","127.0.0.1"].includes(dbUrl.hostname);
if(!localDb&&!["verify-full","verify-ca"].includes(dbUrl.searchParams.get("sslmode")))throw Error("Remote database requires validated TLS (sslmode=verify-full or verify-ca)");
const pool=new Pool({connectionString:databaseUrl,max:10,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
const maxBody=16384,validHex=s=>typeof s==="string"&&/^[a-f0-9]{64}$/i.test(s);
const securityHeaders={
 "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "X-Frame-Options":"DENY","Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
if(https)securityHeaders["Strict-Transport-Security"]="max-age=31536000; includeSubDomains";
class RequestError extends Error{constructor(status,message){super(message);this.status=status}}
function fail(status,message){throw new RequestError(status,message)}
function send(res,status,body,extra={}){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8",...securityHeaders,...extra});res.end(JSON.stringify(body))}
function requiredString(body,key,min=1,max=250){const v=body?.[key];if(typeof v!=="string"||v.trim().length<min||v.length>max)fail(400,"Invalid "+key);return v.trim()}
function iso(value){const n=Date.parse(value);if(typeof value!=="string"||!Number.isFinite(n))fail(400,"Invalid date/time");return new Date(n).toISOString()}
function clientIp(req){return String(req.socket.remoteAddress||"unknown").slice(0,120)} // Do not trust X-Forwarded-For from clients
async function json(req,limit=maxBody){
 if(!String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))fail(415,"JSON content type required");
 let size=0,chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>limit)fail(413,"Request too large");chunks.push(chunk)}
 try{const value=JSON.parse(Buffer.concat(chunks).toString("utf8"));if(!value||typeof value!=="object"||Array.isArray(value))fail(400,"JSON object required");return value}catch(e){if(e instanceof RequestError)throw e;fail(400,"Invalid JSON")}
}
async function transaction(callback){
 const client=await pool.connect();
 try{await client.query("BEGIN");const result=await callback(client);await client.query("COMMIT");return result}
 catch(e){await client.query("ROLLBACK");throw e}
 finally{client.release()}
}
async function audit(db,actor,action,resource,id,context={}){
 await db.query("INSERT INTO academy_audit_events(actor_id,action,resource,resource_id,context) VALUES($1,$2,$3,$4,$5)",[actor,action,resource,String(id),JSON.stringify(context)]);
}
async function actorFor(req){
 const token=cookieToken(req.headers.cookie);if(!token)fail(401,"Sign-in required");
 const {rows}=await pool.query(`SELECT u.id,u.email,u.role,u.adult_confirmed
 FROM academy_sessions s JOIN academy_users u ON u.id=s.user_id
 WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.active=true AND u.disabled_at IS NULL`,[sha256(token)]);
 if(!rows[0])fail(401,"Session expired or revoked");
 return rows[0];
}
function requireRole(actor,action){if(!permission(actor.role,action))fail(403,"Insufficient role authorisation")}
async function evidence(db){const {rows}=await db.query("SELECT * FROM academy_authority_evidence WHERE status='VERIFIED'");return rows}
async function enrolment(db,id){
 const {rows}=await db.query(`SELECT e.*,u.adult_confirmed,u.active,c.review_status
 FROM academy_enrolments e JOIN academy_users u ON u.id=e.student_id
 JOIN academy_courses c ON c.id=e.course_id WHERE e.id=$1`,[id]);
 if(!rows[0]||rows[0].status!=="ENROLLED"||!rows[0].adult_confirmed||!rows[0].active||rows[0].review_status!=="READY_FOR_AUTHORITY")fail(409,"Approved-syllabus adult enrolment required");
 return rows[0];
}
async function failureCount(key){
 const {rows}=await pool.query(`SELECT attempts FROM academy_login_failures WHERE bucket=$1 AND last_at>now()-interval '15 minutes'`,[key]);
 return rows[0]?.attempts||0;
}
async function incrementFailure(key){
 await pool.query(`INSERT INTO academy_login_failures(bucket,attempts,last_at) VALUES($1,1,now())
 ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN academy_login_failures.last_at<now()-interval '15 minutes' THEN 1 ELSE academy_login_failures.attempts+1 END,last_at=now()`,[key]);
}
const invalidHash=await hashPassword("UnusableBootstrapNotARealUser!72");
async function handle(req,res){
 const method=req.method||"GET",pathname=new URL(req.url||"/",baseOrigin).pathname;
 try{
  if(method==="GET"&&["/","/portal.js","/fees-portal.js","/signature-portal.js","/portal.css"].includes(pathname)){
   const file=pathname==="/"? "portal.html":pathname.slice(1);
   const bytes=await readFile(new URL("./"+file,import.meta.url));
   const type=file.endsWith(".html")?"text/html; charset=utf-8":file.endsWith(".css")?"text/css; charset=utf-8":"text/javascript; charset=utf-8";
   const csp="default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
   res.writeHead(200,{...securityHeaders,"Content-Type":type,"Content-Security-Policy":csp});
   res.end(bytes);return;
  }
  if(method==="GET"&&pathname==="/api/health"){send(res,200,{status:"ok",service:"academy-private-ato-foundation"});return}
  if(method==="GET"&&pathname==="/api/public/approval"){
   const docs=await evidence(pool);
   // Internal verification of entered evidence is NOT the same as an online SLCAA validation.
   send(res,200,{approvedTrainingClaim:false,authorityStatus:schoolApproved(docs)?"DOCUMENTS_INTERNALLY_ATTESTED_NOT_ONLINE_VERIFIED":"NOT_AN_APPROVED_TRAINING_ORGANISATION",officialExamsOffByDefault:true});return;
  }
  if(method==="POST"||method==="PUT"||method==="PATCH"||method==="DELETE"){
   try{checkOrigin(req.headers.origin,baseOrigin)}catch{fail(403,"Origin not allowed")}
  }
  if(method==="POST"&&pathname==="/api/login"){
   const body=await json(req),email=validateEmail(body.email),password=String(body.password||"");
   if(password.length>200)fail(400,"Invalid credentials");
   const ipBucket=sha256("ip:"+clientIp(req)),userBucket=sha256("user:"+email);
   if(await failureCount(ipBucket)>=15||await failureCount(userBucket)>=8)fail(429,"Too many attempts; retry later");
   const {rows}=await pool.query("SELECT id,email,role,password_hash,active,disabled_at FROM academy_users WHERE email=$1",[email]);
   const candidate=rows[0],matched=await verifyPassword(password,candidate?.password_hash||invalidHash);
   if(!candidate||!candidate.active||candidate.disabled_at||!matched){
    await Promise.all([incrementFailure(ipBucket),incrementFailure(userBucket)]);
    fail(401,"Invalid credentials");
   }
   await pool.query("DELETE FROM academy_login_failures WHERE bucket=ANY($1::text[])",[[ipBucket,userBucket]]);
   const token=newToken(),hash=sha256(token);
   await transaction(async db=>{
    await db.query("INSERT INTO academy_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+($3::int * interval '1 hour'))",[hash,candidate.id,SESSION_HOURS]);
    await audit(db,candidate.id,"LOGIN","SESSION",hash.slice(0,14));
   });
   send(res,200,{signedIn:true,role:candidate.role}, {"Set-Cookie":sessionCookie(token,https)});return;
  }
  if(method==="POST"&&pathname==="/api/activate"){
   const body=await json(req),email=validateEmail(body.email),password=validatePassword(body.password),token=requiredString(body,"token",64,64);
   if(!validHex(token)||body.adultConfirmed!==true)fail(400,"Valid invitation and adult confirmation required");
   const hash=await hashPassword(password);
   const user=await transaction(async db=>{
    const {rows}=await db.query(`UPDATE academy_invites SET used_at=now()
     WHERE token_hash=$1 AND lower(email)=$2 AND used_at IS NULL AND expires_at>now()
     RETURNING id,role`,[sha256(token),email]);
    if(!rows[0])fail(400,"Invitation invalid or expired");
    const account=await db.query(`INSERT INTO academy_users(email,role,password_hash,adult_confirmed)
     VALUES($1,$2,$3,true) RETURNING id,role`,[email,rows[0].role,hash]);
    await audit(db,account.rows[0].id,"ACTIVATE","USER",account.rows[0].id,{role:rows[0].role});
    return account.rows[0];
   });
   send(res,201,{activated:true,role:user.role,signInRequired:true});return;
  }
  const actor=await actorFor(req);
  if(await handleSignatureRoute({req,res,method,pathname,actor,db:pool,transaction,audit,json,send,fail}))return;
  // Financial access is a separate gate. Only accountable_manager may
  // price, waive, award scholarships, attest off-platform settlement or revoke.
  if(await handleFeesRoute({req,res,method,pathname,actor,db:pool,transaction,
    audit,json,send,fail}))return;

  if(method==="GET"&&pathname==="/api/me"){send(res,200,{user:actor});return}
  if(method==="GET"&&pathname==="/api/my/enrolments"){
   const {rows}=await pool.query(`SELECT e.id,e.course_id,c.title,c.revision,e.status,e.started_at,e.completed_at
    FROM academy_enrolments e JOIN academy_courses c ON c.id=e.course_id WHERE e.student_id=$1 ORDER BY e.started_at DESC`,[actor.id]);
   send(res,200,{enrolments:rows});return;
  }
  if(method==="GET"&&pathname==="/api/my/assessments"){
   const {rows}=await pool.query(`SELECT a.id,a.course_id,a.status,a.assessment_date,a.recorded_at
    FROM academy_assessment_records a WHERE a.student_id=$1 ORDER BY a.recorded_at DESC LIMIT 50`,[actor.id]);
   send(res,200,{assessmentRecords:rows,warning:"These are staff-recorded assessment results; no pilot licence is issued"});return;
  }
  if(method==="GET"&&pathname==="/api/my/completions"){
   const {rows}=await pool.query(`SELECT r.id,r.status,r.serial,r.attested_at,e.course_id
    FROM academy_completion_requests r JOIN academy_enrolments e ON e.id=r.enrolment_id
    WHERE e.student_id=$1 ORDER BY r.requested_at DESC LIMIT 50`,[actor.id]);
   send(res,200,{courseCompletions:rows,notPilotLicence:true});return;
  }
  if(method==="GET"&&pathname==="/api/admin/readiness"){
   if(!["quality_manager","head_of_training","accountable_manager"].includes(actor.role))fail(403,"Staff role required");
   const docs=await evidence(pool);
   const {rows}=await pool.query(`SELECT id,title,revision,review_status,qa_reviewed_at FROM academy_courses ORDER BY created_at DESC LIMIT 100`);
   send(res,200,{schoolDocumentChecks:{atoCertificate:docs.some(x=>x.type==="ATO_CERTIFICATE"&&x.scope==="ORG"),
     trainingSpecs:docs.some(x=>x.type==="TRAINING_SPECIFICATIONS"&&x.scope==="ORG"),
     trainingManual:docs.some(x=>x.type==="TPM_ACCEPTANCE"&&x.scope==="ORG"),
     safetyManagement:docs.some(x=>x.type==="SMS_ACCEPTANCE"&&x.scope==="ORG")},
     schoolApprovedForOperationsInApp:schoolApproved(docs),authorityVerification:"HUMAN_DOCUMENT_ATTESTATION_ONLY",courses:rows});return;
  }

  if(method==="POST"&&pathname==="/api/logout"){
   await transaction(async db=>{
    await db.query("UPDATE academy_sessions SET revoked_at=now() WHERE token_hash=$1",[sha256(cookieToken(req.headers.cookie))]);
    await audit(db,actor.id,"LOGOUT","USER",actor.id);
   });
   send(res,200,{signedOut:true},{"Set-Cookie":clearSessionCookie(https)});return;
  }
  if(method==="POST"&&pathname==="/api/invitations"){
   requireRole(actor,"invite");const body=await json(req),email=validateEmail(body.email),role=requiredString(body,"role",4,50);
   if(!authorizedRole(role))fail(400,"Invalid invited role");
   if(!["student","instructor"].includes(role)&&!permission(actor.role,"issue_privileged_invite"))fail(403,"Only accountable manager can invite privileged roles");
   if(role==="student"&&body.adultOnly!==true)fail(400,"Only adult enrolments are supported; youth accounts disabled pending safeguarding");
   const token=newToken();
   const id=await transaction(async db=>{
    const {rows}=await db.query("INSERT INTO academy_invites(email,role,token_hash,created_by,expires_at) VALUES($1,$2,$3,$4,now()+interval '48 hours') RETURNING id",[email,role,sha256(token),actor.id]);
    await audit(db,actor.id,"INVITE","INVITATION",rows[0].id,{role});
    return rows[0].id;
   });
   send(res,201,{invitationId:id,inviteToken:token,expiresInHours:48,delivery:"SHARE_SECURELY_OUT_OF_BAND_NO_EMAIL_SERVICE"});return;
  }
  if(method==="POST"&&pathname==="/api/authority/evidence"){
   requireRole(actor,"submit_evidence");const body=await json(req);
   const type=requiredString(body,"type"),scope=requiredString(body,"scope",1,180),reference=requiredString(body,"reference",4,249),sha=requiredString(body,"sha256",64,64);
   if(!EVIDENCE_TYPES.includes(type)||!validHex(sha))fail(400,"Invalid documentary evidence");
   const start=iso(body.effectiveFrom),end=body.effectiveUntil?iso(body.effectiveUntil):null;
   if(end&&end<=start)fail(400,"Invalid evidence dates");
   const id=await transaction(async db=>{
    const {rows}=await db.query(`INSERT INTO academy_authority_evidence(type,scope,reference,sha256,effective_from,effective_until,submitted_by)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[type,scope,reference,sha,start,end,actor.id]);
    await audit(db,actor.id,"EVIDENCE_SUBMITTED","AUTHORITY_EVIDENCE",rows[0].id,{type,scope});
    return rows[0].id;
   });
   send(res,201,{id,status:"PENDING_REVIEW",mustBeAuthenticallyVerifiedByIndependentQualityManager:true});return;
  }
  const verify=/^\/api\/authority\/evidence\/([0-9a-f-]{36})\/review$/.exec(pathname);
  if(method==="POST"&&verify){
   requireRole(actor,"verify_evidence");const body=await json(req);
   if(!["VERIFIED","REJECTED"].includes(body.decision))fail(400,"Decision must be VERIFIED or REJECTED");
   const notes=requiredString(body,"reviewNotes",20,1800),id=verify[1];
   const doc=await transaction(async db=>{
    const {rows}=await db.query(`UPDATE academy_authority_evidence SET status=$1,verified_by=CASE WHEN $1='VERIFIED' THEN $2::uuid ELSE NULL END,
     verified_at=CASE WHEN $1='VERIFIED' THEN now() ELSE NULL END,review_notes=$3
     WHERE id=$4 AND status='PENDING_REVIEW' AND submitted_by<>$2 RETURNING id,type,scope,status`,[body.decision,actor.id,notes,id]);
    if(!rows[0])fail(409,"Evidence not pending or reviewer lacks separation of duties");
    await audit(db,actor.id,"EVIDENCE_REVIEWED","AUTHORITY_EVIDENCE",id,{decision:body.decision,type:rows[0].type});
    return rows[0];
   });
   send(res,200,{evidence:doc,warning:"Internal attestation; not an online verification with SLCAA"});return;
  }
  const revoke=new RegExp("^/api/authority/evidence/([0-9a-f-]{36})/revoke$").exec(pathname);
  if(method==="POST"&&revoke){
   requireRole(actor,"verify_evidence");const body=await json(req),why=requiredString(body,"reason",20,1500);
   const result=await transaction(async db=>{
    const {rows}=await db.query(`UPDATE academy_authority_evidence SET status='REVOKED',review_notes=$1
     WHERE id=$2 AND status='VERIFIED' RETURNING id,type,scope,status`,[why,revoke[1]]);
    if(!rows[0])fail(409,"No active verified evidence to revoke");
    await audit(db,actor.id,"EVIDENCE_REVOKED","AUTHORITY_EVIDENCE",rows[0].id,{reason:why});
    return rows[0];
   });
   send(res,200,{evidence:result,trainingRightsReevaluatedImmediately:true});return;
  }
  const disable=new RegExp("^/api/admin/users/([0-9a-f-]{36})/disable$").exec(pathname);
  if(method==="POST"&&disable){
   if(actor.role!=="accountable_manager"||actor.id===disable[1])fail(403,"Separate accountable manager required");
   const body=await json(req),reason=requiredString(body,"reason",20,1500);
   await transaction(async db=>{
    const {rows}=await db.query(`UPDATE academy_users SET active=false,disabled_at=now()
     WHERE id=$1 AND active=true RETURNING id,role`,[disable[1]]);
    if(!rows[0])fail(409,"User already disabled or not found");
    await db.query("UPDATE academy_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",[disable[1]]);
    await audit(db,actor.id,"ACCOUNT_DISABLED","USER",disable[1],{reason,role:rows[0].role});
   });
   send(res,200,{disabled:true,sessionsRevoked:true});return;
  }
  if(method==="GET"&&pathname==="/api/authority/register"){
   if(!["quality_manager","head_of_training","accountable_manager"].includes(actor.role))fail(403,"Staff only");
   const {rows}=await pool.query(`SELECT id,type,scope,reference,effective_from,effective_until,status,submitted_at,verified_at FROM academy_authority_evidence ORDER BY submitted_at DESC LIMIT 300`);
   send(res,200,{evidence:rows});return;
  }
  if(method==="POST"&&pathname==="/api/courses"){
   if(!["head_of_training","accountable_manager"].includes(actor.role))fail(403,"Head of training role required");
   const b=await json(req),id=requiredString(b,"id",3,64),title=requiredString(b,"title",6,249),rev=requiredString(b,"revision",1,79),sha=requiredString(b,"contentSha256",64,64);
   const prereq=requiredString(b,"prerequisites",10,3000),standards=requiredString(b,"stageStandards",10,3000);
   if(!/^[a-z][a-z0-9_-]{2,63}$/.test(id)||!validHex(sha))fail(400,"Invalid course identifier/hash");
   const hours=Number(b.minutesPlanned);if(!Number.isInteger(hours)||hours<1||hours>200000)fail(400,"Invalid planned time");
   const record=await transaction(async db=>{
    const {rows}=await db.query(`INSERT INTO academy_courses(id,title,revision,content_sha256,minutes_planned,prerequisite_text,stage_standard_text,prepared_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,review_status`,[id,title,rev,sha,hours,prereq,standards,actor.id]);
    await audit(db,actor.id,"CURRICULUM_DRAFTED","COURSE",id,{revision:rev});
    return rows[0];
   });
   send(res,201,{course:record});return;
  }
  const courseReview=/^\/api\/courses\/([a-z][a-z0-9_-]{2,63})\/review$/.exec(pathname);
  if(method==="POST"&&courseReview){
   requireRole(actor,"verify_evidence");const b=await json(req),status=requiredString(b,"decision");
   if(!["INTERNAL_REVIEW","READY_FOR_AUTHORITY"].includes(status))fail(400,"Invalid review state");
   const {rows}=await transaction(async db=>{
    const r=await db.query(`UPDATE academy_courses SET review_status=$1,qa_reviewed_by=$2,qa_reviewed_at=now()
    WHERE id=$3 AND prepared_by<>$2 AND review_status IN ('DRAFT','INTERNAL_REVIEW') RETURNING id,review_status`,[status,actor.id,courseReview[1]]);
    if(!r.rows[0])fail(409,"Course unavailable or self-review prohibited");
    if(status==="READY_FOR_AUTHORITY"){
      const stages=await db.query("SELECT COUNT(*)::int AS count FROM academy_course_stage_requirements WHERE course_id=$1",[courseReview[1]]);
      if(stages.rows[0].count<1)fail(409,"Define course stages before quality approval");
    }
    await audit(db,actor.id,"CURRICULUM_REVIEW","COURSE",courseReview[1],{status});
    return r;
   });
   send(res,200,{course:rows[0],authorityApprovalNotGranted:true});return;
  }
  const stageReq=/^\/api\/courses\/([a-z][a-z0-9_-]{2,63})\/stages$/.exec(pathname);
  if(method==="POST"&&stageReq){
   if(actor.role!=="head_of_training")fail(403,"Head of training required");
   const b=await json(req),key=requiredString(b,"stageKey",1,99),standard=requiredString(b,"standard",25,2500);
   await transaction(async db=>{
    const course=await db.query("SELECT * FROM academy_courses WHERE id=$1 AND review_status='DRAFT'",[stageReq[1]]);
    if(!course.rows[0])fail(409,"Course stages can only be defined before quality approval");
    await db.query("INSERT INTO academy_course_stage_requirements(course_id,stage_key,standard) VALUES($1,$2,$3)",[stageReq[1],key,standard]);
    await audit(db,actor.id,"STAGE_REQUIRED","COURSE",stageReq[1],{stage:key});
   });
   send(res,201,{stageAdded:true});return;
  }
  if(method==="POST"&&pathname==="/api/enrolments"){
   if(actor.role!=="head_of_training")fail(403,"Head of training required");
   const b=await json(req),course=requiredString(b,"courseId"),student=requiredString(b,"studentId",36,36);
   const record=await transaction(async db=>{
    const user=await db.query("SELECT id FROM academy_users WHERE id=$1 AND role='student' AND adult_confirmed=true AND active=true",[student]);
    if(!user.rows[0])fail(409,"Only active adult student accounts can enrol");
    const access=await db.query(`SELECT id FROM academy_access_grants
      WHERE student_id=$1 AND course_id=$2 AND status='ACTIVE' AND starts_at<=now()
      AND (expires_at IS NULL OR expires_at>now()) FOR SHARE`,[student,course]);
    if(!access.rows[0])fail(403,"Administrator-awarded active course access required before enrolment");
    const row=await db.query("INSERT INTO academy_enrolments(student_id,course_id) VALUES($1,$2) RETURNING id,course_id",[student,course]);
    await audit(db,actor.id,"ENROLLED","ENROLMENT",row.rows[0].id,{courseId:course});
    return row.rows[0];
   });
   send(res,201,{enrolment:record});return;
  }
  const training=/^\/api\/enrolments\/([0-9a-f-]{36})\/stages$/.exec(pathname);
  if(method==="POST"&&training){
   requireRole(actor,"record_training");const b=await json(req),key=requiredString(b,"stageKey",1,99),notes=requiredString(b,"reviewNotes",10,2999);
   if(!["COMPLETE","NEEDS_RETRAINING"].includes(b.status))fail(400,"Invalid stage status");
   const result=await transaction(async db=>{
    const student=await enrolment(db,training[1]);const docs=await evidence(db);
    if(!canRecordApprovedTraining({evidence:docs,courseId:student.course_id,instructorId:actor.id,enrolled:true,adult:true}))fail(403,"Authority course/instructor approval not verified");
    const stage=await db.query("SELECT stage_key FROM academy_course_stage_requirements WHERE course_id=$1 AND stage_key=$2",[student.course_id,key]);
    if(!stage.rows[0])fail(409,"Stage is not in reviewed course specifications");
    const {rows}=await db.query(`INSERT INTO academy_training_stages(enrolment_id,stage_key,status,training_date,instructor_id,review_notes)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status`,[training[1],key,b.status,iso(b.trainingDate).slice(0,10),actor.id,notes]);
    await audit(db,actor.id,"TRAINING_RECORDED","STAGE",rows[0].id,{status:b.status,stage:key});
    return rows[0];
   });
   send(res,201,{stage:result});return;
  }
  if(method==="POST"&&pathname==="/api/assessments"){
   requireRole(actor,"record_examination");const b=await json(req),id=requiredString(b,"enrolmentId",36,36),status=requiredString(b,"status");
   if(!["PASS","FAIL"].includes(status)||!validHex(b.resultSha256))fail(400,"Invalid assessment record");
   const blueprint=requiredString(b,"blueprintRevision",4,99),ref=requiredString(b,"resultReference",6,249);
   const result=await transaction(async db=>{
    const e=await enrolment(db,id),docs=await evidence(db);
    if(!canRecordOfficialExam({evidence:docs,courseId:e.course_id,examinerId:actor.id,enrolled:true,adult:true}))fail(403,"No verified SLCAA authority for this examination");
    const {rows}=await db.query(`INSERT INTO academy_assessment_records(enrolment_id,course_id,student_id,examiner_id,recorded_by,status,assessment_date,blueprint_revision,result_reference,result_sha256)
      VALUES($1,$2,$3,$4,$4,$5,$6,$7,$8,$9) RETURNING id,status`,[id,e.course_id,e.student_id,actor.id,status,iso(b.assessmentDate).slice(0,10),blueprint,ref,b.resultSha256]);
    await audit(db,actor.id,"EXAM_RECORDED","ASSESSMENT",rows[0].id,{status});
    return rows[0];
   });
   send(res,201,{assessment:result,warning:"Record of externally administered assessment; no online proctoring or licensing decision"});return;
  }
  if(method==="POST"&&pathname==="/api/completion-requests"){
   requireRole(actor,"request_graduation");const b=await json(req),id=requiredString(b,"enrolmentId",36,36),examId=requiredString(b,"assessmentId",36,36);
   const result=await transaction(async db=>{
    const e=await enrolment(db,id);
    const x=await db.query("SELECT * FROM academy_assessment_records WHERE id=$1 AND enrolment_id=$2 AND status='PASS'",[examId,id]);
    if(!x.rows[0])fail(409,"Verified passing examination record required");
    const requirements=await db.query("SELECT stage_key FROM academy_course_stage_requirements WHERE course_id=$1",[e.course_id]);
    const stages=await db.query("SELECT DISTINCT ON(stage_key) stage_key,status,instructor_id FROM academy_training_stages WHERE enrolment_id=$1 ORDER BY stage_key,recorded_at DESC,id DESC",[id]);
    if(!requirements.rows.length||requirements.rows.some(k=>!stages.rows.some(s=>s.stage_key===k.stage_key&&s.status==="COMPLETE")))fail(409,"Required training stages incomplete");
    const docs=await evidence(db);
    if(!canIssueApprovedCourseCompletion({evidence:docs,courseId:e.course_id,studentId:e.student_id,examinerId:x.rows[0].examiner_id,
      trainingStages:stages.rows.map(s=>({status:s.status,instructor_id:s.instructor_id})),officialExam:x.rows[0],
      headOfTrainingId:actor.id,qualityManagerId:"PENDING_QA"}))fail(403,"Authority approval gate closed");
    const {rows}=await db.query(`INSERT INTO academy_completion_requests(enrolment_id,assessment_id,requested_by) VALUES($1,$2,$3) RETURNING id,status`,[id,examId,actor.id]);
    await audit(db,actor.id,"COMPLETION_REQUESTED","COMPLETION",rows[0].id);
    return rows[0];
   });
   send(res,201,{request:result,issuance:"PENDING_SEPARATE_QUALITY_REVIEW"});return;
  }
  const graduation=/^\/api\/completion-requests\/([0-9a-f-]{36})\/attest$/.exec(pathname);
  if(method==="POST"&&graduation){
   requireRole(actor,"attest_graduation");const b=await json(req);
   if(b.confirmDocumentsChecked!==true||b.confirmStagesChecked!==true)fail(400,"Evidence and stage confirmation required");
   const result=await transaction(async db=>{
    const {rows}=await db.query(`SELECT r.*,e.course_id,e.student_id,a.examiner_id,a.recorded_by,a.status AS exam_status,
       a.course_id AS exam_course,a.student_id AS exam_student,a.examiner_id AS exam_examiner
     FROM academy_completion_requests r JOIN academy_enrolments e ON e.id=r.enrolment_id
     JOIN academy_assessment_records a ON a.id=r.assessment_id
     WHERE r.id=$1 AND r.status='PENDING_QA' FOR UPDATE OF r`,[graduation[1]]);
    const rec=rows[0];if(!rec||rec.requested_by===actor.id)fail(409,"Independent QA request required");
    const reqs=await db.query("SELECT stage_key FROM academy_course_stage_requirements WHERE course_id=$1",[rec.course_id]);
    const stages=await db.query("SELECT DISTINCT ON(stage_key) stage_key,status,instructor_id FROM academy_training_stages WHERE enrolment_id=$1 ORDER BY stage_key,recorded_at DESC,id DESC",[rec.enrolment_id]);
    if(!reqs.rows.length||reqs.rows.some(k=>!stages.rows.some(s=>s.stage_key===k.stage_key&&s.status==="COMPLETE")))fail(409,"All course stages must be completed");
    const docs=await evidence(db);
    if(!canIssueApprovedCourseCompletion({evidence:docs,courseId:rec.course_id,studentId:rec.student_id,examinerId:rec.examiner_id,
      trainingStages:stages.rows,officialExam:{status:rec.exam_status,course_id:rec.exam_course,student_id:rec.exam_student,examiner_id:rec.exam_examiner,recorded_by:rec.recorded_by},
      headOfTrainingId:rec.requested_by,qualityManagerId:actor.id}))fail(409,"External authority or course completion conditions not met");
    const serial="AGSA-COURSE-"+randomBytes(12).toString("hex").toUpperCase();
    await db.query(`UPDATE academy_completion_requests SET status='ISSUED',attested_by=$1,attested_at=now(),serial=$2 WHERE id=$3`,[actor.id,serial,rec.id]);
    await audit(db,actor.id,"COURSE_COMPLETION_ATTESTED","COMPLETION",rec.id,{serial});
    return {id:rec.id,serial,courseId:rec.course_id,studentId:rec.student_id};
   });
   send(res,200,{...result,documentType:"APPROVED_COURSE_COMPLETION_RECORD",notPilotLicence:true,regulatorCertificateNotIssuedBySoftware:true});return;
  }
  if(method==="GET"&&pathname==="/api/audit"){
   requireRole(actor,"read_audit");const {rows}=await pool.query("SELECT id,actor_id,action,resource,resource_id,recorded_at FROM academy_audit_events ORDER BY id DESC LIMIT 100");
   send(res,200,{events:rows});return;
  }
  fail(404,"Route not found");
 }catch(error){
  if(error instanceof RequestError){send(res,error.status,{error:error.message});return}
  if(error?.code==="23505"){send(res,409,{error:"Duplicate or previously recorded item"});return}
  if(error?.code==="23503"){send(res,409,{error:"Referenced resource does not exist"});return}
  console.error("private api failure",error?.code||error?.name||"unknown");
  send(res,500,{error:"Private Academy service error"});
 }
}
const server=http.createServer((req,res)=>{void handle(req,res)});
server.requestTimeout=15000;
server.headersTimeout=8000;
server.maxRequestsPerSocket=100;
pool.on("error",error=>console.error("PostgreSQL idle connection failure",error?.code||error?.name||"unknown"));

server.listen(httpPort,process.env.HOST||"127.0.0.1",()=>console.log("Academy private ATO service listening on "+httpPort+"; no regulator approval asserted."));
process.on("SIGTERM",()=>{server.close(()=>{void pool.end()})});
