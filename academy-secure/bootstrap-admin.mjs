// Create the first accountable-manager account once, from a private secret manager.
// Not a public HTTP endpoint. Do not store bootstrap secrets in GitHub or shell history.
import pg from "pg";
const {Pool}=pg;
import {validateEmail,hashPassword} from "./auth.mjs";
if(process.env.ACADEMY_ENABLE_BOOTSTRAP!=="true")throw Error("Explicit ACADEMY_ENABLE_BOOTSTRAP=true required");
if(!process.env.DATABASE_URL||!process.env.ACADEMY_BOOTSTRAP_EMAIL||!process.env.ACADEMY_BOOTSTRAP_PASSWORD)throw Error("Missing bootstrap settings");
const db=new URL(process.env.DATABASE_URL),local=["localhost","127.0.0.1"].includes(db.hostname);
if(!local&&!["verify-full","verify-ca"].includes(db.searchParams.get("sslmode")))throw Error("Remote DB must use verified TLS");
const email=validateEmail(process.env.ACADEMY_BOOTSTRAP_EMAIL);
const hash=await hashPassword(process.env.ACADEMY_BOOTSTRAP_PASSWORD);
const pool=new Pool({connectionString:process.env.DATABASE_URL});
const client=await pool.connect();
try{
 await client.query("BEGIN");
 await client.query("SELECT pg_advisory_xact_lock(948195)");
 const count=await client.query("SELECT COUNT(*)::int AS n FROM academy_users");
 if(count.rows[0].n!==0)throw Error("Bootstrap prohibited: users already exist");
 const {rows}=await client.query(`INSERT INTO academy_users(email,role,password_hash,adult_confirmed)
  VALUES($1,'accountable_manager',$2,true) RETURNING id`,[email,hash]);
 await client.query(`INSERT INTO academy_audit_events(actor_id,action,resource,resource_id)
  VALUES($1,'BOOTSTRAP_ACCOUNTABLE_MANAGER','USER',$2)`,[rows[0].id,rows[0].id]);
 await client.query("COMMIT");
 console.log("First accountable-manager account established. Remove bootstrap secrets from the environment immediately.");
}catch(e){await client.query("ROLLBACK");throw e}
finally{client.release();await pool.end()}
