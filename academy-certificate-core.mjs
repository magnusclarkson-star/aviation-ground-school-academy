/*
 * Aviation Ground School Academy — vector PDF certificate renderer.
 * Fixed A4 landscape, native PDF 1.4, no network, fonts or third-party APIs.
 * Only printable records: never imply regulator-issued pilot licences.
 */
const PAGE_W=842,PAGE_H=595;
export const CERTIFICATE_KINDS=Object.freeze([
 "SELF_STUDY_MODULE","SELF_STUDY_PROGRAMME","ACADEMY_COURSE_COMPLETION"
]);
export function safeCertificateText(input,max=140){
 let s=String(input??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim();
 if(s.length>max)s=s.slice(0,max).trim();
 return s||"Academy Learner";
}
function pdfLiteral(input){
 return safeCertificateText(input,250).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}
function colour(hex){const h=hex.replace("#","");return [0,2,4].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(" ")}
function pdfDate(value){
 const ms=Date.parse(value);
 if(!Number.isFinite(ms))throw Error("Certificate issue date is invalid");
 const d=new Date(ms);
 return d.toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric",timeZone:"UTC"});
}
function visualLength(s){return [...safeCertificateText(s)].reduce((sum,c)=>sum+(/[MW@%]/.test(c)?0.81:/[ilI.,:;!|' ]/.test(c)?0.27:/[A-Z]/.test(c)?0.62:0.52),0)}
export function validateCertificate(record){
 if(!record||!CERTIFICATE_KINDS.includes(record.kind))throw Error("Unsupported certificate kind");
 const name=safeCertificateText(record.name||"Academy Learner",90);
 const title=safeCertificateText(record.courseTitle,145);
 if(!record.courseTitle||title==="Academy Learner")throw Error("A course title is required");
 const date=pdfDate(record.issuedAt);
 if(record.kind==="ACADEMY_COURSE_COMPLETION"){
  if(typeof record.serial!=="string"||!/^AGSA-COURSE-[0-9A-F]{24}$/.test(record.serial))
   throw Error("A verified Academy course-completion reference is required");
  if(record.verifiedAcademicRecord!==true)
   throw Error("Only staff-attested course-completion records may use this design");
 }else if(record.serial)throw Error("Self-study records may not use official-looking serials");
 return {kind:record.kind,name,title,date,serial:record.serial||"",
  revision:safeCertificateText(record.revision||"Study draft",54),
  detail:safeCertificateText(record.detail||"",130)};
}
export function buildCertificatePdf(record){
 const c=validateCertificate(record),parts=[];
 const navy="#122B42",blue="#176784",gold="#CBA85C",ink="#203449",muted="#496176",paper="#FBF9F2";
 const cmd=x=>parts.push(x);
 const rect=(x,y,w,h,hex)=>cmd(colour(hex)+" rg "+x+" "+y+" "+w+" "+h+" re f");
 const stroke=(x,y,w,h,hex,width=1)=>cmd(colour(hex)+" RG "+width+" w "+x+" "+y+" "+w+" "+h+" re S");
 const line=(x1,y1,x2,y2,hex,width=1)=>cmd(colour(hex)+" RG "+width+" w "+x1+" "+y1+" m "+x2+" "+y2+" l S");
 const text=(value,y,size,font="F1",hex=ink,center=true,x=0)=>{
  const str=safeCertificateText(value,210);
  const width=visualLength(str)*size*(font==="F3"?.91:1);
  const drawX=center?Math.max(48,(PAGE_W-width)/2):x;
  cmd("BT /"+font+" "+size+" Tf "+colour(hex)+" rg "+drawX.toFixed(2)+" "+y.toFixed(2)+" Td ("+pdfLiteral(str)+") Tj ET");
 };
 function fit(value,maxWidth,maxSize=27,minSize=13,font="F2"){
  let size=maxSize;while(size>minSize&&visualLength(value)*size>maxWidth)size-=0.6;
  return size;
 }
 rect(0,0,PAGE_W,PAGE_H,paper);
 rect(0,0,12,PAGE_H,navy);rect(PAGE_W-12,0,12,PAGE_H,navy);
 stroke(25,23,792,549,navy,3);
 stroke(33,31,776,533,gold,1.4);
 line(48,544,135,544,gold,1.8);line(707,544,794,544,gold,1.8);
 line(48,51,135,51,gold,1.8);line(707,51,794,51,gold,1.8);
 // Original abstract winged compass (not an official national or regulator seal).
 cmd(colour(blue)+" RG 1.7 w 421 513 20 0 360 arc S".replace("421 513 20 0 360 arc", "441 513 m 439.48 520.65 435.14 527.14 c 428.65 531.48 421 533 413.35 531.48 c 406.86 527.14 402.52 520.65 401 513 c 402.52 505.35 406.86 498.86 413.35 494.52 c 421 493 428.65 494.52 435.14 498.86 c 439.48 505.35 441 513 c"));
 for(let i=0;i<4;i++){
  const sign=i%2?1:-1,start=i<2?389:453;
  line(start,513+i%2*7,(i<2?348:494),513+i%2*12,gold,2.4);
 }
 line(421,501,421,525,blue,1.5);line(409,513,433,513,blue,1.5);
 text("AVIATION GROUND SCHOOL ACADEMY",468,19,"F2",navy);
 text("KNOWLEDGE   -   DISCIPLINE   -   SAFETY",448,9.5,"F1",blue);
 line(181,433,661,433,gold,1.2);
 const kindTitle=c.kind==="ACADEMY_COURSE_COMPLETION"?"CERTIFICATE OF COURSE COMPLETION":
  c.kind==="SELF_STUDY_PROGRAMME"?"CERTIFICATE OF INDEPENDENT STUDY":"CERTIFICATE OF MODULE ACHIEVEMENT";
 text(kindTitle,392,fit(kindTitle,744,27,19,"F3"),"F3",navy);
 text("Presented to",353,13,"F1",muted);
 text(c.name,307,fit(c.name,700,32,15,"F4"),"F4",ink);
 line(176,289,666,289,gold,1.15);
 text("in recognition of completing the Academy learning requirements for",259,11.5,"F1",muted);
 text(c.title,222,fit(c.title,730,25,14,"F2"),"F2",blue);
 const details=c.kind==="SELF_STUDY_MODULE"?"Introductory and advanced module practice goals achieved":
  c.kind==="SELF_STUDY_PROGRAMME"?"All 12 modules and cumulative self-study review completed":
 "Recorded course requirements and independent academic review completed";
 text(details,193,11.5,"F1",muted);
 if(c.detail)text(c.detail,172,10,"F1",muted);
 // Distinctive original Academy mark; avoid aviation regulator crests or false signatures.
 cmd(colour(gold)+" RG 2 w 421 105 m 442 105 454 93 454 80 c 454 67 442 55 421 55 c 400 55 388 67 388 80 c 388 93 400 105 421 105 c S");
 text("AGSA",73,12,"F2",navy);
 line(88,111,313,111,gold,.7);line(529,111,754,111,gold,.7);
 text("ISSUED  "+c.date.toUpperCase(),89,10,"F2",ink,false,91);
 text("COURSE REVISION  "+c.revision,72,9,"F1",muted,false,91);
 const right=c.serial?"RECORD REFERENCE  "+c.serial:"PERSONAL STUDY RECORD  -  NOT VERIFIED";
 let rightSize=fit(right,240,8.6,6.8,"F1");
 const rightX=Math.max(535,756-visualLength(right)*rightSize);
 text(right,89,rightSize,"F1",muted,false,rightX);
 const disclaimer=c.kind==="ACADEMY_COURSE_COMPLETION"?
 "Academy academic completion record. Not a pilot licence or a certificate issued by SLCAA.":
 "Self-study record generated from device-only practice. Not identity-verified, accredited training or a licence.";
 text(disclaimer,39,fit(disclaimer,735,8.8,7.7), "F1",muted);
 const stream=parts.join("\n")+"\n";
 const fonts=[["F1","Helvetica"],["F2","Helvetica-Bold"],["F3","Times-Bold"],["F4","Times-Roman"]];
 const objects=[
 "<< /Type /Catalog /Pages 2 0 R >>",
 "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
 "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font <<"+
 fonts.map((f,i)=>" /"+f[0]+" "+(5+i)+" 0 R").join("")+
 " >> >> /Contents 4 0 R >>",
 "<< /Length "+new TextEncoder().encode(stream).length+" >>\nstream\n"+stream+"endstream",
 ...fonts.map(f=>"<< /Type /Font /Subtype /Type1 /BaseFont /"+f[1]+" /Encoding /WinAnsiEncoding >>")
 ];
 const encoder=new TextEncoder(),buffers=[],offsets=[0];let byteOffset=0;
 function append(text){const data=encoder.encode(text);buffers.push(data);byteOffset+=data.length}
 append("%PDF-1.4\n");
 objects.forEach((obj,i)=>{offsets.push(byteOffset);append((i+1)+" 0 obj\n"+obj+"\nendobj\n")});
 const xref=byteOffset;
 append("xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n");
 offsets.slice(1).forEach(n=>append(String(n).padStart(10,"0")+" 00000 n \n"));
 append("trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n");
 const output=new Uint8Array(byteOffset);let p=0;for(const item of buffers){output.set(item,p);p+=item.length}
 return output;
}
export function certificateFilename(record){
 const kind=record.kind==="ACADEMY_COURSE_COMPLETION"?"course-completion":record.kind==="SELF_STUDY_PROGRAMME"?"full-programme-self-study":"module-self-study";
 const title=safeCertificateText(record.courseTitle,46).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
 return "agsa-"+kind+"-"+(title||"course")+".pdf";
}
