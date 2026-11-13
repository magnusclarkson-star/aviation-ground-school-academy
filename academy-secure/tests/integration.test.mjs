import assert from "node:assert/strict";
import {test} from "node:test";
import {spawn} from "node:child_process";
import {readFile} from "node:fs/promises";
import pg from "pg";
const {Pool}=pg;
import {hashPassword} from "../auth.mjs";
import {deflateSync} from "node:zlib";
function pngChunk(type,payload){
 const body=Buffer.concat([Buffer.from(type),payload]),length=Buffer.alloc(4);
 length.writeUInt32BE(payload.length);
 let crc=0xffffffff;
 for(const b of body){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}
 const checksum=Buffer.alloc(4);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([length,body,checksum]);
}
function sampleSignaturePng(){
 const w=600,h=150,ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);
 ihdr[8]=8;ihdr[9]=6;
 const scan=Buffer.alloc(h*(w*4+1));
 for(let x=20;x<540;x++){
  const y=30+Math.round(30*Math.sin(x/35));
  for(let dy=0;dy<4;dy++){
   const pos=(y+dy)*(w*4+1)+1+x*4;
   scan[pos]=17;scan[pos+1]=60;scan[pos+2]=88;scan[pos+3]=255;
  }
 }
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk("IHDR",ihdr),pngChunk("IDAT",deflateSync(scan)),pngChunk("IEND",Buffer.alloc(0))]);
}


