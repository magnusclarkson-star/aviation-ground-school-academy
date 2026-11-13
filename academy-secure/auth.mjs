import {randomBytes,createHash,timingSafeEqual,scrypt as callbackScrypt} from "node:crypto";
import {promisify} from "node:util";
const scrypt=promisify(callbackScrypt);
export const COOKIE_NAME="agsa_auth";
export const SESSION_HOURS=8;
export function sha256(input){return createHash("sha256").update(input).digest("hex")}
export function newToken(){return randomBytes(32).toString("hex")}
export function validateEmail(email){
 const value=String(email??"").trim().toLowerCase();
 if(value.length<5||value.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error("Invalid email");
 return value;
}
export function validatePassword(password){
 if(typeof password!=="string"||password.length<12||password.length>200)throw new Error("Password must be 12–200 characters");
 const classes=[/[a-z]/.test(password),/[A-Z]/.test(password),/[0-9]/.test(password),/[^A-Za-z0-9\s]/.test(password)].filter(Boolean).length;
 if(classes<3&&password.length<20)throw new Error("Use a longer passphrase or at least three character types");
 return password;
}
export async function hashPassword(password){
 validatePassword(password);
 const salt=randomBytes(16);
 const derived=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return "scrypt$32768$"+salt.toString("hex")+"$"+derived.toString("hex");
}
export async function verifyPassword(password,encoded){
 if(typeof password!=="string"||password.length>200||typeof encoded!=="string")return false;
 const match=/^scrypt\$32768\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(encoded);
 if(!match)return false;
 const actual=await scrypt(password,Buffer.from(match[1],"hex"),64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
 return timingSafeEqual(actual,Buffer.from(match[2],"hex"));
}
export function cookieToken(header){
 const cookies=String(header||"").split(";").map(x=>x.trim());
 const match=cookies.find(x=>x.startsWith(COOKIE_NAME+"="));
 const candidate=match?.slice(COOKIE_NAME.length+1)||"";
 return /^[a-f0-9]{64}$/.test(candidate)?candidate:null;
}
export function sessionCookie(token,https){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error("Invalid session token");
 return COOKIE_NAME+"="+token+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+(SESSION_HOURS*3600)+(https?"; Secure":"");
}
export function clearSessionCookie(https){
 return COOKIE_NAME+"=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"+(https?"; Secure":"");
}
export function checkOrigin(origin,expected){
 if(typeof expected!=="string"||!/^https?:\/\//.test(expected))throw Error("Invalid configured origin");
 if(origin!==expected)throw Error("Origin mismatch");
}
