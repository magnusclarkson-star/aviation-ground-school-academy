import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createPool} from "../src/postgres.mjs";
const pool=createPool(process.env);
try{
 const file=path.join(path.dirname(fileURLToPath(import.meta.url)),"../sql/001_init.sql");
 const source=await readFile(file,"utf8");
 await pool.query(source);
 const tables=await pool.query("SELECT to_regclass('public.practice_attempts') AS attempts,to_regclass('public.feedback_drafts') AS feedback");
 if(!tables.rows[0].attempts||!tables.rows[0].feedback)throw Error("Migration validation failed");
 console.log("Training API schema created/verified. No accounts, student data or credentials were seeded.");
}finally{await pool.end()}
