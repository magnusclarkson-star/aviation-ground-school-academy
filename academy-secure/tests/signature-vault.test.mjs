import test from "node:test";
import assert from "node:assert/strict";
import {deflateSync} from "node:zlib";
import {randomBytes} from "node:crypto";
import {
 decodePng,normalisePreferences,DEFAULT_PREFS,keyFromEnvironment,
 encryptSignature,decryptSignature,MAX_SIGNATURE_BYTES
} from "../signature-vault.mjs";
const owner="11111111-1111-4111-8111-111111111111";
const another="22222222-2222-4222-8222-222222222222";
function chunk(type,payload){
 const len=Buffer.alloc(4);len.writeUInt32BE(payload.length);
 const bytes=Buffer.concat([Buffer.from(type),payload]);
 let crc=0xffffffff;
 for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}
 const check=Buffer.alloc(4);check.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([len,bytes,check]);
}
export function signatureFixture(width=720,height=180){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
 ihdr[8]=8;ihdr[9]=6;
 const raw=Buffer.alloc(height*(width*4+1));
 for(let y=20;y<height-20;y++){
  const x=35+Math.floor((width-75)*(y-20)/(height-40));
  const pos=y*(width*4+1)+1+x*4;
  raw[pos]=15;raw[pos+1]=52;raw[pos+2]=80;raw[pos+3]=255;
 }
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw)),chunk("IEND",Buffer.alloc(0))]);
}
test("PNG signature validation accepts bounded complete RGB/RGBA images",()=>{
 const image=signatureFixture();
 assert.deepEqual(decodePng(image.toString("base64")),image);
 assert.throws(()=>decodePng("not-a-png"),/PNG/);
 assert.throws(()=>decodePng(signatureFixture(100,180).toString("base64")),/dimensions/);
 assert.throws(()=>decodePng(signatureFixture(720,35).toString("base64")),/dimensions/);
 assert.throws(()=>decodePng(image.subarray(0,image.length-7).toString("base64")),/incomplete|invalid/);
 assert.ok(image.length<MAX_SIGNATURE_BYTES);
});
test("signature preferences are complete, explicit booleans only",()=>{
 const all={formalCertificates:true,scoutCertificates:false,
  enthusiastCertificates:true,transcripts:false,academySeal:true};
 assert.deepEqual(normalisePreferences(all),all);
 assert.equal(Object.values(DEFAULT_PREFS).every(v=>v===false),true);
 assert.throws(()=>normalisePreferences({...all,transcripts:"yes"}),/checkbox/);
 assert.throws(()=>normalisePreferences({...all,secret:true}),/preferences/);
 assert.throws(()=>normalisePreferences({formalCertificates:true}),/preferences/);
});
test("private AES-256-GCM signature cannot decrypt with wrong owner or key",()=>{
 const key=randomBytes(32),raw=signatureFixture();
 const encrypted=encryptSignature(raw,key,owner);
 assert.notEqual(encrypted.ciphertext.toString("hex"),raw.toString("hex"));
 assert.notEqual(encrypted.nonce.length,0);
 assert.equal(encrypted.tag.length,16);
 assert.equal(decryptSignature(encrypted,key,owner).equals(raw),true);
 assert.throws(()=>decryptSignature(encrypted,key,another));
 assert.throws(()=>decryptSignature(encrypted,randomBytes(32),owner));
 assert.throws(()=>decryptSignature({...encrypted,tag:randomBytes(16)},key,owner));
});
test("signature key must come from explicit 32-byte private environment secret",()=>{
 const testKey=randomBytes(32);
 assert.ok(keyFromEnvironment({ACADEMY_SIGNATURE_ENCRYPTION_KEY:testKey.toString("base64")}).equals(testKey));
 assert.throws(()=>keyFromEnvironment({}),/unavailable/);
 assert.throws(()=>keyFromEnvironment({ACADEMY_SIGNATURE_ENCRYPTION_KEY:"abc"}),/unavailable/);
});
