import test from "node:test";
import assert from "node:assert/strict";
import {validateDeploymentSettings,validateDatabaseTransport} from "../deployment-preflight.mjs";
import pg from "pg";

const base={NODE_ENV:"test",ACADEMY_ORIGIN:"http://127.0.0.1:8871",
 DATABASE_URL:"postgresql://test:pass@127.0.0.1:5432/academy",HOST:"127.0.0.1",PORT:"8871"};
const secure={...base,NODE_ENV:"production",ACADEMY_ORIGIN:"https://records.academy-training.org",
 DATABASE_URL:"postgresql://app:secret@db.academy.example/academy?sslmode=verify-full",
 ACADEMY_SIGNATURE_ENCRYPTION_KEY:Buffer.alloc(32,34).toString("base64"),
 ACADEMY_TOTP_ENCRYPTION_KEY:Buffer.alloc(32,53).toString("base64"),HOST:"0.0.0.0",PORT:"10000",
 RENDER:"true"};
test("local development and CI can use deliberately restricted access",()=>{
 const cfg=validateDeploymentSettings(base);
 assert.equal(cfg.production,false);assert.equal(cfg.accessState,"restricted");
 assert.equal(cfg.readyToAcceptRequests,true);
 assert.equal(cfg.host,"127.0.0.1");assert.equal(cfg.port,8871);
});
test("production defaults closed even with TLS and a configured signature key",()=>{
 const cfg=validateDeploymentSettings(secure);
 assert.equal(cfg.production,true);assert.equal(cfg.accessState,"closed");
 assert.equal(cfg.readyToAcceptRequests,false);
 assert.equal(cfg.origin,"https://records.academy-training.org");
 assert.equal(cfg.host,"0.0.0.0");
 assert.ok(!JSON.stringify(cfg).includes("secret"));
 assert.ok(!JSON.stringify(cfg).includes("AAAA"));
 const restricted=validateDeploymentSettings({...secure,ACADEMY_ACCESS_STATE:"restricted"});
 assert.equal(restricted.readyToAcceptRequests,true);
});
test("production enforces exact HTTPS origin, verified database TLS and signature key",()=>{
 const invalid=[
  [{...secure,ACADEMY_ORIGIN:"http://records.academy.example"},/HTTPS/],
  [{...secure,ACADEMY_ORIGIN:"https://example.invalid"},/placeholder/],
  [{...secure,ACADEMY_ORIGIN:"https://records.academy.example"},/placeholder/],
  [{...secure,ACADEMY_ORIGIN:"https://127.0.0.1"},/localhost/],
  [{...secure,DATABASE_URL:"postgresql://app:pass@db.academy.example/academy"},/verify-full/],
  [{...secure,DATABASE_URL:"postgresql://app:pass@db.academy.example/academy?sslmode=verify-ca"},/verify-full/],
  [{...secure,DATABASE_URL:"postgresql://app:pass@127.0.0.1/academy?sslmode=verify-full"},/remote/],
  [{...secure,ACADEMY_SIGNATURE_ENCRYPTION_KEY:"fake"},/encryption key/],
  [{...secure,ACADEMY_SIGNATURE_ENCRYPTION_KEY:Buffer.alloc(16).toString("base64")},/encryption key/],
  [{...secure,ACADEMY_TOTP_ENCRYPTION_KEY:undefined},/MFA encryption key/],
  [{...secure,ACADEMY_TOTP_ENCRYPTION_KEY:secure.ACADEMY_SIGNATURE_ENCRYPTION_KEY},/MFA encryption key/],
  [{...secure,ACADEMY_ENABLE_BOOTSTRAP:"true"},/bootstrap/]
 ];
 for(const [env,pattern] of invalid)assert.throws(()=>validateDeploymentSettings(env),pattern);
});
test("private runtime rejects invalid bind values, origins and state",()=>{
 const invalid=[
  [{...base,HOST:"8.8.8.8"},/HOST/],
  [{...base,RENDER:"true"},/Render requires/],
  [{...base,PORT:"0"},/PORT/],
  [{...base,PORT:"65536"},/PORT/],
  [{...base,ACADEMY_ACCESS_STATE:"open"},/ACCESS_STATE/],
  [{...base,ACADEMY_ORIGIN:"http://127.0.0.1:8871/extra"},/base origin/],
  [{...base,ACADEMY_ORIGIN:"http://user:pw@127.0.0.1:8871"},/base origin/],
  [{...base,ACADEMY_ORIGIN:"http://127.0.0.1:8871?a=1"},/base origin/],
  [{...base,DATABASE_URL:"sqlite:///tmp"},/PostgreSQL/],
  [{...base,DATABASE_URL:"not-a-url"},/PostgreSQL/],
  [null,/environment/]
 ];
 for(const [env,pattern] of invalid)assert.throws(()=>validateDeploymentSettings(env),pattern);
});


test("Render private PostgreSQL supports only named internal dpg TLS endpoint",()=>{
 const internal="postgresql://academy_app:opaque@dpg-cpg6dm3etma73ag7u0-a/agsa_private_staging?sslmode=require&uselibpqcompat=true";
 const env={...secure,DATABASE_URL:internal,ACADEMY_DB_NETWORK:"render-private"};
 const network=validateDatabaseTransport(env);
 assert.equal(network.transport,"render-private-tls");
 assert.equal(network.hostnameVerified,false,"Render uses self-signed TLS; don't misrepresent this");
 assert.equal(validateDeploymentSettings(env).accessState,"closed");
 // pg-connection-string's libpq-compatible mode enables TLS with the
 // self-signed Render internal cert. It is never allowed for a public DB host.
 const client=new pg.Client({connectionString:internal});
 assert.equal(client.connectionParameters.ssl?.rejectUnauthorized,false);
 const denied=[
  {...env,RENDER:undefined},
  {...env,NODE_ENV:"test"},
  {...env,DATABASE_URL:internal.replace("dpg-cpg6dm3etma73ag7u0-a","db.academy.org")},
  {...env,DATABASE_URL:internal.replace("dpg-cpg6dm3etma73ag7u0-a","dpg-cpg6dm3etma73ag7u0-a.frankfurt-postgres.render.com")},
  {...env,DATABASE_URL:internal.replace("sslmode=require","sslmode=disable")},
  {...env,DATABASE_URL:internal.replace("sslmode=require","sslmode=verify-full")},
  {...env,DATABASE_URL:internal.replace("&uselibpqcompat=true","")},
  {...env,DATABASE_URL:internal.replace("&uselibpqcompat=true","&uselibpqcompat=false")},
  {...env,DATABASE_URL:internal+"&ssl=0"},
  {...env,DATABASE_URL:internal+"&sslrootcert=/tmp/fake"},
  {...env,ACADEMY_DB_NETWORK:"unrecognised"}
 ];
 for(const candidate of denied)
  assert.throws(()=>validateDeploymentSettings(candidate),/Render private database|Unknown Academy database network/);
});
test("Other production database connections still require verified hostname TLS",()=>{
 const notRender={...secure,DATABASE_URL:"postgresql://app:pass@remote.example.org/academy?sslmode=require"};
 assert.throws(()=>validateDeploymentSettings(notRender),/verify-full/);
 assert.throws(()=>validateDeploymentSettings({...notRender,ACADEMY_DB_NETWORK:"render-private"}),/Render private database/);
 assert.equal(validateDeploymentSettings({
  ...notRender,DATABASE_URL:"postgresql://app:pass@remote.example.org/academy?sslmode=verify-full"
 }).dbTransport,"verified-tls");
});
