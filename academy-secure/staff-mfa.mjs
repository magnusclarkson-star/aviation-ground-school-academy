// Private Academy staff TOTP MFA: RFC 6238 compatible, 30s HMAC-SHA1, 6 digits.
// A separate key encrypts seeds at rest; no TOTP secrets in audit or public Pages.
import {createHmac,createCipheriv,createDecipheriv,randomBytes,timingSafeEqual} from "node:crypto";
const B32="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export const STAFF_ROLES=Object.freeze(["accountable_manager","head_of_training","quality_manager","instructor","examiner"]);
export const isStaff=role=>STAFF_ROLES.includes(role);
export function encodeBase32(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<1)throw Error("TOTP seed bytes required");
 let bits=0,value=0,out="";
 for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=B32[(value>>>(bits-5))&31];bits-=5}}
 if(bits>0)out+=B32[(value<<(5-bits))&31];
 return out;
}
export function decodeBase32(input){
 if(typeof input!=="string"||!input||!/^[A-Z2-7]+$/.test(input))throw Error("Invalid TOTP seed encoding");
 let value=0,bits=0;const out=[];
 for(const char of input){
  value=(value<<5)|B32.indexOf(char);bits+=5;
  if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8}
 }
 if(bits>0&&(value&((1<<bits)-1))!==0)throw Error("Invalid TOTP seed padding");
 return Buffer.from(out);
}
export function newSecret(){return encodeBase32(randomBytes(20))}
export function totp(secret,step,digits=6){
 if(!Number.isSafeInteger(step)||step<0||![6,8].includes(digits))throw Error("Invalid TOTP counter");
 const key=decodeBase32(secret);
 if(key.length!==20)throw Error("TOTP secret must be 160 bits");
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));
 const hmac=createHmac("sha1",key).update(counter).digest();
 const i=hmac[hmac.length-1]&15;
 const binary=((hmac[i]&127)<<24)|((hmac[i+1]&255)<<16)|((hmac[i+2]&255)<<8)|(hmac[i+3]&255);
 return String(binary%(10**digits)).padStart(digits,"0");
}
export function verifyTotp(secret,code,now=Date.now(),lastStep=-1){
 if(typeof code!=="string"||!/^[0-9]{6}$/.test(code)||!Number.isFinite(now)||
  !Number.isSafeInteger(lastStep))return null;
 const step=Math.floor(now/30000);
 // Finite window tolerates small clock offsets; prevent token reuse across sessions.
 for(const candidate of [step-1,step,step+1]){
  if(candidate<=lastStep||candidate<0)continue;
  const expected=Buffer.from(totp(secret,candidate));
  if(timingSafeEqual(expected,Buffer.from(code)))return candidate;
 }
 return null;
}
export function enrollmentUri(secret,email){
 if(decodeBase32(secret).length!==20||typeof email!=="string"||email.length>254||!email.includes("@"))
  throw Error("Invalid TOTP enrollment");
 const label="Aviation Ground School Academy:"+email;
 return "otpauth://totp/"+encodeURIComponent(label)+"?secret="+secret+
  "&issuer="+encodeURIComponent("Aviation Ground School Academy")+"&algorithm=SHA1&digits=6&period=30";
}
export function keyFromEnv(env=process.env){
 const text=env.ACADEMY_TOTP_ENCRYPTION_KEY;
 if(typeof text!=="string"||!/^[A-Za-z0-9+/]{43}=$/.test(text))throw Error("Private staff MFA encryption key missing");
 const key=Buffer.from(text,"base64");
 if(key.length!==32||key.toString("base64")!==text)throw Error("Invalid private staff MFA encryption key");
 return key;
}
export function sealSecret(secret,key,userId){
 if(decodeBase32(secret).length!==20||!Buffer.isBuffer(key)||key.length!==32||
  typeof userId!=="string"||!/^[a-f0-9-]{36}$/i.test(userId))throw Error("Invalid staff MFA encryption data");
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
 cipher.setAAD(Buffer.from("agsa:staff-totp:v1:"+userId));
 const ciphertext=Buffer.concat([cipher.update(secret,"utf8"),cipher.final()]);
 return Object.freeze({ciphertext,nonce,authTag:cipher.getAuthTag()});
}
export function openSecret(record,key,userId){
 if(!record||!Buffer.isBuffer(key)||key.length!==32)throw Error("Invalid staff MFA decryption");
 const decipher=createDecipheriv("aes-256-gcm",key,record.nonce);
 decipher.setAAD(Buffer.from("agsa:staff-totp:v1:"+userId));
 decipher.setAuthTag(record.auth_tag);
 const result=Buffer.concat([decipher.update(record.secret_ciphertext),decipher.final()]).toString("utf8");
 if(decodeBase32(result).length!==20)throw Error("Decrypted TOTP seed invalid");
 return result;
}
