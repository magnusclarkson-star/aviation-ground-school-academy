import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const L=require("../ai-instructor-lessons.js");
const C=require("../ai-instructor-curriculum.js");
const R=require("../curriculum-review-model.js");

const expected=["forces","instruments","controls","flaps","weather","radio","anatomy","preflight"];
assert.deepEqual(L.lessons.map(x=>x.id),expected);
assert.equal(new Set(expected).size,8);
const result=C.validate(expected);
assert.equal(result.lessons,8);
assert.equal(result.allRequireReview,true);
assert.equal(C.get("unsupported"),null);
assert.throws(()=>C.validate(expected.slice(0,7)),/Every public lesson/);
assert.throws(()=>C.validate([...expected.slice(0,7),"unknown"]),/Unknown or repeated/);
assert.deepEqual(C.records.map(x=>x.id),expected);

for(const lesson of L.lessons){
 const item=C.get(lesson.id);
 assert.equal(item.reviewStatus,"SME_REVIEW_REQUIRED");
 assert.match(item.version,/^2026-11-08\./);
 assert.ok(item.objectives.length>=3);
 assert.ok(item.objectives.every(x=>x.endsWith(".")));
 assert.ok(item.activity.length>40);
 assert.ok(item.scope.length>35);
 assert.ok(item.references.length>0);
 assert.ok(item.references.every(ref=>ref.url.startsWith("https://www.faa.gov/")||ref.url.startsWith("https://www.easa.europa.eu/")));
 assert.ok(item.references.every(ref=>["FAA","EASA"].includes(ref.publisher)));
 assert.equal(L.evaluateQuiz(lesson.id,lesson.correct).correct,true);
 assert.equal(L.localAnswer("x",lesson.id).mode,"CURATED_GUIDANCE");
 assert.ok(!JSON.stringify(item).includes("APPROVED"),"No metadata claims regulatory approval");
}
assert.equal(L.localAnswer("Where is the fuselage?","forces").lessonId,"anatomy");
assert.equal(L.localAnswer("What should I inspect preflight?","forces").lessonId,"preflight");
assert.equal(R.dimensions.length,6);
const judgements=Object.fromEntries(R.dimensions.map(d=>[d.id,"not-reviewed"]));
const review=R.draft("preflight",{judgements:{...judgements,factualAccuracy:"needs-edits"},
 comments:"Verify this section's technical claims against current manufacturer documentation.",
 nextAction:"Request a source-to-claim review from a suitably qualified aviation instructor."},
 "2026-11-08T07:30:00.000Z");
assert.equal(review.schema,"agsa.unsigned-curriculum-review.v1");
assert.equal(review.recordStatus,"UNVERIFIED_DRAFT_ONLY");
assert.equal(review.createsCourseApproval,false);
assert.equal(review.authenticatesReviewer,false);
assert.equal(review.grantsTrainingCredit,false);
assert.equal(review.snapshot.lessonId,"preflight");
assert.equal(review.snapshot.currentReviewStatus,"SME_REVIEW_REQUIRED");
assert.equal(review.snapshot.quiz.options.length,3);
assert.equal(review.observations.judgements.factualAccuracy,"needs-edits");
assert.equal(review.snapshot.referencePointers.length,2);
assert.ok(!("reviewer" in review));
assert.ok(!("certificate" in review));
assert.throws(()=>R.draft("invalid",{judgements,comments:"Review"}),/supported/);
assert.throws(()=>R.draft("forces",{judgements}),/Add a discussion note/);
assert.throws(()=>R.draft("forces",{judgements:{...judgements,safetyBoundary:"approved"},comments:"notes"}),/Invalid review/);
assert.throws(()=>R.draft("forces",{judgements,comments:"note",unsafeApproval:true}),/Unknown review field/);
assert.throws(()=>R.draft("forces",{judgements,comments:"note"},"not a date"),/Invalid draft timestamp/);
const bounded=R.draft("radio",{judgements,comments:"x".repeat(1600),nextAction:"y".repeat(900)});
assert.equal(bounded.observations.comments.length,1400);
assert.equal(bounded.observations.nextAction.length,650);
assert.doesNotThrow(()=>JSON.stringify(bounded));
console.log("Curriculum and unsigned review model passed: 8 lesson objectives, source URLs, versions, safe draft status, quiz alignment and bounded comments.");
