import test from "node:test";
import assert from "node:assert/strict";
import {generateSecret} from "../src/crypto.mjs";
import {INVITE_LIFETIME_MS,verifyTokenFormat,makeVerificationUrl,checkDeliveryConfig,sendVerificationInvite} from "../src/invites.mjs";

const env={
 AGSA_MAIL_PROVIDER:"resend",
 AGSA_RESEND_API_KEY:"re_test_use_only_fake_value_123456789",
 AGSA_MAIL_FROM:"noreply@example.test",
 AGSA_PUBLIC_ORIGIN:"https://staging.example.test"
};
test("single-use invitation format, bounded lifespan and URL fragment hygiene",()=>{
 const token=generateSecret();
 assert.equal(INVITE_LIFETIME_MS,1800000);
 assert.equal(verifyTokenFormat(token),true);
 assert.equal(verifyTokenFormat("short"),false);
 const url=makeVerificationUrl(env.AGSA_PUBLIC_ORIGIN,token);
 const parsed=new URL(url);
 assert.equal(parsed.origin,env.AGSA_PUBLIC_ORIGIN);
 assert.equal(parsed.pathname,"/portal/");
 assert.equal(parsed.search,"");
 assert.equal(parsed.hash,"#verify-email="+token);
 assert.equal(parsed.toString().split("#")[0].includes(token),false);
 assert.throws(()=>makeVerificationUrl("http://evil.example.test",token),/HTTPS/);
 assert.throws(()=>makeVerificationUrl("https://staging.example.test:443/portal/",token),/Invalid portal/);
});
test("provider configuration is fail closed and never supplies a default recipient",()=>{
 assert.equal(checkDeliveryConfig(env).from,"noreply@example.test");
 assert.throws(()=>checkDeliveryConfig({...env,AGSA_MAIL_PROVIDER:"disabled"}),/delivery provider/);
 assert.throws(()=>checkDeliveryConfig({...env,AGSA_RESEND_API_KEY:""}),/API key/);
 assert.throws(()=>checkDeliveryConfig({...env,AGSA_PUBLIC_ORIGIN:"http://staging.example.test"}),/HTTPS/);
});
test("send verification via configured provider, never exposing token in successful response",async()=>{
 const token=generateSecret();
 let calls=0;
 const fakeFetch=async(url,opts)=>{
  calls++;
  assert.equal(url,"https://api.resend.com/emails");
  assert.equal(opts.method,"POST");
  assert.equal(opts.headers.Authorization,"Bearer "+env.AGSA_RESEND_API_KEY);
  const mail=JSON.parse(opts.body);
  assert.equal(mail.from,env.AGSA_MAIL_FROM);
  assert.deepEqual(mail.to,["recipient@example.test"]);
  assert.match(mail.subject,/Verify/);
  assert.ok(mail.text.includes("#verify-email="+token));
  assert.match(mail.text,/expires in 30 minutes/);
  assert.equal(mail.text.includes("password="),false);
  return {ok:true};
 };
 const result=await sendVerificationInvite({
  to:"Recipient@Example.Test",token,env,request:fakeFetch
 });
 assert.deepEqual(result,{accepted:true});
 assert.equal(calls,1);
 assert.equal(JSON.stringify(result).includes(token),false);
});
test("delivery failures never masquerade as verified inbox ownership",async()=>{
 const token=generateSecret();
 let requests=0;
 await assert.rejects(sendVerificationInvite({
  to:"a@example.test",token,
  env:{...env,AGSA_MAIL_PROVIDER:"off"},
  request:async()=>{requests++;return {ok:true}}
 }),/delivery provider/);
 assert.equal(requests,0);
 await assert.rejects(sendVerificationInvite({
  to:"a@example.test",token,env,
  request:async()=>({ok:false,status:400,text:async()=>token})
 }),e=>!e.message.includes(token)&&/rejected/.test(e.message));
 await assert.rejects(sendVerificationInvite({
  to:"a@example.test",token,env,
  request:async()=>{throw Error("PRIVATE_API_KEY_SHOULD_NOT_LEAK")}
 }),e=>!e.message.includes("PRIVATE_API_KEY_SHOULD_NOT_LEAK"));
});
