import http from "node:http";
import {createPool,PgStore} from "./postgres.mjs";
import {createHandler} from "./http.mjs";
import {parseEncryptionKey} from "./mfa.mjs";

const env=process.env;
const port=Number(env.PORT||3100);
const insecureLocal=env.AGSA_ALLOW_INSECURE_LOCAL==="1"&&env.NODE_ENV!=="production";
const host=insecureLocal?"127.0.0.1":env.HOST||"127.0.0.1";
if(!Number.isInteger(port)||port<1||port>65535)throw Error("Invalid PORT");
if(env.NODE_ENV==="production"&&(!env.AGSA_PUBLIC_ORIGIN?.startsWith("https://")||env.AGSA_ALLOW_INSECURE_LOCAL==="1"))
 throw Error("Refusing insecure production configuration");
if(env.NODE_ENV==="production"&&env.HOST!=="127.0.0.1"&&env.AGSA_PRIVATE_PROXY_CONFIRMED!=="1")
 throw Error("External production binding requires documented private TLS proxy isolation; set AGSA_PRIVATE_PROXY_CONFIRMED=1 after review");
const mfaKey=parseEncryptionKey(env.AGSA_MFA_ENCRYPTION_KEY);
const pool=createPool(env);
const store=new PgStore(pool);
await store.ping();
const server=http.createServer(createHandler(store,{
 nodeEnv:env.NODE_ENV,
 allowInsecureLocal:insecureLocal,
 publicOrigin:env.AGSA_PUBLIC_ORIGIN,
 mfaKey,
 aiEnv:env,
 logError:e=>console.error("[training-api] request failed",e?.code||e?.name||"unknown")
}));
server.requestTimeout=15000;
server.headersTimeout=12000;
server.keepAliveTimeout=5000;
await new Promise((resolve,reject)=>{
 server.once("error",reject);server.listen(port,host,resolve);
});
console.info("[training-api] listening on",host+":"+port,"— educational staging only; not a public accredited LMS");
async function shutdown(){
 server.close();
 await pool.end();
}
process.on("SIGINT",()=>{void shutdown().then(()=>process.exit(0));});
process.on("SIGTERM",()=>{void shutdown().then(()=>process.exit(0));});
