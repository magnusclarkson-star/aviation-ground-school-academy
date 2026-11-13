import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
import {buildCertificatePdf,certificateFilename} from "../academy-certificate-core.mjs";
import {eligibleModule,eligibleProgramme,prepareSelfStudyAward} from "../academy-certificate-eligibility.mjs";
const require=createRequire(import.meta.url),C=require("../academy-coursebook-data.js"),D=require("../academy-coursebook-depth-model.js");
const date="2026-11-13T12:00:00Z";
const primary=C.modules[0],core=[{id:primary.id,correct:3,revision:C.REVISION,at:1}],
 advanced=[{id:primary.id,correct:4,caseCorrect:true,revision:D.REVISION,at:1}],capstone=[];
assert.equal(eligibleModule(C,D,primary.id,core,advanced),true);
assert.equal(eligibleModule(C,D,C.modules[1].id,core,advanced),false);
assert.equal(eligibleProgramme(C,D,core,advanced,capstone),false);
const award=prepareSelfStudyAward({Core:C,Deep:D,id:primary.id,name:"Air Scout Practice Learner",
 rawCore:core,rawAdvanced:advanced,rawCapstone:capstone,now:date});
assert.equal(award.kind,"SELF_STUDY_MODULE");award.style="SCOUT_MODERN";
const bytes=buildCertificatePdf(award);
assert.equal(Buffer.from(bytes).subarray(0,5).toString(),"%PDF-");
assert.ok(bytes.length>2000);assert.match(certificateFilename(award),/\.pdf$/);
assert.ok(Buffer.from(bytes).includes(Buffer.from("Not identity-verified")));
assert.throws(()=>prepareSelfStudyAward({Core:C,Deep:D,id:C.modules[1].id,name:"Demo",rawCore:core,rawAdvanced:advanced,rawCapstone:[],now:date}));
const allCore=C.modules.map((m,i)=>({id:m.id,correct:3,revision:C.REVISION,at:i+1}));
const allAdvanced=D.units.map((u,i)=>({id:u.id,correct:4,caseCorrect:true,revision:D.REVISION,at:i+1}));
const finals=[{revision:D.REVISION,correct:24,at:25}];
assert.equal(eligibleProgramme(C,D,allCore,allAdvanced,finals),true);
const finalAward=prepareSelfStudyAward({Core:C,Deep:D,programme:true,name:"Academy Learner",
 rawCore:allCore,rawAdvanced:allAdvanced,rawCapstone:finals,now:date});
assert.equal(finalAward.kind,"SELF_STUDY_PROGRAMME");
assert.equal(Buffer.from(buildCertificatePdf(finalAward)).subarray(0,5).toString(),"%PDF-");
assert.throws(()=>buildCertificatePdf({...award,serial:"SLCAA-FAKE"}));
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const v of ["academy-certificate-ui.mjs","certificatesPanel","certificateAutoPrint","certificateAutoDownload","certificateModule"])
 assert.ok(html.includes(v),"Missing certificate public UI "+v);
const script=fs.readFileSync(new URL("../academy-certificate-ui.mjs",import.meta.url),"utf8");
assert.match(script,/agsa:coursebook-advanced-checked/);
assert.match(script,/agsa:coursebook-capstone-checked/);
assert.ok(!script.includes(".innerHTML"),"DOM content should not use HTML injection");
console.log("Self-study certificates: 3 independent milestones tested, printable PDF headers and unverified labels preserved.");
