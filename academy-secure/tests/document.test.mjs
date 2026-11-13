import assert from "node:assert/strict";
import {test} from "node:test";
import {PDFDocument} from "pdf-lib";
import {STYLES,validateOptions,renderCourseCertificate,renderAcademicTranscript} from "../document-pdf.mjs";
import {buildCertificatePdf} from "../../academy-certificate-core.mjs";
import {eligibleModule,eligibleProgramme} from "../../academy-certificate-eligibility.mjs";
import Core from "../../academy-coursebook-data.js";
import Deep from "../../academy-coursebook-depth-model.js";
const serial="AGSA-COURSE-"+"A".repeat(24);
const completion={name:"Academic Test Learner",serial,verifiedAcademicRecord:true,
 courseTitle:"Aircraft Accident and Incident Investigation",completedAt:"2026-11-13T10:00:00.000Z",issuedAt:"2026-11-13T12:00:00.000Z"};
test("formal and student-track PDF templates are structured A4 pages",async()=>{
 for(const style of Object.keys(STYLES)){
  const bytes=await renderCourseCertificate(completion,{style,options:{showSeal:true,showSignature:false}});
  assert.match(Buffer.from(bytes).subarray(0,8).toString(),"PDF-1.");
  const doc=await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),1);
  assert.ok(bytes.length>2000);
  assert.equal(Math.round(doc.getPage(0).getWidth()),842);
  assert.equal(Math.round(doc.getPage(0).getHeight()),595);
 }
});
test("formal documents cannot be generated from self-study scores or fake serials",async()=>{
 await assert.rejects(()=>renderCourseCertificate({...completion,serial:"FAKE-123"}),/completion reference/);
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
