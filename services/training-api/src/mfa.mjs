/* RFC 6238 TOTP for fictional staging staff accounts.
 * Shared secrets are encrypted at rest; replay is prevented transactionally
 * in PostgreSQL. This does not verify instructor identity or accreditation.
 */
import {createHmac,createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {secureEquals} from "./crypto.mjs";
const ALPHABET="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes){
 let result="",bits=0,value=0;
 for(const byte of bytes){
  value=(value<<8)|byte;bits+=8;
  while(bits>=5){bits-=5;result+=ALPHABET[(value>>bits)&31]}
 }
 if(bits>0)result+=ALPHABET[(value<<(5-bits))&31];
 return result;
}
function base32Decode(value){
 if(typeof value!=="string"||! /^[A-Z2-7]{32}$/.test(value))throw Error("Invalid staging TOTP secret");
 let result=[],bits=0,buffer=0;
 for(const letter of value){
  buffer=(buffer<<5)|ALPHABET.indexOf(letter);bits+=5;
  if(bits>=8){bits-=8;result.push((buffer>>bits)&255)}
 }
 if(result.length!==20)throw Error("Invalid decoded TOTP secret");
 return Buffer.from(result);
}
export function parseEncryptionKey(encoded){
 if(typeof encoded!=="string"||! /^[A-Za-z0-9_-]{43}$/.test(encoded))throw Error("Set AGSA_MFA_ENCRYPTION_KEY to 32 random base64url-encoded bytes");
 const key=Buffer.from(encoded,"base64url");
 if(key.length!==32||key.toString("base64url")!==encoded)throw Error("Invalid MFA key encoding");
 return key;
}
export function newTotpSecret(){return base32Encode(randomBytes(20))}
export function provisioningUri(email,secret){
 base32Decode(secret);
 if(typeof email!=="string"||!email.includes("@"))throw Error("Invalid provisioning label");
 const label="AGSA Staging:"+email;
 const url=new URL("otpauth://totp/"+encodeURIComponent(label));
 url.searchParams.set("secret",secret);
 url.searchParams.set("issuer","AGSA Staging");
 url.searchParams.set("algorithm","SHA1");
 url.searchParams.set("digits","6");
 url.searchParams.set("period","30");
 return url.toString();
}
export function encryptTotpSecret(secret,key){
 base32Decode(secret);
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error("Invalid key");
 const iv=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key,iv);
 cipher.setAAD(Buffer.from("agsa-staging-mfa-v1"));
 const data=Buffer.concat([cipher.update(secret,"utf8"),cipher.final()]);
 return "v1."+iv.toString("base64url")+"."+cipher.getAuthTag().toString("base64url")+"."+data.toString("base64url");
}
export function decryptTotpSecret(encrypted,key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error("Invalid key");
 const parts=typeof encrypted==="string"?encrypted.split("."):[];
 if(parts.length!==4||parts[0]!=="v1")throw Error("Unrecognized MFA secret format");
 const iv=Buffer.from(parts[1],"base64url");
 const tag=Buffer.from(parts[2],"base64url");
 const data=Buffer.from(parts[3],"base64url");
 if(iv.length!==12||tag.length!==16||data.length!==32)throw Error("Invalid encrypted MFA record");
 const decipher=createDecipheriv("aes-256-gcm",key,iv);
 decipher.setAAD(Buffer.from("agsa-staging-mfa-v1"));
 decipher.setAuthTag(tag);
 const secret=Buffer.concat([decipher.update(data),decipher.final()]).toString("utf8");
 base32Decode(secret);
 return secret;
}
export function totpAtStep(secret,step){
 const key=base32Decode(secret);
 if(!Number.isSafeInteger(step)||step<0)throw Error("Invalid TOTP step");
 const challenge=Buffer.alloc(8);
 challenge.writeBigUInt64BE(BigInt(step));
 const digest=createHmac("sha1",key).update(challenge).digest();
 const offset=digest[digest.length-1]&15;
 const n=(digest.readUInt32BE(offset)&0x7fffffff)%1000000;
 return String(n).padStart(6,"0");
}
export function checkTotp(secret,code,nowMs=Date.now(),lastUsedStep=-1){
 if(typeof code!=="string"||! /^\d{6}$/.test(code)||
    !Number.isFinite(nowMs)||nowMs<0||
    !Number.isSafeInteger(lastUsedStep))return null;
 const current=Math.floor(nowMs/30000);
 let match=null;
 // A one-step skew allows modest authenticator clock drift. Already-used
 // and older steps are refused to stop concurrent or repeated OTP logins.
 for(const step of [current-1,current,current+1]){
  if(step<0||step<=lastUsedStep)continue;
  if(secureEquals(totpAtStep(secret,step),code))match=step;
 }
 return match;
}
