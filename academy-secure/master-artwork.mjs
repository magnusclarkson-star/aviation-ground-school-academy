// Exact owner-selected certificate artwork master files (unmodified PNGs).
// A checksum match prevents the app from substituting degraded or redesigned models.
// These decorative images are not staff signatures or regulator authorisations.
import {createHash} from "node:crypto";
import {readdir,readFile} from "node:fs/promises";
export const MASTER_ARTWORK=Object.freeze({
 FORMAL_TRADITIONAL:Object.freeze({filename:"formal-traditional-burgundy.png",sha256:"6050a0603674d7b5e402c0c21b477ef76b04b107e6abc61c13a314978d5f7986"}),
 SCOUT_MODERN:Object.freeze({filename:"scouts-modern-aviation.png",sha256:"e5a3fe35698e9637a37ffb24218ee1fbf79074e0232d0e93199eca7ccf8d98c9"}),
 ENTHUSIAST_NAVY_GOLD:Object.freeze({filename:"enthusiast-navy-gold.png",sha256:"03de002823c75cbe8f7a93ad756bd7361f51f51287f4f8ecb1ccc93c5d4e8be1"})
});
const PNG_HEADER=Buffer.from([137,80,78,71,13,10,26,10]);
export function validateMasterArtwork(data,style){
 const expected=MASTER_ARTWORK[style];
 if(!expected)throw Error("Unknown approved artwork style");
 if(!Buffer.isBuffer(data)||data.length<50000||data.length>6000000)throw Error("PNG size outside allowed bounds");
 if(!data.subarray(0,8).equals(PNG_HEADER)||data.toString("ascii",12,16)!=="IHDR")throw Error("Invalid PNG header");
 if(data.readUInt32BE(16)!==1491||data.readUInt32BE(20)!==1055)throw Error("Expected 1491 x 1055 original artwork image");
 const sha256=createHash("sha256").update(data).digest("hex");
 if(sha256!==expected.sha256)throw Error("Artwork does not match the exact original certificate selected by the administrator");
 return {style,sha256,width:1491,height:1055,bytes:data.length,filename:expected.filename};
}
// Exact previously approved artwork is checked into this repository in
// text-safe base64 chunks. Reconstruct only these immutable SHA-256 masters.
const BUNDLED_FOLDER=Object.freeze({
 FORMAL_TRADITIONAL:"formal",
 SCOUT_MODERN:"scout",
 ENTHUSIAST_NAVY_GOLD:"enthusiast"
});
const bundleCache=new Map();
export async function bundledMasterArtworkFor(style){
 const folder=BUNDLED_FOLDER[style];
 if(!folder)throw Error("Unknown approved certificate artwork");
 if(bundleCache.has(style))return bundleCache.get(style);
 const root=new URL("../assets/certificate-originals/"+folder+"/",import.meta.url);
 const chunks=(await readdir(root)).filter(name=>/^part-[0-9]{3}\.b64$/.test(name)).sort();
 if(chunks.length<8)throw Error("Approved "+style+" certificate artwork is incomplete");
 const pieces=await Promise.all(chunks.map(name=>readFile(new URL(name,root),"utf8")));
 const bytes=Buffer.from(pieces.join("").trim(),"base64");
 validateMasterArtwork(bytes,style);
 bundleCache.set(style,bytes);
 return bytes;
}
export async function originalArtworkFor(db,style){
 const expected=MASTER_ARTWORK[style];
 if(!expected)throw Error("Unknown certificate style");
 const {rows}=await db.query("SELECT png,sha256 FROM academy_certificate_master_artwork WHERE style=$1",[style]);
 // No per-device or per-administrator upload is needed for the bundled originals.
 if(!rows[0])return bundledMasterArtworkFor(style);
 const buf=Buffer.from(rows[0].png);
 validateMasterArtwork(buf,style);
 if(rows[0].sha256!==expected.sha256)throw Error("Stored original artwork fingerprint differs from the approved master");
 return buf;
}
export async function handleMasterArtworkRoute({req,res,method,pathname,actor,db,transaction,audit,send,fail}){
 if(!pathname.startsWith("/api/admin/certificate-master"))return false;
 if(actor.role!=="accountable_manager")fail(403,"Only the Academy administrator can manage original certificate artwork");
 if(method==="GET"&&pathname==="/api/admin/certificate-master/status"){
  const {rows}=await db.query("SELECT style,sha256,uploaded_at FROM academy_certificate_master_artwork ORDER BY style");
  const state=await Promise.all(Object.entries(MASTER_ARTWORK).map(async([style,expected])=>{
   const got=rows.find(x=>x.style===style);
   let bundled=false;
   try{await bundledMasterArtworkFor(style);bundled=true}catch{}
   const stored=!!got&&got.sha256===expected.sha256;
   return {style,filename:expected.filename,sha256:expected.sha256,
    installed:stored||bundled,bundled,uploadedAt:got?.uploaded_at||null};
  }));
  send(res,200,{originalMasters:state,allInstalled:state.every(x=>x.installed),
   note:"The three exact SHA-256-approved certificate masters are bundled permanently; no upload is required."});return true;
 }
 const m=/^\/api\/admin\/certificate-master\/(FORMAL_TRADITIONAL|SCOUT_MODERN|ENTHUSIAST_NAVY_GOLD)$/.exec(pathname);
 if(!m)fail(404,"Artwork route not found");
 const style=m[1];
 if(method==="GET"){
  const asset=await originalArtworkFor(db,style);
  res.writeHead(200,{"Content-Type":"image/png","Content-Length":asset.length,
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Frame-Options":"DENY",
   "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"});
  res.end(asset);return true;
 }
 if(method==="POST"){
  if(String(req.headers["content-type"]||"").split(";")[0].toLowerCase()!=="image/png")fail(415,"Upload PNG image data directly");
  if(Number(req.headers["content-length"]||0)>6000000)fail(413,"Artwork exceeds maximum size");
  const chunks=[];let total=0;
  for await(const chunk of req){total+=chunk.length;if(total>6000000)fail(413,"Artwork exceeds maximum size");chunks.push(chunk)}
  const bytes=Buffer.concat(chunks);let validation;
  try{validation=validateMasterArtwork(bytes,style)}catch(e){fail(422,e.message)}
  const now=await transaction(async tx=>{
   await tx.query(`INSERT INTO academy_certificate_master_artwork(style,png,sha256,width,height,uploaded_by)
    VALUES($1,$2,$3,1491,1055,$4)
    ON CONFLICT(style) DO UPDATE SET png=EXCLUDED.png,sha256=EXCLUDED.sha256,
    uploaded_by=EXCLUDED.uploaded_by,uploaded_at=now()`,[style,bytes,validation.sha256,actor.id]);
   await audit(tx,actor.id,"APPROVED_CERTIFICATE_MASTER_STORED","CERTIFICATE_MASTER",style,{sha256:validation.sha256});
   return validation;
  });
  send(res,201,{originalMasterStored:true,...now});return true;
 }
 fail(405,"Unsupported artwork action");
}