const PORT=8871,ORIGIN="http://127.0.0.1:"+PORT;
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL)throw Error("Isolated test PostgreSQL DATABASE_URL required");
test("private ATO roles, verified-source gates and independent completion record",async t=>{
 const pool=new Pool({connectionString:DATABASE_URL});
 let child=null;
 try{
  const schema=await readFile(new URL("../schema.sql",import.meta.url),"utf8");
  await pool.query(schema);
  const pass="ExampleVeryStrongTrainingPassword!2026";
  const encoded=await hashPassword(pass);
  const users={};
  for(const [label,role] of Object.entries({admin:"accountable_manager",head:"head_of_training",qa:"quality_manager",instructor:"instructor",examiner:"examiner",student:"student"})){
   const email=label+"@academy.test";
   const row=await pool.query(`INSERT INTO academy_users(email,role,password_hash,adult_confirmed)
    VALUES($1,$2,$3,true) RETURNING id`,[email,role,encoded]);
   users[label]={id:row.rows[0].id,email};
  }
  child=spawn(process.execPath,[new URL("../server.mjs",import.meta.url).pathname],{
   cwd:new URL("..",import.meta.url).pathname,
   env:{...process.env,ACADEMY_ORIGIN:ORIGIN,PORT:String(PORT),HOST:"127.0.0.1",DATABASE_URL,
    ACADEMY_SIGNATURE_ENCRYPTION_KEY:Buffer.alloc(32,73).toString("base64")},
   stdio:["ignore","pipe","pipe"]
  });
  let errOutput="";
  child.stderr.on("data",chunk=>{errOutput+=chunk.toString().slice(0,1500)});
  let up=false;
  for(let i=0;i<100;i++){
   if(child.exitCode!==null)break;
   try{const r=await fetch(ORIGIN+"/api/health");if(r.ok){up=true;break}}catch{}
   await new Promise(resolve=>setTimeout(resolve,80));
  }
  assert.ok(up,"private API must start: "+errOutput);
  async function call(path,method="GET",payload,token){
   const headers={Origin:ORIGIN,"Content-Type":"application/json"};
   if(token)headers.Cookie=token;
   const response=await fetch(ORIGIN+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload)});
   const body=await response.json();
   return {status:response.status,body,cookie:response.headers.get("set-cookie")?.split(";")[0]};
  }
  async function login(label){
   const r=await call("/api/login","POST",{email:users[label].email,password:pass});
   assert.equal(r.status,200,JSON.stringify(r.body));
   assert.match(r.cookie,/^agsa_auth=/);
   return r.cookie;
  }
  const initial=await call("/api/public/approval");
  assert.equal(initial.body.approvedTrainingClaim,false);
  assert.match(initial.body.authorityStatus,/NOT_AN_APPROVED/);
  assert.equal((await call("/api/me")).status,401);
  const student=await login("student"),head=await login("head"),qa=await login("qa"),admin=await login("admin"),
   instructor=await login("instructor"),examiner=await login("examiner");
  assert.equal((await call("/api/authority/evidence","POST",{},student)).status,403);

  // Owner-only signature capture, at-rest encryption and explicit tick boxes.
  const image=sampleSignaturePng(),preferences={
   formalCertificates:true,scoutCertificates:true,
   enthusiastCertificates:true,transcripts:false,academySeal:true
  };
  const emptySig=await call("/api/admin/signature","GET",undefined,admin);
  assert.equal(emptySig.status,200);
  assert.equal(emptySig.body.stored,false);
  assert.equal((await call("/api/admin/signature","GET",undefined,student)).status,403);
  assert.equal((await call("/api/admin/signature","GET",undefined,head)).status,403);
  const invalidSave=await call("/api/admin/signature","POST",{
   pngBase64:image.toString("base64"),preferences,confirmPassword:"WrongButStrongPassword!22",
   confirmOwnSignature:true
  },admin);
  assert.equal(invalidSave.status,403);
  assert.equal((await call("/api/admin/signature","GET",undefined,admin)).body.stored,false);
  const deniedOwner=await call("/api/admin/signature","POST",{
   pngBase64:image.toString("base64"),preferences,confirmPassword:pass,
   confirmOwnSignature:true
  },head);
  assert.equal(deniedOwner.status,403);
  const savedSig=await call("/api/admin/signature","POST",{
   pngBase64:image.toString("base64"),preferences,confirmPassword:pass,
   confirmOwnSignature:true
  },admin);
  assert.equal(savedSig.status,200,JSON.stringify(savedSig.body));
  assert.equal(savedSig.body.stored,true);
  assert.equal(savedSig.body.preferences.scoutCertificates,true);
  const {rows:storedSignature}=await pool.query(
   "SELECT encrypted_png,nonce,auth_tag,sha256,preferences FROM academy_admin_signatures WHERE owner_id=$1",
   [users.admin.id]
  );
  assert.equal(storedSignature.length,1);
  assert.equal(storedSignature[0].encrypted_png.equals(image),false,"Private DB must not contain plaintext PNG");
  assert.equal(storedSignature[0].nonce.length,12);
  assert.equal(storedSignature[0].auth_tag.length,16);
  const preview=await fetch(ORIGIN+"/api/admin/signature/preview",{headers:{Cookie:admin}});
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get("content-type"),"image/png");
  assert.equal(preview.headers.get("cache-control"),"no-store, private");
  assert.deepEqual(Buffer.from(await preview.arrayBuffer()),image);
  assert.equal((await call("/api/admin/signature/preview","GET",undefined,student)).status,403);
  const nextPrefs={...preferences,formalCertificates:false,transcripts:true};
  const changed=await call("/api/admin/signature/preferences","POST",{
   confirmPassword:pass,preferences:nextPrefs
  },admin);
  assert.equal(changed.status,200,JSON.stringify(changed.body));
  assert.equal((await call("/api/admin/signature","GET",undefined,admin)).body.preferences.transcripts,true);
  assert.equal((await call("/api/admin/signature","DELETE",{
   confirmPassword:"WrongButStrongPassword!22",confirmRemove:true
  },admin)).status,403);
  assert.equal((await call("/api/admin/signature","GET",undefined,admin)).body.stored,true);
  const removeSig=await call("/api/admin/signature","DELETE",{
   confirmPassword:pass,confirmRemove:true
  },admin);
  assert.equal(removeSig.status,200);
  assert.equal(removeSig.body.stored,false);
  assert.equal((await call("/api/admin/signature","GET",undefined,admin)).body.stored,false);
  const {rows:signatureAfterDelete}=await pool.query(
   "SELECT owner_id FROM academy_admin_signatures WHERE owner_id=$1",[users.admin.id]);
  assert.equal(signatureAfterDelete.length,0);

  assert.equal((await call("/api/me","GET",undefined,student)).body.user.role,"student");
  assert.equal((await call("/api/invitations","POST",{email:"nonadult@academy.test",role:"student"},head)).status,400);
  const invite=await call("/api/invitations","POST",{email:"invitee@academy.test",role:"student",adultOnly:true},head);
  assert.equal(invite.status,201);
  assert.equal((await call("/api/activate","POST",{email:"invitee@academy.test",token:invite.body.inviteToken,password:pass,adultConfirmed:true})).status,201);
  assert.equal((await call("/api/activate","POST",{email:"invitee@academy.test",token:invite.body.inviteToken,password:pass,adultConfirmed:true})).status,400);
  const docs=[
   ["ATO_CERTIFICATE","ORG"],["TRAINING_SPECIFICATIONS","ORG"],["TPM_ACCEPTANCE","ORG"],
   ["SMS_ACCEPTANCE","ORG"],["COURSE_APPROVAL","ppl-theory"],["EXAMINING_AUTHORITY","ppl-theory"],
   ["INSTRUCTOR_CREDENTIAL",users.instructor.id+":ppl-theory"],
   ["EXAMINER_AUTHORISATION",users.examiner.id+":ppl-theory"]
  ];
  let firstDocId="";
  for(const [type,scope] of docs){
   const sub=await call("/api/authority/evidence","POST",{
    type,scope,reference:"SLCAA-TEST-"+type,sha256:"a".repeat(64),
    effectiveFrom:"2026-01-01T00:00:00Z",effectiveUntil:"2027-01-01T00:00:00Z"
   },admin);
   assert.equal(sub.status,201,type+" "+JSON.stringify(sub.body));
   const id=sub.body.id;if(!firstDocId)firstDocId=id;
   assert.equal((await call("/api/authority/evidence/"+id+"/review","POST",{decision:"VERIFIED",reviewNotes:"SYNTHETIC TEST FIXTURE - not an actual government document"},admin)).status,403);
   const rev=await call("/api/authority/evidence/"+id+"/review","POST",{decision:"VERIFIED",reviewNotes:"SYNTHETIC TEST FIXTURE - not an actual government document"},qa);
   assert.equal(rev.status,200,type+" "+JSON.stringify(rev.body));
  }
  const publicStatus=await call("/api/public/approval");
  assert.equal(publicStatus.body.approvedTrainingClaim,false);
  assert.equal(publicStatus.body.authorityStatus,"DOCUMENTS_INTERNALLY_ATTESTED_NOT_ONLINE_VERIFIED");
  const course=await call("/api/courses","POST",{id:"ppl-theory",title:"Test PPL Theoretical Knowledge",
   revision:"test-2026-01",contentSha256:"b".repeat(64),minutesPlanned:1200,
   prerequisites:"Synthetic adult student enrolment and eligibility",
   stageStandards:"Stage one must meet independently verified knowledge objectives"},head);
  assert.equal(course.status,201,JSON.stringify(course.body));
  const prereview=await call("/api/courses/ppl-theory/review","POST",{decision:"READY_FOR_AUTHORITY"},qa);
  assert.equal(prereview.status,409);
  assert.equal((await call("/api/courses/ppl-theory/stages","POST",{
   stageKey:"stage-1",standard:"Complete prescribed instructional evidence and structured skills review"},head)).status,201);
  assert.equal((await call("/api/courses/ppl-theory/review","POST",{decision:"READY_FOR_AUTHORITY"},qa)).status,200);
  assert.equal((await call("/api/courses/ppl-theory/stages","POST",{
   stageKey:"too-late",standard:"This addition should be barred after independent quality sign off"},head)).status,409);
  // Tuition and scholarships must be explicitly managed by the owner,
  // without automatically changing the course's regulatory accreditation.
  assert.equal((await call("/api/enrolments","POST",{
   courseId:"ppl-theory",studentId:users.student.id},head)).status,403,
   "Training management cannot enrol students who lack owner-granted access");
  assert.equal((await call("/api/admin/fees","GET",undefined,student)).status,403);
  assert.equal((await call("/api/admin/grants","GET",undefined,head)).status,403);
  const price=await call("/api/admin/fees","POST",{courseId:"ppl-theory",countryCode:"SL",
   currency:"SLE",billingPeriod:"ONE_TIME",amountMinor:150000},admin);
  assert.equal(price.status,201,JSON.stringify(price.body));
  assert.equal(price.body.plan.amount_minor,"150000");
  assert.equal((await call("/api/admin/fees","POST",{courseId:"ppl-theory",countryCode:"SL",
   currency:"SLE",billingPeriod:"ONE_TIME",amountMinor:199},head)).status,403);
  assert.equal((await call("/api/my/courses/ppl-theory/access","GET",undefined,student)).status,403);
  const scholarship=await call("/api/admin/grants","POST",{studentId:users.student.id,
   planId:price.body.plan.id,grantType:"SCHOLARSHIP",discountBps:10000,
   reason:"Full scholarship sponsored by the Academy administrator"},admin);
  assert.equal(scholarship.status,201,JSON.stringify(scholarship.body));
  assert.equal(scholarship.body.grant.status,"ACTIVE");
  assert.equal(scholarship.body.grant.payable_minor,"0");
  assert.equal(scholarship.body.manualSettlementRequired,false);
  assert.equal((await call("/api/my/courses/ppl-theory/access","GET",undefined,student)).status,200);
  assert.equal((await call("/api/my/access","GET",undefined,student)).body.accessGrants.length,1);
  const revisedPrice=await call("/api/admin/fees","POST",{courseId:"ppl-theory",countryCode:"SL",
   currency:"SLE",billingPeriod:"ONE_TIME",amountMinor:180000},admin);
  assert.equal(revisedPrice.status,201);
  assert.equal((await call("/api/admin/fees","GET",undefined,admin)).body.plans.filter(p=>
   p.course_id==="ppl-theory"&&p.country_code.trim()==="SL"&&p.status==="ACTIVE").length,1);
  assert.equal((await call("/api/my/access","GET",undefined,student)).body.accessGrants[0].gross_minor,"150000",
   "Scholarships preserve the price at which they were granted");
  const internationalPrice=await call("/api/admin/fees","POST",{courseId:"ppl-theory",countryCode:"GB",
   currency:"GBP",billingPeriod:"MONTHLY",amountMinor:20000},admin);
  assert.equal(internationalPrice.status,201);
  const inviteeRow=await pool.query("SELECT id FROM academy_users WHERE email='invitee@academy.test'");
  users.invitee={id:inviteeRow.rows[0].id,email:"invitee@academy.test"};
  const inviteeSession=await login("invitee");
  const partial=await call("/api/admin/grants","POST",{studentId:users.invitee.id,
   planId:internationalPrice.body.plan.id,grantType:"SCHOLARSHIP",discountBps:6000,
   reason:"Sixty percent scholarship, remaining tuition payable"},admin);
  assert.equal(partial.status,201,JSON.stringify(partial.body));
  assert.equal(partial.body.grant.payable_minor,"8000");
  assert.equal(partial.body.grant.status,"PENDING_PAYMENT");
  assert.equal((await call("/api/my/courses/ppl-theory/access","GET",undefined,inviteeSession)).status,403,
    "A partially funded place without verified settlement must remain locked");
  const wrongAmount=await call("/api/admin/grants/"+partial.body.grant.id+"/confirm-payment","POST",{
   amountMinor:7000,reference:"SYNTHETIC-TRANSFER-001",evidenceSha256:"e".repeat(64),
   notes:"Synthetic external payment verification, not a real transfer"
  },admin);
  assert.equal(wrongAmount.status,409);
  const settled=await call("/api/admin/grants/"+partial.body.grant.id+"/confirm-payment","POST",{
   amountMinor:8000,reference:"SYNTHETIC-TRANSFER-001",evidenceSha256:"e".repeat(64),
   notes:"Synthetic test of fully settled external funds"
  },admin);
  assert.equal(settled.status,200,JSON.stringify(settled.body));
  assert.equal((await call("/api/my/courses/ppl-theory/access","GET",undefined,inviteeSession)).status,200);
  assert.equal((await call("/api/admin/grants/"+partial.body.grant.id+"/confirm-payment","POST",{
   amountMinor:8000,reference:"SYNTHETIC-TRANSFER-001",evidenceSha256:"e".repeat(64),
   notes:"Do not permit a duplicate attested payment"
  },admin)).status,409);
  assert.equal((await call("/api/admin/grants/"+partial.body.grant.id+"/revoke","POST",{
   reason:"End of synthetic promotional and scholarship access period"
  },head)).status,403);
  assert.equal((await call("/api/admin/grants/"+partial.body.grant.id+"/revoke","POST",{
   reason:"End of synthetic promotional and scholarship access period"
  },admin)).status,200);
  assert.equal((await call("/api/my/courses/ppl-theory/access","GET",undefined,inviteeSession)).status,403);
  assert.equal((await call("/api/my/access","GET",undefined,inviteeSession)).body.accessGrants[0].status,"REVOKED");
  assert.equal((await call("/api/admin/students","GET",undefined,admin)).body.students.length,2);
  assert.equal((await call("/api/admin/students","GET",undefined,qa)).status,403);
  const enrol=await call("/api/enrolments","POST",{courseId:"ppl-theory",studentId:users.student.id},head);
  assert.equal(enrol.status,201,JSON.stringify(enrol.body));
  const enrolmentId=enrol.body.enrolment.id;
  assert.equal((await call("/api/enrolments/"+enrolmentId+"/stages","POST",{
   stageKey:"stage-1",status:"COMPLETE",trainingDate:"2026-11-13",reviewNotes:"An instructor confirmed synthetic training stage progress"},student)).status,403);
  const stage=await call("/api/enrolments/"+enrolmentId+"/stages","POST",{
   stageKey:"stage-1",status:"COMPLETE",trainingDate:"2026-11-13",reviewNotes:"Synthetic instructor sign-off for scenario test only"},instructor);
  assert.equal(stage.status,201,JSON.stringify(stage.body));
  const exam=await call("/api/assessments","POST",{
   enrolmentId,status:"PASS",assessmentDate:"2026-11-13",
   blueprintRevision:"test-private-bank-v1",resultReference:"TEST-EXAM-REPORT-0001",resultSha256:"c".repeat(64)
  },examiner);
  assert.equal(exam.status,201,JSON.stringify(exam.body));
  const request=await call("/api/completion-requests","POST",{enrolmentId,assessmentId:exam.body.assessment.id},head);
  assert.equal(request.status,201,JSON.stringify(request.body));
  assert.equal((await call("/api/completion-requests/"+request.body.request.id+"/attest","POST",{
   confirmDocumentsChecked:true,confirmStagesChecked:true},head)).status,403);
  const issued=await call("/api/completion-requests/"+request.body.request.id+"/attest","POST",{
   confirmDocumentsChecked:true,confirmStagesChecked:true},qa);
  assert.equal(issued.status,200,JSON.stringify(issued.body));
  assert.equal(issued.body.notPilotLicence,true);
  // Formal document fees are independent from tuition, grades, and examination authority.
  assert.equal((await call("/api/admin/documents/fees","GET",undefined,student)).status,403);
  assert.equal((await call("/api/my/documents","GET",undefined,student)).body.documents.length,0);
  const identity=await call("/api/admin/documents/verify-identity","POST",{
   studentId:users.student.id,legalName:"Academic Test Learner",evidenceSha256:"8".repeat(64)},qa);
  assert.equal(identity.status,200,JSON.stringify(identity.body));
  assert.equal((await call("/api/admin/documents/verify-identity","POST",{
   studentId:users.student.id,legalName:"Unauthorized Self Attestation",evidenceSha256:"8".repeat(64)},admin)).status,403);
  const certFee=await call("/api/admin/documents/fees","POST",{
   kind:"CERTIFICATE",courseId:"ppl-theory",countryCode:"SL",currency:"SLE",amountMinor:20000
  },admin);
  assert.equal(certFee.status,201,JSON.stringify(certFee.body));
  const transFee=await call("/api/admin/documents/fees","POST",{
   kind:"TRANSCRIPT",countryCode:"SL",currency:"SLE",amountMinor:15000
  },admin);
  assert.equal(transFee.status,201,JSON.stringify(transFee.body));
  const certificateGrant=await call("/api/admin/documents/grants","POST",{
   kind:"CERTIFICATE",studentId:users.student.id,completionId:request.body.request.id,
   feePlanId:certFee.body.feePlan.id,grantType:"SCHOLARSHIP",discountBps:10000,
   reason:"Full scholarship covers course certificate issue fee"
  },admin);
  assert.equal(certificateGrant.status,201,JSON.stringify(certificateGrant.body));
  assert.equal(certificateGrant.body.grant.status,"ACTIVE");
  const pendingTranscript=await call("/api/admin/documents/grants","POST",{
   kind:"TRANSCRIPT",studentId:users.student.id,feePlanId:transFee.body.feePlan.id,
   grantType:"PAID",discountBps:0,reason:"Student requested official-style academic transcript"
  },admin);
  assert.equal(pendingTranscript.status,201,JSON.stringify(pendingTranscript.body));
  assert.equal(pendingTranscript.body.grant.status,"PENDING_PAYMENT");
  assert.equal((await call("/api/admin/documents/grants","GET",undefined,head)).status,403);
  assert.equal((await call("/api/admin/documents/grants/"+pendingTranscript.body.grant.id+"/confirm-payment","POST",{
   amountMinor:14500,reference:"TEST-RECEIPT-001",evidenceSha256:"a".repeat(64),
   notes:"Synthetic test receipt, no live funds moved"},admin)).status,409);
  const layout=await call("/api/admin/documents/layouts","POST",{
   audience:"FORMAL",style:"FORMAL_TRADITIONAL",enabled:true,
   options:{showSeal:true,showSignature:false,showCertificateNumber:true,
    showCompletionDate:true,showCourseTitle:true,showInstructorLine:true}
  },admin);
  assert.equal(layout.status,200,JSON.stringify(layout.body));
  const transLayout=await call("/api/admin/documents/layouts","POST",{
   audience:"TRANSCRIPT",style:"FORMAL_TRADITIONAL",enabled:true,
   options:{showSeal:true,showSignature:false}
  },admin);
  assert.equal(transLayout.status,200,JSON.stringify(transLayout.body));
  assert.equal((await call("/api/admin/documents/layouts","POST",{
   audience:"FORMAL",style:"SCOUT_MODERN",enabled:true,options:{showQrVerification:true}
  },admin)).status,400,"Unverified QR codes must stay disabled");
  // Preview PDFs are sample-only, owner-restricted, and carry no student data
  // or actual encrypted signature even when the owner has enabled signature use.
  for(const audience of ["FORMAL","SCOUT","ENTHUSIAST","TRANSCRIPT"]){
   const path="/api/admin/documents/preview/"+audience;
   const denied=await fetch(ORIGIN+path,{headers:{Origin:ORIGIN,Cookie:student}});
   assert.equal(denied.status,403,"Students may not use private owner-only specimen endpoint");
   const example=await fetch(ORIGIN+path,{headers:{Origin:ORIGIN,Cookie:admin}});
   assert.equal(example.status,200,audience+" preview failed");
   assert.match(example.headers.get("content-type"),/application\\/pdf/);
   assert.match(example.headers.get("content-disposition"),/inline/);
   const pdf=Buffer.from(await example.arrayBuffer());
   assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
   assert.ok(pdf.length>2000,"Sample must contain full printable document design");
  }
  const pdfResponse=await fetch(ORIGIN+"/api/my/documents/"+certificateGrant.body.grant.id+"/download",{
   headers:{Origin:ORIGIN,Cookie:student}
  });
  assert.equal(pdfResponse.status,200);
  assert.match(pdfResponse.headers.get("content-type"),/application\/pdf/);
  assert.equal(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0,5).toString(),"%PDF-");
  const premature=await fetch(ORIGIN+"/api/my/documents/"+pendingTranscript.body.grant.id+"/download",{
   headers:{Origin:ORIGIN,Cookie:student}
  });
  assert.equal(premature.status,403,"Unsettled transcript must remain blocked");
  const settlement=await call("/api/admin/documents/grants/"+pendingTranscript.body.grant.id+"/confirm-payment","POST",{
   amountMinor:15000,reference:"TEST-RECEIPT-001",evidenceSha256:"a".repeat(64),
   notes:"Synthetic test of independently attested outside payment"
  },admin);
  assert.equal(settlement.status,200,JSON.stringify(settlement.body));
  const transcriptResponse=await fetch(ORIGIN+"/api/my/documents/"+pendingTranscript.body.grant.id+"/download",{
   headers:{Origin:ORIGIN,Cookie:student}
  });
  assert.equal(transcriptResponse.status,200);
  assert.equal(Buffer.from(await transcriptResponse.arrayBuffer()).subarray(0,5).toString(),"%PDF-");
  assert.equal((await call("/api/admin/documents/grants/"+pendingTranscript.body.grant.id+"/revoke","POST",{
   reason:"Synthetic test of revoking document printing access"
  },admin)).status,200);
  const afterRevoke=await fetch(ORIGIN+"/api/my/documents/"+pendingTranscript.body.grant.id+"/download",{
   headers:{Origin:ORIGIN,Cookie:student}
  });
  assert.equal(afterRevoke.status,403);
  assert.equal((await call("/api/my/documents","GET",undefined,student)).body.documents.length,2);

  assert.match(issued.body.serial,/^AGSA-COURSE-/);
  assert.equal((await call("/api/my/assessments","GET",undefined,student)).body.assessmentRecords.length,1);
  assert.equal((await call("/api/my/enrolments","GET",undefined,student)).body.enrolments.length,1);
  assert.equal((await call("/api/my/completions","GET",undefined,student)).body.courseCompletions.length,1);
  const audit=await call("/api/audit","GET",undefined,qa);
  assert.equal(audit.status,200);
  assert.ok(audit.body.events.some(event=>event.action==="COURSE_COMPLETION_ATTESTED"));
  assert.equal((await call("/api/audit","GET",undefined,student)).status,403);
  // A later SLCAA suspension, evidence rejection or credential withdrawal
  // must close the gate without rewriting historic assessments.
  const revoked=await call("/api/authority/evidence/"+firstDocId+"/revoke","POST",{
   reason:"SYNTHETIC TEST: external approval removed from active scope"
  },qa);
  assert.equal(revoked.status,200,JSON.stringify(revoked.body));
  assert.equal((await call("/api/public/approval")).body.authorityStatus,"NOT_AN_APPROVED_TRAINING_ORGANISATION");
  const afterRevocation=await call("/api/assessments","POST",{
   enrolmentId,status:"PASS",assessmentDate:"2026-11-13",
   blueprintRevision:"test-private-bank-v1",resultReference:"TEST-EXAM-REPORT-0002",resultSha256:"d".repeat(64)
  },examiner);
  assert.equal(afterRevocation.status,403,"Revoked authority must block new exam records");
  assert.equal((await call("/api/admin/users/"+users.admin.id+"/disable","POST",{
   reason:"A manager should not disable their own authenticated account"
  },admin)).status,403);
  assert.equal((await call("/api/admin/users/"+users.instructor.id+"/disable","POST",{
   reason:"SYNTHETIC TEST: instructor credentials no longer valid"
  },admin)).status,200);
  assert.equal((await call("/api/me","GET",undefined,instructor)).status,401,"Disabled instructor session must be invalidated");

  await assert.rejects(()=>pool.query("UPDATE academy_audit_events SET action='tampered' WHERE 1=1"),/audit events are append only/);
  await assert.rejects(()=>pool.query("DELETE FROM academy_assessment_records WHERE id=$1",[exam.body.assessment.id]),/append only/);
  assert.equal((await call("/api/logout","POST",{},student)).status,200);
  assert.equal((await call("/api/me","GET",undefined,student)).status,401);
  t.diagnostic("ATO test passed: invite-only adult accounts, role separation, eight synthetic evidence gates, course stages, stage/exam records, independent completion, immutable audit and logout.");
 }finally{
  if(child){child.kill("SIGTERM");await new Promise(resolve=>child.once("exit",resolve)).catch(()=>{})}
  await pool.end();
 }
});
