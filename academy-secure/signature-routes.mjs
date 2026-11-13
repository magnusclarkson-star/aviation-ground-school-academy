// Private signature vault endpoints. Only the authenticated accountable
// manager can see, upload, replace or remove their OWN signature.
// All modifications require fresh password confirmation and origin checks.
import {decodePng,keyFromEnvironment,encryptSignature,decryptSignature,normalisePreferences,DEFAULT_PREFS} from "./signature-vault.mjs";
import {sha256,verifyPassword} from "./auth.mjs";

function denied(fail,actor){
 if(actor?.role!=="accountable_manager")fail(403,"Administrator access required");
}
function requireConfirmation(body,fail){
 if(body?.confirmOwnSignature!==true)fail(400,"Confirm you own this signature and permit private Academy storage");
}
async function authenticateAgain(body,actor,db,fail){
 const password=body?.confirmPassword;
 if(typeof password!=="string"||password.length<12||password.length>200)fail(400,"Re-enter the account password to authorise this action");
 const bucket=sha256("signature-admin-reauth:"+actor.id);
 const {rows:attempts}=await db.query(`SELECT attempts FROM academy_login_failures
  WHERE bucket=$1 AND last_at>now()-interval '15 minutes'`,[bucket]);
 if((attempts[0]?.attempts||0)>=5)fail(429,"Too many signature confirmation attempts; try later");
 const {rows}=await db.query("SELECT password_hash,active,disabled_at FROM academy_users WHERE id=$1",[actor.id]);
 if(!rows[0]||!rows[0].active||rows[0].disabled_at||!(await verifyPassword(password,rows[0].password_hash))){
  await db.query(`INSERT INTO academy_login_failures(bucket,attempts,last_at) VALUES($1,1,now())
  ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN academy_login_failures.last_at<now()-interval '15 minutes' THEN 1
  ELSE academy_login_failures.attempts+1 END,last_at=now()`,[bucket]);
  fail(403,"Password confirmation failed");
 }
 await db.query("DELETE FROM academy_login_failures WHERE bucket=$1",[bucket]);
}
export async function handleSignatureRoute({req,res,method,pathname,actor,db,transaction,audit,json,send,fail}){
 if(!pathname.startsWith("/api/admin/signature"))return false;
 denied(fail,actor);
 if(!["/api/admin/signature","/api/admin/signature/preview","/api/admin/signature/preferences"].includes(pathname))
  fail(404,"Signature route not found");
 if(method==="GET"&&pathname==="/api/admin/signature"){
  const {rows}=await db.query(`SELECT sha256,image_width,image_height,preferences,uploaded_at,changed_at
    FROM academy_admin_signatures WHERE owner_id=$1`,[actor.id]);
  const s=rows[0];
  send(res,200,{stored:!!s,
    encryptionConfigured:!!process.env.ACADEMY_SIGNATURE_ENCRYPTION_KEY,
    fingerprint:s?.sha256||null,width:s?.image_width||null,height:s?.image_height||null,
    uploadedAt:s?.uploaded_at||null,changedAt:s?.changed_at||null,
    preferences:s?.preferences||DEFAULT_PREFS,
    consent:"No certificate, stamp or transcript is signed by saving this image. Individual issuance still requires its own authorisation."});
  return true;
 }
 if(method==="GET"&&pathname==="/api/admin/signature/preview"){
  let key;try{key=keyFromEnvironment()}catch{fail(503,"Private signature encryption is not configured")}
  try{
   const {rows}=await db.query(`SELECT encrypted_png,nonce,auth_tag,sha256
    FROM academy_admin_signatures WHERE owner_id=$1`,[actor.id]);
   if(!rows[0])fail(404,"No administrator signature stored");
   const s=rows[0],clear=decryptSignature({
    ciphertext:s.encrypted_png,nonce:s.nonce,tag:s.auth_tag,sha256:s.sha256},key,actor.id);
   res.writeHead(200,{"Content-Type":"image/png","Cache-Control":"no-store, private",
    "X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY",
    "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
    "Content-Disposition":"inline; filename=\"private-academy-admin-signature.png\""});
   res.once("finish",()=>clear.fill(0));
   res.end(clear);
  }catch(e){if(e?.status)throw e;fail(500,"Private signature preview unavailable")}
  finally{key.fill(0)}
  return true;
 }
 if(method==="POST"&&pathname==="/api/admin/signature"){
  const body=await json(req,250000);
  requireConfirmation(body,fail);
  const preferences=normalisePreferences(body.preferences);
  await authenticateAgain(body,actor,db,fail);
  let clear,encrypted,key;
  try{
   clear=decodePng(body.pngBase64);
   key=keyFromEnvironment();
   encrypted=encryptSignature(clear,key,actor.id);
  }catch(e){
   if(String(e.message).includes("encryption key"))fail(503,"Private signature encryption must be configured before saving");
   fail(400,e.message);
  }finally{if(clear)clear.fill(0);if(key)key.fill(0)}
  const width=Buffer.from(body.pngBase64.slice(0,36),"base64").readUInt32BE(16);
  const height=Buffer.from(body.pngBase64.slice(0,36),"base64").readUInt32BE(20);
  const outcome=await transaction(async tx=>{
   const {rows}=await tx.query(`INSERT INTO academy_admin_signatures(
     owner_id,encrypted_png,nonce,auth_tag,sha256,image_width,image_height,preferences)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     ON CONFLICT(owner_id) DO UPDATE SET encrypted_png=EXCLUDED.encrypted_png,
       nonce=EXCLUDED.nonce,auth_tag=EXCLUDED.auth_tag,sha256=EXCLUDED.sha256,
       image_width=EXCLUDED.image_width,image_height=EXCLUDED.image_height,
       preferences=EXCLUDED.preferences,changed_at=now()
     RETURNING sha256,changed_at`,[actor.id,encrypted.ciphertext,encrypted.nonce,
       encrypted.tag,encrypted.sha256,width,height,JSON.stringify(preferences)]);
   await audit(tx,actor.id,"ADMIN_SIGNATURE_SAVED","ADMIN_SIGNATURE",actor.id,
    {fingerprint:rows[0].sha256,width,height,preferences,signingAuthorisation:"NONE_AUTOMATIC"});
   return rows[0];
  });
  encrypted.ciphertext.fill(0);
  send(res,200,{stored:true,fingerprint:outcome.sha256,changedAt:outcome.changed_at,
   preferences,warning:"Saved privately for optional use. No existing certificate or record was signed."});
  return true;
 }
 if(method==="POST"&&pathname==="/api/admin/signature/preferences"){
  const body=await json(req),preferences=normalisePreferences(body.preferences);
  await authenticateAgain(body,actor,db,fail);
  await transaction(async tx=>{
   const {rows}=await tx.query(`UPDATE academy_admin_signatures
      SET preferences=$1::jsonb,changed_at=now() WHERE owner_id=$2 RETURNING owner_id`,
      [JSON.stringify(preferences),actor.id]);
   if(!rows[0])fail(404,"Save your signature before setting usage permissions");
   await audit(tx,actor.id,"ADMIN_SIGNATURE_OPTIONS_CHANGED","ADMIN_SIGNATURE",actor.id,
     {preferences,signingAuthorisation:"NONE_AUTOMATIC"});
  });
  send(res,200,{saved:true,preferences,warning:"These are layout preferences, not automatic regulatory approval or signing authority."});
  return true;
 }
 if(method==="DELETE"&&pathname==="/api/admin/signature"){
  const body=await json(req);
  if(body.confirmRemove!==true)fail(400,"Explicit signature removal confirmation required");
  await authenticateAgain(body,actor,db,fail);
  await transaction(async tx=>{
   const {rows}=await tx.query("DELETE FROM academy_admin_signatures WHERE owner_id=$1 RETURNING sha256",[actor.id]);
   if(!rows[0])fail(404,"No saved signature to remove");
   await audit(tx,actor.id,"ADMIN_SIGNATURE_REMOVED","ADMIN_SIGNATURE",actor.id,
    {previousFingerprint:rows[0].sha256,encryptedBytesDeleted:true});
  });
  send(res,200,{stored:false,removed:true,
   notice:"Encrypted signature data removed from the active database. Backup retention depends on the private host's backup policy."});
  return true;
 }
 fail(405,"Method not allowed");
}
