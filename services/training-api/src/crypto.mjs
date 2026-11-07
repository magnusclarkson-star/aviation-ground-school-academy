import {randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from "node:crypto";
import {promisify} from "node:util";
const scrypt=promisify(scryptCallback);
// OWASP-equivalent scrypt profile: N=2^15, r=8, p=3; per-user random salt.
const PARAMS={N:32768,r:8,p:3,maxmem:96*1024*1024};
const HASH_LENGTH=64;
export function hashSha256(data){return createHash("sha256").update(data).digest("hex");}
export function generateSecret(){return randomBytes(32).toString("base64url");}
export function normalizeEmail(email){
 if(typeof email!=="string")throw Error("Invalid email");
 const value=email.trim().toLowerCase();
 if(value.length<5||value.length>254||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(value))throw Error("Invalid email");
 return value;
}
export function validPassword(password){
 return typeof password==="string"&&Buffer.byteLength(password,"utf8")>=12&&Buffer.byteLength(password,"utf8")<=128;
}
export async function hashPassword(password){
 if(!validPassword(password))throw Error("Password must be 12–128 UTF-8 bytes");
 const salt=randomBytes(16);
 const derived=await scrypt(password,salt,HASH_LENGTH,PARAMS);
 return `scrypt$32768$8$3$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}
export async function verifyPassword(password,encoded){
 if(typeof password!=="string"||Buffer.byteLength(password)>128)return false;
 if(typeof encoded!=="string")return false;
 const parts=encoded.split("$");
 if(parts.length!==6||parts[0]!=="scrypt"||parts[1]!=="32768"||parts[2]!=="8"||parts[3]!=="3")return false;
 let salt,expected;
 try{salt=Buffer.from(parts[4],"base64url");expected=Buffer.from(parts[5],"base64url");}
 catch{return false}
 if(salt.length!==16||expected.length!==HASH_LENGTH)return false;
 const actual=await scrypt(password,salt,HASH_LENGTH,PARAMS);
 return timingSafeEqual(actual,expected);
}
// Match the expensive verification cost on missing users to reduce enumeration by response time.
const DUMMY_SALT=Buffer.from("agsa-demo-dummy1!","utf8");
export async function consumePasswordCost(password){
 await scrypt(typeof password==="string"&&password.length<=128?password:"",DUMMY_SALT,HASH_LENGTH,PARAMS);
}
export function secureEquals(a,b){
 if(typeof a!=="string"||typeof b!=="string")return false;
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length&&timingSafeEqual(x,y);
}
