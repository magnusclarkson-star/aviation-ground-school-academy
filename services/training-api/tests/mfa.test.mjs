import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {
 parseEncryptionKey,newTotpSecret,totpAtStep,checkTotp,
 encryptTotpSecret,decryptTotpSecret,provisioningUri
} from "../src/mfa.mjs";
const rfcSecret="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
test("RFC 6238 SHA-1 six-digit vectors and strict one-time codes",()=>{
 assert.equal(totpAtStep(rfcSecret,1),"287082"); // 59 seconds in RFC 6238
 assert.equal(totpAtStep(rfcSecret,37037036),"081804");
 assert.equal(totpAtStep(rfcSecret,41152263),"005924");
 assert.equal(checkTotp(rfcSecret,"287082",59000),1);
 assert.equal(checkTotp(rfcSecret,"287082",59000,1),null,"same TOTP must never replay");
 assert.equal(checkTotp(rfcSecret,"287082",90000),null,"expired code rejected");
 assert.equal(checkTotp(rfcSecret,"287082",30000),1,"one time-step of skew allowed");
 assert.equal(checkTotp(rfcSecret,"0287082",59000),null,"exactly six digits required");
 assert.equal(checkTotp(rfcSecret,"notcode",59000),null);
 assert.equal(checkTotp(rfcSecret,287082,59000),null,"must not lose leading zeros");
});
test("every staging instructor TOTP secret is freshly generated",()=>{
 const a=newTotpSecret(),b=newTotpSecret();
 assert.match(a,/^[A-Z2-7]{32}$/);
 assert.notEqual(a,b);
 assert.match(provisioningUri("teacher@example.org",a),/^otpauth:\/\/totp\//);
 assert.match(provisioningUri("teacher@example.org",a),/issuer=AGSA\+Staging/);
});
test("MFA shared secrets stay authenticated and encrypted at rest",()=>{
 const key=randomBytes(32);
 const encoded=parseEncryptionKey(key.toString("base64url"));
 assert.deepEqual(encoded,key);
 assert.throws(()=>parseEncryptionKey("not-a-key"),/MFA/);
 const encrypted=encryptTotpSecret(rfcSecret,key);
 assert.match(encrypted,/^v1\./);
 assert.ok(!encrypted.includes(rfcSecret));
 assert.equal(decryptTotpSecret(encrypted,key),rfcSecret);
 assert.throws(()=>decryptTotpSecret(encrypted,randomBytes(32)),/authenticate|decrypt|Unsupported|bad/i);
 const midpoint=encrypted.indexOf(".",encrypted.indexOf(".")+1)+3;
 const changed=encrypted.slice(0,midpoint)+(encrypted[midpoint]==="A"?"Z":"A")+encrypted.slice(midpoint+1);
 assert.throws(()=>decryptTotpSecret(changed,key));
 assert.throws(()=>encryptTotpSecret("INVALID SECRET",key),/Invalid/);
});
