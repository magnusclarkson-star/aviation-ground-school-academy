import test from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {newSecret,totp,verifyTotp,encodeBase32,decodeBase32,enrollmentUri,
 keyFromEnv,sealSecret,openSecret,isStaff,STAFF_ROLES} from "../staff-mfa.mjs";
test("RFC 6238 six and eight-digit examples and strict base32",()=>{
 const secret=encodeBase32(Buffer.from("12345678901234567890"));
 assert.equal(decodeBase32(secret).toString("utf8"),"12345678901234567890");
 assert.equal(totp(secret,1,8),"94287082");
 assert.equal(totp(secret,1),"287082");
 assert.equal(verifyTotp(secret,"287082",59000),1);
 assert.equal(verifyTotp(secret,"287082",59000,1),null,"A code cannot be replayed");
 assert.equal(verifyTotp(secret,"287082",59000,0),1);
 assert.equal(verifyTotp(secret,"287082",59000,3),null);
 assert.equal(verifyTotp(secret,"12345",59000),null);
 assert.equal(verifyTotp(secret,"1234567",59000),null);
 assert.equal(verifyTotp(secret,123456,59000),null);
 assert.throws(()=>decodeBase32("!bad"),/Invalid/);
 assert.throws(()=>totp(secret,-1),/Invalid/);
});
test("staff seeds are cryptographically random and AES-GCM bound to the user",()=>{
 const a=newSecret(),b=newSecret();assert.notEqual(a,b);
 assert.equal(decodeBase32(a).length,20);
 const key=randomBytes(32),id="11111111-1111-4111-8111-111111111111";
 const record=sealSecret(a,key,id);
 const stored={secret_ciphertext:record.ciphertext,nonce:record.nonce,auth_tag:record.authTag};
 assert.notEqual(record.ciphertext.toString("utf8"),a);
 assert.equal(openSecret(stored,key,id),a);
 assert.throws(()=>openSecret(stored,key,"22222222-2222-4222-8222-222222222222"));
 assert.throws(()=>openSecret(stored,randomBytes(32),id));
 assert.match(enrollmentUri(a,"staff@academy.test"),/^otpauth:\/\/totp\//);
 assert.match(enrollmentUri(a,"staff@academy.test"),/algorithm=SHA1&digits=6&period=30/);
 assert.throws(()=>sealSecret("bad",key,id));
});
test("distinct staff key and roles enforced",()=>{
 const key=randomBytes(32);
 assert.deepEqual(keyFromEnv({ACADEMY_TOTP_ENCRYPTION_KEY:key.toString("base64")}),key);
 assert.throws(()=>keyFromEnv({}),/missing/);
 assert.throws(()=>keyFromEnv({ACADEMY_TOTP_ENCRYPTION_KEY:"not-secret"}),/missing|Invalid/);
 for(const role of STAFF_ROLES)assert.equal(isStaff(role),true);
 assert.equal(isStaff("student"),false);
});
