/* Production gates for the separately hosted private Academy records service.
 * These checks do NOT establish MFA, hosting security, payment verification or
 * regulator approval. The live portal stays closed until explicitly opened. */
const STATES=Object.freeze(["closed","restricted"]);
function isValidPort(value){
 const n=Number(value);
 return Number.isInteger(n)&&n>=1&&n<=65535;
}
function isExactBaseOrigin(value){
 try{
  const u=new URL(value);
  return ["http:","https:"].includes(u.protocol)&&!!u.hostname&&u.pathname==="/"&&
   !u.username&&!u.password&&!u.search&&!u.hash&&u.origin===value.replace(/\/$/,"");
 }catch{return false}
}
function isEncryptionKey(value){
 if(typeof value!=="string"||!/(?:[A-Za-z0-9+/]{43}=)/.test(value))return false;
 const bytes=Buffer.from(value,"base64");
 return bytes.length===32&&bytes.toString("base64")===value;
}
export function validateDeploymentSettings(env){
 if(!env||typeof env!=="object")throw Error("Deployment environment is required");
 const production=env.NODE_ENV==="production";
 const accessState=env.ACADEMY_ACCESS_STATE||(production?"closed":"restricted");
 if(!STATES.includes(accessState))throw Error("ACADEMY_ACCESS_STATE must be closed or restricted");
 if(!isValidPort(env.PORT||8787))throw Error("Invalid private service PORT");
 const host=env.HOST||"127.0.0.1";
 if(!["127.0.0.1","localhost","0.0.0.0"].includes(host))throw Error("Invalid private service HOST");
 if(env.RENDER&&env.RENDER!=="false"&&host!=="0.0.0.0")
  throw Error("Render requires HOST=0.0.0.0 and the assigned PORT");
 if(!isExactBaseOrigin(env.ACADEMY_ORIGIN))throw Error("ACADEMY_ORIGIN must be an exact base origin");
 let database;
 try{database=new URL(env.DATABASE_URL)}catch{throw Error("DATABASE_URL must be a valid PostgreSQL URL")}
 if(!["postgres:","postgresql:"].includes(database.protocol)||!database.hostname)
  throw Error("DATABASE_URL must be a valid PostgreSQL URL");
 if(production){
  const origin=new URL(env.ACADEMY_ORIGIN);
  if(origin.protocol!=="https:")throw Error("Production Academy origin must be HTTPS");
  if(origin.hostname.endsWith(".invalid")||["localhost","127.0.0.1"].includes(origin.hostname))
   throw Error("Production Academy origin must not be a placeholder or localhost");
  if(["localhost","127.0.0.1"].includes(database.hostname)||database.searchParams.get("sslmode")!=="verify-full")
   throw Error("Production private PostgreSQL must be remote with sslmode=verify-full");
  if(!isEncryptionKey(env.ACADEMY_SIGNATURE_ENCRYPTION_KEY))
   throw Error("Production must have a dedicated base64 32-byte signature encryption key");
  if(env.ACADEMY_ENABLE_BOOTSTRAP==="true")throw Error("Disable account bootstrap before production server startup");
 }
 return Object.freeze({production,accessState,host,port:Number(env.PORT||8787),
  origin:new URL(env.ACADEMY_ORIGIN).origin,readyToAcceptRequests:accessState==="restricted"});
}
