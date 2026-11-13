// Aviation Ground School Academy — proposed ATO authorisation and separation-of-duties policy.
// No application state, user record or Academy self-check grants SLCAA approval.
export const ROLES=Object.freeze(["student","instructor","examiner","quality_manager","head_of_training","accountable_manager"]);
export const EVIDENCE_TYPES=Object.freeze(["ATO_CERTIFICATE","TRAINING_SPECIFICATIONS","COURSE_APPROVAL","EXAMINING_AUTHORITY","EXAMINER_AUTHORISATION","INSTRUCTOR_CREDENTIAL","TPM_ACCEPTANCE","SMS_ACCEPTANCE"]);
export const EVIDENCE_STATUS=Object.freeze(["PENDING_REVIEW","VERIFIED","REJECTED","REVOKED"]);
export function authorizedRole(role){return ROLES.includes(role)}
export function permission(role,action){
 const allowed={
  invite:["accountable_manager","head_of_training"],
  issue_privileged_invite:["accountable_manager"],
  submit_evidence:["accountable_manager","head_of_training"],
  verify_evidence:["quality_manager"],
  record_training:["instructor"],
  record_examination:["examiner"],
  request_graduation:["head_of_training"],
  attest_graduation:["quality_manager"],
  read_audit:["quality_manager","accountable_manager"]
 };
 return (allowed[action]||[]).includes(role);
}
export function validEvidence(record,now=new Date()){
 const stamp=new Date(now).getTime();
 return !!record&&record.status==="VERIFIED"&&record.issuer==="SLCAA"&&
  typeof record.reference==="string"&&record.reference.trim().length>=4&&
  typeof record.sha256==="string"&&/^[a-f0-9]{64}$/i.test(record.sha256)&&
  !!record.submitted_by&&!!record.verified_by&&record.submitted_by!==record.verified_by&&
  !!record.verified_at&&Number.isFinite(Date.parse(record.verified_at))&&
  Number.isFinite(stamp)&&Number.isFinite(Date.parse(record.effective_from))&&
  stamp>=Date.parse(record.effective_from)&&
  (record.effective_until===null||record.effective_until===undefined||
    (Number.isFinite(Date.parse(record.effective_until))&&stamp<Date.parse(record.effective_until)));
}
export function approvalFor(evidence,type,scope,now=new Date()){
 return evidence.some(x=>x.type===type&&x.scope===scope&&validEvidence(x,now));
}
export function schoolApproved(evidence,now=new Date()){
 // Never assume a simulator or digital school has an ATO rating.
 return approvalFor(evidence,"ATO_CERTIFICATE","ORG",now)&&
  approvalFor(evidence,"TRAINING_SPECIFICATIONS","ORG",now);
}
export function courseApproved(evidence,courseId,now=new Date()){
 return schoolApproved(evidence,now)&&approvalFor(evidence,"COURSE_APPROVAL",courseId,now);
}
export function examinerApproved(evidence,examinerId,courseId,now=new Date()){
 return approvalFor(evidence,"EXAMINER_AUTHORISATION",examinerId+":"+courseId,now)&&
  approvalFor(evidence,"EXAMINING_AUTHORITY",courseId,now);
}
export function canRecordApprovedTraining({evidence,courseId,instructorId,enrolled,adult,now=new Date()}){
 return courseApproved(evidence,courseId,now)&&
  approvalFor(evidence,"INSTRUCTOR_CREDENTIAL",instructorId+":"+courseId,now)&&
  enrolled===true&&adult===true;
}
export function canRecordOfficialExam({evidence,courseId,examinerId,enrolled,adult,now=new Date()}){
 return courseApproved(evidence,courseId,now)&&examinerApproved(evidence,examinerId,courseId,now)&&
  enrolled===true&&adult===true;
}
export function canIssueApprovedCourseCompletion({evidence,courseId,studentId,examinerId,trainingStages,
 officialExam,headOfTrainingId,qualityManagerId,now=new Date()}){
 if(!courseApproved(evidence,courseId,now)||!examinerApproved(evidence,examinerId,courseId,now))
  return false;
 if(!studentId||!headOfTrainingId||!qualityManagerId||headOfTrainingId===qualityManagerId)
  return false;
 if(!Array.isArray(trainingStages)||!trainingStages.length||trainingStages.some(x=>x.status!=="COMPLETE"||!x.instructor_id))
  return false;
 if(!officialExam||officialExam.status!=="PASS"||officialExam.course_id!==courseId||
   officialExam.student_id!==studentId||officialExam.examiner_id!==examinerId||
   officialExam.recorded_by!==examinerId)return false;
 return true;
}
export const STATUS_TEXT=Object.freeze({
  UNAPPROVED:"NOT AN APPROVED TRAINING ORGANISATION",
  PENDING:"APPROVAL DOCUMENTS UNDER REVIEW",
  VERIFIED:"ATO documentation internally verified against supplied SLCAA evidence; confirm with the Authority"
});
