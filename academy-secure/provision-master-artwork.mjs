// One-time operator migration of the three exact owner-approved originals
// into a server-only directory. This command must never run in GitHub Pages.
import {mkdir,open,readFile,realpath,stat,chmod} from "node:fs/promises";
import {resolve,join,sep,isAbsolute,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {MASTER_ARTWORK,bundledApprovedArtwork,validateMasterArtwork} from "./master-artwork.mjs";

const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),"..");
export async function provisionCertificateMasters(directory){
 if(typeof directory!=="string"||!isAbsolute(directory))
  throw Error("Provide an absolute restricted private directory outside the public repository");
 const target=resolve(directory);
 if(target===repoRoot||target.startsWith(repoRoot+sep))
  throw Error("Never store clean certificate masters inside the public Academy repository");
 await mkdir(target,{recursive:true,mode:0o700});
 const canonical=await realpath(target);
 if(canonical===repoRoot||canonical.startsWith(repoRoot+sep))
  throw Error("Certificate master directory resolves into the public repository");
 await chmod(canonical,0o700);
 const delivered=[];
 for(const [style,item] of Object.entries(MASTER_ARTWORK)){
  const bytes=await bundledApprovedArtwork(style);
  validateMasterArtwork(bytes,style);
  const file=join(canonical,item.filename);
  let exists=false;
  try{
   const previous=await readFile(file);
   validateMasterArtwork(previous,style);
   exists=true;
  }catch(error){
   if(error.code!=="ENOENT")throw error; // Refuse to overwrite damaged or unfamiliar files
  }
  if(!exists){
   const handle=await open(file,"wx",0o600);
   try{await handle.writeFile(bytes);await handle.sync()}finally{await handle.close()}
  }
  await chmod(file,0o600);
  const info=await stat(file);
  if(!info.isFile())throw Error("Secure certificate destination is not a file");
  delivered.push({style,filename:item.filename,sha256:item.sha256,preexisting:exists});
 }
 return delivered;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directory=process.argv[2];
 const delivered=await provisionCertificateMasters(directory);
 console.log("Verified "+delivered.length+" original certificate masters in the private directory; no images printed to logs.");
}
