// Original print layouts for Academy records. pdf-lib is bundled in private Node server.
// IMPORTANT: image signature is an optional visual reproduction, NOT cryptographic signing.
import {PDFDocument,StandardFonts,rgb,degrees} from "pdf-lib";
import {buildTranscriptPdf} from "./transcript-pdf.mjs";
export const ACADEMY_STANDARD_STYLE="ACADEMY_STANDARD";
export const STYLES=Object.freeze({
 FORMAL_TRADITIONAL:"Formal academic ivory and burgundy",
 SCOUT_MODERN:"Air Scouts modern aviation blue and teal",
 ENTHUSIAST_NAVY_GOLD:"Aviation enthusiast formal navy and gold"
});
export const DEFAULT_OPTIONS=Object.freeze({
 showSeal:false,showSignature:false,showCertificateNumber:true,
 showCompletionDate:true,showCourseTitle:true,showInstructorLine:false,
 showQrVerification:false,autoDownload:false,autoPrint:false
});
export function validateOptions(obj){
 if(!obj||typeof obj!=="object"||Array.isArray(obj)||Object.keys(obj).some(x=>!(x in DEFAULT_OPTIONS)))throw Error("Invalid certificate choices");
 const out={...DEFAULT_OPTIONS,...obj};
 for(const value of Object.values(out))if(typeof value!=="boolean")throw Error("Certificate options must be checkboxes");
 if(out.showQrVerification)throw Error("Verification QR requires a live verified registry and cannot be enabled in this prototype");
 return out;
}
const C={
 navy:rgb(.07,.16,.28),ivory:rgb(.994,.984,.954),gold:rgb(.77,.59,.30),
 burgundy:rgb(.42,.11,.20),teal:rgb(.08,.55,.60),blue:rgb(.10,.37,.65),
 white:rgb(1,1,1),grey:rgb(.40,.45,.49),black:rgb(.13,.16,.19)
};
function clean(input,max=120){
 const value=String(input??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim();
 return value.slice(0,max);
}
function safeFont(text,font,size,maxWidth){
 const t=clean(text,160);let n=size;
 while(n>11&&font.widthOfTextAtSize(t,n)>maxWidth)n-=.5;
 return n;
}
function centered(page,value,y,size,font,color,maxWidth=700){
 const str=clean(value,160),n=safeFont(str,font,size,maxWidth);
 page.drawText(str,{x:Math.max(40,(page.getWidth()-font.widthOfTextAtSize(str,n))/2),y,size:n,font,color});
}
function rule(page,x1,y1,x2,y2,color=C.gold,width=1){
 page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:width,color});
}
function seal(page,x,y,ink=C.gold){
 page.drawCircle({x,y,size:31,borderWidth:1.8,borderColor:ink});
 page.drawCircle({x,y,size:25,borderWidth:.7,borderColor:ink});
 const rays=[[0,20],[20,0],[0,-20],[-20,0]];
 rays.forEach(([dx,dy])=>rule(page,x,y,x+dx,y+dy,ink,.95));
 page.drawText("AGSA",{x:x-15,y:y-5,size:10,color:ink});
}
export async function renderCourseCertificate(record,{style=ACADEMY_STANDARD_STYLE,options={},signaturePng=null,sample=false}={}){
 if(!STYLES[style]&&style!==ACADEMY_STANDARD_STYLE)throw Error("Unrecognised Academy certificate design");
 const opts=validateOptions(options);
 if(!record||typeof record.name!=="string"||record.name.trim().length<3||
   !/^AGSA-COURSE-[0-9A-F]{24}$/.test(record.serial||"")||record.verifiedAcademicRecord!==true)
   throw Error("Official-looking Academy PDF requires verified staff-attested course completion");
 const doc=await PDFDocument.create(),page=doc.addPage([841.89,595.28]);
 const ser=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
 const book=await doc.embedFont(StandardFonts.TimesRoman),bookBold=await doc.embedFont(StandardFonts.TimesRomanBold);
 const width=page.getWidth(),height=page.getHeight();
 const theme=style===ACADEMY_STANDARD_STYLE?{background:C.ivory,heading:C.navy,accent:C.gold,body:C.navy,font:bookBold}:
  style==="FORMAL_TRADITIONAL"?{background:C.ivory,heading:C.burgundy,accent:C.gold,body:C.navy,font:bookBold}:
  style==="SCOUT_MODERN"?{background:C.white,heading:C.blue,accent:C.teal,body:C.navy,font:bold}:
   {background:C.navy,heading:C.white,accent:C.gold,body:C.white,font:bookBold};
 page.drawRectangle({x:0,y:0,width,height,color:theme.background});
 page.drawRectangle({x:22,y:22,width:width-44,height:height-44,borderColor:theme.accent,borderWidth:2});
 page.drawRectangle({x:30,y:30,width:width-60,height:height-60,borderColor:theme.accent,borderWidth:.55});
 if(style==="SCOUT_MODERN"){
  page.drawRectangle({x:0,y:height-110,width,height:110,color:C.blue});
  page.drawRectangle({x:0,y:height-119,width,height:9,color:C.teal});
  rule(page,62,466,160,500,C.white,3);rule(page,160,500,240,475,C.white,3);
 }else if(style==="FORMAL_TRADITIONAL"){
  page.drawRectangle({x:0,y:height-39,width,height:39,color:C.burgundy});
  rule(page,140,472,702,472,C.gold,1.5);
 }else if(style===ACADEMY_STANDARD_STYLE){
  page.drawRectangle({x:0,y:height-22,width,height:22,color:C.navy});
  rule(page,140,472,702,472,C.gold,1.5);
 }else{
  page.drawRectangle({x:0,y:0,width:13,height,color:C.gold});
  page.drawRectangle({x:width-13,y:0,width:13,height,color:C.gold});
 }
 const topColor=style==="SCOUT_MODERN"?C.white:theme.heading;
 centered(page,"AVIATION GROUND SCHOOL ACADEMY",style==="SCOUT_MODERN"?515:520,18,bold,topColor);
 centered(page,style==="SCOUT_MODERN"?"AIR SCOUTS AND AVIATION STUDIES":style==="ENTHUSIAST_NAVY_GOLD"?"AVIATION STUDIES - KNOWLEDGE AND DISCIPLINE":style===ACADEMY_STANDARD_STYLE?"KNOWLEDGE - DISCIPLINE - SAFETY":"ACADEMIC COURSE RECORD",style==="SCOUT_MODERN"?490:495,10,ser,topColor);
 centered(page,"CERTIFICATE OF COURSE COMPLETION",427,26,theme.font,theme.heading);
 centered(page,"THIS CERTIFIES THAT",387,11,ser,theme.body);
 centered(page,record.name,338,34,style==="SCOUT_MODERN"?bold:bookBold,theme.heading,690);
 rule(page,132,323,width-132,323,theme.accent,1.2);
 centered(page,"has completed the documented learning requirements for",290,12,ser,theme.body);
 if(opts.showCourseTitle)centered(page,record.courseTitle,251,23,bold,theme.heading,715);
 else centered(page,"an Academy course",251,19,ser,theme.body);
 centered(page,"Recorded Academy course completion - not a civil aviation pilot licence",211,10,ser,theme.body);
 if(opts.showSeal)seal(page,width/2,118,theme.accent);
 if(opts.showSignature){
  if(!signaturePng)throw Error("Signature checkbox selected but no authorised signature image is available");
  const png=await doc.embedPng(signaturePng),ratio=Math.min(150/png.width,42/png.height);
  page.drawImage(png,{x:94,y:106,width:png.width*ratio,height:png.height*ratio});
  page.drawText("ACADEMY ADMINISTRATOR",{x:94,y:91,size:8,font:ser,color:theme.body});
 }
 if(opts.showInstructorLine){rule(page,568,119,754,119,theme.accent,.8);page.drawText("INSTRUCTOR SIGN-OFF (IF AUTHORIZED)",{x:562,y:104,size:8,font:ser,color:theme.body})}
 const left=opts.showCompletionDate?"Date: "+clean(record.completedAt||record.issuedAt,20).slice(0,10):"";
 if(left)page.drawText(left,{x:69,y:73,size:9,font:ser,color:theme.body});
 if(opts.showCertificateNumber)page.drawText("Academy reference: "+clean(record.serial,55),{x:470,y:73,size:9,font:ser,color:theme.body});
 centered(page,"ACADEMY RECORD ONLY - ANY REGULATORY STATUS REQUIRES INDEPENDENT VERIFICATION",41,8,ser,theme.body);
 if(sample){
  // Rendered after all document art so the watermark can never be covered by
  // seal, decorative text, or a sample signature. Not an issued credential.
  page.drawText("SAMPLE - NOT ISSUED",{
   x:116,y:283,size:53,font:bold,color:C.burgundy,rotate:degrees(18),opacity:.36
  });
  page.drawRectangle({x:190,y:15,width:460,height:24,color:C.burgundy,opacity:.92});
  page.drawText("SPECIMEN ONLY - NOT A STUDENT CERTIFICATE",{
   x:236,y:22,size:12,font:bold,color:C.white
  });
 }
 return doc.save({useObjectStreams:false});
}
export async function renderAcademicTranscript(record,{options={},signaturePng=null,sample=false}={}){
 const opts=validateOptions(options);
 if(opts.showSignature&&!signaturePng)throw Error("Signature preference is enabled but signature image has not been authorised");
 const raw=buildTranscriptPdf(record);
 const doc=await PDFDocument.load(raw),pages=doc.getPages();
 const font=await doc.embedFont(StandardFonts.Helvetica);
 const png=opts.showSignature?await doc.embedPng(signaturePng):null;
 for(const page of pages){
  if(opts.showSeal)seal(page,521,103,C.gold);
  if(png){const ratio=Math.min(130/png.width,28/png.height);page.drawImage(png,{x:333,y:90,width:png.width*ratio,height:png.height*ratio})}
  page.drawText("Academy records - identity and payment checked before release",{x:38,y:71,size:7.6,font,color:C.grey});
  if(sample){
   const heading=await doc.embedFont(StandardFonts.HelveticaBold);
   page.drawText("SAMPLE - NOT ISSUED",{
    x:95,y:389,size:45,font:heading,color:C.burgundy,rotate:degrees(33),opacity:.34
   });
   page.drawRectangle({x:125,y:15,width:345,height:22,color:C.burgundy,opacity:.92});
   page.drawText("SPECIMEN - NOT A VERIFIED TRANSCRIPT",{x:162,y:21,size:10,font:heading,color:C.white});
  }
 }
 return doc.save({useObjectStreams:false});
}
