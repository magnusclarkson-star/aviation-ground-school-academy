import test from "node:test";
import assert from "node:assert/strict";
import {hashPassword,verifyPassword,newToken,sha256,validatePassword,validateEmail,cookieToken,sessionCookie,clearSessionCookie,checkOrigin} from "../auth.mjs";
test("scrypt password storage uses random salts and verifies without plaintext",async()=>{
 const password="LongUniqueTrainingPassphrase2026!";
 const first=await hashPassword(password),second=await hashPassword(password);
 assert.notEqual(first,second);
 assert.equal(await verifyPassword(password,first),true);
 assert.equal(await verifyPassword(password+"!",first),false);
 assert.equal(await verifyPassword("other","bad hash"),false);
 assert.throws(()=>validatePassword("weak"),/12/);
 assert.throws(()=>validatePassword("lowercaseonly"),/character types/);
 assert.equal(validatePassword("twenty words make a much longer passphrase"),"twenty words make a much longer passphrase");
});
test("opaque sessions are random and HttpOnly/Secure",()=>{
 const first=newToken(),second=newToken();
 assert.equal(first.length,64);assert.notEqual(first,second);
 assert.match(sha256(first),/^[a-f0-9]{64}$/);
 assert.equal(cookieToken("x=y; agsa_auth="+first+"; a=1"),first);
 assert.equal(cookieToken("agsa_auth=malformed"),null);
 assert.match(sessionCookie(first,true),/HttpOnly; SameSite=Strict; Max-Age=28800; Secure/);
 assert.match(clearSessionCookie(true),/Max-Age=0; Secure/);
});
test("origin check and normalized email reject cross-origin requests",()=>{
 assert.equal(validateEmail(" TEST@EXAMPLE.ORG "),"test@example.org");
 assert.throws(()=>validateEmail("bad"),/Invalid email/);
 assert.doesNotThrow(()=>checkOrigin("https://academy.example","https://academy.example"));
 assert.throws(()=>checkOrigin("https://attacker.test","https://academy.example"),/Origin mismatch/);
 assert.throws(()=>checkOrigin(undefined,"https://academy.example"),/Origin mismatch/);
});
