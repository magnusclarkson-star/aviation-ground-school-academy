// Authentic owner-approved raster masters as immutable backgrounds.
// Only dynamic fields are overprinted. Original 1491x1055 PNG bytes are never edited.
import {PDFDocument,StandardFonts,rgb,degrees} from "pdf-lib";
import {validateOptions} from "./document-pdf.mjs";
import {validateMasterArtwork} from "./master-artwork.mjs";
const W=841.89,H=595.28,SX=W/1491,SY=H/1055;
const fields={
 FORMAL_TRADITIONAL:{
  name:{x:390,y:364,w:710,fontSize:28,color:rgb(.38,.11,.14)},
  course:{x:328,y:518,w:838,fontSize:25,rect:{x:320,y:494,w:840,h:55,color:rgb(.43,.035,.055)},color:rgb(1,.97,.89)},
  date:{x:345,y:726,w:200,fontSize:13,color:rgb(.19,.12,.12)},
  number:{x:920,y:726,w:230,fontSize:10,color:rgb(.19,.12,.12)},
  signature:{x:900,y:800,w:255,h:46},
  extraSeal:{x:1230,y:710},
  footer:{x:285,y:910}
 },
 SCOUT_MODERN:{
  name:{x:359,y:415,w:740,fontSize:28,color:rgb(.04,.26,.41)},
  course:{x:316,y:560,w:824,fontSize:25,rect:{x:313,y:523,w:826,h:70,color:rgb(.075,.29,.42)},color:rgb(1,1,1)},
  date:{x:414,y:713,w:174,fontSize:12,color:rgb(.03,.20,.30)},
  number:{x:975,y:713,w:250,fontSize:10,color:rgb(.03,.20,.30)},
  signature:{x:930,y:791,w:270,h:45},
  extraSeal:{x:1245,y:678},
  footer:{x:312,y:906}
 },
 ENTHUSIAST_NAVY_GOLD:{
  name:{x:322,y:438,w:825,fontSize:28,color:rgb(.07,.16,.28)},
  course:{x:370,y:563,w:758,fontSize:27,rect:{x:365,y:542,w:762,h:55,color:rgb(.012,.105,.19)},color:rgb(1,.97,.89)},
  date:{x:395,y:732,w:180,fontSize:12,color:rgb(.07,.16,.28)},
  number:{x:1160,y:732,w:180,fontSize:8,color:rgb(.07,.16,.28)},
  signature:{x:933,y:793,w:285,h:44},
  extraSeal:{x:1250,y:683},
  footer:{x:320,y:908}
 }
};
function ptTop(top){return H-top*SY}
function text(page,text,font,box){
 const source=String(text??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim().slice(0,150);
 let size=box.fontSize;
 while(size>7&&font.widthOfTextAtSize(source,size)>box.w*SX)size-=.5;
 const width=font.widthOfTextAtSize(source,size),x=box.x*SX+(box.w*SX-width)/2;
 page.drawText(source,{x:Math.max(8,x),y:ptTop(box.y),font,size,color:box.color});
}
function backgroundMask(page,r){
 page.drawRectangle({x:r.x*SX,y:ptTop(r.y+r.h),width:r.w*SX,height:r.h*SY,color:r.color});
}
export async function renderOriginalCertificate(record,{style,masterPng,options={},signaturePng=null,sample=false}={}){
 const m=fields[style];
 if(!m)throw Error("Original style not supported");
 if(!record||typeof record.name!=="string"||record.name.trim().length<3||
  !/^AGSA-COURSE-[0-9A-F]{24}$/.test(record.serial||"")||
  record.verifiedAcademicRecord!==true)
  throw Error("A staff-attested Academy completion record is required");
 const opts=validateOptions(options);
 validateMasterArtwork(Buffer.from(masterPng||[]),style);
 const doc=await PDFDocument.create(),page=doc.addPage([W,H]);
 const image=await doc.embedPng(masterPng),font=await doc.embedFont(StandardFonts.TimesRomanBold),
  sans=await doc.embedFont(StandardFonts.HelveticaBold);
 page.drawImage(image,{x:0,y:0,width:W,height:H});
 text(page,record.name,font,m.name);
 // The source ribbon has a fixed course title baked into its pixels. Mask only
 // its lettering region inside the original ornamental ribbon, preserving borders.
 backgroundMask(page,m.course.rect);
 if(opts.showCourseTitle)text(page,record.courseTitle,sans,m.course);
 if(opts.showCompletionDate){
  const d=record.completedAt||record.issuedAt;
  if(!Number.isFinite(Date.parse(d)))throw Error("Invalid completion date");
  text(page,new Date(d).toISOString().slice(0,10),sans,m.date);
 }
 if(opts.showCertificateNumber){
  const reference=record.serial.slice(-16); // full secure reference retained in PDF metadata
  text(page,reference,sans,m.number);
 }
 if(opts.showSignature){
  if(!signaturePng)throw Error("Owner signature option requires a verified and authorised private signature PNG");
  const signature=await doc.embedPng(signaturePng);
  const size=m.signature,scale=Math.min(size.w*SX/signature.width,size.h*SY/signature.height);
  page.drawImage(signature,{x:size.x*SX,y:ptTop(size.y+size.h),width:signature.width*scale,height:signature.height*scale});
 }
 // The original artwork already includes its ornate central medal/seal and printed
 // instructor lines. The option adds a DISTINCT small validation mark, not a replacement.
 if(opts.showSeal){
  const x=m.extraSeal.x*SX,y=ptTop(m.extraSeal.y);
  page.drawCircle({x,y,size:22,borderWidth:1.25,borderColor:rgb(.50,.34,.12),opacity:.95});
  page.drawText("AGSA",{x:x-13,y:y-3,font:sans,size:8,color:rgb(.35,.24,.12)});
 }
 // Always include an explicit validity limitation; the pixel artwork may contain
 // fixed wording such as "approved course" that is not a regulator approval.
 page.drawRectangle({x:60,y:11,width:722,height:15,color:rgb(1,1,1),opacity:.92});
 const notice="ACADEMY COURSE RECORD - NOT A PILOT LICENCE OR AN SLCAA-ISSUED CERTIFICATE";
 const info=await doc.embedFont(StandardFonts.Helvetica);
 page.drawText(notice,{x:159,y:15,font:info,size:8,color:rgb(.19,.23,.28)});
 if(sample){
  page.drawRectangle({x:190,y:27,width:462,height:27,color:rgb(.45,.055,.11),opacity:.89});
  page.drawText("SAMPLE ONLY - NOT ISSUED",{x:286,y:34,font:sans,size:13,color:rgb(1,1,1)});
  page.drawText("SAMPLE - NOT ISSUED",{x:140,y:298,font:sans,size:52,
   color:rgb(.48,.06,.12),rotate:degrees(16),opacity:.29});
 }
 doc.setTitle((sample?"SAMPLE - ":"")+String(record.courseTitle||"Academy certificate").slice(0,90));
 doc.setSubject("Academy record "+record.serial+"; not an SLCAA licence");
 return doc.save({useObjectStreams:false});
}
export const ORIGINAL_STYLES=Object.freeze(Object.keys(fields));
