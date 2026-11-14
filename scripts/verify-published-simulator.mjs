/* Deployment-time public-site verification for the mobile Academy simulator.
 * Runs AFTER actions/deploy-pages. Unlike the pre-upload package check, this
 * compares bytes actually served by GitHub Pages with the checked-out source.
 * Never requests private files or credentials.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile,stat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const baseString=process.env.AGSA_PAGES_URL;
if(!baseString)throw Error("AGSA_PAGES_URL must be the Pages deployment URL");
const base=new URL(baseString.endsWith("/")?baseString:baseString+"/");
assert.equal(base.protocol,"https:","Published Academy site must use HTTPS");
const sha=process.env.GITHUB_SHA||"manual";
const version=sha.slice(0,16);
const sourceFiles=[
 "flight-sim.html","flight-sim-sw.js",
 "flight-sim-3d.js","flight-sim-airframe-geometry.js",
 "flight-sim-f22-airframe.js","flight-sim-f35-airframe.js",
 "flight-sim-manifest.json",
 "academy-certificate-gallery.html","academy-certificate-gallery.css",
 "academy-certificate-gallery.js"
];
const models=[
 ["assets/aircraft/f22-fguk-exterior.json","json",500000],
 ["assets/aircraft/f35b-fg-exterior.json","json",350000],
 ["assets/aircraft/c172-molen-skyhawk.glb","glb",1000000],
 ["assets/aircraft/r44-molen-raven-ii.glb","glb",500000]
];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
function deployedUrl(file,attempt){
 const url=new URL(file,base);
 if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))
  throw Error("Refusing out-of-scope live asset URL: "+file);
 url.searchParams.set("agsa-release",version);
 url.searchParams.set("probe",String(attempt));
 return url;
}
async function download(file,attempt,range=false){
 const url=deployedUrl(file,attempt);
 const response=await fetch(url,{
  headers:range?{"Range":"bytes=0-127","Cache-Control":"no-cache"}:
   {"Cache-Control":"no-cache"},
  redirect:"follow",signal:AbortSignal.timeout(18000)
 });
 if(!response.ok)throw Error(file+": public HTTP "+response.status);
 if(response.url&&new URL(response.url).origin!==base.origin)
  throw Error(file+": redirected away from Academy origin");
 const mime=(response.headers.get("content-type")||"").toLowerCase();
 if(file.endsWith(".glb")&&mime.startsWith("text/html"))
  throw Error(file+": served an HTML error page instead of a 3D model");
 if(range){
  const reader=response.body?.getReader();
  if(!reader)throw Error(file+": missing response body");
  const first=await reader.read();
  try{await reader.cancel()}catch{}
  if(first.done||!first.value||first.value.length<4)
   throw Error(file+": empty first bytes of published model");
  return {bytes:first.value,response,mime};
 }
 return {bytes:Buffer.from(await response.arrayBuffer()),response,mime};
}
const expected=new Map(await Promise.all(sourceFiles.map(async file=>
 [file,digest(await readFile(path.join(root,file)))]
)));
async function checkLive(attempt){
 const versions=await Promise.all(sourceFiles.map(async file=>{
  const {bytes}=await download(file,attempt);
  const actual=digest(bytes),want=expected.get(file);
  if(actual!==want)throw Error(file+": published bytes do not match this commit");
  return file;
 }));
 // HEAD alone would pass for a blank or HTML error page; check the actual
 // first bytes of every licensed source model. A range request avoids
 // downloading the multi-megabyte C172/R44 files on each release.
 for(const [file,kind,minBytes] of models){
  const local=await stat(path.join(root,file));
  if(local.size<minBytes)throw Error(file+": local model unexpectedly truncated");
  const {bytes,response,mime}=await download(file,attempt,true);
  const prefix=Buffer.from(bytes).toString("utf8",0,16);
  if(kind==="glb"&&Buffer.from(bytes).toString("ascii",0,4)!=="glTF")
   throw Error(file+": live file lacks valid GLB magic");
  if(kind==="json"&&!(prefix.trimStart().startsWith("{"))){
   throw Error(file+": published mesh JSON does not start with a JSON object");
  }
  if(kind==="json"&&mime.includes("html"))
   throw Error(file+": served HTML instead of source mesh JSON");
  const range=response.headers.get("content-range");
  if(range){
   const n=Number(range.match(/\/(\d+)$/)?.[1]);
   if(Number.isFinite(n)&&n<minBytes)
    throw Error(file+": live model is too small ("+n+" bytes)");
  }
 }
 // Public certificate pages must serve ONLY the baked-watermark versions.
 // A successful deployment must not accidentally restore exact clean originals.
 for(const file of [
  "assets/certificate-previews/formal-sample.png",
  "assets/certificate-previews/scout-sample.png",
  "assets/certificate-previews/enthusiast-sample.png"
 ]){
  const local=await readFile(path.join(root,"dist-pages",file));
  if(local.length<100000||local.subarray(0,8).toString("hex")!=="89504e470d0a1a0a")
   throw Error(file+": local raster watermark preview missing or invalid");
  const {bytes,mime}=await download(file,attempt);
  if(!mime.includes("image/png")||digest(bytes)!==digest(local))
   throw Error(file+": public sample does not match raster-watermarked release bytes");
 }
 for(const file of [
  "assets/certificates/original-formal.part00.txt",
  "assets/certificates/original-scout.part00.txt",
  "assets/certificates/original-enthusiast.part00.txt"
 ]){
  const response=await fetch(deployedUrl(file,attempt),{
   headers:{"Cache-Control":"no-cache"},signal:AbortSignal.timeout(18000),
   redirect:"manual"
  });
  try{await response.body?.cancel()}catch{}
  if(response.status!==404&&response.status!==410)
   throw Error(file+": clean original certificate asset is exposed on public GitHub Pages (HTTP "+response.status+")");
 }
 console.log("Public Pages release "+version+" matches checked-out simulator JS, "+
  versions.length+" exact source files and all four real aircraft model assets.");
}
let lastError;
for(let attempt=1;attempt<=15;attempt++){
 try{
  await checkLive(attempt);
  console.log("Published simulator verified at "+base.href);
  process.exit(0);
 }catch(error){
  lastError=error;
  console.log("Public CDN verification "+attempt+"/15: "+error.message);
  if(attempt<15)await sleep(4000);
 }
}
throw new Error("Published simulator did not reach this release: "+lastError?.message);
