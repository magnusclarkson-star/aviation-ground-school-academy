// Private staff MFA endpoints. Password-only sessions are deliberately partial
// and cannot access any Academy staff records or financial actions.
import {isStaff,newSecret,enrollmentUri,keyFromEnv,sealSecret,openSecret,verifyTotp} from "./staff-mfa.mjs";
import {cookieToken,sha256,verifyPassword} from "./auth.mjs";
export async function handleMfaRoute({req,res,method,pathname,actor,db,transaction,audit,json,send,fail,
 failureCount,incrementFailure,clientIp}){
 if(!pathname.startsWith("/api/mfa/"))return false;
 if(!isStaff(actor.role))fail(403,"Staff MFA is only available for invited Academy staff");
 const {rows}=await db.query("SELECT status FROM academy_staff_mfa WHERE user_id=$1",[actor.id]);
 const state=rows[0]?.status||"NONE";
 if(method==="GET"&&pathname==="/api/mfa/status"){
  send(res,200,{mfaRequired:true,mfaEnrolled:state==="ACTIVE",
   verified:!!actor.mfa_verified_at,setupAllowed:state!=="ACTIVE",
   notice:"Staff must finish authenticator verification before access to any private Academy records."});return true;
 }
 const ipKey=sha256("mfa-ip:"+clientIp(req)),userKey=sha256("mfa-user:"+actor.id);
 if(method==="POST"&&["/api/mfa/setup","/api/mfa/enable","/api/mfa/verify"].includes(pathname)){
  if(await failureCount(ipKey)>=15||await failureCount(userKey)>=8)
   fail(429,"Too many authenticator attempts; retry later");
  const body=await json(req);
  if(pathname==="/api/mfa/setup"){
   if(state==="ACTIVE")fail(409,"Authenticator already enrolled; account recovery requires independent administrator review");
   const {rows:passwordRows}=await db.query("SELECT password_hash FROM academy_users WHERE id=$1 AND active=true AND disabled_at IS NULL",[actor.id]);
   if(!await verifyPassword(body.confirmPassword,passwordRows[0]?.password_hash||"")){
    await Promise.all([incrementFailure(ipKey),incrementFailure(userKey)]);
    fail(403,"Password confirmation rejected");
   }
   const secret=newSecret(),sealed=sealSecret(secret,keyFromEnv(),actor.id);
   await transaction(async tx=>{
    await tx.query(`INSERT INTO academy_staff_mfa(user_id,secret_ciphertext,nonce,auth_tag,status,last_step)
      VALUES($1,$2,$3,$4,'PENDING',-1)
      ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=EXCLUDED.secret_ciphertext,
       nonce=EXCLUDED.nonce,auth_tag=EXCLUDED.auth_tag,status='PENDING',
       last_step=-1,changed_at=now()
      WHERE academy_staff_mfa.status='PENDING'`,
     [actor.id,sealed.ciphertext,sealed.nonce,sealed.authTag]);
    await audit(tx,actor.id,"MFA_SETUP_STARTED","STAFF_MFA",actor.id);
   });
   // Returned ONLY to this password-confirmed partial session, no audit or persistence
   // in browser; user transfers to an authenticator app once.
   send(res,200,{secret,uri:enrollmentUri(secret,actor.email),
    caution:"Store the authenticator securely. Account recovery is an offline administrator process; there are no bypass or backup codes in the portal."});
   return true;
  }
  if(actor.mfa_verified_at)fail(409,"This session is already MFA verified");
  const code=body.code,token=cookieToken(req.headers.cookie);
  if(!token)fail(401,"Session required");
  const sessionHash=sha256(token);
  const wanted=pathname==="/api/mfa/enable"?"PENDING":"ACTIVE";
  const attempt=await transaction(async tx=>{
   const {rows:locked}=await tx.query(`SELECT secret_ciphertext,nonce,auth_tag,last_step,status
    FROM academy_staff_mfa WHERE user_id=$1 FOR UPDATE`,[actor.id]);
   const record=locked[0];
   if(!record||record.status!==wanted)return {ok:false};
   const step=verifyTotp(openSecret(record,keyFromEnv(),actor.id),code,Date.now(),Number(record.last_step));
   if(step===null)return {ok:false};
   const m=await tx.query("UPDATE academy_staff_mfa SET status='ACTIVE',last_step=$1,changed_at=now() WHERE user_id=$2",[step,actor.id]);
   if(m.rowCount!==1)throw Error("MFA update failed");
   const q=await tx.query(`UPDATE academy_sessions SET mfa_verified_at=now()
    WHERE token_hash=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>now()`,[sessionHash,actor.id]);
   if(q.rowCount!==1)throw Error("Current MFA session expired");
   if(wanted==="PENDING"){
    await tx.query(`UPDATE academy_sessions SET revoked_at=now()
      WHERE user_id=$1 AND token_hash<>$2 AND revoked_at IS NULL`,[actor.id,sessionHash]);
   }
   await audit(tx,actor.id,wanted==="PENDING"?"MFA_ENROLLED":"MFA_VERIFIED","STAFF_MFA",actor.id);
   return {ok:true};
  });
  if(!attempt.ok){
   await Promise.all([incrementFailure(ipKey),incrementFailure(userKey)]);
   fail(403,"Invalid, reused or unavailable authenticator code");
  }
  await db.query("DELETE FROM academy_login_failures WHERE bucket=ANY($1::text[])",[[ipKey,userKey]]);
  send(res,200,{mfaVerified:true,signedIn:true,access:"STAFF_SESSION_VERIFIED"});
  return true;
 }
 fail(404,"Authenticator route not found");
}
