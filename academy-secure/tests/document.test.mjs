import assert from "node:assert/strict";
import {test} from "node:test";
import {PDFDocument} from "pdf-lib";
import {STYLES,ACADEMY_STANDARD_STYLE,validateOptions,renderCourseCertificate,renderAcademicTranscript} from "../document-pdf.mjs";
import {buildCertificatePdf} from "../../academy-certificate-core.mjs";
import {eligibleModule,eligibleProgramme} from "../../academy-certificate-eligibility.mjs";
import Core from "../../academy-coursebook-data.js";
import Deep from "../../academy-coursebook-depth-model.js";
const serial="AGSA-COURSE-"+"A".repeat(24);
const completion={name:"Academic Test Learner",serial,verifiedAcademicRecord:true,
 courseTitle:"Aircraft Accident and Incident Investigation",completedAt:"2026-11-13T10:00:00.000Z",issuedAt:"2026-11-13T12:00:00.000Z"};
test("built-in Academy standard certificate works without an image upload",async()=>{
 assert.equal(ACADEMY_STANDARD_STYLE,"ACADEMY_STANDARD");
 const issued=await renderCourseCertificate(completion,{
  style:ACADEMY_STANDARD_STYLE,options:{showSeal:true,showSignature:false}
 });
 const sample=await renderCourseCertificate(completion,{
  style:ACADEMY_STANDARD_STYLE,options:{showSeal:true},sample:true
 });
 assert.equal((await PDFDocument.load(issued)).getPageCount(),1);
 assert.ok(issued.length>2000);
 assert.notEqual(Buffer.compare(Buffer.from(issued),Buffer.from(sample)),0);
 await assert.rejects(()=>renderCourseCertificate({...completion,verifiedAcademicRecord:false},{
  style:ACADEMY_STANDARD_STYLE
 }),/completion/);
});
test("formal and student-track PDF templates are structured A4 pages",async()=>{
 for(const style of Object.keys(STYLES)){
  const bytes=await renderCourseCertificate(completion,{style,options:{showSeal:true,showSignature:false}});
  assert.match(Buffer.from(bytes).subarray(0,8).toString(),/%PDF-1/);
  const doc=await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),1);
  assert.ok(bytes.length>2000);
  assert.equal(Math.round(doc.getPage(0).getWidth()),842);
  assert.equal(Math.round(doc.getPage(0).getHeight()),595);
 }
});
test("private specimen certificate and transcript PDFs are distinct from issued records",async()=>{
 for(const style of Object.keys(STYLES)){
  const issued=await renderCourseCertificate(completion,{style,options:{showSeal:true}});
  const specimen=await renderCourseCertificate(completion,{style,options:{showSeal:true},sample:true});
  assert.equal(Buffer.from(specimen).subarray(0,5).toString(),"%PDF-");
  assert.notEqual(Buffer.compare(Buffer.from(issued),Buffer.from(specimen)),0,
   "Specimen PDF must include additional unissued watermark artwork");
  const doc=await PDFDocument.load(specimen);
  assert.equal(doc.getPageCount(),1);
 }
 const transcript={name:"Example Learner",studentId:"DEMO-000",issuedAt:"2026-11-13T12:00:00Z",
  releaseId:"SAMPLE-NOT-ISSUED",entries:[{
   courseId:"test-course",courseTitle:"Safety Foundations",revision:"PREVIEW",startedAt:"2026-01-01",
   enrolmentStatus:"DEMO",stages:[],assessments:[],completion:null
  }],verifiedIdentity:false};
 const issued=await renderAcademicTranscript(transcript);
 const sample=await renderAcademicTranscript(transcript,{sample:true});
 assert.notEqual(Buffer.compare(Buffer.from(issued),Buffer.from(sample)),0);
 assert.equal((await PDFDocument.load(sample)).getPageCount(),1);
});
test("formal documents cannot be generated from self-study scores or fake serials",async()=>{
 await assert.rejects(()=>renderCourseCertificate({...completion,serial:"FAKE-123"}),/course completion/);
 await assert.rejects(()=>renderCourseCertificate({...completion,verifiedAcademicRecord:false}),/completion/);
 await assert.rejects(()=>renderCourseCertificate(completion,{options:{showSignature:true}}),/signature image/);
 assert.throws(()=>validateOptions({showQrVerification:true}),/registry/);
 assert.throws(()=>validateOptions({showSeal:"yes"}),/checkboxes/);
});
test("transcript serializes multiple academic records into a valid private PDF",async()=>{
 const bytes=await renderAcademicTranscript({
  name:"Academic Test Learner",studentId:"random-test-record-1",issuedAt:"2026-11-13T12:00:00Z",
  releaseId:"test-document-release",entries:[
   {courseId:"flight-safety",courseTitle:"Aviation Safety Management",revision:"draft-2",
    enrolmentStatus:"ENROLLED",startedAt:"2026-01-01",
    stages:[{stageKey:"stage-1",status:"COMPLETE",trainingDate:"2026-06-01"}],
    assessments:[{status:"PASS",assessmentDate:"2026-09-01",blueprintRevision:"release-1"}],
    completion:{status:"ISSUED",serial,attestedAt:"2026-10-01"}},
   {courseId:"avionics-foundations",courseTitle:"Avionics Engineering Foundations",revision:"intro-1",
    enrolmentStatus:"ENROLLED",startedAt:"2026-08-01",stages:[],assessments:[],completion:null}
  ],verifiedIdentity:true
 },{options:{showSeal:true}});
 assert.equal(Buffer.from(bytes).subarray(0,5).toString(),"%PDF-");
 const parsed=await PDFDocument.load(bytes);assert.ok(parsed.getPageCount()>=1);
 assert.equal(Math.round(parsed.getPage(0).getHeight()),842);
});
test("self-study certificate is clearly different from a formal school award",()=>{
 const data=buildCertificatePdf({kind:"SELF_STUDY_MODULE",name:"Academy Learner",
  courseTitle:"Aviation Foundations",issuedAt:"2026-11-13T00:00:00Z",revision:"v1",
  style:"SCOUT_MODERN"});
 assert.equal(Buffer.from(data).subarray(0,5).toString(),"%PDF-");
 assert.ok(data.length>1500);
 assert.throws(()=>buildCertificatePdf({kind:"ACADEMY_COURSE_COMPLETION",
  name:"Student",courseTitle:"Example",issuedAt:"2026-11-13T00:00:00Z",serial:"FAKE"}));
});
