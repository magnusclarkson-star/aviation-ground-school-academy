import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createPool} from "../src/postgres.mjs";
const pool=createPool(process.env);
try{
 const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),"../sql");
 for(const name of ["001_init.sql","002_instructor_mfa.sql","003_email_verification.sql","004_ai_usage.sql","005_realtime_voice.sql","006_realtime_call_registry.sql"]){
  const source=await readFile(path.join(dir,name),"utf8");
  await pool.query(source);
 }
 const tables=await pool.query("SELECT to_regclass('public.practice_attempts') AS attempts,to_regclass('public.feedback_drafts') AS feedback,to_regclass('public.instructor_mfa') AS mfa,to_regclass('public.email_verification_challenges') AS email_challenges,to_regclass('public.ai_daily_usage') AS ai_usage,to_regclass('public.realtime_voice_calls') AS voice_calls");
 if(!tables.rows[0].attempts||!tables.rows[0].feedback||!tables.rows[0].mfa||!tables.rows[0].email_challenges||!tables.rows[0].ai_usage||!tables.rows[0].voice_calls)throw Error("Migration validation failed");
 console.log("Training API schema created/verified. No accounts, student data or credentials were seeded.");
}finally{await pool.end()}
