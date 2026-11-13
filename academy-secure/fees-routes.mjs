// Separate finance/access routes from academic and SLCAA authorisation workflows.
// All prices/waivers/scholarships are controlled solely by accountable_manager.
// This service DOES NOT charge a card or verify a payment with a provider.
import {validatePrice,calculateAward,studentHasAccess,isOwner,financialAccessIsNotAccreditation} from "./fees-policy.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COURSE=/^[a-z][a-z0-9_-]{2,63}$/;
function validateId(id,fail){if(typeof id!=="string"||!UUID.test(id))fail(400,"Invalid record identifier");return id}
function owner(actor,fail){if(!isOwner(actor.role))fail(403,"Only the Academy administrator can manage fees, grants or scholarships")}
function requiredReason(value,fail,min=8){if(typeof value!=="string"||value.trim().length<min||value.length>1000)fail(400,"A documented reason is required");return value.trim()}
function castMinor(value,fail){
 if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0)fail(400,"Use a non-negative whole number of minor currency units");
 return value;
}
function approvalNotGranted(){return financialAccessIsNotAccreditation()}
const accessSelect=`SELECT g.id,g.course_id,g.student_id,g.grant_type,g.discount_bps,g.gross_minor,
 g.discount_minor,g.payable_minor,g.currency,g.country_code,g.billing_period,g.status,
 g.starts_at,g.expires_at,g.activated_at,g.awarded_at,g.revoked_at,g.revoked_reason,
 c.title AS course_title
 FROM academy_access_grants g JOIN academy_courses c ON c.id=g.course_id`;
