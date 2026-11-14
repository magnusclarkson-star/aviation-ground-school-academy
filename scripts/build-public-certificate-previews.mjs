// Create protected PUBLIC sample PNGs using the administrator's exact approved
// originals. This is a build-only tool: never deploy the clean master bytes.
// Requires pinned sharp as a CI build dependency, not in the website bundle.
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";
import {bundledApprovedArtwork,MASTER_ARTWORK} from "../academy-secure/master-artwork.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const selectedOutput=process.argv[2]
 ? path.resolve(root,process.argv[2])
 : path.resolve(root,"dist-pages/assets/certificate-previews");
if(!selectedOutput.startsWith(root+path.sep))
 throw Error("Preview destination must be inside the Academy workspace");

export const PUBLIC_CERTIFICATE_PREVIEWS=Object.freeze([
 {style:"FORMAL_TRADITIONAL",file:"formal-sample.png"},
 {style:"SCOUT_MODERN",file:"scout-sample.png"},
 {style:"ENTHUSIAST_NAVY_GOLD",file:"enthusiast-sample.png"}
]);

// Text is composited into the pixels before publishing, not placed in a
// removable page layer. A deliberately repeated, outlined stamp is readable
// against dark navy, pale parchment and teal portions of all three designs.
function sampleStampSvg(width,height){
 return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><pattern id="sample" patternUnits="userSpaceOnUse" width="440" height="245">
   <g transform="translate(220 122) rotate(-28)" text-anchor="middle"
      font-family="DejaVu Sans,Arial,sans-serif" font-weight="900" letter-spacing="1">
    <text x="0" y="-5" font-size="54" fill="#7c071e" fill-opacity=".88"
      stroke="#fff9ed" stroke-opacity=".86" stroke-width="5" stroke-linejoin="round" paint-order="stroke fill">SAMPLE</text>
    <text x="0" y="42" font-size="43" fill="#7c071e" fill-opacity=".88"
      stroke="#fff9ed" stroke-opacity=".86" stroke-width="5" stroke-linejoin="round" paint-order="stroke fill">NOT ISSUED</text>
   </g>
  </pattern></defs>
  <rect width="${width}" height="${height}" fill="url(#sample)"/>
 </svg>`);
}
export async function buildPublicCertificatePreviews(destination=selectedOutput){
 await mkdir(destination,{recursive:true});
 const results=[];
 for(const {style,file} of PUBLIC_CERTIFICATE_PREVIEWS){
  const master=await bundledApprovedArtwork(style); // verifies exact SHA-256
  const meta=MASTER_ARTWORK[style];
  if(!meta||master.length<2000000)throw Error("Approved master not verified: "+style);
  const width=1491,height=1055;
  const protectedPng=await sharp(master)
   .composite([{input:sampleStampSvg(width,height),blend:"over"}])
   .png({compressionLevel:9,palette:false})
   .toBuffer();
  const image=await sharp(protectedPng).metadata();
  if(image.format!=="png"||image.width!==width||image.height!==height)
   throw Error("Protected preview dimensions invalid: "+style);
  const target=path.join(destination,file);
  await writeFile(target,protectedPng);
  results.push({style,file,bytes:protectedPng.length,sourceFingerprint:meta.sha256});
 }
 return results;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out=await buildPublicCertificatePreviews();
 console.log("Generated "+out.length+" baked-watermark certificate previews (no clean originals in output).");
}
