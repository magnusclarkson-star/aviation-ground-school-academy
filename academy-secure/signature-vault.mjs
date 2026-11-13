// Private Academy administrator signature cryptography.
// Signed authorisations are separate from a signature image. Do not publish
// encrypted signature bytes or decryption keys in the static GitHub Pages app.
import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";

export const MAX_SIGNATURE_BYTES=145000;
export const MIME="image/png";
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const PREF_NAMES=Object.freeze([
 "formalCertificates","scoutCertificates","enthusiastCertificates","transcripts","academySeal"
]);
export const DEFAULT_PREFS=Object.freeze(Object.fromEntries(PREF_NAMES.map(k=>[k,false])));

export function normalisePreferences(value){
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Signature preferences must be an object");
 const keys=Object.keys(value);
 if(keys.some(k=>!PREF_NAMES.includes(k))||keys.length!==PREF_NAMES.length)
  throw Error("All signature use preferences must be provided");
 for(const key of PREF_NAMES)if(typeof value[key]!=="boolean")throw Error("Signature preferences must be checkboxes");
 return Object.fromEntries(PREF_NAMES.map(k=>[k,Boolean(value[k])]));
}
export function decodePng(base64){
 if(typeof base64!=="string"||base64.length<32||base64.length>MAX_SIGNATURE_BYTES*4/3+12||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64))
  throw Error("Provide a PNG signature no larger than 145 KB");
 const bytes=Buffer.from(base64,"base64");
 if(bytes.length<50||bytes.length>MAX_SIGNATURE_BYTES||!bytes.subarray(0,8).equals(PNG))
  throw Error("Signature must be a valid PNG image");
 if(bytes.toString("ascii",12,16)!=="IHDR"||bytes.readUInt32BE(8)!==13)
  throw Error("PNG header is invalid");
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 // Bounds keep memory and document layout predictable, including Android.
 if(width<240||width>1600||height<70||height>800)
  throw Error("Signature image dimensions must be 240-1600 px wide and 70-800 px high");
 if(![2,6].includes(bytes[25])||bytes[24]!==8)
  throw Error("Use an 8-bit RGB or transparent RGBA PNG");
 // Prevent extra untrusted trailing files or truncated PNG chunks.
 let offset=8,lastType="",hasData=false;
 while(offset+12<=bytes.length){
  const len=bytes.readUInt32BE(offset);
  if(len>MAX_SIGNATURE_BYTES||offset+12+len>bytes.length)throw Error("PNG chunk length invalid");
  const type=bytes.toString("ascii",offset+4,offset+8);
  if(!/^[A-Za-z]{4}$/.test(type))throw Error("PNG chunk type invalid");
  if(type==="IDAT")hasData=true;
  offset+=12+len;lastType=type;
  if(type==="IEND")break;
 }
 if(lastType!=="IEND"||!hasData||offset!==bytes.length)throw Error("PNG is incomplete or contains extra trailing data");
 return bytes;
}
export function keyFromEnvironment(env=process.env){
 const value=env.ACADEMY_SIGNATURE_ENCRYPTION_KEY;
 if(typeof value!=="string"||!/^[A-Za-z0-9+/]{43}=$/.test(value))
  throw Error("Signature encryption key unavailable; configure a dedicated random 32-byte base64 secret");
 const key=Buffer.from(value,"base64");
 if(key.length!==32)throw Error("Invalid signature encryption key length");
 return key;
}
export function encryptSignature(bytes,key,ownerId){
 if(!Buffer.isBuffer(bytes)||bytes.length<50||bytes.length>MAX_SIGNATURE_BYTES)throw Error("Invalid PNG signature bytes");
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error("Expected an AES-256 encryption key");
 if(typeof ownerId!=="string"||!/^[a-f0-9-]{36}$/i.test(ownerId))throw Error("Invalid signature owner");
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
 cipher.setAAD(Buffer.from("agsa:owner-signature:v1:"+ownerId));
 const ciphertext=Buffer.concat([cipher.update(bytes),cipher.final()]);
 return {ciphertext,nonce,tag:cipher.getAuthTag(),sha256:createHash("sha256").update(bytes).digest("hex")};
}
export function decryptSignature(record,key,ownerId){
 const decipher=createDecipheriv("aes-256-gcm",key,record.nonce);
 decipher.setAAD(Buffer.from("agsa:owner-signature:v1:"+ownerId));
 decipher.setAuthTag(record.tag);
 const clear=Buffer.concat([decipher.update(record.ciphertext),decipher.final()]);
 const fingerprint=createHash("sha256").update(clear).digest("hex");
 if(fingerprint!==record.sha256)throw Error("Stored signature fingerprint mismatch");
 return clear;
}
