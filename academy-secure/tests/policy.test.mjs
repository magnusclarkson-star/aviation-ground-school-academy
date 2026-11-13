import test from "node:test";
import assert from "node:assert/strict";
import {authorizedRole,permission,validEvidence,schoolApproved,courseApproved,canRecordApprovedTraining,canRecordOfficialExam,canIssueApprovedCourseCompletion} from "../policy.mjs";
const now=new Date("2026-11-13T12:00:00Z");
const sha="a".repeat(64);
const evidence=(type,scope,over={})=>({
 type,scope,issuer:"SLCAA",status:"VERIFIED",reference:"SLCAA-REF-2026",
 sha256:sha,submitted_by:"staff-a",verified_by:"qa-b",verified_at:"2026-10-01T00:00:00Z",
 effective_from:"2026-10-01T00:00:00Z",effective_until:"2027-10-01T00:00:00Z",...over
});
const school=[
 evidence("ATO_CERTIFICATE","ORG"),evidence("TRAINING_SPECIFICATIONS","ORG"),
 evidence("TPM_ACCEPTANCE","ORG"),evidence("SMS_ACCEPTANCE","ORG")
];
const course=[...school,evidence("COURSE_APPROVAL","ppl-theory")];
const exam=[...course,evidence("EXAMINING_AUTHORITY","ppl-theory"),
 evidence("EXAMINER_AUTHORISATION","examiner-01:ppl-theory"),
 evidence("INSTRUCTOR_CREDENTIAL","instructor-01:ppl-theory")];
test("role matrix denies privilege escalation",()=>{
 assert.equal(authorizedRole("student"),true);
 assert.equal(permission("student","verify_evidence"),false);
 assert.equal(permission("instructor","record_examination"),false);
 assert.equal(permission("examiner","attest_graduation"),false);
 assert.equal(permission("head_of_training","issue_privileged_invite"),false);
 assert.equal(permission("accountable_manager","issue_privileged_invite"),true);
 assert.equal(permission("quality_manager","verify_evidence"),true);
});
test("authority evidence requires human-separated review, valid time and document hash",()=>{
 assert.equal(validEvidence(evidence("ATO_CERTIFICATE","ORG"),now),true);
 for(const record of [
  evidence("ATO_CERTIFICATE","ORG",{status:"PENDING_REVIEW"}),
  evidence("ATO_CERTIFICATE","ORG",{issuer:"AGSA"}),
  evidence("ATO_CERTIFICATE","ORG",{sha256:"not-a-hash"}),
  evidence("ATO_CERTIFICATE","ORG",{verified_by:"staff-a"}),
  evidence("ATO_CERTIFICATE","ORG",{effective_until:"2026-10-01T00:00:00Z"}),
  evidence("ATO_CERTIFICATE","ORG",{effective_from:"2026-12-01T00:00:00Z"})
 ])assert.equal(validEvidence(record,now),false);
});
test("school must have ATO certificate, specifications, TPM and SMS acceptance",()=>{
 for(let i=0;i<school.length;i++)assert.equal(schoolApproved(school.filter((_,j)=>j!==i),now),false);
 assert.equal(schoolApproved(school,now),true);
 assert.equal(schoolApproved(school,new Date("2028-01-01T00:00:00Z")),false);
 assert.equal(courseApproved(school,"ppl-theory",now),false);
 assert.equal(courseApproved(course,"ppl-theory",now),true);
 assert.equal(courseApproved(course,"different-course",now),false);
});
test("private self-study cannot record approved flight training",()=>{
 assert.equal(canRecordApprovedTraining({evidence:course,courseId:"ppl-theory",instructorId:"instructor-01",enrolled:true,adult:true,now}),false);
 assert.equal(canRecordApprovedTraining({evidence:exam,courseId:"ppl-theory",instructorId:"instructor-01",enrolled:true,adult:true,now}),true);
 assert.equal(canRecordApprovedTraining({evidence:exam,courseId:"ppl-theory",instructorId:"instructor-01",enrolled:true,adult:false,now}),false);
 assert.equal(canRecordApprovedTraining({evidence:exam,courseId:"ppl-theory",instructorId:"random",enrolled:true,adult:true,now}),false);
});
test("official examination requires separately authorised examining authority and examiner",()=>{
 assert.equal(canRecordOfficialExam({evidence:course,courseId:"ppl-theory",examinerId:"examiner-01",enrolled:true,adult:true,now}),false);
 assert.equal(canRecordOfficialExam({evidence:exam,courseId:"ppl-theory",examinerId:"examiner-01",enrolled:true,adult:true,now}),true);
 assert.equal(canRecordOfficialExam({evidence:exam,courseId:"ppl-theory",examinerId:"examiner-02",enrolled:true,adult:true,now}),false);
});
test("graduation record requires valid external approvals, complete stages and independent QA",()=>{
 const base={evidence:exam,courseId:"ppl-theory",studentId:"student-01",examinerId:"examiner-01",
 trainingStages:[{status:"COMPLETE",instructor_id:"instructor-01"}],
 officialExam:{status:"PASS",course_id:"ppl-theory",student_id:"student-01",examiner_id:"examiner-01",recorded_by:"examiner-01"},
 headOfTrainingId:"head-01",qualityManagerId:"qa-01",now};
 assert.equal(canIssueApprovedCourseCompletion(base),true);
 assert.equal(canIssueApprovedCourseCompletion({...base,evidence:course}),false);
 assert.equal(canIssueApprovedCourseCompletion({...base,officialExam:{...base.officialExam,status:"FAIL"}}),false);
 assert.equal(canIssueApprovedCourseCompletion({...base,trainingStages:[{status:"NEEDS_RETRAINING",instructor_id:"instructor-01"}]}),false);
 assert.equal(canIssueApprovedCourseCompletion({...base,qualityManagerId:"head-01"}),false);
});
