import {createPool} from "../src/postgres.mjs";
import {hashPassword,normalizeEmail} from "../src/crypto.mjs";
import {newTotpSecret,parseEncryptionKey,encryptTotpSecret,provisioningUri} from "../src/mfa.mjs";
const [command,...args]=process.argv.slice(2);
if(!["org","user","assign","mfa"].includes(command)){
 console.error("Usage: npm run provision -- org <slug> <organisation-name> <country-code> | user <slug> <email> <student|instructor> | assign <slug> <instructor-email> <student-email> | mfa <slug> <instructor-email>");
 process.exit(2);
}
const pool=createPool(process.env);
async function findMember(client,slug,email,role){
 const r=await client.query(`SELECT m.user_id AS id,o.id AS org_id
 FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id
 WHERE u.email=$1 AND o.slug=$2 AND m.role=$3 AND m.status='active' AND u.status='active'`,
 [normalizeEmail(email),slug,role]);
 if(!r.rowCount)throw Error("Expected an active "+role+" membership in this organisation");
 return r.rows[0];
}
const client=await pool.connect();
try{
 await client.query("BEGIN");
 if(command==="org"){
  const [slug,name,country]=args;
  if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug||"")||
    typeof name!=="string"||name.length<2||name.length>160||
    !/^[A-Z]{2}$/.test(country||""))throw Error("Invalid organisation arguments");
  await client.query(`INSERT INTO organizations(slug,legal_name,country_code)
   VALUES($1,$2,$3) ON CONFLICT(slug) DO NOTHING`,[slug,name,country]);
  console.info("Organisation created if absent:",slug);
 }else if(command==="user"){
  const [slug,emailRaw,role]=args;
  if(!["student","instructor"].includes(role))throw Error("Allowed roles: student/instructor");
  const email=normalizeEmail(emailRaw),password=process.env.AGSA_PROVISION_PASSWORD;
  if(!password||Buffer.byteLength(password)<12)throw Error("Set AGSA_PROVISION_PASSWORD from secure environment for this one-time manual provision; never print or commit it");
  const org=await client.query("SELECT id FROM organizations WHERE slug=$1",[slug]);
  if(!org.rowCount)throw Error("Organisation not found — run provision org first");
  const passHash=await hashPassword(password);
  const inserted=await client.query(`INSERT INTO users(email,password_hash) VALUES($1,$2)
     ON CONFLICT(email) DO NOTHING RETURNING id`,[email,passHash]);
  if(!inserted.rowCount)throw Error("Account already exists; no password or membership was changed");
  const uid=inserted.rows[0].id,oid=org.rows[0].id;
  await client.query("INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3)",[uid,oid,role]);
  await client.query(`INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id)
   VALUES(NULL,$1,'bootstrap.account.create','user',$2)`,[oid,uid]);
  console.info("Staging-only account provisioned:",role,email,"in",slug,"(no approval or licence implied)");
 }else if(command==="mfa"){
  const [slug,instructorEmail]=args;
  const encryptionKey=parseEncryptionKey(process.env.AGSA_MFA_ENCRYPTION_KEY);
  const teacher=await findMember(client,slug,instructorEmail,"instructor");
  const secret=newTotpSecret();
  const encrypted=encryptTotpSecret(secret,encryptionKey);
  const inserted=await client.query(`
    INSERT INTO instructor_mfa(organization_id,instructor_id,encrypted_secret)
    VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING instructor_id`,
    [teacher.org_id,teacher.id,encrypted]);
  if(!inserted.rowCount)throw Error("MFA already enrolled; use a separate verified recovery process, never silently replace the existing secret");
  await client.query(`
   INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id)
   VALUES(NULL,$1,'bootstrap.mfa.enroll','instructor_mfa',$2)`,[teacher.org_id,teacher.id]);
  // Reveal the one-time setup URI only to this trusted interactive operator,
  // never to application logs, GitHub, screenshots or unverified email.
  await client.query("COMMIT");
  console.info("IMPORTANT: show this one-time URI only to the intended fictional staging instructor in a trusted channel.");
  console.info(provisioningUri(normalizeEmail(instructorEmail),secret));
  console.info("MFA enrolment committed. Delete this terminal output and verify a working authenticator before relying on the staging account.");
  process.exit(0);
 }else if(command==="assign"){
  const [slug,instructorEmail,studentEmail]=args;
  const teacher=await findMember(client,slug,instructorEmail,"instructor");
  const learner=await findMember(client,slug,studentEmail,"student");
  await client.query(`INSERT INTO instructor_assignments(organization_id,instructor_id,student_id,active)
    VALUES($1,$2,$3,true)
    ON CONFLICT(organization_id,instructor_id,student_id) DO UPDATE SET active=true`,
    [teacher.org_id,teacher.id,learner.id]);
  await client.query(`INSERT INTO audit_events(actor_user_id,organization_id,action,target_type,target_id)
   VALUES(NULL,$1,'bootstrap.assignment.set','student_assignment',$2)`,[teacher.org_id,learner.id]);
  console.info("Created staging instructor-student assignment in",slug);
 }
 await client.query("COMMIT");
}catch(error){
 await client.query("ROLLBACK").catch(()=>{});
 console.error("Provision operation failed:",error.message);
 process.exitCode=1;
}finally{client.release();await pool.end()}
