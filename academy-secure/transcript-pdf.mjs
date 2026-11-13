// Academy training transcript - printable A4 portrait PDF, served only after
// authenticated entitlement checks. No assumption of SLCAA recognition.
const encoder=new TextEncoder();
export function cleanText(value,max=125){
 return String(value??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function pdfString(text){return cleanText(text,220).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function rgb(hex){return [1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(3)).join(" ")}
function date(value){if(!value||!Number.isFinite(new Date(value).getTime()))return "Not recorded";return new Date(value).toISOString().slice(0,10)}
function objectPdf(pageStreams){
 const fonts=["Helvetica","Helvetica-Bold","Times-Roman"];
 const pageCount=pageStreams.length;
 const pageIds=pageStreams.map((_,i)=>3+i*2),streamIds=pageStreams.map((_,i)=>4+i*2);
 const fontBase=3+2*pageCount,objects=[
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids ["+pageIds.map(x=>x+" 0 R").join(" ")+"] /Count "+pageCount+" >>"
 ];
 for(let i=0;i<pageCount;i++){
  const bytes=encoder.encode(pageStreams[i]);
  objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 "+fontBase+" 0 R /F2 "+(fontBase+1)+" 0 R /F3 "+(fontBase+2)+" 0 R >> >> /Contents "+streamIds[i]+" 0 R >>");
  objects.push("<< /Length "+bytes.length+" >>\nstream\n"+pageStreams[i]+"\nendstream");
 }
 fonts.forEach(name=>objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /"+name+" /Encoding /WinAnsiEncoding >>"));
 const out=[],offsets=[0];let total=0;
 const append=s=>{const v=encoder.encode(s);out.push(v);total+=v.length};
 append("%PDF-1.4\n");
 objects.forEach((o,i)=>{offsets.push(total);append((i+1)+" 0 obj\n"+o+"\nendobj\n")});
 const xref=total;
 append("xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n");
 offsets.slice(1).forEach(pos=>append(String(pos).padStart(10,"0")+" 00000 n \n"));
 append("trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF\n");
 const bytes=new Uint8Array(total);let p=0;for(const part of out){bytes.set(part,p);p+=part.length}return bytes;
}
function makePainter(){
 const commands=[],add=s=>commands.push(s);
 const fill=(hex,x,y,w,h)=>add(rgb(hex)+" rg "+x+" "+y+" "+w+" "+h+" re f");
 const line=(hex,x1,y1,x2,y2,width=1)=>add(rgb(hex)+" RG "+width+" w "+x1+" "+y1+" m "+x2+" "+y2+" l S");
 const text=(s,x,y,size=11,bold=false,hex="#203448")=>add("BT /"+(bold?"F2":"F1")+" "+size+" Tf "+rgb(hex)+" rg "+x+" "+y+" Td ("+pdfString(s)+") Tj ET");
 return {commands,fill,line,text};
}
function wrap(value,maxCharacters=86){
 const words=cleanText(value,400).split(" "),lines=[];let current="";
 for(const word of words){const next=current?current+" "+word:word;if(next.length>maxCharacters&&current){lines.push(current);current=word}else current=next}
 if(current)lines.push(current);return lines.length?lines:["-"];
}
export function buildTranscriptPdf({name,studentId,issuedAt,releaseId,entries,verifiedIdentity=true}){
 if(typeof name!=="string"||name.trim().length<3)throw Error("Academic transcript requires a reviewed legal name");
 if(!Array.isArray(entries)||entries.length<1||entries.length>100)throw Error("Transcript requires 1-100 recorded courses");
 if(!Number.isFinite(Date.parse(issuedAt)))throw Error("Invalid document issuance timestamp");
 const pages=[];let painter,position;
 function newPage(){
  painter=makePainter();pages.push(painter);
  const {fill,line,text}=painter;
  fill("#fbfaf5",0,0,595,842);fill("#122c44",0,765,595,77);fill("#c7a460",0,756,595,9);
  text("AVIATION GROUND SCHOOL ACADEMY",39,802,16,true,"#ffffff");
  text("ACADEMIC TRANSCRIPT  |  PRIVATE TRAINING RECORD",39,784,10,false,"#d7e7f2");
  text("Learner: "+cleanText(name,58),39,726,12,true);
  text("Record identifier: "+cleanText(studentId,45),39,706,9);
  text("Document snapshot: "+date(issuedAt),39,690,9);
  text("Document reference: "+cleanText(releaseId,55),39,674,9);
  line("#c7a460",39,660,556,660,1.2);
  position=639;
 }
 function reserve(space=30){
  if(position-space<93){newPage();return}
 }
 function heading(s){reserve(34);painter.text(s.toUpperCase(),39,position,11,true,"#176784");position-=17;painter.line("#aab8c2",39,position,555,position,.6);position-=14}
 function row(label,value){
  const lines=wrap(value,78);
  reserve(20+lines.length*12);
  painter.text(cleanText(label,20),39,position,9,true);
  for(const s of lines){painter.text(s,170,position,9);position-=12}
  position-=7;
 }
 newPage();
 for(const [i,e] of entries.entries()){
  heading("Course "+(i+1)+": "+cleanText(e.courseTitle,72));
  row("Course code",e.courseId);row("Syllabus revision",e.revision||"Not recorded");
  row("Enrolment",date(e.startedAt)+" | "+(e.enrolmentStatus||"Unknown"));
  row("Recorded outcomes",e.stages?.length?e.stages.length+" stage record(s)":"No staff stage records yet");
  for(const s of (e.stages||[]).slice(0,35))row("Stage - "+cleanText(s.stageKey,13),cleanText(s.status,25)+" | "+date(s.trainingDate));
  if((e.stages||[]).length>35)row("Additional records","Contact the Academy for full stage history");
  row("Assessments",e.assessments?.length?e.assessments.length+" staff-recorded result(s)":"No formal assessment results recorded");
  for(const a of (e.assessments||[]).slice(0,35))row("Exam - "+date(a.assessmentDate),cleanText(a.status,12)+" | blueprint "+cleanText(a.blueprintRevision,42));
  if((e.assessments||[]).length>35)row("Additional results","Contact the Academy for full examination history");
  row("Course completion",e.completion?.status==="ISSUED"?
   "ACADEMY COURSE COMPLETION recorded "+date(e.completion.attestedAt)+" | "+cleanText(e.completion.serial,45):
   e.completion?.status||"Not yet recorded");
  position-=7;
 }
 reserve(82);painter.line("#c7a460",39,position,555,position,1);position-=19;
 painter.text("ISSUED FROM PRIVATE ACADEMY RECORDS - NO CREDIT CONFERRED BY THIS PDF",39,position,8.5,true,"#203448");position-=18;
 for(const s of wrap("This document reports existing staff-recorded course activity, not automatically awarded qualifications. It is not an SLCAA pilot licence, regulator-issued certificate or verified digital signature.",88)){
  painter.text(s,39,position,8.5,false,"#53697c");position-=12;
 }
 for(const [i,p] of pages.entries()){
  const {text,line}=p;line("#c7a460",39,61,555,61,.65);
  text("CONFIDENTIAL STUDENT RECORD  |  Valid only with separately verified Academy source",39,43,7.3,false,"#53697c");
  text("Page "+(i+1)+" / "+pages.length,508,43,8,false,"#53697c");
  if(!verifiedIdentity)text("PROVISIONAL IDENTITY - NOT FOR FORMAL ISSUANCE",39,29,8,true,"#8b392e");
 }
 return objectPdf(pages.map(p=>p.commands.join("\n")+"\n"));
}
