// Private formal document fees, waivers, independent identity review and printable PDF release.
// Course completion records and transcript results are never created by payment.
import {calculateAward,validatePrice} from "./fees-policy.mjs";
import {STYLES,ACADEMY_STANDARD_STYLE,validateOptions,renderCourseCertificate,renderAcademicTranscript} from "./document-pdf.mjs";
import {courseApproved} from "./policy.mjs";
import {keyFromEnvironment,decryptSignature,DEFAULT_PREFS} from "./signature-vault.mjs";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const COURSE=/^[a-z][a-z0-9_-]{2,63}$/;
const KINDS=["CERTIFICATE","TRANSCRIPT"],AUDIENCES=["FORMAL","SCOUT","ENTHUSIAST","TRANSCRIPT"];
function assertOwner(actor,fail){if(actor.role!=="accountable_manager")fail(403,"Only Academy administrator may set document fees and release places")}
function string(body,key,min,max,fail){
 const v=body?.[key];if(typeof v!=="string"||v.trim().length<min||v.length>max)fail(400,"Invalid "+key);
 return v.trim();
}
function uuid(value,fail){if(typeof value!=="string"||!UUID.test(value))fail(400,"Invalid identifier");return value}
function kind(value,fail){if(!KINDS.includes(value))fail(400,"Document must be CERTIFICATE or TRANSCRIPT");return value}
function reason(value,fail){if(typeof value!=="string"||value.trim().length<8||value.length>1000)fail(400,"Document a reason of at least eight characters");return value.trim()}
async function evidence(db){
 const r=await db.query("SELECT * FROM academy_authority_evidence WHERE status='VERIFIED'");return r.rows;
}
function dateISO(value,fail){if(typeof value!=="string"||Number.isNaN(Date.parse(value)))fail(400,"Invalid date");return new Date(value).toISOString()}
async function layout(db,audience){
 const q=await db.query("SELECT * FROM academy_document_layouts WHERE id=$1",[audience]);
 return q.rows[0]||null; // fail closed until owner explicitly enables the layout
}
async function signatureFor(db,audience,options){
 if(!options.showSignature)return null;
 const {rows}=await db.query(`SELECT u.id AS owner_id,s.encrypted_png,s.nonce,s.auth_tag,s.sha256,s.preferences
  FROM academy_admin_signatures s JOIN academy_users u ON u.id=s.owner_id
  WHERE u.role='accountable_manager' AND u.active=true AND u.disabled_at IS NULL
  ORDER BY s.changed_at DESC LIMIT 1`);
 if(!rows[0])throw Error("Administrator signature is not stored in the private vault");
 const r=rows[0],pref=r.preferences||DEFAULT_PREFS;
 const permitted=audience==="TRANSCRIPT"?pref.transcripts:audience==="SCOUT"?pref.scoutCertificates:
  audience==="ENTHUSIAST"?pref.enthusiastCertificates:pref.formalCertificates;
 if(permitted!==true)throw Error("Administrator has not enabled the signature for this document type");
 const key=keyFromEnvironment();
 try{
  return decryptSignature({ciphertext:r.encrypted_png,nonce:r.nonce,tag:r.auth_tag,sha256:r.sha256},key,r.owner_id);
 }finally{key.fill(0)}
}
async function transcriptData(db,studentId,cutoff){
 const e=await db.query(`SELECT e.id,e.course_id,e.status,e.started_at,c.title,c.revision
   FROM academy_enrolments e JOIN academy_courses c ON c.id=e.course_id
   WHERE e.student_id=$1 AND e.started_at<=$2 ORDER BY e.started_at ASC LIMIT 100`,[studentId,cutoff]);
 const entries=[];
 for(const row of e.rows){
  const stages=await db.query(`SELECT DISTINCT ON(stage_key) stage_key,status,training_date,recorded_at
   FROM academy_training_stages WHERE enrolment_id=$1 AND recorded_at<=$2
   ORDER BY stage_key,recorded_at DESC,id DESC`,[row.id,cutoff]);
  const exams=await db.query(`SELECT status,assessment_date,blueprint_revision,recorded_at
   FROM academy_assessment_records WHERE enrolment_id=$1 AND recorded_at<=$2 ORDER BY recorded_at ASC LIMIT 35`,[row.id,cutoff]);
  const completed=await db.query(`SELECT status,serial,attested_at FROM academy_completion_requests
   WHERE enrolment_id=$1 AND attested_at<=$2 ORDER BY attested_at DESC LIMIT 1`,[row.id,cutoff]);
  entries.push({courseId:row.course_id,courseTitle:row.title,revision:row.revision,startedAt:row.started_at,
   enrolmentStatus:row.status,stages:stages.rows.map(s=>({stageKey:s.stage_key,status:s.status,trainingDate:s.training_date})),
   assessments:exams.rows.map(a=>({status:a.status,assessmentDate:a.assessment_date,blueprintRevision:a.blueprint_revision})),
   completion:completed.rows[0]?{status:completed.rows[0].status,serial:completed.rows[0].serial,attestedAt:completed.rows[0].attested_at}:null});
 }
 return entries;
}
function binaryPdf(res,bytes,filename,disposition="attachment"){
 if(!["attachment","inline"].includes(disposition))throw Error("Unsafe PDF content disposition");
 res.writeHead(200,{"Content-Type":"application/pdf","Content-Disposition":disposition+'; filename="'+filename+'"',
  "Content-Length":bytes.length,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy":"no-referrer"});res.end(Buffer.from(bytes));
}
export async function handleDocumentRoute({req,res,method,pathname,actor,db,transaction,audit,json,send,fail}){
 if(!(pathname.startsWith("/api/admin/documents")||pathname.startsWith("/api/my/documents")))return false;
 const preview=/^\/api\/admin\/documents\/preview\/(FORMAL|SCOUT|ENTHUSIAST|TRANSCRIPT)$/.exec(pathname);
 if(method==="GET"&&preview){
  assertOwner(actor,fail);
  const audience=preview[1],stored=await layout(db,audience);
  const defaults={FORMAL:"FORMAL_TRADITIONAL",SCOUT:"SCOUT_MODERN",
   ENTHUSIAST:"ENTHUSIAST_NAVY_GOLD",TRANSCRIPT:"FORMAL_TRADITIONAL"};
  let options;
  try{options=validateOptions(stored?.options||{showSeal:true})}
  catch{fail(409,"Fix the saved certificate display options before printing a sample")}
  // Samples may show a seal but intentionally NEVER expose an encrypted owner
  // signature or any real student identity, result or receipt data.
  options={...options,showSignature:false,showQrVerification:false};
  let bytes;
  if(audience==="TRANSCRIPT"){
   bytes=await renderAcademicTranscript({
    name:"Example Academic Learner",studentId:"SAMPLE-STUDENT-NO-IDENTITY",
    issuedAt:"2026-11-13T12:00:00Z",releaseId:"SAMPLE-NOT-ISSUED",
    entries:[{courseId:"aviation-safety-basics",courseTitle:"Aviation Safety Foundations",
      revision:"DEMONSTRATION",startedAt:"2026-01-01",enrolmentStatus:"DEMO",
      stages:[{stageKey:"training-exercise",status:"DEMO",trainingDate:"2026-02-01"}],
      assessments:[],completion:null}],verifiedIdentity:false
   },{options,sample:true});
  }else{
   // Permanent standard specimen: no uploaded certificate image is required.
   // This owner-only endpoint still uses fictional data and a sample watermark.
   bytes=await renderCourseCertificate({
    name:"Example Academy Learner",serial:"AGSA-COURSE-"+"0".repeat(24),
    courseTitle:audience==="FORMAL"?"Aircraft Accident & Incident Investigation":
     audience==="SCOUT"?"Air Scouts Aviation Foundations":"Aviation Ground School Foundations",
    issuedAt:"2026-11-13T12:00:00Z",completedAt:"2026-11-13T12:00:00Z",
    verifiedAcademicRecord:true
   },{style:ACADEMY_STANDARD_STYLE,options,sample:true});
  }
  binaryPdf(res,bytes,"agsa-"+audience.toLowerCase()+"-sample-not-issued.pdf","inline");
  return true;
 }

 if(method==="GET"&&pathname==="/api/my/documents"){
  if(actor.role!=="student")fail(403,"Private student record access only");
  const {rows}=await db.query(`SELECT g.id,g.kind,g.course_id,g.grant_type,g.status,g.payable_minor,
   g.currency,g.created_at,g.activated_at,c.title AS course_title
   FROM academy_document_release_grants g LEFT JOIN academy_courses c ON c.id=g.course_id
   WHERE g.student_id=$1 ORDER BY g.created_at DESC LIMIT 100`,[actor.id]);
  send(res,200,{documents:rows,warning:"Document access is separate from training qualification and SLCAA approval."});return true;
 }
 const download=/^\/api\/my\/documents\/([a-f0-9-]{36})\/(download|print)$/.exec(pathname);
 if(method==="GET"&&download){
  if(actor.role!=="student")fail(403,"Only the student can download their formal documents");
  const grantId=uuid(download[1],fail);
  const {rows}=await db.query(`SELECT g.*,p.kind AS price_kind
   FROM academy_document_release_grants g JOIN academy_document_fee_plans p ON p.id=g.fee_plan_id
   WHERE g.id=$1 AND g.student_id=$2`,[grantId,actor.id]);
  const grant=rows[0];if(!grant||grant.status!=="ACTIVE"||!grant.activated_at)fail(403,"This document has not been released by the Academy");
  const {rows:people}=await db.query("SELECT legal_name FROM academy_student_document_identity WHERE student_id=$1",[actor.id]);
  if(!people[0])fail(403,"Independent student identity verification is required for formal documents");
  const audience=grant.kind==="TRANSCRIPT"?"TRANSCRIPT":(
   await db.query("SELECT audience FROM academy_course_certificate_templates WHERE course_id=$1",[grant.course_id])
  ).rows[0]?.audience||"FORMAL";
  const settings=await layout(db,audience);
  if(!settings||!settings.enabled)fail(403,"Document printing has been held by the Academy administrator");
  let opts;
  try{opts=validateOptions(settings.options)}catch{fail(409,"Admin document options need correction")}
  let png=null,document;
  try{
   if(grant.kind==="CERTIFICATE"){
    const {rows:completed}=await db.query(`SELECT r.serial,r.attested_at,e.course_id,c.title,c.revision
    FROM academy_completion_requests r JOIN academy_enrolments e ON e.id=r.enrolment_id
    JOIN academy_courses c ON c.id=e.course_id
    WHERE r.id=$1 AND e.student_id=$2 AND e.course_id=$3 AND r.status='ISSUED'`,[grant.completion_id,actor.id,grant.course_id]);
    if(!completed[0])fail(409,"Staff-attested course completion has not been verified");
    const docs=await evidence(db);
    if(!courseApproved(docs,grant.course_id))fail(403,"Current course regulatory approval cannot be confirmed");
    png=await signatureFor(db,audience,opts);
    // Document grants, identity verification, approved course evidence and
    // staff-attested completion remain required. Only the decoration is fixed.
    document=await renderCourseCertificate({
     name:people[0].legal_name,serial:completed[0].serial,courseTitle:completed[0].title,
     completedAt:completed[0].attested_at,issuedAt:grant.activated_at,verifiedAcademicRecord:true
    },{style:ACADEMY_STANDARD_STYLE,options:opts,signaturePng:png});
   }else{
    const entries=await transcriptData(db,actor.id,grant.activated_at);
    if(!entries.length)fail(409,"No private course records exist for this transcript");
    png=await signatureFor(db,audience,opts);
    document=await renderAcademicTranscript({
     name:people[0].legal_name,studentId:actor.id,issuedAt:grant.activated_at,
     releaseId:grant.id,entries,verifiedIdentity:true
    },{options:opts,signaturePng:png});
   }
  }catch(e){if(e?.status)throw e;fail(409,"Document cannot be printed: "+String(e.message).slice(0,160))}
  finally{if(png)png.fill(0)}
  await transaction(tx=>audit(tx,actor.id,"DOCUMENT_PDF_DOWNLOADED","DOCUMENT_RELEASE",grant.id,{kind:grant.kind}));
  binaryPdf(res,document,"agsa-"+grant.kind.toLowerCase()+"-"+grant.id.slice(0,8)+".pdf",download[2]==="print"?"inline":"attachment");
  return true;
 }
 if(method==="GET"&&pathname==="/api/admin/documents/identity-pending"){
  if(actor.role!=="quality_manager")fail(403,"Quality manager required");
  const {rows}=await db.query(`SELECT u.id,u.email,d.verified_at
   FROM academy_users u LEFT JOIN academy_student_document_identity d ON d.student_id=u.id
   WHERE u.role='student' AND u.active=true ORDER BY u.created_at DESC LIMIT 150`);
  send(res,200,{students:rows});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/documents/verify-identity"){
  if(actor.role!=="quality_manager")fail(403,"Independent quality manager required");
  const b=await json(req),studentId=uuid(b.studentId,fail),name=string(b,"legalName",3,160,fail);
  if(!/^[a-f0-9]{64}$/i.test(b.evidenceSha256||""))fail(400,"Verified private evidence fingerprint required");
  const result=await transaction(async tx=>{
   const {rows:students}=await tx.query("SELECT id FROM academy_users WHERE id=$1 AND role='student' AND active=true",[studentId]);
   if(!students[0])fail(404,"Student not found");
   const {rows}=await tx.query(`INSERT INTO academy_student_document_identity(student_id,legal_name,evidence_sha256,verified_by)
    VALUES($1,$2,$3,$4) ON CONFLICT(student_id) DO UPDATE SET
    legal_name=EXCLUDED.legal_name,evidence_sha256=EXCLUDED.evidence_sha256,
    verified_by=EXCLUDED.verified_by,verified_at=now() RETURNING student_id,verified_at`,
    [studentId,name,b.evidenceSha256,actor.id]);
   await audit(tx,actor.id,"IDENTITY_REVIEWED","STUDENT",studentId,{evidenceHash:b.evidenceSha256});
   return rows[0];
  });
  send(res,200,{identityVerifiedForDocumentRelease:true,review:result});return true;
 }
 assertOwner(actor,fail);
 if(method==="GET"&&pathname==="/api/admin/documents/fees"){
  const {rows}=await db.query(`SELECT p.*,c.title FROM academy_document_fee_plans p
   LEFT JOIN academy_courses c ON c.id=p.course_id ORDER BY p.created_at DESC LIMIT 300`);
  send(res,200,{plans:rows});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/documents/fees"){
  const b=await json(req),documentKind=kind(b.kind,fail);
  const courseId=documentKind==="CERTIFICATE"?string(b,"courseId",3,64,fail):null;
  if(courseId&&!COURSE.test(courseId))fail(400,"Invalid course key");
  let input;try{input=validatePrice({countryCode:b.countryCode,currency:b.currency,billingPeriod:"ONE_TIME",amountMinor:b.amountMinor})}
  catch(e){fail(400,e.message)}
  const result=await transaction(async tx=>{
   if(courseId){const check=await tx.query("SELECT id FROM academy_courses WHERE id=$1 FOR UPDATE",[courseId]);if(!check.rows[0])fail(404,"Course not found")}
   await tx.query(`UPDATE academy_document_fee_plans SET status='ARCHIVED',archived_at=now()
    WHERE kind=$1 AND course_id IS NOT DISTINCT FROM $2 AND country_code=$3 AND currency=$4 AND status='ACTIVE'`,
    [documentKind,courseId,input.countryCode,input.currency]);
   const {rows}=await tx.query(`INSERT INTO academy_document_fee_plans(kind,course_id,country_code,currency,amount_minor,created_by)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [documentKind,courseId,input.countryCode,input.currency,input.amountMinor,actor.id]);
   await audit(tx,actor.id,"DOCUMENT_FEE_CHANGED","DOCUMENT_FEE",rows[0].id,{kind:documentKind,courseId,amountMinor:input.amountMinor,currency:input.currency});
   return rows[0];
  });
  send(res,201,{feePlan:result,notice:"Document printing fee only; this does not change tuition or academic results"});return true;
 }
 if(method==="GET"&&pathname==="/api/admin/documents/layouts"){
  const r=await db.query("SELECT * FROM academy_document_layouts ORDER BY id");
  const m=await db.query("SELECT * FROM academy_course_certificate_templates");
  send(res,200,{layouts:r.rows,courses:m.rows,availableStyles:STYLES});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/documents/layouts"){
  const b=await json(req),audience=string(b,"audience",4,20,fail);
  if(!AUDIENCES.includes(audience)||!STYLES[b.style]||typeof b.enabled!=="boolean")fail(400,"Invalid design choices");
  let opts;try{opts=validateOptions(b.options)}catch(e){fail(400,e.message)}
  const data=await transaction(async tx=>{
   const {rows}=await tx.query(`INSERT INTO academy_document_layouts(id,style,enabled,options,changed_by)
    VALUES($1,$2,$3,$4::jsonb,$5) ON CONFLICT(id)
    DO UPDATE SET style=EXCLUDED.style,enabled=EXCLUDED.enabled,options=EXCLUDED.options,changed_by=EXCLUDED.changed_by,updated_at=now()
    RETURNING id,style,enabled,options,updated_at`,[audience,b.style,b.enabled,JSON.stringify(opts),actor.id]);
   await audit(tx,actor.id,"DOCUMENT_DESIGN_CONFIGURED","DOCUMENT_LAYOUT",audience,{style:b.style,enabled:b.enabled,options:opts});
   return rows[0];
  });
  send(res,200,{layout:data,regulatorSeal:false});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/documents/course-audience"){
  const b=await json(req),courseId=string(b,"courseId",3,64,fail),audience=string(b,"audience",4,20,fail);
  if(!COURSE.test(courseId)||!["FORMAL","SCOUT","ENTHUSIAST"].includes(audience))fail(400,"Invalid category");
  await transaction(async tx=>{
   await tx.query(`INSERT INTO academy_course_certificate_templates(course_id,audience,changed_by)
    VALUES($1,$2,$3) ON CONFLICT(course_id) DO UPDATE SET audience=$2,changed_by=$3,updated_at=now()`,
    [courseId,audience,actor.id]);
   await audit(tx,actor.id,"DOCUMENT_AUDIENCE_CHANGED","COURSE",courseId,{audience});
  });
  send(res,200,{courseId,audience});return true;
 }
 if(method==="GET"&&pathname==="/api/admin/documents/grants"){
  const {rows}=await db.query(`SELECT g.id,g.kind,g.student_id,u.email,g.course_id,g.status,g.grant_type,
   g.discount_bps,g.gross_minor,g.discount_minor,g.payable_minor,g.currency,g.reason,
   g.created_at,g.activated_at,g.completion_id FROM academy_document_release_grants g
   JOIN academy_users u ON u.id=g.student_id ORDER BY g.created_at DESC LIMIT 250`);
  send(res,200,{grants:rows});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/documents/grants"){
  const b=await json(req),studentId=uuid(b.studentId,fail),feeId=uuid(b.feePlanId,fail),
   documentKind=kind(b.kind,fail),why=reason(b.reason,fail),completionId=documentKind==="CERTIFICATE"?uuid(b.completionId,fail):null;
  const result=await transaction(async tx=>{
   const s=await tx.query("SELECT id FROM academy_users WHERE id=$1 AND role='student' AND active=true FOR SHARE",[studentId]);
   if(!s.rows[0])fail(404,"Active student not found");
   const verified=await tx.query("SELECT student_id FROM academy_student_document_identity WHERE student_id=$1",[studentId]);
   if(!verified.rows[0])fail(409,"Independent identity verification required before a document release grant");
   const {rows:plans}=await tx.query("SELECT * FROM academy_document_fee_plans WHERE id=$1 AND status='ACTIVE' FOR SHARE",[feeId]);
   const plan=plans[0];if(!plan||plan.kind!==documentKind)fail(409,"Document pricing is missing or has been archived");
   if(documentKind==="CERTIFICATE"){
    const {rows:completed}=await tx.query(`SELECT e.course_id FROM academy_completion_requests r
      JOIN academy_enrolments e ON e.id=r.enrolment_id WHERE r.id=$1 AND e.student_id=$2 AND r.status='ISSUED'`,
      [completionId,studentId]);
    if(!completed[0]||completed[0].course_id!==plan.course_id)fail(403,"Staff-attested course completion is required");
    if(!courseApproved(await evidence(tx),plan.course_id))fail(403,"An active verified course-approval record is required");
   }else{
    const {rows}=await tx.query("SELECT id FROM academy_enrolments WHERE student_id=$1 LIMIT 1",[studentId]);
    if(!rows[0])fail(409,"No academic training records available for a transcript");
   }
   let awarded;try{awarded=calculateAward({grossMinor:Number(plan.amount_minor),
    grantType:b.grantType,discountBps:b.discountBps})}catch(e){fail(400,e.message)}
   const {rows}=await tx.query(`INSERT INTO academy_document_release_grants
    (kind,student_id,course_id,completion_id,fee_plan_id,grant_type,discount_bps,gross_minor,
     discount_minor,payable_minor,country_code,currency,status,reason,created_by,activated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
      CASE WHEN $13='ACTIVE' THEN now() ELSE NULL END)
    RETURNING id,kind,student_id,course_id,status,grant_type,payable_minor,currency,activated_at`,
    [documentKind,studentId,plan.course_id,completionId,plan.id,b.grantType,b.discountBps,
     awarded.grossMinor,awarded.discountMinor,awarded.payableMinor,plan.country_code,
     plan.currency,awarded.status,why,actor.id]);
   await audit(tx,actor.id,"DOCUMENT_RELEASE_GRANTED","DOCUMENT_RELEASE",rows[0].id,
    {kind:documentKind,status:awarded.status,grantType:b.grantType,payableMinor:awarded.payableMinor});
   return rows[0];
  });
  send(res,201,{grant:result,printReady:result.status==="ACTIVE",note:"Document payment/waiver does not confer academic success"});return true;
 }
 const settle=/^\/api\/admin\/documents\/grants\/([a-f0-9-]{36})\/confirm-payment$/.exec(pathname);
 if(method==="POST"&&settle){
  const id=uuid(settle[1],fail),b=await json(req);
  const pay=b.amountMinor,hash=b.evidenceSha256;
  if(!Number.isSafeInteger(pay)||pay<=0||!(/^[a-f0-9]{64}$/i.test(hash||"")))fail(400,"Payment amount and evidence fingerprint required");
  const reference=string(b,"reference",6,250,fail),notes=string(b,"notes",12,1000,fail);
  const result=await transaction(async tx=>{
   const {rows}=await tx.query("SELECT * FROM academy_document_release_grants WHERE id=$1 FOR UPDATE",[id]);
   const grant=rows[0];if(!grant||grant.status!=="PENDING_PAYMENT")fail(409,"Document not awaiting payment");
   if(pay!==Number(grant.payable_minor))fail(409,"Payment must equal the outstanding document fee");
   await tx.query(`INSERT INTO academy_document_manual_settlements
    (grant_id,amount_minor,currency,payment_reference,evidence_sha256,notes,attested_by)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,pay,grant.currency,reference,hash,notes,actor.id]);
   await tx.query("UPDATE academy_document_release_grants SET status='ACTIVE',activated_at=now() WHERE id=$1",[id]);
   await audit(tx,actor.id,"DOCUMENT_FEE_ATTESTED","DOCUMENT_RELEASE",id,
    {amountMinor:pay,currency:grant.currency,reference,verifiedByGateway:false});
   return {id,status:"ACTIVE"};
  });
  send(res,200,{grant:result,notice:"Manually attested externally settled payment; no payment gateway transaction occurred"});return true;
 }
 const revoke=/^\/api\/admin\/documents\/grants\/([a-f0-9-]{36})\/revoke$/.exec(pathname);
 if(method==="POST"&&revoke){
  const id=uuid(revoke[1],fail),b=await json(req),why=reason(b.reason,fail);
  await transaction(async tx=>{
   const {rows}=await tx.query(`UPDATE academy_document_release_grants
    SET status='REVOKED',revoked_by=$1,revoked_at=now(),revoked_reason=$2
    WHERE id=$3 AND status IN ('ACTIVE','PENDING_PAYMENT') RETURNING id`,[actor.id,why,id]);
   if(!rows[0])fail(409,"Grant was not active or pending");
   await audit(tx,actor.id,"DOCUMENT_RELEASE_REVOKED","DOCUMENT_RELEASE",id,{reason:why});
  });
  send(res,200,{revoked:true,academicRecordsUnchanged:true});return true;
 }
 return false;
}
