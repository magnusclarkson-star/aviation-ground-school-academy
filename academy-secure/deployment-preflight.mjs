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
// Render's internal PostgreSQL endpoints use self-signed TLS certificates.
// They cannot support verify-full. Permit a narrowly scoped TLS-only route
// exclusively on Render's private network. All other production connections
// must keep hostname-verified TLS. See Render Postgres documentation.
export function validateDatabaseTransport(env){
 if(!env||typeof env!=="object")throw Error("Database environment required");
 let url;
 try{url=new URL(env.DATABASE_URL)}catch{throw Error("DATABASE_URL must be a valid PostgreSQL URL")}
 if(!["postgres:","postgresql:"].includes(url.protocol)||!url.hostname)
  throw Error("DATABASE_URL must be a valid PostgreSQL URL");
 const local=["localhost","127.0.0.1"].includes(url.hostname);
 const network=env.ACADEMY_DB_NETWORK||"verified";
 if(!["verified","render-private"].includes(network))
  throw Error("Unknown Academy database network policy");
 if(network==="render-private"){
  // Require both the provider's built-in service indicator and an exact,
  // single-label Render-internal Postgres hostname. No public host or arbitrary
  // domain is accepted; even Render external .render.com URLs are rejected.
  if(env.NODE_ENV!=="production"||env.RENDER!=="true"||
     !/^dpg-[a-z0-9-]+-a$/.test(url.hostname)||url.hostname.includes("..")||
     url.searchParams.get("sslmode")!=="require"||
     url.searchParams.get("uselibpqcompat")!=="true"||
     url.searchParams.has("sslrootcert")||url.searchParams.has("sslcert")||
     url.searchParams.has("sslkey")||url.searchParams.has("ssl"))
   throw Error("Render private database requires internal dpg host and TLS-only sslmode=require with uselibpqcompat=true");
  return Object.freeze({network,transport:"render-private-tls",hostnameVerified:false});
 }
 if(env.NODE_ENV==="production"&&(local||url.searchParams.get("sslmode")!=="verify-full"))
  throw Error("Production private PostgreSQL must be remote with sslmode=verify-full");
 if(env.NODE_ENV!=="production"&&!local&&
   !["verify-full","verify-ca"].includes(url.searchParams.get("sslmode")))
  throw Error("Remote database must use validated TLS outside Render private mode");
 return Object.freeze({network,transport:local?"local-only":"verified-tls",hostnameVerified:!local});
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
 const transport=validateDatabaseTransport(env);
 if(production){
  const origin=new URL(env.ACADEMY_ORIGIN);
  if(origin.protocol!=="https:")throw Error("Production Academy origin must be HTTPS");
  if([".invalid",".example",".test"].some(suffix=>origin.hostname.endsWith(suffix))||["localhost","127.0.0.1"].includes(origin.hostname))
   throw Error("Production Academy origin must not be a placeholder or localhost");
  if(!isEncryptionKey(env.ACADEMY_SIGNATURE_ENCRYPTION_KEY))
   throw Error("Production must have a dedicated base64 32-byte signature encryption key");
  if(!isEncryptionKey(env.ACADEMY_TOTP_ENCRYPTION_KEY)||env.ACADEMY_TOTP_ENCRYPTION_KEY===env.ACADEMY_SIGNATURE_ENCRYPTION_KEY)
   throw Error("Production must have a separate 32-byte base64 staff MFA encryption key");
  if(env.ACADEMY_ENABLE_BOOTSTRAP==="true")throw Error("Disable account bootstrap before production server startup");
 }
 return Object.freeze({production,accessState,host,port:Number(env.PORT||8787),
  origin:new URL(env.ACADEMY_ORIGIN).origin,dbTransport:transport.transport,readyToAcceptRequests:accessState==="restricted"});
}
