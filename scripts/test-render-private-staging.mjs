import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=async p=>readFile(new URL(p,import.meta.url),"utf8");

test("optional Render Blueprint provisions only a closed private service and isolated Postgres",async()=>{
 const yaml=await read("../infra/render-private-staging.yaml");
 assert.match(yaml,/^services:\s*$/m);
 assert.match(yaml,/^databases:\s*$/m);
 assert.match(yaml,/^\s*- type: pserv\s*$/m);
 assert.doesNotMatch(yaml,/^\s*- type: web\s*$/m);
 assert.match(yaml,/^\s+runtime: docker\s*$/m);
 assert.match(yaml,/^\s+dockerfilePath: \.\/academy-secure\/Dockerfile\s*$/m);
 assert.match(yaml,/^\s+dockerContext: \.\/academy-secure\s*$/m);
 assert.match(yaml,/^\s+autoDeployTrigger: off\s*$/m);
 assert.match(yaml,/^\s+value: closed\s*$/m);
 assert.match(yaml,/^\s+value: render-private\s*$/m);
 assert.match(yaml,/^\s+postgresMajorVersion: '16'\s*$/m);
 assert.match(yaml,/^\s+ipAllowList: \[\]\s*$/m);
 assert.equal((yaml.match(/^\s+region: frankfurt\s*$/gm)||[]).length,2);
 for(const key of ["DATABASE_URL","ACADEMY_ORIGIN","ACADEMY_SIGNATURE_ENCRYPTION_KEY",
  "ACADEMY_TOTP_ENCRYPTION_KEY"]){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  assert.match(yaml,new RegExp("      - key: "+escaped+"\\n        sync: false"));
 }
 assert.doesNotMatch(yaml,/fromDatabase:|generateValue: true|DATABASE_URL\s*\n\s*value:|type: web|healthCheckPath:|autoDeployTrigger: commit/);
 assert.match(yaml,/plan: 0\.5c-512mb/);
 assert.match(yaml,/plan: 0\.5c-1g/);
});
test("Render Blueprint is deliberately not named render.yaml at root",async()=>{
 const yaml=await read("../infra/render-private-staging.yaml");
 const guide=await read("../docs/ACADEMY-RENDER-PRIVATE-STAGING.md");
 assert.match(guide,/billable|paid/i);
 assert.match(guide,/manual sync/i);
 assert.match(guide,/no public/i);
 assert.match(guide,/credential|restricted role/i);
 assert.match(guide,/self-signed/i);
 assert.match(guide,/not live/i);
 assert.match(yaml,/MANUAL-ONLY/);
});
