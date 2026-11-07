import pg from "pg";
import {grantStatements,roleName} from "../src/grants.mjs";

const migrationUrl=process.env.AGSA_MIGRATION_DATABASE_URL;
const app=process.env.AGSA_APP_DB_ROLE;
const provision=process.env.AGSA_PROVISION_DB_ROLE;
if(!migrationUrl||!app||!provision)throw Error("AGSA_MIGRATION_DATABASE_URL, AGSA_APP_DB_ROLE and AGSA_PROVISION_DB_ROLE are required");
roleName(app);roleName(provision);
if(app===provision)throw Error("Application and provisioning roles must differ");
const ssl=process.env.PGSSL_MODE;
if(!["verify-full","disable"].includes(ssl))throw Error("Set explicit PGSSL_MODE");
if(process.env.NODE_ENV==="production"&&ssl!=="verify-full")throw Error("Production migrations require verified database TLS");
const pool=new pg.Pool({
 connectionString:migrationUrl,
 ssl:ssl==="verify-full"?{rejectUnauthorized:true}:undefined,
 max:1,connectionTimeoutMillis:5000
});
const client=await pool.connect();
try{
 await client.query("BEGIN");
 const roleData=await client.query(`
  SELECT r.rolname,r.rolsuper,r.rolcreatedb,r.rolcreaterole,r.rolreplication,r.rolbypassrls,
   pg_has_role(r.oid,(SELECT oid FROM pg_roles WHERE rolname=current_user),'MEMBER') AS inherits_owner
  FROM pg_roles r WHERE r.rolname = ANY($1::text[])`,[[app,provision]]);
 if(roleData.rows.length!==2)throw Error("Both pre-created PostgreSQL roles must exist");
 for(const row of roleData.rows){
  if(row.rolsuper||row.rolcreatedb||row.rolcreaterole||row.rolreplication||row.rolbypassrls||row.inherits_owner)
   throw Error("Refusing elevated privilege role "+row.rolname);
 }
 const owners=await client.query(`
  SELECT tablename,tableowner FROM pg_tables WHERE schemaname='public'
   AND tablename=ANY($1::text[])`,[["organizations","users","memberships","instructor_assignments","sessions","practice_attempts","feedback_drafts","login_throttles","audit_events","instructor_mfa","email_verification_challenges"]]);
 if(owners.rows.length!==11)throw Error("Run database migrations before granting privileges");
 if(owners.rows.some(x=>[app,provision].includes(x.tableowner)))
  throw Error("Runtime or provisioning role must not own database tables");
 for(const statement of grantStatements(app,provision))await client.query(statement);
 await client.query("COMMIT");
 console.log("Applied separate runtime/provision database permissions; no privileges granted to change or delete audit history.");
}catch(err){
 await client.query("ROLLBACK").catch(()=>{});
 throw err;
}finally{client.release();await pool.end()}