export async function handleFeesRoute({req,res,method,pathname,actor,db,transaction,audit,json,send,fail}){
 if(method==="GET"&&pathname==="/api/my/access"){
  if(actor.role!=="student")fail(403,"Student access only");
  const {rows}=await db.query(accessSelect+" WHERE g.student_id=$1 ORDER BY g.awarded_at DESC LIMIT 100",[actor.id]);
  send(res,200,{accessGrants:rows,financialAccessDoesNotGrantAccreditation:approvalNotGranted()});return true;
 }
 const learn=/^\/api\/my\/courses\/([a-z][a-z0-9_-]{2,63})\/access$/.exec(pathname);
 if(method==="GET"&&learn){
  if(actor.role!=="student")fail(403,"Student access only");
  const {rows}=await db.query(accessSelect+" WHERE g.student_id=$1 AND g.course_id=$2 ORDER BY g.awarded_at DESC LIMIT 30",[actor.id,learn[1]]);
  if(!studentHasAccess(rows,learn[1]))fail(403,"No active administrator-approved course access");
  const {rows:course}=await db.query("SELECT id,title,revision,review_status,prerequisite_text FROM academy_courses WHERE id=$1",[learn[1]]);
  if(!course[0])fail(404,"Course not found");
  send(res,200,{course:course[0],contentAccess:"ACTIVE",regulatoryCredit:"NONE_BY_PAYMENT_OR_SCHOLARSHIP",
   note:"Academic course approval is independent of payment. Course materials are provided through the separately governed teaching programme."});return true;
 }
 if(method==="GET"&&pathname==="/api/admin/students"){
  owner(actor,fail);
  const {rows}=await db.query(`SELECT id,email,active,adult_confirmed FROM academy_users
   WHERE role='student' ORDER BY created_at DESC LIMIT 200`);
  send(res,200,{students:rows});return true;
 }
 if(method==="GET"&&pathname==="/api/admin/fees"){
  owner(actor,fail);
  const {rows}=await db.query(`SELECT p.id,p.course_id,c.title AS course_title,p.country_code,p.currency,
   p.billing_period,p.amount_minor,p.status,p.created_at,p.archived_at
   FROM academy_fee_plans p JOIN academy_courses c ON c.id=p.course_id
   ORDER BY p.created_at DESC LIMIT 300`);
  send(res,200,{plans:rows,notice:"Admin-set prices only. No payment provider is connected."});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/fees"){
  owner(actor,fail);
  const b=await json(req);
  const courseId=b.courseId;
  if(typeof courseId!=="string"||!COURSE.test(courseId))fail(400,"Invalid course identifier");
  let price;try{price=validatePrice(b)}catch(e){fail(400,e.message)}
  const plan=await transaction(async tx=>{
   const {rows:course}=await tx.query("SELECT id FROM academy_courses WHERE id=$1 FOR UPDATE",[courseId]);
   if(!course.length)fail(404,"Create the private course before setting a price");
   await tx.query(`UPDATE academy_fee_plans SET status='ARCHIVED',archived_at=now()
    WHERE course_id=$1 AND country_code=$2 AND currency=$3 AND billing_period=$4 AND status='ACTIVE'`,
    [courseId,price.countryCode,price.currency,price.billingPeriod]);
   const {rows}=await tx.query(`INSERT INTO academy_fee_plans
    (course_id,country_code,currency,billing_period,amount_minor,created_by)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id,course_id,country_code,currency,billing_period,amount_minor,status`,
    [courseId,price.countryCode,price.currency,price.billingPeriod,price.amountMinor,actor.id]);
   await audit(tx,actor.id,"FEE_PLAN_SET","FEE_PLAN",rows[0].id,
    {courseId,countryCode:price.countryCode,currency:price.currency,billingPeriod:price.billingPeriod,amountMinor:price.amountMinor});
   return rows[0];
  });
  send(res,201,{plan,notice:"Owner-controlled fee published; no learner has been charged or enrolled."});return true;
 }
 if(method==="GET"&&pathname==="/api/admin/grants"){
  owner(actor,fail);
  const {rows}=await db.query(`SELECT g.id,g.student_id,u.email AS student_email,g.course_id,
    c.title AS course_title,g.grant_type,g.discount_bps,g.gross_minor,g.discount_minor,
    g.payable_minor,g.currency,g.country_code,g.billing_period,g.status,g.reason,
    g.awarded_at,g.expires_at,g.revoked_reason
    FROM academy_access_grants g JOIN academy_users u ON u.id=g.student_id
    JOIN academy_courses c ON c.id=g.course_id ORDER BY g.awarded_at DESC LIMIT 200`);
  send(res,200,{grants:rows});return true;
 }
 if(method==="POST"&&pathname==="/api/admin/grants"){
  owner(actor,fail);const b=await json(req);
  const studentId=validateId(b.studentId,fail),planId=validateId(b.planId,fail);
  const reason=requiredReason(b.reason,fail),grantType=b.grantType,discountBps=b.discountBps;
  const grant=await transaction(async tx=>{
   const {rows:students}=await tx.query(`SELECT id FROM academy_users
    WHERE id=$1 AND role='student' AND active=true AND adult_confirmed=true FOR UPDATE`,[studentId]);
   if(!students[0])fail(409,"Active eligible adult student account required");
   const {rows:plans}=await tx.query("SELECT * FROM academy_fee_plans WHERE id=$1 AND status='ACTIVE' FOR SHARE",[planId]);
   if(!plans[0])fail(409,"The selected fee plan is no longer active");
   const plan=plans[0],grossMinor=Number(plan.amount_minor);
   let award;try{award=calculateAward({grossMinor,grantType,discountBps})}catch(e){fail(400,e.message)}
   await tx.query(`UPDATE academy_access_grants SET status='EXPIRED'
     WHERE student_id=$1 AND course_id=$2 AND status='ACTIVE' AND expires_at<=now()`,[studentId,plan.course_id]);
   const {rows}=await tx.query(`INSERT INTO academy_access_grants
      (student_id,course_id,fee_plan_id,grant_type,discount_bps,gross_minor,discount_minor,
       payable_minor,currency,country_code,billing_period,status,reason,awarded_by,expires_at,activated_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
       CASE $11 WHEN 'MONTHLY' THEN now()+interval '1 month'
                WHEN 'QUARTERLY' THEN now()+interval '3 months'
                WHEN 'YEARLY' THEN now()+interval '1 year' ELSE NULL END,
       CASE WHEN $12='ACTIVE' THEN now() ELSE NULL END)
      RETURNING id,student_id,course_id,grant_type,discount_bps,gross_minor,discount_minor,
       payable_minor,currency,country_code,billing_period,status,expires_at`,
      [studentId,plan.course_id,plan.id,grantType,discountBps,award.grossMinor,award.discountMinor,
       award.payableMinor,plan.currency,plan.country_code,plan.billing_period,award.status,reason,actor.id]);
   await audit(tx,actor.id,"ACCESS_AWARDED","ACCESS_GRANT",rows[0].id,
    {studentId,courseId:plan.course_id,grantType,discountBps,priceMinor:award.grossMinor,
     discountMinor:award.discountMinor,payableMinor:award.payableMinor,currency:plan.currency});
   return rows[0];
  });
  send(res,201,{grant,accessImmediatelyAvailable:grant.status==="ACTIVE",
   manualSettlementRequired:grant.status==="PENDING_PAYMENT",
   notice:"Scholarship and fee decisions affect learning access only, not academic awards or regulator accreditation."});return true;
 }
 const payment=/^\/api\/admin\/grants\/([0-9a-f-]{36})\/confirm-payment$/.exec(pathname);
 if(method==="POST"&&payment){
  owner(actor,fail);
  const b=await json(req),grantId=validateId(payment[1],fail);
  const amountMinor=castMinor(b.amountMinor,fail);
  const reference=typeof b.reference==="string"?b.reference.trim():"";
  const evidenceSha256=typeof b.evidenceSha256==="string"?b.evidenceSha256.trim():"";
  const notes=requiredReason(b.notes,fail,12);
  if(reference.length<6||reference.length>250||!/^[a-f0-9]{64}$/i.test(evidenceSha256))fail(400,"Provide a manual settlement reference and SHA-256 evidence fingerprint");
  const result=await transaction(async tx=>{
   const {rows}=await tx.query("SELECT * FROM academy_access_grants WHERE id=$1 FOR UPDATE",[grantId]);
   const grant=rows[0];
   if(!grant||grant.status!=="PENDING_PAYMENT")fail(409,"Only an unsettled access grant can be confirmed");
   if(grant.expires_at&&new Date(grant.expires_at).getTime()<=Date.now())fail(409,"Award expired before payment confirmation");
   if(amountMinor!==Number(grant.payable_minor))fail(409,"Manually confirmed amount must equal remaining payable amount");
   const p=await tx.query(`INSERT INTO academy_manual_payment_attestations
    (grant_id,amount_minor,currency,reference,evidence_sha256,notes,attested_by)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [grantId,amountMinor,grant.currency,reference,evidenceSha256,notes,actor.id]);
   await tx.query("UPDATE academy_access_grants SET status='ACTIVE',activated_at=now() WHERE id=$1",[grantId]);
   await audit(tx,actor.id,"MANUAL_PAYMENT_ATTESTED","ACCESS_GRANT",grantId,
    {evidenceId:p.rows[0].id,amountMinor,currency:grant.currency,
     declaration:"OWNER_ATTESTED_OUTSIDE_PLATFORM_NOT_GATEWAY_VERIFIED"});
   return {grantId,paymentAttestationId:p.rows[0].id,status:"ACTIVE"};
  });
  send(res,200,{...result,notice:"Owner-attested off-platform settlement. No payment was processed or bank-verified by the Academy."});return true;
 }
 const revoke=/^\/api\/admin\/grants\/([0-9a-f-]{36})\/revoke$/.exec(pathname);
 if(method==="POST"&&revoke){
  owner(actor,fail);const b=await json(req),grantId=validateId(revoke[1],fail),reason=requiredReason(b.reason,fail);
  const result=await transaction(async tx=>{
   const {rows}=await tx.query(`UPDATE academy_access_grants
    SET status='REVOKED',revoked_by=$1,revoked_at=now(),revoked_reason=$2
    WHERE id=$3 AND status IN ('ACTIVE','PENDING_PAYMENT') RETURNING id,student_id,course_id,status`,
    [actor.id,reason,grantId]);
   if(!rows[0])fail(409,"Grant already revoked, expired or not found");
   await audit(tx,actor.id,"ACCESS_REVOKED","ACCESS_GRANT",grantId,
    {studentId:rows[0].student_id,courseId:rows[0].course_id,reason});
   return rows[0];
  });
  send(res,200,{grant:result,academicRecordsPreserved:true});return true;
 }
 return false;
}
