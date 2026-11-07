/* Operator-only invite delivery. No public enrolment endpoint or token echo.
 * This command requires a configured verified email sender; no print-to-console
 * fallback can masquerade as verified inbox ownership.
 */
import {createPool} from "../src/postgres.mjs";
import {normalizeEmail,generateSecret,hashSha256} from "../src/crypto.mjs";
import {INVITE_LIFETIME_MS,checkDeliveryConfig,sendVerificationInvite} from "../src/invites.mjs";

const [slug,emailArg]=process.argv.slice(2);
if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug||"")){
 console.error("Usage: node scripts/send-invite.mjs <organisation-slug> <fictional-account-email>");
 process.exit(2);
}
const email=normalizeEmail(emailArg);
checkDeliveryConfig(process.env); // Refuse to create dead tokens without an email provider.
const pool=createPool(process.env);
const token=generateSecret(),hash=hashSha256(token);
const client=await pool.connect();
try{
 await client.query("BEGIN");
 const member=await client.query(`
  SELECT u.id,u.email_verified_at AS verified
  FROM users u JOIN memberships m ON m.user_id=u.id
   JOIN organizations o ON o.id=m.organization_id
  WHERE o.slug=$1 AND u.email=$2 AND u.status='active' AND m.status='active'
  FOR UPDATE OF u`,[slug,email]);
 if(member.rowCount!==1)throw Error("No active staging account with that email in the requested organisation");
 if(member.rows[0].verified)throw Error("Email already verified; no new invitation issued");
 const userId=member.rows[0].id;
 await client.query(`
  UPDATE email_verification_challenges SET consumed_at=now()
  WHERE user_id=$1 AND consumed_at IS NULL`,[userId]);
 await client.query(`
  INSERT INTO email_verification_challenges(user_id,token_hash,expires_at)
  VALUES($1,$2,$3)`,[userId,hash,new Date(Date.now()+INVITE_LIFETIME_MS)]);
 await client.query(`
  INSERT INTO audit_events(actor_user_id,action,target_type,target_id)
  VALUES(NULL,'bootstrap.email.invite','user',$1)`,[userId]);
 await client.query("COMMIT");
}catch(error){
 await client.query("ROLLBACK").catch(()=>{});
 throw error;
}finally{client.release()}
try{
 await sendVerificationInvite({to:email,token,env:process.env});
 console.info("Email provider accepted a single-use staging verification invitation for",email,"in",slug);
 console.info("Verification remains pending until the recipient deliberately confirms through the private portal.");
}catch{
 // The token is intentionally unavailable after process exit; rerun this command
 // after fixing delivery to revoke the undelivered challenge and issue a new one.
 console.error("Email delivery failed. Account stays unverified. Fix provider configuration and retry the invitation.");
 process.exitCode=1;
}
