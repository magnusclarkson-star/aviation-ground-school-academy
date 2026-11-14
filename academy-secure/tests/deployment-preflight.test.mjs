import test from "node:test";
import assert from "node:assert/strict";
import {validateDeploymentSettings} from "../deployment-preflight.mjs";

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
